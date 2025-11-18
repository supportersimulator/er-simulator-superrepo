#!/usr/bin/env node

/**
 * Run Batch Processing via Apps Script API
 *
 * This script will:
 * 1. Check the Input sheet for available rows
 * 2. Check the Master Scenario Convert sheet for processed rows
 * 3. Identify the next unprocessed rows
 * 4. Execute batch processing via Apps Script API
 *
 * Usage:
 *   node scripts/runBatchProcessing.cjs
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

// OAuth2 credentials
const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.SHEET_ID;
const APPS_SCRIPT_ID = process.env.APPS_SCRIPT_ID;

/**
 * Load OAuth2 token from disk
 */
function loadToken() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error(`Token file not found at ${TOKEN_PATH}. Run 'npm run auth-google' first.`);
  }
  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  return tokenData;
}

/**
 * Create authenticated Sheets API client
 */
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

/**
 * Create authenticated Apps Script API client
 */
function createAppsScriptClient() {
  const oauth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );

  const token = loadToken();
  oauth2Client.setCredentials(token);

  return google.script({ version: 'v1', auth: oauth2Client });
}

/**
 * Main batch processing function
 */
async function runBatchProcessing() {
  console.log('');
  console.log('🚀 RUNNING BATCH PROCESSING');
  console.log('════════════════════════════════════════════════════');
  console.log(`Sheet ID: ${SHEET_ID}`);
  console.log(`Apps Script ID: ${APPS_SCRIPT_ID}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const sheets = createSheetsClient();

    // Step 1: Check Input sheet
    console.log('📖 STEP 1: Reading Input sheet...');
    const inputResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Input!A:D',
    });

    const inputRows = inputResponse.data.values || [];
    console.log(`✅ Found ${inputRows.length} rows in Input sheet`);

    // Count non-empty input rows (starting from row 2, skipping header)
    let inputDataRows = [];
    for (let i = 1; i < inputRows.length; i++) {
      const rowData = inputRows[i];
      const hasData = rowData && rowData.some(cell => cell && String(cell).trim() !== '');
      if (hasData) {
        inputDataRows.push({
          rowNum: i + 1, // 1-indexed
          data: rowData
        });
      }
    }

    console.log(`✅ Found ${inputDataRows.length} non-empty input row(s) (excluding header)`);
    console.log('');

    // Step 2: Check Master Scenario Convert sheet for processed rows
    console.log('📊 STEP 2: Checking Master Scenario Convert sheet...');
    const outputResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Master Scenario Convert!A:E',
    });

    const outputRows = outputResponse.data.values || [];
    console.log(`✅ Found ${outputRows.length} rows in Master Scenario Convert sheet`);

    // Count processed rows (rows 3+ with Case_ID filled)
    let processedCount = 0;
    let nextUnprocessedRow = null;

    for (let i = 2; i < outputRows.length; i++) { // Start at row 3 (index 2)
      const rowData = outputRows[i];
      const caseId = rowData && rowData[0] ? String(rowData[0]).trim() : '';

      if (caseId && caseId !== 'N/A' && caseId !== '') {
        processedCount++;
      } else {
        // Found first unprocessed row
        if (!nextUnprocessedRow) {
          nextUnprocessedRow = i + 1; // Convert to 1-indexed
        }
      }
    }

    console.log(`✅ Found ${processedCount} already processed row(s)`);
    if (nextUnprocessedRow) {
      console.log(`📍 Next unprocessed row: ${nextUnprocessedRow}`);
    }
    console.log('');

    // Step 3: Determine which rows to process
    console.log('🎯 STEP 3: Determining rows to process...');

    // We want to process the next 2 unprocessed rows
    let rowsToProcess = [];
    if (nextUnprocessedRow) {
      rowsToProcess.push(nextUnprocessedRow);
      if (nextUnprocessedRow + 1 <= outputRows.length) {
        rowsToProcess.push(nextUnprocessedRow + 1);
      }
    } else {
      console.log('⚠️  All rows appear to be processed already');
      console.log('');
      return;
    }

    console.log(`✅ Will process rows: ${rowsToProcess.join(', ')}`);
    console.log('');

    // Step 4: Show what we're about to process
    console.log('📋 STEP 4: Preview of rows to process...');
    for (const rowNum of rowsToProcess) {
      const rowData = outputRows[rowNum - 1] || [];
      const preview = rowData.slice(0, 3).map(c =>
        String(c || '').substring(0, 30)
      ).join(' | ');
      console.log(`   Row ${rowNum}: ${preview || '[EMPTY]'}`);
    }
    console.log('');

    // Step 5: Execute via Apps Script
    console.log('⚡ STEP 5: Executing batch processing via Apps Script...');
    console.log(`   Processing ${rowsToProcess.length} row(s)...`);
    console.log('');

    const script = createAppsScriptClient();

    // Call the Apps Script function to run batch processing
    const executionResponse = await script.scripts.run({
      scriptId: APPS_SCRIPT_ID,
      requestBody: {
        function: 'runBatchConvert',
        parameters: ['SPECIFIC', rowsToProcess.join(',')],
        devMode: false
      }
    });

    console.log('✅ Batch processing request sent!');
    console.log('');

    if (executionResponse.data.error) {
      console.error('❌ Apps Script execution error:');
      console.error(JSON.stringify(executionResponse.data.error, null, 2));
      console.log('');
    } else if (executionResponse.data.response) {
      console.log('📊 Response:');
      console.log(JSON.stringify(executionResponse.data.response, null, 2));
      console.log('');
    }

    console.log('════════════════════════════════════════════════════');
    console.log('✅ BATCH PROCESSING INITIATED');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log('The batch processing is running in your Google Sheet.');
    console.log('');
    console.log('🔍 To monitor progress:');
    console.log('1. Open your sheet:');
    console.log(`   https://docs.google.com/spreadsheets/d/${SHEET_ID}`);
    console.log('');
    console.log('2. Watch for toast notifications showing progress');
    console.log('');
    console.log('3. Check the Batch_Reports sheet for final results');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ BATCH PROCESSING FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.response && error.response.data) {
      console.error('API Error Details:');
      console.error(JSON.stringify(error.response.data, null, 2));
      console.error('');
    }

    if (error.message.includes('insufficient authentication')) {
      console.error('💡 Solution: Re-authenticate with Apps Script execution access');
      console.error('');
      console.error('   Run: npm run auth-google');
      console.error('');
    }

    process.exit(1);
  }
}

// Run batch processing
if (require.main === module) {
  runBatchProcessing().catch(console.error);
}

module.exports = { runBatchProcessing };
