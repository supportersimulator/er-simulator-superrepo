#!/usr/bin/env node

/**
 * Test Sidebar Single-Case Mode
 *
 * This simulates what happens when you use the sidebar to process one row
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

async function testSidebarMode(rowNumber) {
  console.log('');
  console.log('🧪 TESTING SIDEBAR SINGLE-CASE MODE');
  console.log('════════════════════════════════════════════════════');
  console.log(`Target Row: ${rowNumber}`);
  console.log('');

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oauth2Client });

  try {
    console.log('📡 Calling Apps Script function: runSingleCaseFromSidebar');
    console.log('   Input Sheet: Input');
    console.log('   Output Sheet: Master Scenario Convert');
    console.log(`   Row: ${rowNumber}`);
    console.log('');

    const response = await script.scripts.run({
      scriptId: SCRIPT_ID,
      requestBody: {
        function: 'runSingleCaseFromSidebar',
        parameters: ['Input', 'Master Scenario Convert', rowNumber],
        devMode: false
      }
    });

    if (response.data.error) {
      console.log('❌ APPS SCRIPT ERROR:');
      console.log('════════════════════════════════════════════════════');
      console.log(JSON.stringify(response.data.error, null, 2));
      console.log('');

      if (response.data.error.details) {
        console.log('Error Details:');
        response.data.error.details.forEach(detail => {
          console.log(`   ${detail.errorMessage}`);
        });
      }
      console.log('');
      return;
    }

    console.log('✅ SUCCESS!');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log('Response from Apps Script:');
    console.log(JSON.stringify(response.data.response, null, 2));
    console.log('');

    // Check if a new row was created in Master Scenario Convert
    console.log('🔍 Verifying Master Scenario Convert sheet...');
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    const masterResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Master Scenario Convert!A1:E10'
    });

    const rows = masterResponse.data.values || [];
    console.log(`   Total rows in Master Scenario Convert: ${rows.length}`);
    console.log('');

    if (rows.length > 7) {
      const lastRow = rows[rows.length - 1];
      console.log('   Last row (newest):');
      console.log(`      Case_ID: ${lastRow[0] || '(empty)'}`);
      console.log(`      Field 2: ${lastRow[1] ? lastRow[1].substring(0, 60) + '...' : '(empty)'}`);
      console.log(`      Field 3: ${lastRow[2] ? lastRow[2].substring(0, 60) + '...' : '(empty)'}`);
      console.log('');
    }

    console.log('════════════════════════════════════════════════════');
    console.log('✅ TEST COMPLETE');
    console.log('════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ TEST FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.code === 404) {
      console.error('💡 APPS_SCRIPT_ID not found in .env or script not deployed');
      console.error('   Run: npm run get-script-id');
      console.error('');
    } else if (error.code === 403) {
      console.error('💡 Authorization required');
      console.error('   The Apps Script Execution API may need to be enabled');
      console.error('   Or the function may not be authorized to run via API');
      console.error('');
    }

    process.exit(1);
  }
}

const rowNum = parseInt(process.argv[2]) || 3;

if (require.main === module) {
  testSidebarMode(rowNum).catch(console.error);
}

module.exports = { testSidebarMode };
