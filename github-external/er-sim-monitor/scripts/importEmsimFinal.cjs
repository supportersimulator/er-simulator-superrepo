#!/usr/bin/env node

/**
 * Import emsim_final to Master Scenario Convert
 *
 * Reads raw scenario data from emsim_final sheet and imports
 * to Master Scenario Convert with proper Case_ID generation
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const MASTER_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const EMSIM_FINAL_SHEET_ID = '1Sx_6R3Dr1fbaV3u8y9tgtkc0ir7GV2X-zI9ZJiDwRXA';

function loadToken() {
  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  return tokenData;
}

function createGoogleClient() {
  const oauth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  const token = loadToken();
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

async function readEmsimFinal() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('      IMPORT EMSIM_FINAL TO MASTER SCENARIO');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const auth = createGoogleClient();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('📖 Reading emsim_final sheet...');

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: EMSIM_FINAL_SHEET_ID,
    range: 'emsim_final!A:Z'
  });

  const rows = response.data.values || [];
  console.log(`✅ Read ${rows.length} rows (including header)`);
  console.log('');

  if (rows.length < 2) {
    console.log('❌ No data rows found');
    return null;
  }

  const headers = rows[0];
  console.log(`📋 Columns: ${headers.join(', ')}`);
  console.log('');

  const dataRows = rows.slice(1);
  console.log(`📊 Data rows: ${dataRows.length}`);
  console.log('');

  return { headers, dataRows };
}

async function checkExistingCaseIds() {
  console.log('🔍 Checking existing Case IDs in Master Scenario...');

  const auth = createGoogleClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: MASTER_SHEET_ID,
    range: 'Master Scenario Convert!A:A'
  });

  const existingIds = new Set();
  const rows = response.data.values || [];

  // Skip header rows (2-tier header structure)
  for (let i = 2; i < rows.length; i++) {
    if (rows[i] && rows[i][0]) {
      existingIds.add(rows[i][0].trim());
    }
  }

  console.log(`✅ Found ${existingIds.size} existing Case IDs`);
  console.log('');

  return existingIds;
}

async function getMasterScenarioHeaders() {
  const auth = createGoogleClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: MASTER_SHEET_ID,
    range: 'Master Scenario Convert!1:2' // Get 2-tier headers
  });

  const headerRows = response.data.values || [];
  return headerRows;
}

function generateCaseId(prefix = 'EM') {
  // Generate ID like EM00001, EM00002, etc.
  const timestamp = Date.now().toString().slice(-5);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${prefix}${timestamp}${random}`;
}

async function importToInputSheet(emsimData, dryRun = true) {
  const existingIds = await checkExistingCaseIds();

  console.log('📋 Importing to Input sheet for processing');
  console.log('');

  // Map emsim_final data to Input sheet format
  // Apps Script expects: Column A=Formal_Info, B=HTML, C=DOC, D=Extra (any may be blank)
  const newRows = [];
  const skipped = [];

  console.log('🔄 Processing rows...');
  console.log('');

  for (let i = 0; i < emsimData.dataRows.length; i++) {
    const row = emsimData.dataRows[i];

    if (!row || row.length === 0) {
      skipped.push({ index: i + 1, reason: 'Empty row' });
      continue;
    }

    // Generate unique Case_ID
    let caseId;
    let attempts = 0;
    do {
      caseId = generateCaseId('EM');
      attempts++;
    } while (existingIds.has(caseId) && attempts < 100);

    if (existingIds.has(caseId)) {
      skipped.push({ index: i + 1, reason: 'Could not generate unique ID' });
      continue;
    }

    // Create new row for Input sheet
    // Input sheet currently has 2 columns, so we only populate B and C
    // Leave A and D empty to match existing structure
    const newRow = [];
    newRow[0] = '';              // Column A: (empty to match Input sheet)
    newRow[1] = row[0] || '';    // Column B: HTML (site_text)
    newRow[2] = row[1] || '';    // Column C: DOC (document_text)
    newRow[3] = '';              // Column D: (empty to match Input sheet)

    newRows.push(newRow);
    existingIds.add(caseId);

    if ((i + 1) % 50 === 0) {
      console.log(`   Processed ${i + 1}/${emsimData.dataRows.length} rows...`);
    }
  }

  console.log('');
  console.log(`✅ Processed ${emsimData.dataRows.length} rows`);
  console.log(`   New rows to import: ${newRows.length}`);
  console.log(`   Skipped: ${skipped.length}`);
  console.log('');

  if (skipped.length > 0) {
    console.log('⚠️  Skipped rows:');
    skipped.slice(0, 10).forEach(s => {
      console.log(`   Row ${s.index}: ${s.reason}`);
    });
    if (skipped.length > 10) {
      console.log(`   ... and ${skipped.length - 10} more`);
    }
    console.log('');
  }

  if (newRows.length === 0) {
    console.log('❌ No rows to import');
    return null;
  }

  // Show sample
  console.log('📋 Sample of first 3 rows to import:');
  newRows.slice(0, 3).forEach((row, idx) => {
    console.log(`   Row ${idx + 1}:`);
    console.log(`     Column A: (empty)`);
    console.log(`     Column B (HTML): ${(row[1] || '').substring(0, 80)}...`);
    console.log(`     Column C (DOC): ${(row[2] || '').substring(0, 80)}...`);
    console.log(`     Column D: (empty)`);
    console.log('');
  });

  if (dryRun) {
    console.log('═══════════════════════════════════════════════════');
    console.log('⚠️  DRY RUN MODE - NO CHANGES MADE');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log(`Would import ${newRows.length} rows to Input sheet`);
    console.log('');
    console.log('To proceed with actual import, run:');
    console.log('  node scripts/importEmsimFinal.cjs --execute');
    console.log('');
    return { newRows, dryRun: true };
  }

  // Execute import
  console.log('');
  console.log('💾 Writing to Input sheet...');

  const auth = createGoogleClient();
  const sheets = google.sheets({ version: 'v4', auth });

  // Get current row count in Input sheet
  const existingResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: MASTER_SHEET_ID,
    range: 'Input!A:A'
  });

  const existingRows = existingResponse.data.values || [];
  const nextRow = existingRows.length + 1;

  console.log(`📍 Appending ${newRows.length} rows starting at row ${nextRow}`);

  // Append data to Input sheet
  const range = `Input!A${nextRow}`;
  await sheets.spreadsheets.values.append({
    spreadsheetId: MASTER_SHEET_ID,
    range: range,
    valueInputOption: 'RAW',
    requestBody: {
      values: newRows
    }
  });

  console.log('✅ Import complete!');
  console.log('');
  console.log(`📊 Imported rows: ${newRows.length}`);
  console.log(`📍 Input sheet row range: ${nextRow}-${nextRow + newRows.length - 1}`);
  console.log('');

  return { newRows, startRow: nextRow, endRow: nextRow + newRows.length - 1, dryRun: false };
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--execute');

    // Parse limit argument
    const limitArg = args.find(arg => arg.startsWith('--limit='));
    const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;

    // Read emsim_final data
    const emsimData = await readEmsimFinal();

    if (!emsimData) {
      console.log('❌ No data to import');
      return;
    }

    // Apply limit if specified
    if (limit && limit > 0) {
      console.log(`🔢 Limiting import to first ${limit} rows`);
      emsimData.dataRows = emsimData.dataRows.slice(0, limit);
      console.log(`📊 Rows after limit: ${emsimData.dataRows.length}`);
      console.log('');
    }

    // Import to Input sheet
    const result = await importToInputSheet(emsimData, dryRun);

    if (result && !result.dryRun) {
      console.log('═══════════════════════════════════════════════════');
      console.log('✅ IMPORT COMPLETE');
      console.log('═══════════════════════════════════════════════════');
      console.log('');
      console.log(`📊 Total imported: ${result.newRows.length} rows`);
      console.log(`📍 Input sheet rows: ${result.startRow}-${result.endRow}`);
      console.log('');
      console.log('Next steps:');
      console.log('1. Verify data in Input sheet (rows ${result.startRow}-${result.endRow})');
      console.log('2. Process via Apps Script (Input → Master Scenario):');
      console.log(`   npm run run-batch-http -- "${result.startRow},${result.startRow + 1},...,${result.endRow}"`);
      console.log('');
      console.log('   Example for first 10:');
      const firstTen = Array.from({length: Math.min(10, result.newRows.length)}, (_, i) => result.startRow + i).join(',');
      console.log(`   npm run run-batch-http -- "${firstTen}"`);
      console.log('');
    }

  } catch (error) {
    console.error('');
    console.error('❌ IMPORT FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { readEmsimFinal, importToInputSheet };
