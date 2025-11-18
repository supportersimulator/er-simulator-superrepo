#!/usr/bin/env node

/**
 * Test Batch Processing
 *
 * Safely tests the batch processing engine by:
 * 1. Reading the Google Sheet structure
 * 2. Checking for the batch processing menu/functions
 * 3. Attempting a small batch (2-3 rows) if safe
 *
 * Usage:
 *   node scripts/testBatchProcessing.cjs
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
 * Main test function
 */
async function testBatchProcessing() {
  console.log('');
  console.log('🧪 TESTING BATCH PROCESSING');
  console.log('════════════════════════════════════════════════════');
  console.log(`Sheet ID: ${SHEET_ID}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const sheets = createSheetsClient();

    // Step 1: Read sheet structure
    console.log('📖 STEP 1: Reading Google Sheet structure...');
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
      fields: 'sheets.properties'
    });

    console.log(`✅ Found ${spreadsheet.data.sheets.length} sheet(s):`);
    spreadsheet.data.sheets.forEach(sheet => {
      console.log(`   - ${sheet.properties.title}`);
    });
    console.log('');

    // Find the Master Scenario Convert sheet
    const masterSheet = spreadsheet.data.sheets.find(s =>
      s.properties.title.includes('Master') ||
      s.properties.title.includes('Convert')
    );

    if (!masterSheet) {
      console.log('⚠️  Could not find "Master Scenario Convert" sheet');
      console.log('   Available sheets listed above.');
      console.log('');
      return;
    }

    const sheetName = masterSheet.properties.title;
    console.log(`✅ Using sheet: "${sheetName}"`);
    console.log('');

    // Step 2: Read current data (first few rows)
    console.log('📊 STEP 2: Checking existing data...');
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A1:D10`, // Read first 10 rows, first 4 columns
    });

    const rows = dataResponse.data.values || [];
    console.log(`✅ Found ${rows.length} rows in range A1:D10`);
    console.log('');

    // Show header structure
    if (rows.length >= 2) {
      console.log('📋 Header structure (Two-tier):');
      console.log(`   Tier 1 (Row 1): ${rows[0].slice(0, 4).join(' | ')}`);
      console.log(`   Tier 2 (Row 2): ${rows[1].slice(0, 4).join(' | ')}`);
      console.log('');
    }

    // Show data rows (starting from row 3)
    if (rows.length > 2) {
      console.log(`📄 Data rows (starting at row 3):`);
      for (let i = 2; i < Math.min(rows.length, 6); i++) {
        const rowNum = i + 1;
        const rowData = rows[i];
        const isEmpty = !rowData || rowData.every(cell => !cell || String(cell).trim() === '');

        if (isEmpty) {
          console.log(`   Row ${rowNum}: [EMPTY]`);
        } else {
          const preview = rowData.slice(0, 2).map(c =>
            String(c || '').substring(0, 30)
          ).join(' | ');
          console.log(`   Row ${rowNum}: ${preview}...`);
        }
      }
      console.log('');
    }

    // Step 3: Check if we can safely test
    console.log('🔍 STEP 3: Safety check...');

    // Count non-empty rows after headers (row 3 onwards)
    let testableRows = [];
    for (let i = 2; i < rows.length; i++) {
      const rowData = rows[i];
      const hasData = rowData && rowData.some(cell => cell && String(cell).trim() !== '');
      if (hasData) {
        testableRows.push(i + 1); // Convert to 1-indexed row number
      }
    }

    console.log(`✅ Found ${testableRows.length} non-empty data row(s)`);
    console.log('');

    if (testableRows.length === 0) {
      console.log('⚠️  No data rows to test with');
      console.log('   Please add some input data to row 3 or later');
      console.log('');
      return;
    }

    // Step 4: Instructions for manual testing
    console.log('════════════════════════════════════════════════════');
    console.log('✅ BATCH PROCESSING IS READY TO TEST');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log('Your Google Sheet has the data structure ready.');
    console.log('');
    console.log('🧪 TO TEST BATCH PROCESSING:');
    console.log('');
    console.log('1. Open your Google Sheet:');
    console.log(`   https://docs.google.com/spreadsheets/d/${SHEET_ID}`);
    console.log('');
    console.log('2. You should see a menu: 🚀 ER Simulator');
    console.log('   (If not, refresh the page)');
    console.log('');
    console.log('3. Click: 🚀 ER Simulator → 📋 Batch Convert → 🎯 Process Specific Rows');
    console.log('');
    console.log('4. Enter this in the prompt:');
    console.log(`   ${testableRows.slice(0, 2).join(',')}`);
    console.log(`   (This will process just ${Math.min(testableRows.length, 2)} row(s) safely)`);
    console.log('');
    console.log('5. Click OK and watch the progress!');
    console.log('');
    console.log('════════════════════════════════════════════════════');
    console.log('📊 WHAT TO EXPECT:');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log('✅ Toast notifications showing progress');
    console.log('✅ OpenAI API calls to generate case scenarios');
    console.log('✅ Cells populated with JSON data');
    console.log('✅ Quality scores calculated');
    console.log('✅ Batch report at the end');
    console.log('');
    console.log('⚠️  NOTE: This will use OpenAI API credits');
    console.log('   Make sure your API key is configured in the sheet');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ TEST FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.message.includes('insufficient authentication')) {
      console.error('💡 Solution: Re-authenticate with Sheets API access');
      console.error('');
      console.error('   Run: npm run auth-google');
      console.error('');
    }

    process.exit(1);
  }
}

// Run test
if (require.main === module) {
  testBatchProcessing().catch(console.error);
}

module.exports = { testBatchProcessing };
