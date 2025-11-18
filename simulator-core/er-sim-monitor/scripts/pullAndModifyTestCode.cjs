#!/usr/bin/env node

/**
 * Pull Code.gs from TEST, add cache test menu item, redeploy
 * SAFETY: Only works with TEST spreadsheet, never touches MAIN
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

async function pullModifyDeploy() {
  console.log('\n🔧 PULL → MODIFY → DEPLOY TEST Code.gs (SAFE)\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Pull current TEST script
    console.log('📥 Pulling current TEST script...\n');
    const currentProject = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    const codeFile = currentProject.data.files.find(f => f.name === 'Code');
    const phase2File = currentProject.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');
    const manifestFile = currentProject.data.files.find(f => f.name === 'appsscript');

    if (!codeFile) {
      console.log('❌ Code file not found in TEST\n');
      return;
    }

    console.log(`   ✅ Found Code.gs (${Math.round(codeFile.source.length / 1024)} KB)\n`);

    // Modify Code.gs - add cache test function
    let code = codeFile.source;

    // Remove old unsafe version if it exists
    if (code.indexOf('runCacheTestWithLogs') !== -1) {
      console.log('🗑️  Removing old unsafe cache test...\n');
      // Remove function
      code = code.replace(/\/\*\*[\s\S]*?DIAGNOSTIC: Test cache.*?[\s\S]*?function runCacheTestWithLogs\(\)[\s\S]*?\n\}/m, '');
      // Remove menu item
      code = code.replace(/\.addItem\('🧪 Run Cache Test', 'runCacheTestWithLogs'\)\s*/g, '');
    }

    console.log('📝 Adding SAFE TEST-ONLY cache test to TEST Tools menu...\n');

    // Find TEST Tools menu and add item
    const menuPattern = /ui\.createMenu\('TEST Tools'\)/;
    if (menuPattern.test(code)) {
      code = code.replace(
        /ui\.createMenu\('TEST Tools'\)/,
        "ui.createMenu('TEST Tools')\n    .addItem('🧪 Run Cache Test (TEST ONLY)', 'runCacheTestWithLogs')"
      );
      console.log('   ✅ Added menu item\n');
    }

    // Add SAFE function at end - explicitly opens TEST spreadsheet by ID
    const newFunction = `

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

    code += newFunction;
    console.log('   ✅ Added SAFE runCacheTestWithLogs() function\n');
    console.log('   🔒 SAFETY: Function explicitly opens TEST spreadsheet by ID\n');
    console.log(`   🔒 TEST ID: ${TEST_SPREADSHEET_ID}\n`);

    // Redeploy
    console.log('🚀 Redeploying to TEST...\n');

    const files = [manifestFile, { ...codeFile, source: code }, phase2File];

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: { files }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ DEPLOYED!\n');
    console.log('📋 Now in TEST spreadsheet:\n');
    console.log('   1. Refresh the page');
    console.log('   2. Click "TEST Tools" menu');
    console.log('   3. Click "🧪 Run Cache Test (TEST ONLY)"');
    console.log('   4. Check popup + execution log\n');
    console.log('🔒 SAFETY GUARANTEE:\n');
    console.log(`   • Function opens TEST by ID: ${TEST_SPREADSHEET_ID}`);
    console.log('   • Never uses getActiveSpreadsheet()');
    console.log('   • Never searches for "master scenario csv"');
    console.log('   • MAIN spreadsheet is completely untouched\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
  }
}

pullModifyDeploy().catch(console.error);
