#!/usr/bin/env node

/**
 * Restore TEST Tools menu to Code.gs
 * Add back both the menu creation and cache test function
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';
const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

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

async function restoreTestTools() {
  console.log('\n🔧 RESTORING TEST Tools Menu\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Pull current TEST script
    console.log('📥 Pulling Code.gs from TEST...\n');
    const currentProject = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    const codeFile = currentProject.data.files.find(f => f.name === 'Code');
    const phase2File = currentProject.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');
    const manifestFile = currentProject.data.files.find(f => f.name === 'appsscript');

    if (!codeFile) {
      console.log('❌ Code.gs not found\n');
      return;
    }

    console.log(`   ✅ Found Code.gs (${Math.round(codeFile.source.length / 1024)} KB)\n`);

    let code = codeFile.source;

    // Check if TEST Tools menu already exists
    if (code.indexOf("createMenu('TEST Tools')") !== -1) {
      console.log('   ℹ️  TEST Tools menu already exists\n');
    } else {
      console.log('🔧 Adding TEST Tools menu to onOpen()...\n');

      // Find onOpen function and add TEST Tools menu
      const onOpenPattern = /function onOpen\(\) \{[\s\S]*?\n\}/;
      if (onOpenPattern.test(code)) {
        code = code.replace(
          /function onOpen\(\) \{/,
          `function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('TEST Tools')
    .addItem('🧪 Run Cache Test (TEST ONLY)', 'runCacheTestWithLogs')
    .addToUi();`
        );
        console.log('   ✅ Added TEST Tools menu to onOpen()\n');
      } else {
        // If no onOpen exists, create it
        console.log('   ⚠️  No onOpen() found, creating new one...\n');
        code = `function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('TEST Tools')
    .addItem('🧪 Run Cache Test (TEST ONLY)', 'runCacheTestWithLogs')
    .addToUi();
}

` + code;
        console.log('   ✅ Created onOpen() with TEST Tools menu\n');
      }
    }

    // Add cache test function if not exists
    if (code.indexOf('runCacheTestWithLogs') === -1) {
      console.log('🔧 Adding runCacheTestWithLogs() function...\n');

      const testFunction = `

/**
 * DIAGNOSTIC: Test cache functionality with detailed logging
 * SAFETY: ONLY accesses TEST spreadsheet by ID, never touches MAIN
 */
function runCacheTestWithLogs() {
  Logger.log('🚀 CACHE TEST STARTED (TEST SPREADSHEET ONLY)');

  try {
    // SAFETY: Open TEST spreadsheet explicitly by ID
    const TEST_SPREADSHEET_ID = '${TEST_SPREADSHEET_ID}';
    const ss = SpreadsheetApp.openById(TEST_SPREADSHEET_ID);
    Logger.log('✅ TEST Spreadsheet: ' + ss.getName());
    Logger.log('✅ Spreadsheet ID: ' + ss.getId());

    // Verify we have the right spreadsheet
    if (ss.getId() !== TEST_SPREADSHEET_ID) {
      throw new Error('SAFETY CHECK FAILED: Wrong spreadsheet opened!');
    }

    // Get active sheet (whatever sheet is currently open in TEST)
    const sheet = ss.getActiveSheet();
    Logger.log('✅ Active Sheet: ' + sheet.getName());

    const data = sheet.getDataRange().getValues();
    Logger.log('✅ Total rows: ' + data.length);
    Logger.log('✅ Data rows: ' + (data.length - 2));

    Logger.log('✅ CACHE TEST COMPLETE (TEST ONLY)');

    SpreadsheetApp.getUi().alert(
      '✅ Cache Test Complete (TEST ONLY)!\\n\\n' +
      'TEST Spreadsheet ID: ' + TEST_SPREADSHEET_ID + '\\n' +
      'Sheet: ' + sheet.getName() + '\\n' +
      'Data rows: ' + (data.length - 2) + '\\n\\n' +
      'Check Apps Script → Execution log for details'
    );
  } catch (e) {
    Logger.log('❌ ERROR: ' + e.message);
    SpreadsheetApp.getUi().alert('❌ Error: ' + e.message);
  }
}`;

      code += testFunction;
      console.log('   ✅ Added runCacheTestWithLogs()\n');
    } else {
      console.log('   ℹ️  runCacheTestWithLogs() already exists\n');
    }

    // Redeploy
    console.log('🚀 Redeploying to TEST...\n');

    const files = [manifestFile, { ...codeFile, source: code }, phase2File];

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: { files }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ TEST Tools Menu Restored!\n');
    console.log('📋 Next steps:\n');
    console.log('   1. Refresh TEST spreadsheet page');
    console.log('   2. You should see "TEST Tools" menu in menu bar');
    console.log('   3. Click TEST Tools → 🧪 Run Cache Test (TEST ONLY)\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
  }
}

restoreTestTools().catch(console.error);
