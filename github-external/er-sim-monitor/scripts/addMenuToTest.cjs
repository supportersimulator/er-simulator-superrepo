#!/usr/bin/env node

/**
 * ADD MENU TO TEST ENVIRONMENT
 * The test spreadsheet has ATSR code but no onOpen menu function
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_PROJECT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

console.log('\n🔧 ADDING MENU TO TEST ENVIRONMENT\n');
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

async function addMenu() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`🎯 TEST Project ID: ${TEST_PROJECT_ID}\n`);

    // Download current code
    console.log('📥 Downloading current test code...\n');
    const project = await script.projects.getContent({
      scriptId: TEST_PROJECT_ID
    });

    const codeFile = project.data.files.find(f => f.name === 'Code');
    const manifestFile = project.data.files.find(f => f.name === 'appsscript');

    if (!codeFile) {
      throw new Error('Could not find Code.gs in test project');
    }

    const currentCode = codeFile.source;
    console.log(`✅ Current code: ${(currentCode.length / 1024).toFixed(1)} KB\n`);

    // Create backup
    const backupPath = path.join(__dirname, '../backups/test-before-menu-add-2025-11-06.gs');
    fs.writeFileSync(backupPath, currentCode, 'utf8');
    console.log(`💾 Backup created: ${backupPath}\n`);

    // Add onOpen function at the end (before "END OF MONOLITHIC CODE")
    const onOpenFunction = `

// ==================== MENU SYSTEM ====================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('ATSR Titles Optimizer')
    .addItem('✨ Run ATSR Title Generator', 'runATSRTitleGenerator')
    .addToUi();
}
`;

    const endMarker = '// ==================== END OF MONOLITHIC CODE ====================';
    const endIndex = currentCode.lastIndexOf(endMarker);

    if (endIndex === -1) {
      throw new Error('Could not find END OF MONOLITHIC CODE marker');
    }

    const updatedCode = currentCode.substring(0, endIndex) + onOpenFunction + '\n' + endMarker;

    console.log(`📊 Updated code size: ${(updatedCode.length / 1024).toFixed(1)} KB\n`);
    console.log(`   Added: ${(updatedCode.length - currentCode.length)} characters\n`);

    // Upload
    console.log('💾 Uploading updated code to test environment...\n');

    const files = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: updatedCode
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: TEST_PROJECT_ID,
      requestBody: { files }
    });

    console.log('✅ Successfully added menu to test!\n');

    // Save updated code
    const updatedBackupPath = path.join(__dirname, '../backups/test-with-menu-2025-11-06.gs');
    fs.writeFileSync(updatedBackupPath, updatedCode, 'utf8');
    console.log(`💾 Updated code saved: ${updatedBackupPath}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ MENU ADDED!\n');
    console.log('📝 NEXT STEPS:\n');
    console.log('   1. Close test spreadsheet tab completely\n');
    console.log('   2. Wait 10 seconds for script to reload\n');
    console.log('   3. Reopen: https://docs.google.com/spreadsheets/d/1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI\n');
    console.log('   4. You should NOW see "ATSR Titles Optimizer" menu!\n');
    console.log('   5. Click it and run the title generator\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

addMenu();
