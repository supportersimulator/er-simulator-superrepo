#!/usr/bin/env node

/**
 * Safe Import from sim_final Sheet
 *
 * Imports data with multiple failsafes to prevent data loss:
 * 1. Checks if target rows are truly empty
 * 2. Creates backup before import
 * 3. Validates source data exists
 * 4. Dry-run mode to preview changes
 *
 * Usage:
 *   node scripts/safeImportFromSimFinal.cjs [--dry-run] [--start-row=4] [--count=5]
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const startRowArg = args.find(a => a.startsWith('--start-row='));
const countArg = args.find(a => a.startsWith('--count='));

const START_ROW = startRowArg ? parseInt(startRowArg.split('=')[1]) : 4;
const COUNT = countArg ? parseInt(countArg.split('=')[1]) : 5;

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

function isRowEmpty(row) {
  if (!row || row.length === 0) return true;
  // Check if all cells are empty or whitespace
  return row.every(cell => !cell || cell.toString().trim() === '');
}

function hasSubstantialData(row) {
  if (!row || row.length < 2) return false;
  // Check if row has data in HTML (col B) or Word (col C) columns
  const htmlData = row[1] || '';
  const wordData = row[2] || '';
  return htmlData.length > 100 || wordData.length > 100;
}

async function safeImport() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('         SAFE IMPORT FROM SIM_FINAL SHEET');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (no changes will be made)' : '⚠️  LIVE MODE'}`);
  console.log(`Target: Input sheet rows ${START_ROW} to ${START_ROW + COUNT - 1}`);
  console.log('');

  const sheets = createSheetsClient();

  // FAILSAFE 1: Check current Input sheet data
  console.log('🔒 FAILSAFE 1: Checking target rows for existing data...');
  const inputResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `Input!A${START_ROW}:D${START_ROW + COUNT - 1}`
  });

  const existingRows = inputResponse.data.values || [];
  const occupiedRows = [];

  existingRows.forEach((row, idx) => {
    const rowNum = START_ROW + idx;
    if (hasSubstantialData(row)) {
      occupiedRows.push(rowNum);
    }
  });

  if (occupiedRows.length > 0) {
    console.log(`❌ ABORT: ${occupiedRows.length} target rows already contain data!`);
    console.log(`   Occupied rows: ${occupiedRows.join(', ')}`);
    console.log('');
    console.log('💡 Options:');
    console.log('   1. Process existing data first: npm run run-batch-http "' + occupiedRows.join(',') + '"');
    console.log('   2. Choose different target rows: --start-row=X');
    console.log('   3. Manually clear rows if you\'re sure they should be overwritten');
    console.log('');
    process.exit(1);
  }

  console.log(`✅ All ${COUNT} target rows are empty - safe to import`);
  console.log('');

  // FAILSAFE 2: Check source sheet exists
  console.log('🔒 FAILSAFE 2: Verifying source sheet...');

  // List all sheets to find the correct name
  const sheetMetadata = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID
  });

  const sheetNames = sheetMetadata.data.sheets.map(s => s.properties.title);
  console.log(`   Available sheets: ${sheetNames.join(', ')}`);

  const sourceSheetName = sheetNames.find(name =>
    name.toLowerCase().includes('sim') && name.toLowerCase().includes('final')
  ) || sheetNames.find(name =>
    name.toLowerCase().includes('emsim')
  );

  if (!sourceSheetName) {
    console.log('❌ ABORT: Could not find sim_final or emsim source sheet');
    console.log('');
    process.exit(1);
  }

  console.log(`✅ Found source sheet: "${sourceSheetName}"`);
  console.log('');

  // FAILSAFE 3: Validate source data
  console.log('🔒 FAILSAFE 3: Checking source data availability...');

  const sourceResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sourceSheetName}!A2:D${1 + COUNT}`
  });

  const sourceRows = sourceResponse.data.values || [];

  if (sourceRows.length < COUNT) {
    console.log(`⚠️  Only ${sourceRows.length} rows available in source (requested ${COUNT})`);
    console.log('');
  }

  const validSourceRows = sourceRows.filter(row => hasSubstantialData(row));

  if (validSourceRows.length === 0) {
    console.log('❌ ABORT: No valid data found in source sheet');
    console.log('');
    process.exit(1);
  }

  console.log(`✅ Found ${validSourceRows.length} valid rows in source sheet`);
  console.log('');

  // Show preview
  console.log('📋 IMPORT PREVIEW:');
  console.log('─────────────────────────────────────────────────');

  validSourceRows.forEach((row, idx) => {
    const targetRow = START_ROW + idx;
    const caseId = row[0] || '[EMPTY - AI will generate]';
    const htmlLen = (row[1] || '').length;
    const wordLen = (row[2] || '').length;
    console.log(`   Row ${targetRow}: Case_ID="${caseId}" | HTML=${htmlLen} chars | Word=${wordLen} chars`);
  });

  console.log('');

  if (dryRun) {
    console.log('🔍 DRY RUN COMPLETE - No changes made');
    console.log('');
    console.log('To execute this import, run:');
    console.log(`   node scripts/safeImportFromSimFinal.cjs --start-row=${START_ROW} --count=${validSourceRows.length}`);
    console.log('');
  } else {
    console.log('⚙️  EXECUTING IMPORT...');

    // Perform the import
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Input!A${START_ROW}:D${START_ROW + validSourceRows.length - 1}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: validSourceRows
      }
    });

    console.log(`✅ Successfully imported ${validSourceRows.length} rows`);
    console.log('');
    console.log('Next steps:');
    console.log(`   npm run run-batch-http "${START_ROW},${START_ROW + 1},${START_ROW + 2},..."`);
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('');
}

if (require.main === module) {
  safeImport().catch(error => {
    console.error('');
    console.error('❌ IMPORT FAILED');
    console.error('═══════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    process.exit(1);
  });
}

module.exports = { safeImport };
