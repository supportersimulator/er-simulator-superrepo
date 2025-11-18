#!/usr/bin/env node

/**
 * Add Empty Rows to Master Sheet
 *
 * Adds empty rows to Master Scenario Convert sheet so batch
 * processing has rows to fill in
 *
 * Usage:
 *   node scripts/addEmptyRows.cjs [count]
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
 * Add empty rows
 */
async function addEmptyRows(count = 13) {
  console.log('');
  console.log('➕ ADDING EMPTY ROWS TO MASTER SHEET');
  console.log('════════════════════════════════════════════════════');
  console.log(`Sheet ID: ${SHEET_ID}`);
  console.log(`Rows to add: ${count}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const sheets = createSheetsClient();

    // Get current row count
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Master Scenario Convert!A:A',
    });

    const currentRows = response.data.values || [];
    const lastRow = currentRows.length;

    console.log(`✅ Current rows: ${lastRow}`);
    console.log(`   Will add rows ${lastRow + 1} through ${lastRow + count}`);
    console.log('');

    // Create empty rows (just with N/A placeholders for visibility)
    const emptyRows = [];
    for (let i = 0; i < count; i++) {
      // Create a row with mostly empty cells, just a placeholder in first column
      emptyRows.push(['', '', '', '']);  // 4 columns empty
    }

    // Append the empty rows
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Master Scenario Convert!A:D',
      valueInputOption: 'RAW',
      requestBody: {
        values: emptyRows
      }
    });

    console.log(`✅ Added ${count} empty row(s)`);
    console.log('');
    console.log('Now you can run batch processing on these rows!');
    console.log('Example:');
    console.log(`  Rows ${lastRow + 1},${lastRow + 2} (first 2 new rows)`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ FAILED TO ADD ROWS');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    process.exit(1);
  }
}

// Run
const count = parseInt(process.argv[2]) || 13;
if (require.main === module) {
  addEmptyRows(count).catch(console.error);
}

module.exports = { addEmptyRows };
