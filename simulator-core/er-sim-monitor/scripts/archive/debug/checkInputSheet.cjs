#!/usr/bin/env node

/**
 * Check Input Sheet Status
 *
 * Examines the Input sheet to see what data is available to process
 *
 * Usage:
 *   node scripts/checkInputSheet.cjs
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
 * Check Input sheet status
 */
async function checkInputSheet() {
  console.log('');
  console.log('📋 CHECKING INPUT SHEET STATUS');
  console.log('════════════════════════════════════════════════════');
  console.log(`Sheet ID: ${SHEET_ID}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const sheets = createSheetsClient();

    // Read Input sheet
    console.log('📖 Reading Input sheet...');
    const inputResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Input!A1:D30',
    });

    const rows = inputResponse.data.values || [];
    console.log(`✅ Found ${rows.length} total rows`);
    console.log('');

    // Show headers
    if (rows.length > 0) {
      console.log('📊 HEADERS:');
      const headers = rows[0];
      headers.forEach((h, idx) => {
        console.log(`   Column ${String.fromCharCode(65 + idx)}: ${h}`);
      });
      console.log('');
    }

    // Show data rows
    console.log('📊 DATA ROWS:');
    console.log('');

    let dataRowCount = 0;
    for (let i = 1; i < rows.length; i++) {
      const rowData = rows[i];
      const hasData = rowData && rowData.some(cell => cell && String(cell).trim() !== '');

      if (hasData) {
        dataRowCount++;
        const caseId = rowData[0] || '[EMPTY]';
        const htmlSource = rowData[1] ? String(rowData[1]).substring(0, 50) : '[EMPTY]';
        const wordText = rowData[2] ? String(rowData[2]).substring(0, 50) : '[EMPTY]';

        console.log(`Row ${i + 1}:`);
        console.log(`   Case_ID: ${caseId}`);
        console.log(`   HTML_Source: ${htmlSource}...`);
        console.log(`   Word_Text: ${wordText}...`);
        console.log('');
      }
    }

    console.log('════════════════════════════════════════════════════');
    console.log(`✅ SUMMARY: ${dataRowCount} data row(s) available for processing`);
    console.log('════════════════════════════════════════════════════');
    console.log('');

    // Now check Master Scenario Convert to see what's been processed
    console.log('📊 CHECKING MASTER SCENARIO CONVERT STATUS...');
    console.log('');

    const masterResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Master Scenario Convert!A1:E30',
    });

    const masterRows = masterResponse.data.values || [];
    console.log(`✅ Found ${masterRows.length} total rows in Master sheet`);
    console.log('');

    // Count processed rows (skip headers row 1-2, start from row 3)
    let processedCount = 0;
    console.log('📊 PROCESSED CASES:');
    console.log('');

    for (let i = 2; i < masterRows.length; i++) {
      const rowData = masterRows[i];
      const caseId = rowData && rowData[0] ? String(rowData[0]).trim() : '';

      if (caseId && caseId !== 'N/A' && caseId !== '') {
        processedCount++;
        const title = rowData[1] ? String(rowData[1]).substring(0, 50) : '[EMPTY]';
        console.log(`   Row ${i + 1}: ${caseId} - ${title}...`);
      }
    }

    console.log('');
    console.log('════════════════════════════════════════════════════');
    console.log(`✅ ${processedCount} case(s) already processed`);
    console.log(`📍 ${dataRowCount - processedCount} case(s) remaining to process`);
    console.log('════════════════════════════════════════════════════');
    console.log('');

    if (dataRowCount > processedCount) {
      console.log('💡 NEXT STEPS:');
      console.log('');
      console.log('   Ready to process next 2 cases using batch mode.');
      console.log('   The batch processor will:');
      console.log('   1. Read rows from Input sheet');
      console.log('   2. Send to OpenAI API for conversion');
      console.log('   3. Create NEW rows in Master Scenario Convert');
      console.log('');
      console.log('   To proceed, run batch processing via Google Sheets UI:');
      console.log('   🚀 ER Simulator → 📋 Batch Convert → Run 25 Rows');
      console.log('');
    } else {
      console.log('✅ All Input rows have been processed!');
      console.log('');
    }

  } catch (error) {
    console.error('');
    console.error('❌ CHECK FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    process.exit(1);
  }
}

// Run check
if (require.main === module) {
  checkInputSheet().catch(console.error);
}

module.exports = { checkInputSheet };
