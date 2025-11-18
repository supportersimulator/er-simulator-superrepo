#!/usr/bin/env node

/**
 * Delete Empty Rows from Master Sheet
 *
 * Removes the incorrectly added empty rows (10-22) from Master Scenario Convert
 *
 * Usage:
 *   node scripts/deleteEmptyRows.cjs
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
 * Delete empty rows
 */
async function deleteEmptyRows() {
  console.log('');
  console.log('🗑️  DELETING EMPTY ROWS FROM MASTER SHEET');
  console.log('════════════════════════════════════════════════════');
  console.log(`Sheet ID: ${SHEET_ID}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const sheets = createSheetsClient();

    // First, get the sheet metadata to find the sheetId
    console.log('📖 Getting sheet metadata...');
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
      fields: 'sheets.properties'
    });

    const masterSheet = spreadsheet.data.sheets.find(
      s => s.properties.title === 'Master Scenario Convert'
    );

    if (!masterSheet) {
      throw new Error('Master Scenario Convert sheet not found');
    }

    const sheetId = masterSheet.properties.sheetId;
    console.log(`✅ Found Master Scenario Convert (sheetId: ${sheetId})`);
    console.log('');

    // Delete rows 10-22 (indices 9-21, zero-indexed)
    console.log('🗑️  Deleting rows 10-22 (13 empty rows)...');

    const request = {
      spreadsheetId: SHEET_ID,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: 9,  // Row 10 (zero-indexed)
                endIndex: 22    // Up to but not including row 23
              }
            }
          }
        ]
      }
    };

    await sheets.spreadsheets.batchUpdate(request);

    console.log('✅ Successfully deleted 13 empty rows');
    console.log('');
    console.log('════════════════════════════════════════════════════');
    console.log('✅ CLEANUP COMPLETE');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log('Master Scenario Convert now has:');
    console.log('   - Row 1-2: Headers');
    console.log('   - Rows 3-9: 7 processed cases');
    console.log('   - Ready for batch processing to add more rows');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ DELETION FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    process.exit(1);
  }
}

// Run deletion
if (require.main === module) {
  deleteEmptyRows().catch(console.error);
}

module.exports = { deleteEmptyRows };
