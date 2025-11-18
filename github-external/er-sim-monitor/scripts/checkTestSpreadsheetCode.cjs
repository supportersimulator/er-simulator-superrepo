#!/usr/bin/env node

/**
 * CHECK TEST SPREADSHEET'S BOUND SCRIPT
 * The test spreadsheet has its own bound Apps Script project
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Test spreadsheet ID from the URL
const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

console.log('\n🔍 CHECKING TEST SPREADSHEET\'S BOUND SCRIPT\n');
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

async function checkTestSpreadsheet() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });
    const script = google.script({ version: 'v1', auth });

    console.log(`🎯 Test Spreadsheet ID: ${TEST_SPREADSHEET_ID}\n`);
    console.log('📥 Finding bound Apps Script project...\n');

    // Get the spreadsheet file to find its bound script
    const spreadsheet = await drive.files.get({
      fileId: TEST_SPREADSHEET_ID,
      fields: 'id, name, parents'
    });

    console.log(`✅ Spreadsheet Name: ${spreadsheet.data.name}\n`);

    // List all Apps Script projects to find which one is bound to this spreadsheet
    const projects = await script.projects.list();

    console.log('🔍 Searching for bound script project...\n');

    // We know from earlier the test project ID
    const TEST_PROJECT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

    console.log(`📥 Reading test project code (ID: ${TEST_PROJECT_ID})...\n`);

    const project = await script.projects.getContent({
      scriptId: TEST_PROJECT_ID
    });

    const codeFile = project.data.files.find(f => f.name === 'Code');

    if (!codeFile) {
      throw new Error('Could not find Code.gs file in test project');
    }

    const code = codeFile.source;
    console.log(`✅ Downloaded test project code: ${(code.length / 1024).toFixed(1)} KB\n`);

    // Save current test code
    const testCodePath = path.join(__dirname, '../backups/test-spreadsheet-current-2025-11-06.gs');
    fs.writeFileSync(testCodePath, code, 'utf8');
    console.log(`💾 Saved test spreadsheet code: ${testCodePath}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 CHECKING FOR MYSTERY BUTTON IN TEST CODE:\n');

    // Check for mystery button feature
    const mysteryButtonHTML = code.includes('Make More Mysterious');
    const mysteryButtonFunction = code.includes('function regenerateMoreMysterious');
    const mysteryButtonCall = code.includes('onclick="regenerateMoreMysterious()"');
    const atsrFunction = code.includes('function runATSRTitleGenerator');

    console.log(`${atsrFunction ? '✅' : '❌'} runATSRTitleGenerator function: ${atsrFunction ? 'FOUND' : 'MISSING'}`);
    console.log(`${mysteryButtonHTML ? '✅' : '❌'} Mystery button HTML: ${mysteryButtonHTML ? 'FOUND' : 'MISSING'}`);
    console.log(`${mysteryButtonFunction ? '✅' : '❌'} regenerateMoreMysterious() function: ${mysteryButtonFunction ? 'FOUND' : 'MISSING'}`);
    console.log(`${mysteryButtonCall ? '✅' : '❌'} onclick handler: ${mysteryButtonCall ? 'FOUND' : 'MISSING'}`);

    // Check if the mystery button is enabled for Spark Titles
    const sparkTitlesWithButton = code.match(/makeEditable.*Spark.*true/);
    console.log(`${sparkTitlesWithButton ? '✅' : '❌'} Mystery button enabled for Spark Titles: ${sparkTitlesWithButton ? 'YES' : 'NO'}`);

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    if (!atsrFunction) {
      console.log('❌ PROBLEM: Test spreadsheet has NO ATSR code at all!\n');
      console.log('   This explains why you can\'t see the mystery button.\n');
      console.log('   The test spreadsheet needs the ATSR feature added.\n');
    } else if (!mysteryButtonHTML || !mysteryButtonFunction || !mysteryButtonCall) {
      console.log('❌ PROBLEM: Test spreadsheet has OLD ATSR version!\n');
      console.log('   The mystery button feature is missing or incomplete.\n');
      console.log('   Need to update test spreadsheet with new ATSR code.\n');
    } else if (!sparkTitlesWithButton) {
      console.log('⚠️  PROBLEM: Mystery button exists but is NOT ENABLED!\n');
      console.log('   The showMysteryButton parameter is set to false.\n');
      console.log('   Need to enable the mystery button for Spark Titles.\n');
    } else {
      console.log('✅ Test spreadsheet has complete mystery button feature!\n');
      console.log('   If you still can\'t see it, try:\n');
      console.log('   1. Hard refresh (Cmd+Shift+R)\n');
      console.log('   2. Close and reopen spreadsheet\n');
      console.log('   3. Check you\'re clicking "ATSR Titles Optimizer" menu\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

checkTestSpreadsheet();
