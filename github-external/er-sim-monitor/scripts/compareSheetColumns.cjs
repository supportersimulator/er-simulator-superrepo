#!/usr/bin/env node

/**
 * Compare Sheet Columns
 *
 * Compares headers between emsim_final and Input sheet
 * to understand the column mapping
 *
 * Usage:
 *   node scripts/compareSheetColumns.cjs
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

// OAuth2 credentials
const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');

const EMSIM_FINAL_ID = '1Sx_6R3Dr1fbaV3u8y9tgtkc0ir7GV2X-zI9ZJiDwRXA';
const CURRENT_SHEET_ID = process.env.SHEET_ID;

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
 * Main comparison function
 */
async function compareSheetColumns() {
  console.log('');
  console.log('🔍 COMPARING SHEET COLUMNS');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const sheets = createSheetsClient();

    // Read emsim_final headers
    console.log('📖 Reading emsim_final sheet headers...');
    const emsimResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: EMSIM_FINAL_ID,
      range: 'emsim_final!1:1',
    });

    const emsimHeaders = emsimResponse.data.values ? emsimResponse.data.values[0] : [];
    console.log(`✅ Found ${emsimHeaders.length} columns in emsim_final`);
    console.log('');

    // Read Input sheet headers
    console.log('📖 Reading Input sheet headers...');
    const inputResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: CURRENT_SHEET_ID,
      range: 'Input!1:1',
    });

    const inputHeaders = inputResponse.data.values ? inputResponse.data.values[0] : [];
    console.log(`✅ Found ${inputHeaders.length} columns in Input sheet`);
    console.log('');

    // Compare
    console.log('════════════════════════════════════════════════════');
    console.log('📊 COLUMN COMPARISON');
    console.log('════════════════════════════════════════════════════');
    console.log('');

    const maxLen = Math.max(emsimHeaders.length, inputHeaders.length);

    console.log('Col | emsim_final                    | Input Sheet');
    console.log('----+--------------------------------+--------------------------------');

    for (let i = 0; i < maxLen; i++) {
      const emsim = emsimHeaders[i] || '';
      const input = inputHeaders[i] || '';
      const match = emsim === input ? '✓' : ' ';

      const emsimTrunc = emsim.substring(0, 30).padEnd(30);
      const inputTrunc = input.substring(0, 30).padEnd(30);

      console.log(`${String(i + 1).padStart(3)} ${match} ${emsimTrunc} | ${inputTrunc}`);
    }

    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ COMPARISON FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    process.exit(1);
  }
}

// Run comparison
if (require.main === module) {
  compareSheetColumns().catch(console.error);
}

module.exports = { compareSheetColumns };
