#!/usr/bin/env node

/**
 * Waveform Naming Migration Script
 *
 * This script updates all waveform fields in your Google Sheet to use the
 * universal _ecg suffix naming convention.
 *
 * Usage:
 *   node scripts/migrateWaveformNaming.js
 *
 * What it does:
 * - Reads all rows from "Master Scenario Convert" tab
 * - Finds all vitals columns (Initial_Vitals, State1-5_Vitals)
 * - Parses JSON and adds _ecg suffix where missing
 * - Updates Google Sheet with corrected data
 * - Logs all changes for review
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

// OAuth2 credentials (same as your vitals sync)
const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SHEET_ID = process.env.SHEET_ID;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');

// Valid waveforms (universal naming standard with _ecg suffix)
const VALID_WAVEFORMS = [
  'sinus_ecg',
  'sinus_brady_ecg',
  'sinus_tachy_ecg',
  'afib_ecg',
  'aflutter_ecg',
  'vfib_ecg',
  'vtach_ecg',
  'svt_ecg',
  'asystole_ecg',
  'pea_ecg',
  'artifact_ecg'
];

// Waveform mapping (old → new)
const WAVEFORM_MIGRATION_MAP = {
  'sinus': 'sinus_ecg',
  'afib': 'afib_ecg',
  'vfib': 'vfib_ecg',
  'vtach': 'vtach_ecg',
  'asystole': 'asystole_ecg',
  'pea': 'pea_ecg',
  'artifact': 'artifact_ecg',
  'aflutter': 'aflutter_ecg',
  'svt': 'svt_ecg',
  'sinus_brady': 'sinus_brady_ecg',
  'sinus_tachy': 'sinus_tachy_ecg'
};

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
 * Create authenticated Google Sheets client
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
 * Fix waveform naming in a vitals JSON object
 * Returns { modified: boolean, vitals: object, changes: string[] }
 */
function fixWaveformNaming(vitalsObj) {
  if (!vitalsObj || typeof vitalsObj !== 'object') {
    return { modified: false, vitals: vitalsObj, changes: [] };
  }

  const changes = [];
  let modified = false;

  // Check if waveform field exists
  if (vitalsObj.waveform) {
    const oldWaveform = vitalsObj.waveform;

    // Check if it needs migration
    if (!oldWaveform.endsWith('_ecg')) {
      // Try to find mapping
      if (WAVEFORM_MIGRATION_MAP[oldWaveform]) {
        vitalsObj.waveform = WAVEFORM_MIGRATION_MAP[oldWaveform];
        changes.push(`"${oldWaveform}" → "${vitalsObj.waveform}"`);
        modified = true;
      } else {
        // Unknown waveform, add _ecg suffix
        vitalsObj.waveform = `${oldWaveform}_ecg`;
        changes.push(`"${oldWaveform}" → "${vitalsObj.waveform}" (auto-suffix)`);
        modified = true;
      }
    }
  }

  return { modified, vitals: vitalsObj, changes };
}

/**
 * Main migration function
 */
async function migrateWaveformNaming() {
  console.log('');
  console.log('🌐 WAVEFORM NAMING MIGRATION');
  console.log('════════════════════════════════════════════════════');
  console.log('This script will update all waveform fields to use');
  console.log('the universal _ecg suffix naming convention.');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    // Create authenticated client
    console.log('🔐 Authenticating with Google Sheets...');
    const sheets = createSheetsClient();

    // Read sheet data
    console.log('📥 Fetching data from "Master Scenario Convert" tab...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Master Scenario Convert!A1:ZZ' // Read all columns
    });

    const rows = response.data.values;
    if (!rows || rows.length < 3) {
      throw new Error('Sheet appears empty or has insufficient data');
    }

    // Parse headers (two-tier system)
    const tier1Headers = rows[0]; // Tier 1: Category names
    const tier2Headers = rows[1]; // Tier 2: Field names
    const dataRows = rows.slice(2); // Data starts at row 3

    // Find vitals columns (any column with "Vitals" in Tier2)
    const vitalsColumns = [];
    tier2Headers.forEach((tier2, index) => {
      if (tier2 && tier2.toLowerCase().includes('vitals')) {
        vitalsColumns.push({
          index,
          tier1: tier1Headers[index] || '',
          tier2: tier2,
          fullName: `${tier1Headers[index]}:${tier2}`
        });
      }
    });

    console.log(`📊 Found ${vitalsColumns.length} vitals columns:`);
    vitalsColumns.forEach(col => {
      console.log(`   - ${col.fullName} (column ${String.fromCharCode(65 + col.index)})`);
    });
    console.log('');

    // Process each data row
    const updates = [];
    let totalChanges = 0;
    let rowsModified = 0;

    console.log('🔍 Scanning for waveform fields needing migration...');
    console.log('');

    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
      const row = dataRows[rowIndex];
      const sheetRowNumber = rowIndex + 3; // +3 because of 2 header rows + 0-indexing
      let rowModified = false;
      const rowChanges = [];

      // Check each vitals column in this row
      for (const col of vitalsColumns) {
        const cellValue = row[col.index];
        if (!cellValue || cellValue.trim() === '' || cellValue.trim() === 'N/A') {
          continue;
        }

        try {
          // Try to parse as JSON
          const vitalsObj = JSON.parse(cellValue);
          const result = fixWaveformNaming(vitalsObj);

          if (result.modified) {
            // Update cell value
            row[col.index] = JSON.stringify(result.vitals);
            rowModified = true;
            rowChanges.push(`${col.fullName}: ${result.changes.join(', ')}`);
            totalChanges++;
          }
        } catch (e) {
          // Not valid JSON, skip
          console.log(`⚠️  Row ${sheetRowNumber}, ${col.fullName}: Invalid JSON, skipping`);
        }
      }

      if (rowModified) {
        rowsModified++;
        console.log(`✏️  Row ${sheetRowNumber}:`);
        rowChanges.forEach(change => console.log(`     ${change}`));

        // Queue this row for update
        updates.push({
          range: `Master Scenario Convert!A${sheetRowNumber}:ZZ${sheetRowNumber}`,
          values: [row]
        });
      }
    }

    console.log('');
    console.log('📊 MIGRATION SUMMARY');
    console.log('════════════════════════════════════════════════════');
    console.log(`Total rows scanned: ${dataRows.length}`);
    console.log(`Rows modified: ${rowsModified}`);
    console.log(`Waveform fields updated: ${totalChanges}`);
    console.log('════════════════════════════════════════════════════');
    console.log('');

    if (updates.length === 0) {
      console.log('✅ No changes needed! All waveforms already use _ecg suffix.');
      return;
    }

    // Ask for confirmation
    console.log('⚠️  READY TO UPDATE GOOGLE SHEET');
    console.log(`This will update ${updates.length} rows in your Google Sheet.`);
    console.log('');
    console.log('Press Ctrl+C to cancel, or any key to continue...');

    // Wait for user input (simple version)
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });

    // Perform batch update
    console.log('');
    console.log('💾 Writing changes to Google Sheet...');

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      }
    });

    console.log('✅ Migration complete!');
    console.log('');
    console.log('🎯 All waveform fields now use the universal _ecg suffix naming convention.');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ MIGRATION FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.message.includes('Token')) {
      console.error('💡 Tip: Run "npm run auth-google" to authenticate first.');
    }

    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrateWaveformNaming().catch(console.error);
}

module.exports = { migrateWaveformNaming };
