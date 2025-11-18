#!/usr/bin/env node

/**
 * CHECK WHAT APPS SCRIPT PROJECT IS BOUND TO TEST SPREADSHEET
 * This will tell us which script the spreadsheet is actually using
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

console.log('\n🔍 CHECKING SPREADSHEET BINDINGS\n');
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

async function checkBindings() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    console.log(`🎯 TEST Spreadsheet ID: ${TEST_SPREADSHEET_ID}\n`);

    // Get spreadsheet metadata
    console.log('📥 Fetching spreadsheet metadata...\n');
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: TEST_SPREADSHEET_ID
    });

    console.log(`📊 Spreadsheet Name: ${spreadsheet.data.properties.title}\n`);
    console.log(`   URL: https://docs.google.com/spreadsheets/d/${TEST_SPREADSHEET_ID}\n`);

    // List children (bound scripts appear as children)
    console.log('🔗 Checking for bound scripts (Apps Script projects)...\n');

    const files = await drive.files.list({
      q: `'${TEST_SPREADSHEET_ID}' in parents and mimeType='application/vnd.google-apps.script'`,
      fields: 'files(id, name, createdTime, modifiedTime, webViewLink)'
    });

    if (files.data.files.length === 0) {
      console.log('❌ NO BOUND SCRIPTS FOUND!\n');
      console.log('   This means the spreadsheet has no attached Apps Script project.\n');
      console.log('   The ATSR Title Optimizer menu should not be working at all.\n');
      console.log('   This is VERY unusual if you\'re seeing a menu!\n');
    } else {
      console.log(`📚 FOUND ${files.data.files.length} BOUND SCRIPT(S):\n`);
      console.log('═══════════════════════════════════════════════════════════════\n');

      files.data.files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name}`);
        console.log(`   Script ID: ${file.id}`);
        console.log(`   Created: ${new Date(file.createdTime).toLocaleString()}`);
        console.log(`   Modified: ${new Date(file.modifiedTime).toLocaleString()}`);
        console.log(`   URL: ${file.webViewLink || 'N/A'}`);
        console.log('');

        // Compare with our known test project
        if (file.id === '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf') {
          console.log('   ✅ THIS IS OUR KNOWN TEST PROJECT (matches expected ID)\n');
        } else {
          console.log(`   ⚠️  WARNING: This is NOT the expected test project!\n`);
          console.log(`   Expected: 1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf\n`);
          console.log(`   Found:    ${file.id}\n`);
          console.log(`   🔴 THIS MIGHT BE THE PROBLEM - Wrong script bound!\n`);
        }
      });

      console.log('═══════════════════════════════════════════════════════════════\n');

      if (files.data.files.length > 1) {
        console.log('⚠️  MULTIPLE BOUND SCRIPTS DETECTED!\n');
        console.log('   This is unusual. A spreadsheet normally has only ONE bound script.\n');
        console.log('   The spreadsheet might be calling the wrong one!\n');
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📝 NEXT STEP:\n');
    console.log('   If the bound script ID does NOT match:\n');
    console.log('   1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf\n');
    console.log('   Then we need to:\n');
    console.log('   1. Download the ACTUAL bound script\n');
    console.log('   2. Update that one instead\n');
    console.log('   OR rebind the spreadsheet to the correct project\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

checkBindings();
