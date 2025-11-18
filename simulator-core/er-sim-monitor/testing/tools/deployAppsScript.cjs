#!/usr/bin/env node

/**
 * Apps Script Deployment Tool
 * Deploys local Code_ULTIMATE_ATSR.gs to live Apps Script project
 * No bash commands - pure Node.js + googleapis
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

async function deployScript() {
  console.log('\n🚀 APPS SCRIPT DEPLOYMENT\n');
  console.log('━'.repeat(70));

  try {
    // Check if source file exists
    if (!fs.existsSync(SOURCE_FILE)) {
      throw new Error('Source file not found: Code_ULTIMATE_ATSR.gs');
    }

    const localCode = fs.readFileSync(SOURCE_FILE, 'utf8');
    console.log(`📁 Local Source: ${(localCode.length / 1024).toFixed(2)} KB`);

    // Authenticate
    console.log('🔐 Authenticating...');
    const auth = await authenticate();
    console.log('✅ Authenticated\n');

    const script = google.script({ version: 'v1', auth });

    // Get current deployed version
    console.log('📥 Fetching current deployment...');
    const currentContent = await script.projects.getContent({
      scriptId: SCRIPT_ID
    });

    const currentFiles = currentContent.data.files;
    console.log(`✅ Found ${currentFiles.length} files in deployment\n`);

    // Prepare new content
    const newFiles = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: localCode
      }
    ];

    // Add appsscript.json if it exists in current deployment
    const appsScriptJson = currentFiles.find(f => f.name === 'appsscript');
    if (appsScriptJson) {
      newFiles.push(appsScriptJson);
      console.log('✅ Preserving appsscript.json manifest\n');
    }

    // Update the script
    console.log('⬆️  Uploading new version...');
    await script.projects.updateContent({
      scriptId: SCRIPT_ID,
      requestBody: {
        files: newFiles
      }
    });

    console.log('✅ Upload complete\n');

    // Verify deployment
    console.log('🔍 Verifying deployment...');
    const verifyContent = await script.projects.getContent({
      scriptId: SCRIPT_ID
    });

    const deployedCode = verifyContent.data.files.find(f => f.name === 'Code');

    if (!deployedCode) {
      throw new Error('Verification failed: Code.gs not found after deployment');
    }

    const deployed = deployedCode.source;
    const identical = deployed === localCode;

    console.log(`📊 Deployed: ${(deployed.length / 1024).toFixed(2)} KB`);
    console.log(`   Status: ${identical ? '✅ IDENTICAL' : '⚠️ DIFFERENT'}\n`);

    if (!identical) {
      console.log('⚠️  Warning: Deployed code differs from local source\n');
      console.log(`   Local Size: ${localCode.length} characters`);
      console.log(`   Deployed Size: ${deployed.length} characters`);
      console.log(`   Difference: ${Math.abs(deployed.length - localCode.length)} characters\n`);
    }

    // Extract function names
    const functionRegex = /^function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/gm;
    const functions = [];
    let match;

    while ((match = functionRegex.exec(deployed)) !== null) {
      functions.push(match[1]);
    }

    console.log(`📋 Deployed Functions: ${functions.length}`);

    // Check critical functions
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

    console.log(`\n🎯 Critical Functions:`);
    let allPresent = true;

    criticalFunctions.forEach(func => {
      const present = functions.includes(func);
      console.log(`   ${present ? '✅' : '❌'} ${func}`);
      if (!present) allPresent = false;
    });

    console.log('\n' + '━'.repeat(70));

    if (allPresent && identical) {
      console.log('✅ DEPLOYMENT SUCCESSFUL - All functions present and verified\n');
      return {
        success: true,
        identical: true,
        allFunctionsPresent: true
      };
    } else if (allPresent) {
      console.log('⚠️  DEPLOYMENT COMPLETE - All functions present (minor differences)\n');
      return {
        success: true,
        identical: false,
        allFunctionsPresent: true
      };
    } else {
      console.log('❌ DEPLOYMENT FAILED - Missing critical functions\n');
      return {
        success: false,
        identical: false,
        allFunctionsPresent: false
      };
    }

  } catch (error) {
    console.log(`\n❌ Deployment Error: ${error.message}\n`);
    throw error;
  }
}

// ========== EXECUTION ==========

if (require.main === module) {
  deployScript()
    .then(result => {
      // Save result
      const resultsDir = path.join(__dirname, '../results');
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const resultPath = path.join(resultsDir, `deployment-${timestamp}.json`);

      fs.writeFileSync(resultPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        scriptId: SCRIPT_ID,
        result
      }, null, 2));

      console.log(`📁 Deployment record saved: ${resultPath}\n`);

      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Fatal Error:', error.message);
      process.exit(1);
    });
}

module.exports = { deployScript };
