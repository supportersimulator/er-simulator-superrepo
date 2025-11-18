#!/usr/bin/env node

/**
 * Execute Batch Processing Directly via Apps Script API
 *
 * This script directly calls the batch processing functions in Apps Script,
 * bypassing the need for manual menu interaction. It can:
 * - Call any Apps Script function
 * - Pass parameters
 * - Monitor execution
 * - Get results
 *
 * Usage:
 *   node scripts/executeBatchDirect.cjs [rows]
 *   Example: node scripts/executeBatchDirect.cjs "10,11"
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

// OAuth2 credentials
const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const APPS_SCRIPT_ID = process.env.APPS_SCRIPT_ID;
const SHEET_ID = process.env.SHEET_ID;

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
 * Create authenticated Sheets API client for monitoring
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
 * Execute batch processing directly
 */
async function executeBatchDirect(rowSpec) {
  console.log('');
  console.log('🚀 EXECUTING BATCH PROCESSING DIRECTLY');
  console.log('════════════════════════════════════════════════════');
  console.log(`Apps Script ID: ${APPS_SCRIPT_ID}`);
  console.log(`Sheet ID: ${SHEET_ID}`);
  console.log(`Rows to process: ${rowSpec}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const script = createAppsScriptClient();
    const sheets = createSheetsClient();

    // Step 1: Check current state
    console.log('📊 STEP 1: Checking current state...');
    const beforeResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Master Scenario Convert!A1:E20',
    });

    const beforeRows = beforeResponse.data.values || [];
    console.log(`✅ Master sheet has ${beforeRows.length} rows`);
    console.log('');

    // Step 2: Parse row specification
    console.log('🎯 STEP 2: Parsing row specification...');
    const rowsArray = rowSpec.split(',').map(r => r.trim());
    console.log(`✅ Will process ${rowsArray.length} row(s): ${rowsArray.join(', ')}`);
    console.log('');

    // Step 3: Preview what we're about to process
    console.log('📋 STEP 3: Preview of rows to process...');
    for (const rowNum of rowsArray) {
      const idx = parseInt(rowNum) - 1;
      if (idx >= 0 && idx < beforeRows.length) {
        const rowData = beforeRows[idx];
        const preview = rowData.slice(0, 3).map(c =>
          String(c || '').substring(0, 30)
        ).join(' | ');
        console.log(`   Row ${rowNum}: ${preview || '[EMPTY]'}`);
      }
    }
    console.log('');

    // Step 4: Initialize batch processing
    console.log('⚡ STEP 4: Initializing batch processing...');
    console.log('   Calling: startBatchFromSidebar()');
    console.log('');

    const initResponse = await script.scripts.run({
      scriptId: APPS_SCRIPT_ID,
      requestBody: {
        function: 'startBatchFromSidebar',
        parameters: [
          'Input',                    // inputSheetName
          'Master Scenario Convert',  // outputSheetName
          'specific',                 // mode
          rowSpec                     // spec (e.g., "10,11")
        ],
        devMode: false
      }
    });

    if (initResponse.data.error) {
      console.error('❌ Error initializing batch:');
      console.error(JSON.stringify(initResponse.data.error, null, 2));
      console.log('');
      throw new Error(initResponse.data.error.message || 'Batch initialization failed');
    }

    console.log('✅ Batch initialized successfully');
    console.log(`   ${initResponse.data.response.result || 'Batch queued'}`);
    console.log('');

    // Step 5: Process rows one by one
    console.log('🔄 STEP 5: Processing rows...');
    console.log('');

    let processedCount = 0;
    let hasMore = true;

    while (hasMore) {
      // Call runSingleStepBatch
      const stepResponse = await script.scripts.run({
        scriptId: APPS_SCRIPT_ID,
        requestBody: {
          function: 'runSingleStepBatch',
          parameters: [],
          devMode: false
        }
      });

      if (stepResponse.data.error) {
        console.error('❌ Error during batch step:');
        console.error(JSON.stringify(stepResponse.data.error, null, 2));
        break;
      }

      const result = stepResponse.data.response.result;

      if (result.done) {
        console.log(`✅ ${result.msg || 'Batch processing complete'}`);
        hasMore = false;
      } else {
        processedCount++;
        console.log(`   ⏳ Processed row ${result.row} - ${result.remaining} remaining`);
        console.log(`      ${result.msg || 'Processing...'}`);

        // Wait 2 seconds between rows (rate limiting)
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('');
    console.log(`✅ Processed ${processedCount} row(s)`);
    console.log('');

    // Step 6: Get final report
    console.log('📊 STEP 6: Getting final report...');
    const reportResponse = await script.scripts.run({
      scriptId: APPS_SCRIPT_ID,
      requestBody: {
        function: 'finishBatchAndReport',
        parameters: [],
        devMode: false
      }
    });

    if (reportResponse.data.response && reportResponse.data.response.result) {
      console.log('');
      console.log('════════════════════════════════════════════════════');
      console.log('📋 BATCH REPORT');
      console.log('════════════════════════════════════════════════════');
      console.log(reportResponse.data.response.result);
      console.log('');
    }

    // Step 7: Verify changes
    console.log('🔍 STEP 7: Verifying changes...');
    const afterResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Master Scenario Convert!A1:E20',
    });

    const afterRows = afterResponse.data.values || [];
    console.log(`✅ Master sheet now has ${afterRows.length} rows`);
    console.log('');

    // Show what changed
    console.log('📝 Updated rows:');
    for (const rowNum of rowsArray) {
      const idx = parseInt(rowNum) - 1;
      if (idx >= 0 && idx < afterRows.length) {
        const rowData = afterRows[idx];
        const caseId = rowData[0] || '[EMPTY]';
        const title = rowData[1] ? String(rowData[1]).substring(0, 40) : '[EMPTY]';
        console.log(`   Row ${rowNum}: ${caseId} - ${title}...`);
      }
    }
    console.log('');

    console.log('════════════════════════════════════════════════════');
    console.log('✅ BATCH PROCESSING COMPLETE');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log('View results:');
    console.log(`https://docs.google.com/spreadsheets/d/${SHEET_ID}`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ BATCH EXECUTION FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.response && error.response.data) {
      console.error('Full error details:');
      console.error(JSON.stringify(error.response.data, null, 2));
      console.error('');
    }

    if (error.message.includes('insufficient authentication')) {
      console.error('💡 Solution: Need Apps Script execution permission');
      console.error('');
      console.error('   The token needs the scope:');
      console.error('   https://www.googleapis.com/auth/script.projects');
      console.error('');
      console.error('   Run: npm run auth-google');
      console.error('');
    }

    process.exit(1);
  }
}

// Run batch execution
const rowSpec = process.argv[2] || '10,11';
if (require.main === module) {
  executeBatchDirect(rowSpec).catch(console.error);
}

module.exports = { executeBatchDirect };
