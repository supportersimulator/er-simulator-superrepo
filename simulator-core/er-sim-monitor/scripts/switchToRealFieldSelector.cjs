#!/usr/bin/env node

/**
 * SWITCH TO REAL FIELD SELECTOR
 * Now that defaults are fixed, switch from test to real field selector
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 SWITCHING TO REAL FIELD SELECTOR\n');
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

async function switchToReal() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Switching preCacheRichData() to call showFieldSelector()...\n');

    // Switch from test to real
    const testVersion = `function preCacheRichData() {
  // TEMPORARY: Testing with simple modal first
  try {
    Logger.log('🚀 preCacheRichData() called');
    Logger.log('🔧 Calling testSimpleFieldSelector() first...');
    testSimpleFieldSelector();
    // Once test works, we'll switch back to: showFieldSelector();
  } catch (error) {
    Logger.log('❌ preCacheRichData ERROR: ' + error.toString());
    SpreadsheetApp.getUi().alert('Error: ' + error.message);
  }
}`;

    const realVersion = `function preCacheRichData() {
  try {
    Logger.log('🚀 preCacheRichData() called - starting field selector');
    showFieldSelector();
  } catch (error) {
    Logger.log('❌ preCacheRichData ERROR: ' + error.toString());
    SpreadsheetApp.getUi().alert('Field Selector Error: ' + error.message);
  }
}`;

    if (code.includes(testVersion)) {
      code = code.replace(testVersion, realVersion);
      console.log('✅ Switched to showFieldSelector()\n');
    } else {
      console.log('⚠️  Test version not found, may already be using real version\n');
    }

    // Add better error handling to showFieldSelector
    console.log('🔧 Adding comprehensive error handling to showFieldSelector()...\n');

    const oldShowFieldSelector = `function showFieldSelector() {
  Logger.log('🎯 showFieldSelector() started');

  // Get all available fields from spreadsheet
  // Ensure header cache is fresh before reading fields
  Logger.log('📋 Step 1: Refreshing headers...');
  refreshHeaders();
  Logger.log('✅ Step 1 complete');

  Logger.log('📋 Step 2: Getting available fields...');
  const availableFields = getAvailableFields();
  Logger.log('✅ Step 2 complete: ' + availableFields.length + ' fields found');`;

    const newShowFieldSelector = `function showFieldSelector() {
  try {
    Logger.log('🎯 showFieldSelector() started');

    // Get all available fields from spreadsheet
    // Ensure header cache is fresh before reading fields
    Logger.log('📋 Step 1: Refreshing headers...');
    refreshHeaders();
    Logger.log('✅ Step 1 complete');

    Logger.log('📋 Step 2: Getting available fields...');
    const availableFields = getAvailableFields();
    Logger.log('✅ Step 2 complete: ' + availableFields.length + ' fields found');

    if (!availableFields || availableFields.length === 0) {
      throw new Error('No fields found. Headers may not be cached properly.');
    }`;

    if (code.includes(oldShowFieldSelector)) {
      code = code.replace(oldShowFieldSelector, newShowFieldSelector);
      console.log('✅ Added error handling to showFieldSelector()\n');
    }

    // Wrap the rest of showFieldSelector in try-catch if not already
    // Find the end of showFieldSelector and add catch block
    const showFieldSelectorStart = code.indexOf('function showFieldSelector()');
    if (showFieldSelectorStart !== -1) {
      // Find matching closing brace
      let braceCount = 0;
      let inFunction = false;
      let funcEnd = showFieldSelectorStart;

      for (let i = showFieldSelectorStart; i < code.length; i++) {
        if (code[i] === '{') {
          braceCount++;
          inFunction = true;
        } else if (code[i] === '}') {
          braceCount--;
          if (inFunction && braceCount === 0) {
            funcEnd = i;
            break;
          }
        }
      }

      // Check if there's already a catch block before the closing brace
      const beforeCloseBrace = code.substring(funcEnd - 200, funcEnd);
      if (!beforeCloseBrace.includes('} catch')) {
        // Add catch block
        const catchBlock = `
  } catch (error) {
    Logger.log('❌ showFieldSelector ERROR: ' + error.toString());
    Logger.log('   Stack: ' + error.stack);
    SpreadsheetApp.getUi().alert('Field Selector Error: ' + error.message + '\\n\\nCheck Execution Log for details.');
  }
`;
        code = code.slice(0, funcEnd) + catchBlock + code.slice(funcEnd);
        console.log('✅ Added catch block to showFieldSelector()\n');
      }
    }

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-real-selector-2025-11-06.gs');
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

    console.log(`✅ Deployment successful! Size: ${newSize} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 SWITCHED TO REAL FIELD SELECTOR!\n');
    console.log('Now when you click "Pre-Cache Rich Data":\n');
    console.log('   1. Calls refreshHeaders() - caches 642 headers silently');
    console.log('   2. Calls getAvailableFields() - parses cached headers');
    console.log('   3. Calls loadFieldSelection() - loads 27 ACTUAL defaults');
    console.log('   4. Calls getRecommendedFields_() - ChatGPT suggestions');
    console.log('   5. Builds HTML modal with 3 sections');
    console.log('   6. Shows field selector!\n');
    console.log('If it still fails, check Execution Log for error details.\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

switchToReal();
