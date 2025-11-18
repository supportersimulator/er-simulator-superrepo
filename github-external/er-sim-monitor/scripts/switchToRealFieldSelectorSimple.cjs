#!/usr/bin/env node

/**
 * SWITCH TO REAL FIELD SELECTOR (SIMPLE VERSION)
 * Just change preCacheRichData() to call showFieldSelector() instead of test
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 SWITCHING TO REAL FIELD SELECTOR (SIMPLE)\n');
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

    // Only change preCacheRichData() - don't touch showFieldSelector()
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
    SpreadsheetApp.getUi().alert('Field Selector Error: ' + error.message + '\\n\\nCheck Execution Log for details.');
  }
}`;

    if (code.includes(testVersion)) {
      code = code.replace(testVersion, realVersion);
      console.log('✅ Switched to showFieldSelector()\n');
    } else {
      console.log('⚠️  Test version not found, may already be using real version\n');
    }

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-final-selector-switch-2025-11-06.gs');
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
    console.log('   1. Calls showFieldSelector()');
    console.log('   2. Refreshes headers (silently, no alert)');
    console.log('   3. Gets available fields (642 from Row 2)');
    console.log('   4. Loads saved fields or 27 defaults');
    console.log('   5. Calls ChatGPT for recommendations');
    console.log('   6. Shows 3-section modal!\n');
    console.log('If it fails, check Apps Script Execution Log for error details.\n');
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
