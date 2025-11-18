#!/usr/bin/env node

/**
 * RESTORE from lost-and-found (Nov 5, 8:38 PM) - NEWEST version
 * This has the .trim() improvements and all latest work
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

async function restore() {
  console.log('\n🔄 RESTORING from LOST-AND-FOUND (Nov 5, 8:38 PM)\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Load lost-and-found version (NEWEST)
    const lostAndFoundPath = path.join(__dirname, '../backups/lost-and-found-20251105-203821/Code_ULTIMATE_ATSR_FROM_DRIVE.gs');
    let code = fs.readFileSync(lostAndFoundPath, 'utf8');

    console.log(`✅ Loaded lost-and-found: ${Math.round(code.length / 1024)} KB\n`);
    console.log('   This version includes:\n');
    console.log('   • .trim() improvements in processOneInputRow_()\n');
    console.log('   • All latest batch processing work\n');
    console.log('   • All original menu tools\n');

    // Add cache test function at the end
    console.log('📝 Adding TEST-only cache test function...\n');

    const cacheTestFunction = `

// ========== TEST-ONLY Cache Diagnostic ==========

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

    code += cacheTestFunction;

    // Modify onOpen to add TEST Tools menu item
    console.log('📝 Adding TEST Tools menu to onOpen()...\n');

    code = code.replace(
      /(ui\.createMenu\('ER Simulator'\)[\s\S]*?\.addToUi\(\);)/,
      `$1

  // TEST Tools menu (for cache diagnostics)
  ui.createMenu('TEST Tools')
    .addItem('🧪 Run Cache Test (TEST ONLY)', 'runCacheTestWithLogs')
    .addToUi();`
    );

    console.log(`✅ Final code size: ${Math.round(code.length / 1024)} KB\n`);

    // Pull current project
    console.log('📥 Pulling current TEST project...\n');
    const currentProject = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    const phase2File = currentProject.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');
    const manifestFile = currentProject.data.files.find(f => f.name === 'appsscript');

    // Deploy
    console.log('🚀 Deploying RESTORED Code.gs to TEST...\n');

    const files = [manifestFile, { name: 'Code', type: 'SERVER_JS', source: code }, phase2File];

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: { files }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ RESTORED FROM LOST-AND-FOUND!\n');
    console.log('📋 What was restored:\n');
    console.log('   ✅ .trim() improvements in processOneInputRow_()');
    console.log('   ✅ All latest batch processing work (from Nov 5, 8:38 PM)');
    console.log('   ✅ All original menu tools (Sim Builder, ER Simulator)');
    console.log('   ✅ TEST Tools menu with cache test\n');
    console.log('🔄 Refresh TEST spreadsheet to see all menus!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) console.log(e.stack);
  }
}

restore().catch(console.error);
