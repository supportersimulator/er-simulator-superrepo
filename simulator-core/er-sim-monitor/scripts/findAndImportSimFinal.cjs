#!/usr/bin/env node

/**
 * Find and Import Sim_Final Sheet
 *
 * Searches for Google Sheets containing "sim_final" and imports
 * case data into the Master Scenario Convert sheet
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const MASTER_SHEET_ID = process.env.GOOGLE_SHEET_ID;

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

async function searchForSimFinal() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('      SEARCH FOR SIM_FINAL GOOGLE SHEET');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const auth = createGoogleClient();
  const drive = google.drive({ version: 'v3', auth });

  console.log('🔍 Searching Google Drive for sheets containing "sim"...');

  const response = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet' and name contains 'sim'",
    fields: 'files(id, name, createdTime, modifiedTime)',
    orderBy: 'modifiedTime desc',
    pageSize: 20
  });

  const files = response.data.files || [];

  console.log(`✅ Found ${files.length} spreadsheet(s):`);
  console.log('');

  files.forEach((file, idx) => {
    console.log(`${idx + 1}. ${file.name}`);
    console.log(`   ID: ${file.id}`);
    console.log(`   Modified: ${new Date(file.modifiedTime).toLocaleString()}`);
    console.log('');
  });

  return files;
}

async function readSheetData(sheetId, sheetName = null) {
  console.log('');
  console.log('📖 Reading sheet data...');

  const auth = createGoogleClient();
  const sheets = google.sheets({ version: 'v4', auth });

  // Get sheet metadata to find sheet names
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: sheetId
  });

  const availableSheets = metadata.data.sheets.map(s => s.properties.title);
  console.log(`📋 Available tabs: ${availableSheets.join(', ')}`);
  console.log('');

  // Use first sheet if not specified
  const targetSheet = sheetName || availableSheets[0];
  console.log(`📊 Reading from tab: "${targetSheet}"`);

  const range = `${targetSheet}!A1:Z1000`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: range
  });

  const rows = response.data.values || [];
  console.log(`✅ Read ${rows.length} rows`);

  if (rows.length > 0) {
    console.log(`📋 Headers: ${rows[0].slice(0, 5).join(', ')}...`);
  }

  return { rows, sheetName: targetSheet };
}

async function checkExistingCaseIds() {
  console.log('');
  console.log('🔍 Checking existing Case IDs in Master Scenario sheet...');

  const auth = createGoogleClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: MASTER_SHEET_ID,
    range: 'Master Scenario Convert!A:A'
  });

  const existingIds = new Set();
  const rows = response.data.values || [];

  // Skip header rows (assuming 2-row header)
  for (let i = 2; i < rows.length; i++) {
    if (rows[i] && rows[i][0]) {
      existingIds.add(rows[i][0].trim());
    }
  }

  console.log(`✅ Found ${existingIds.size} existing Case IDs`);
  console.log('');

  return existingIds;
}

async function importData(sourceSheetId, sourceSheetName) {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('      IMPORTING DATA');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // Read source data
  const { rows: sourceRows } = await readSheetData(sourceSheetId, sourceSheetName);

  if (sourceRows.length < 2) {
    console.log('❌ No data rows found in source sheet');
    return;
  }

  // Check existing IDs
  const existingIds = await checkExistingCaseIds();

  // Find Case_ID column
  const headers = sourceRows[0];
  const caseIdIndex = headers.findIndex(h =>
    h && h.toLowerCase().includes('case') && h.toLowerCase().includes('id')
  );

  if (caseIdIndex === -1) {
    console.log('❌ Could not find Case_ID column in source sheet');
    console.log(`📋 Available columns: ${headers.join(', ')}`);
    return;
  }

  console.log(`✅ Found Case_ID column at index ${caseIdIndex} (${headers[caseIdIndex]})`);
  console.log('');

  // Filter out duplicates
  const newRows = [];
  const duplicates = [];

  for (let i = 1; i < sourceRows.length; i++) {
    const row = sourceRows[i];
    if (!row || row.length === 0) continue;

    const caseId = row[caseIdIndex];
    if (!caseId) continue;

    if (existingIds.has(caseId.trim())) {
      duplicates.push(caseId);
    } else {
      newRows.push(row);
    }
  }

  console.log(`📊 Import Summary:`);
  console.log(`   Source rows: ${sourceRows.length - 1}`);
  console.log(`   Duplicates skipped: ${duplicates.length}`);
  console.log(`   New rows to import: ${newRows.length}`);
  console.log('');

  if (duplicates.length > 0) {
    console.log(`⚠️  Duplicate Case IDs (first 5):`);
    duplicates.slice(0, 5).forEach(id => console.log(`   - ${id}`));
    if (duplicates.length > 5) {
      console.log(`   ... and ${duplicates.length - 5} more`);
    }
    console.log('');
  }

  if (newRows.length === 0) {
    console.log('✅ No new rows to import (all are duplicates)');
    return;
  }

  // Confirm import
  console.log(`⚠️  About to import ${newRows.length} new rows to Master Scenario Convert`);
  console.log('');
  console.log('💡 This script will append rows to the end of the sheet.');
  console.log('   Review the data first to ensure column mapping is correct.');
  console.log('');

  // Show sample of what will be imported
  console.log('📋 Sample of first row to import:');
  const sampleRow = newRows[0];
  headers.slice(0, 8).forEach((header, idx) => {
    console.log(`   ${header}: ${sampleRow[idx] || '(empty)'}`);
  });
  console.log('');

  // Return data for manual confirmation
  return {
    headers,
    newRows,
    duplicates,
    sourceSheetId,
    sourceSheetName
  };
}

async function executeImport(headers, newRows) {
  console.log('');
  console.log('💾 Writing to Master Scenario Convert sheet...');

  const auth = createGoogleClient();
  const sheets = google.sheets({ version: 'v4', auth });

  // Find next empty row
  const existingResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: MASTER_SHEET_ID,
    range: 'Master Scenario Convert!A:A'
  });

  const existingRows = existingResponse.data.values || [];
  const nextRow = existingRows.length + 1;

  console.log(`📍 Appending ${newRows.length} rows starting at row ${nextRow}`);

  // Append data
  const range = `Master Scenario Convert!A${nextRow}`;
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
  console.log(`📍 Row range: ${nextRow}-${nextRow + newRows.length - 1}`);
  console.log('');

  return { startRow: nextRow, endRow: nextRow + newRows.length - 1 };
}

async function main() {
  try {
    // Search for sheets
    const files = await searchForSimFinal();

    if (files.length === 0) {
      console.log('❌ No sheets found with "sim" in the name');
      console.log('');
      console.log('💡 Please provide the Sheet ID or name manually');
      return;
    }

    // Ask user which sheet to import
    console.log('═══════════════════════════════════════════════════');
    console.log('Please specify which sheet to import:');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/findAndImportSimFinal.cjs [SHEET_ID] [SHEET_NAME]');
    console.log('');
    console.log('Example:');
    console.log(`  node scripts/findAndImportSimFinal.cjs ${files[0].id}`);
    console.log('');
    console.log('Or update this script with the correct Sheet ID.');
    console.log('═══════════════════════════════════════════════════');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR');
    console.error('════════════════════════════════════════════════════');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length >= 1) {
    const sheetId = args[0];
    const sheetName = args[1] || null;

    (async () => {
      try {
        const data = await importData(sheetId, sheetName);

        if (data && data.newRows.length > 0) {
          console.log('═══════════════════════════════════════════════════');
          console.log('⚠️  IMPORT READY');
          console.log('═══════════════════════════════════════════════════');
          console.log('');
          console.log('To proceed with import, run:');
          console.log('  node scripts/executeImport.cjs');
          console.log('');
          console.log('Or modify this script to auto-import (uncomment executeImport)');
          console.log('');

          // Uncomment to auto-import:
          // const result = await executeImport(data.headers, data.newRows);
          // console.log(`✅ Import complete! Rows ${result.startRow}-${result.endRow}`);
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
    })();
  } else {
    main();
  }
}

module.exports = { searchForSimFinal, importData, executeImport, checkExistingCaseIds };
