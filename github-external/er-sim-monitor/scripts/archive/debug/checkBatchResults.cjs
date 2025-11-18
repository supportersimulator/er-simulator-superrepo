#!/usr/bin/env node

/**
 * Check Batch Processing Results
 *
 * Checks the Master Scenario Convert sheet and Batch_Reports to see what was processed
 *
 * Usage:
 *   node scripts/checkBatchResults.cjs
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

function loadToken() {
  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  return tokenData;
}

function createSheetsClient() {
  const oauth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  const token = loadToken();
  oauth2Client.setCredentials(token);
  return google.sheets({ version: 'v4', auth: oauth2Client });
}

async function checkBatchResults() {
  console.log('');
  console.log('🔍 CHECKING BATCH RESULTS');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const sheets = createSheetsClient();

    // Check Input sheet - rows 2 and 3
    console.log('📋 STEP 1: Checking Input sheet (rows 2-3)...');
    const inputResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Input!A2:C3'
    });

    const inputRows = inputResponse.data.values || [];
    console.log(`✅ Found ${inputRows.length} input row(s)`);
    inputRows.forEach((row, idx) => {
      console.log(`   Row ${idx + 2}: Case ID = ${row[0] || 'EMPTY'}`);
    });
    console.log('');

    // Check Master Scenario Convert - last few rows
    console.log('📊 STEP 2: Checking Master Scenario Convert sheet...');
    const masterResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Master Scenario Convert!A:A'
    });

    const masterRows = masterResponse.data.values || [];
    const totalMasterRows = masterRows.length;
    console.log(`✅ Total rows in Master sheet: ${totalMasterRows}`);

    // Get last 5 rows with Case IDs
    console.log('   Last 5 rows:');
    const lastFiveResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `Master Scenario Convert!A${Math.max(2, totalMasterRows - 4)}:A${totalMasterRows}`
    });

    const lastFive = lastFiveResponse.data.values || [];
    lastFive.forEach((row, idx) => {
      const rowNum = totalMasterRows - lastFive.length + idx + 1;
      console.log(`   Row ${rowNum}: ${row[0] || 'EMPTY'}`);
    });
    console.log('');

    // Check Batch_Reports sheet
    console.log('📈 STEP 3: Checking Batch_Reports sheet...');
    const reportsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Batch_Reports!A:H'
    });

    const reports = reportsResponse.data.values || [];
    if (reports.length > 1) {
      const lastReport = reports[reports.length - 1];
      console.log('✅ Latest batch report:');
      console.log(`   Timestamp: ${lastReport[0] || 'N/A'}`);
      console.log(`   Type: ${lastReport[1] || 'N/A'}`);
      console.log(`   Created: ${lastReport[2] || '0'}`);
      console.log(`   Skipped: ${lastReport[3] || '0'}`);
      console.log(`   Duplicates: ${lastReport[4] || '0'}`);
      console.log(`   Errors: ${lastReport[5] || '0'}`);
      console.log(`   Error Details: ${lastReport[6] || 'None'}`);
      console.log(`   Elapsed: ${lastReport[7] || 'N/A'}`);
    } else {
      console.log('⚠️  No batch reports found');
    }
    console.log('');

    // Check for error details in Master sheet
    console.log('🔎 STEP 4: Looking for error indicators...');

    // Check if rows 2 or 3 exist in Master sheet
    const searchResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Master Scenario Convert!A:A'
    });

    const allCaseIds = searchResponse.data.values || [];
    const hasRow2 = allCaseIds.some(row => row[0] && row[0].toString().includes('02'));
    const hasRow3 = allCaseIds.some(row => row[0] && row[0].toString().includes('03'));

    console.log(`   Row 2 in Master sheet: ${hasRow2 ? '✅ YES' : '❌ NO'}`);
    console.log(`   Row 3 in Master sheet: ${hasRow3 ? '✅ YES' : '❌ NO'}`);
    console.log('');

    console.log('════════════════════════════════════════════════════');
    console.log('✅ BATCH RESULTS CHECK COMPLETE');
    console.log('════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ CHECK FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    process.exit(1);
  }
}

if (require.main === module) {
  checkBatchResults().catch(console.error);
}

module.exports = { checkBatchResults };
