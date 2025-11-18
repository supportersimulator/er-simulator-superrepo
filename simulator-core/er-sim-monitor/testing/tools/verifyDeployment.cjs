#!/usr/bin/env node

/**
 * Deployment Verification Tool
 * Verifies Apps Script deployment status without bash commands
 * Uses Google Apps Script API to check deployed version
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

require('dotenv').config();

const SCRIPT_ID = process.env.APPS_SCRIPT_ID;
const TOKEN_PATH = path.join(__dirname, '../../config/token.json');
const SOURCE_FILE = path.join(__dirname, '../../scripts/Code_ULTIMATE_ATSR.gs');

async function authenticate() {
  const credentials = {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uris: ['http://localhost']
  };

  const oauth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uris[0]
  );

  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('Token file not found. Run npm run auth-google first.');
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  oauth2Client.setCredentials(token);

  return oauth2Client;
}

async function verifyDeployment() {
  console.log('\n🔍 APPS SCRIPT DEPLOYMENT VERIFICATION\n');
  console.log('━'.repeat(70));

  try {
    // Authenticate
    console.log('🔐 Authenticating...');
    const auth = await authenticate();
    console.log('✅ Authenticated\n');

    const script = google.script({ version: 'v1', auth });

    // Get deployed script content
    console.log('📥 Fetching deployed script...');
    const response = await script.projects.getContent({
      scriptId: SCRIPT_ID
    });

    const deployedFiles = response.data.files;
    console.log(`✅ Found ${deployedFiles.length} deployed files\n`);

    // Find main Code.gs file
    const codeFile = deployedFiles.find(f => f.name === 'Code' || f.name === 'Code.gs');

    if (!codeFile) {
      console.log('❌ No Code.gs file found in deployment\n');
      return {
        deployed: false,
        reason: 'No Code.gs file in deployment'
      };
    }

    const deployedCode = codeFile.source;
    const deployedSize = deployedCode.length;

    console.log('📊 Deployed Script Info:');
    console.log(`   File: ${codeFile.name}`);
    console.log(`   Size: ${(deployedSize / 1024).toFixed(2)} KB`);
    console.log(`   Type: ${codeFile.type}`);

    // Read local source file
    if (!fs.existsSync(SOURCE_FILE)) {
      console.log('\n⚠️  Local source file not found');
      console.log('   Cannot compare with deployed version\n');
      return {
        deployed: true,
        localSource: false
      };
    }

    const localCode = fs.readFileSync(SOURCE_FILE, 'utf8');
    const localSize = localCode.length;

    console.log(`\n📁 Local Source Info:`);
    console.log(`   File: Code_ULTIMATE_ATSR.gs`);
    console.log(`   Size: ${(localSize / 1024).toFixed(2)} KB`);

    // Compare sizes
    const sizeDifference = Math.abs(deployedSize - localSize);
    const sizeDifferencePercent = ((sizeDifference / localSize) * 100).toFixed(2);

    console.log(`\n🔍 Comparison:`);
    console.log(`   Size Difference: ${sizeDifference} characters (${sizeDifferencePercent}%)`);

    // Check if identical
    const identical = deployedCode === localCode;

    if (identical) {
      console.log(`   Status: ✅ IDENTICAL - Deployed version matches local source`);
    } else {
      console.log(`   Status: ⚠️  DIFFERENT - Deployed version differs from local source`);
    }

    // Extract function names from both versions
    const deployedFunctions = extractFunctionNames(deployedCode);
    const localFunctions = extractFunctionNames(localCode);

    console.log(`\n📋 Functions:`);
    console.log(`   Deployed: ${deployedFunctions.length} functions`);
    console.log(`   Local: ${localFunctions.length} functions`);

    // Check for missing functions
    const missingInDeployed = localFunctions.filter(f => !deployedFunctions.includes(f));
    const extraInDeployed = deployedFunctions.filter(f => !localFunctions.includes(f));

    if (missingInDeployed.length > 0) {
      console.log(`\n   ⚠️  Missing in Deployed:`);
      missingInDeployed.forEach(f => console.log(`      - ${f}`));
    }

    if (extraInDeployed.length > 0) {
      console.log(`\n   ⚠️  Extra in Deployed:`);
      extraInDeployed.forEach(f => console.log(`      - ${f}`));
    }

    if (missingInDeployed.length === 0 && extraInDeployed.length === 0) {
      console.log(`   ✅ All functions present in both versions`);
    }

    // Check for critical functions
    const criticalFunctions = [
      'onOpen',
      'openSimSidebar',
      'runATSRTitleGenerator',
      'checkApiStatus',
      'openCategoriesPathwaysPanel',
      'runQualityAudit_AllOrRows',
      'refreshHeaders',
      'openSettingsPanel',
      'openImageSyncDefaults',
      'openMemoryTracker',
      'cleanUpLowValueRows',
      'retrainPromptStructure'
    ];

    console.log(`\n🎯 Critical Functions Check:`);
    let allCriticalPresent = true;

    criticalFunctions.forEach(func => {
      const present = deployedFunctions.includes(func);
      console.log(`   ${present ? '✅' : '❌'} ${func}`);
      if (!present) allCriticalPresent = false;
    });

    console.log('\n' + '━'.repeat(70));

    if (allCriticalPresent && identical) {
      console.log('✅ DEPLOYMENT VERIFIED - All functions present and code identical\n');
      return {
        deployed: true,
        identical: true,
        allFunctionsPresent: true,
        status: 'VERIFIED'
      };
    } else if (allCriticalPresent) {
      console.log('⚠️  DEPLOYMENT OK - All functions present but code differs\n');
      return {
        deployed: true,
        identical: false,
        allFunctionsPresent: true,
        status: 'NEEDS_UPDATE'
      };
    } else {
      console.log('❌ DEPLOYMENT INCOMPLETE - Missing critical functions\n');
      return {
        deployed: false,
        identical: false,
        allFunctionsPresent: false,
        status: 'INCOMPLETE'
      };
    }

  } catch (error) {
    console.log(`\n❌ Error: ${error.message}\n`);
    return {
      deployed: false,
      error: error.message
    };
  }
}

function extractFunctionNames(code) {
  const functionRegex = /^function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/gm;
  const matches = [];
  let match;

  while ((match = functionRegex.exec(code)) !== null) {
    matches.push(match[1]);
  }

  return matches;
}

// ========== EXECUTION ==========

if (require.main === module) {
  verifyDeployment()
    .then(result => {
      // Save result to JSON
      const resultsDir = path.join(__dirname, '../results');
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const resultPath = path.join(resultsDir, `deployment-verification-${timestamp}.json`);

      fs.writeFileSync(resultPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        scriptId: SCRIPT_ID,
        result
      }, null, 2));

      console.log(`📁 Verification result saved: ${resultPath}\n`);

      process.exit(result.deployed ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Fatal Error:', error.message);
      process.exit(1);
    });
}

module.exports = { verifyDeployment };
