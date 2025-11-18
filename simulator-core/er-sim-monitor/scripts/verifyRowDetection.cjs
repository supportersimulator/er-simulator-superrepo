#!/usr/bin/env node

/**
 * Verify Row Detection is Working Correctly
 *
 * This script verifies that the next row detection will work correctly
 * by reading the current Output sheet state and calculating what the
 * next row should be.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || process.env.SHEET_ID;

async function verifyRowDetection() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  VERIFY ROW DETECTION');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  // Read Settings to get output sheet name
  console.log('📖 Reading Settings...');
  const settingsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Settings!A1:B2'
  });

  const settingsData = settingsResponse.data.values || [];
  let outputSheetName = 'Master Scenario Convert';

  if (settingsData.length > 0 && settingsData[0][0]) {
    outputSheetName = settingsData[0][0];
  }

  console.log(`✅ Output sheet: ${outputSheetName}`);
  console.log('');

  // Read Output sheet to count rows
  console.log('📊 Reading Output sheet...');
  const outputResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${outputSheetName}!A:A`
  });

  const outputData = outputResponse.data.values || [];
  const outputLast = outputData.length;

  console.log(`Total rows in Output: ${outputLast}`);
  console.log('');

  // Read Input sheet to count rows
  const inputSheetName = 'Input'; // Default input sheet
  console.log(`📊 Reading Input sheet (${inputSheetName})...`);
  const inputResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${inputSheetName}!A:A`
  });

  const inputData = inputResponse.data.values || [];
  const inputLast = inputData.length;

  console.log(`Total rows in Input: ${inputLast}`);
  console.log('');

  // Calculate next row using the robust formula
  console.log('═══════════════════════════════════════════════════');
  console.log('  ROBUST ROW DETECTION CALCULATION');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const outputDataRows = Math.max(0, outputLast - 2);
  const nextInputRow = 3 + outputDataRows;

  console.log('Formula: nextInputRow = 3 + (outputLast - 2)');
  console.log('');
  console.log(`Step 1: outputLast = ${outputLast}`);
  console.log(`Step 2: outputDataRows = ${outputLast} - 2 = ${outputDataRows}`);
  console.log(`Step 3: nextInputRow = 3 + ${outputDataRows} = ${nextInputRow}`);
  console.log('');

  // Verify against user's expectation
  console.log('═══════════════════════════════════════════════════');
  console.log('  VERIFICATION');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const expectedNextRow = 15; // User confirmed this
  const matches = nextInputRow === expectedNextRow;

  if (matches) {
    console.log(`✅ CORRECT! Next row = ${nextInputRow} (matches user expectation: ${expectedNextRow})`);
  } else {
    console.log(`⚠️  MISMATCH! Next row = ${nextInputRow}, but user expects ${expectedNextRow}`);
  }
  console.log('');

  // Show what rows will be queued
  const rowsToQueue = [];
  for (let r = nextInputRow; r <= inputLast && rowsToQueue.length < 25; r++) {
    rowsToQueue.push(r);
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('  NEXT BATCH (25 rows)');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Will queue ${rowsToQueue.length} rows:`);
  console.log(`  First 10: [${rowsToQueue.slice(0, 10).join(', ')}]`);
  if (rowsToQueue.length > 10) {
    console.log(`  Last row: ${rowsToQueue[rowsToQueue.length - 1]}`);
  }
  console.log('');

  // Show sample of Output Case_IDs
  console.log('═══════════════════════════════════════════════════');
  console.log('  PROCESSED CASE_IDS (Last 10)');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const caseIdStart = Math.max(3, outputLast - 9);
  const caseIdRange = `${outputSheetName}!A${caseIdStart}:A${outputLast}`;
  const caseIdResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: caseIdRange
  });

  const caseIds = caseIdResponse.data.values || [];
  caseIds.forEach((row, idx) => {
    const rowNum = caseIdStart + idx;
    const caseId = row[0] || '';
    console.log(`  Row ${rowNum}: ${caseId}`);
  });

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ VERIFICATION COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh Google Sheets (F5)');
  console.log('2. Click "Launch Batch Engine"');
  console.log(`3. Should process starting at row ${nextInputRow}`);
  console.log('');
}

if (require.main === module) {
  verifyRowDetection().catch(error => {
    console.error('');
    console.error('❌ FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { verifyRowDetection };
