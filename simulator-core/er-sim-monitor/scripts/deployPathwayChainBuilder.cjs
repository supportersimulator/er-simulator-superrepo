#!/usr/bin/env node

/**
 * DEPLOY PATHWAY CHAIN BUILDER - THE ROBUST TABBED PANEL
 * 1920x1000 modal with Categories tab & Pathways tab
 * Includes cache button and field editing
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🚀 DEPLOYING PATHWAY CHAIN BUILDER\n');
console.log('═══════════════════════════════════════════════════════════════\n');

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

function extractFunctionBody(code, functionName, startIdx) {
  let braceCount = 0;
  let inFunction = false;
  let functionBody = '';

  for (let i = startIdx; i < code.length; i++) {
    const char = code[i];
    functionBody += char;

    if (char === '{') {
      braceCount++;
      inFunction = true;
    } else if (char === '}') {
      braceCount--;
      if (inFunction && braceCount === 0) {
        return functionBody;
      }
    }
  }

  return functionBody;
}

async function deploy() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    // Load test monolithic code
    const testCodePath = path.join(__dirname, '../backups/test-with-complete-atsr-2025-11-06.gs');

    if (!fs.existsSync(testCodePath)) {
      console.log('❌ Test code not found!\n');
      return;
    }

    const testCode = fs.readFileSync(testCodePath, 'utf8');

    console.log('📥 Extracting Pathway Chain Builder functions...\n');

    // Functions to extract (in order)
    const functionsToExtract = [
      'runPathwayChainBuilder',
      'getOrCreateHolisticAnalysis_',
      'analyzeHolistically_',
      'generateCaseInsights_',
      'buildCategoriesTabHTML_',
      'buildPathwaysTabHTML_',
      'buildBirdEyeViewUI_',
      'buildChainBuilderUI',
      'savePathwayChain'
    ];

    const extractedFunctions = [];

    for (const funcName of functionsToExtract) {
      const regex = new RegExp(`function ${funcName}\\s*\\(`);
      const match = testCode.match(regex);

      if (match) {
        const functionBody = extractFunctionBody(testCode, funcName, match.index);
        extractedFunctions.push({ name: funcName, code: functionBody });
        console.log(`   ✅ Extracted ${funcName} (${(functionBody.length / 1024).toFixed(1)} KB)`);
      } else {
        console.log(`   ⏭️  Skipped ${funcName} (not found)`);
      }
    }

    console.log(`\n📊 Extracted ${extractedFunctions.length} functions\n`);

    // Download production code
    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    // Remove old Categories & Pathways Panel code
    console.log('🗑️  Removing old Categories & Pathways code...\n');

    const oldSection = /\/\/ ═+\s*\n\/\/ CATEGORIES & PATHWAYS.*?\n\/\/ ═+[\s\S]*?(?=\/\/ ═+|$)/g;
    if (oldSection.test(code)) {
      code = code.replace(oldSection, '');
      console.log('   🗑️  Removed old Categories & Pathways section\n');
    }

    // Add Pathway Chain Builder
    console.log('📦 Adding Pathway Chain Builder...\n');

    const pathwayChainBuilder = `

// ═══════════════════════════════════════════════════════════════
// PATHWAY CHAIN BUILDER - ROBUST TABBED PANEL (1920x1000)
// Categories Tab + Pathways Tab with Cache & Field Editing
// ═══════════════════════════════════════════════════════════════

${extractedFunctions.map(f => f.code).join('\n\n')}

// Menu wrapper - calls the robust panel
function openCategoriesPathwaysPanel() {
  runPathwayChainBuilder();
}

function runCategoriesPathwaysPanel() {
  runPathwayChainBuilder();
}
`;

    // Insert before first function
    const firstFunctionMatch = code.match(/^function /m);
    if (firstFunctionMatch) {
      const insertPos = firstFunctionMatch.index;
      code = code.slice(0, insertPos) + pathwayChainBuilder + '\n' + code.slice(insertPos);
    } else {
      code = pathwayChainBuilder + '\n' + code;
    }

    console.log('✅ Added Pathway Chain Builder\n');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-chain-builder-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up to: ${backupPath}\n`);

    // Deploy
    console.log('📤 Deploying to production...\n');

    const updatedFiles = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: code
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: updatedFiles }
    });

    const newSize = (code.length / 1024).toFixed(1);
    console.log(`✅ Deployment successful! New size: ${newSize} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 PATHWAY CHAIN BUILDER DEPLOYED!\n');
    console.log('\nFeatures:\n');
    console.log('   ✅ 1920x1000 modal dialog (BIG robust panel)\n');
    console.log('   ✅ Categories Tab - System-based organization\n');
    console.log('   ✅ Pathways Tab - AI-powered pathway discovery\n');
    console.log('   ✅ Cache button with field editing\n');
    console.log('   ✅ Dynamic header cache mapping\n');
    console.log('   ✅ Holistic analysis engine\n');
    console.log('\nMenu function: openCategoriesPathwaysPanel() → runPathwayChainBuilder()\n');
    console.log('\nNext steps:\n');
    console.log('   1. Refresh your production spreadsheet\n');
    console.log('   2. Click "🧠 Sim Builder" → "🧩 Categories & Pathways"\n');
    console.log('   3. Should see the BIG tabbed panel (Categories | Pathways)!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deploy();
