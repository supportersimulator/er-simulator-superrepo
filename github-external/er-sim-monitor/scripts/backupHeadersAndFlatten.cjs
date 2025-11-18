#!/usr/bin/env node

/**
 * Backup Current Headers & Implement Flattening System
 *
 * Phase 1: Backup
 * - Copy current Master Scenario Convert to "BACKUP_2Tier_Headers"
 * - Preserve original 2-tier header structure
 *
 * Phase 2: Flatten Headers
 * - Create flattened headers: Tier1_Tier2
 * - Add human-readable row above (duplicate of Tier 2)
 * - Update Master Scenario Convert with new structure
 *
 * New Structure:
 * Row 1: Human-readable (Tier 2 labels for reference)
 * Row 2: Flattened headers (Tier1_Tier2 for Django)
 * Row 3+: Data
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

function createGoogleClient() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

async function backupCurrentHeaders() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  PHASE 1: BACKUP CURRENT HEADERS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const auth = createGoogleClient();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('📖 Reading current Master Scenario Convert...');

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Master Scenario Convert!A1:ZZ250'
  });

  const allData = response.data.values || [];
  console.log(`✅ Read ${allData.length} rows`);
  console.log('');

  // Check if backup sheet exists
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID
  });

  const backupSheetName = 'BACKUP_2Tier_Headers';
  const existingSheet = spreadsheet.data.sheets.find(
    s => s.properties.title === backupSheetName
  );

  if (existingSheet) {
    console.log(`⚠️  Backup sheet "${backupSheetName}" already exists`);
    console.log('   Deleting old backup...');

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{
          deleteSheet: {
            sheetId: existingSheet.properties.sheetId
          }
        }]
      }
    });

    console.log('✅ Old backup deleted');
  }

  // Create new backup sheet
  console.log(`📋 Creating backup sheet "${backupSheetName}"...`);

  const addSheetResponse = await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{
        addSheet: {
          properties: {
            title: backupSheetName
          }
        }
      }]
    }
  });

  console.log('✅ Backup sheet created');
  console.log('');

  // Copy all data to backup
  console.log('💾 Copying data to backup sheet...');

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${backupSheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: allData
    }
  });

  console.log('✅ Data copied successfully');
  console.log(`📊 Backed up ${allData.length} rows`);
  console.log('');

  return { allData, backupSheetName };
}

function flattenHeaders(tier1, tier2) {
  console.log('🔧 Flattening headers...');
  console.log('');

  const flattened = [];

  for (let i = 0; i < tier1.length; i++) {
    const t1 = (tier1[i] || '').trim();
    const t2 = (tier2[i] || '').trim();

    if (!t1 && !t2) {
      flattened.push('');
    } else if (!t1) {
      flattened.push(t2);
    } else if (!t2) {
      flattened.push(t1);
    } else {
      // Flatten: Tier1_Tier2
      flattened.push(`${t1}_${t2}`);
    }
  }

  console.log('Sample flattened headers (first 10):');
  for (let i = 0; i < Math.min(10, flattened.length); i++) {
    console.log(`  ${i + 1}. ${tier1[i]} → ${tier2[i]} => ${flattened[i]}`);
  }
  console.log('');

  return flattened;
}

async function applyFlattenedHeaders(allData) {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  PHASE 2: APPLY FLATTENED HEADERS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const tier1 = allData[0] || [];
  const tier2 = allData[1] || [];
  const dataRows = allData.slice(2);

  const flattenedHeaders = flattenHeaders(tier1, tier2);

  // New structure:
  // Row 1: Human-readable (copy of tier2 for reference)
  // Row 2: Flattened headers (tier1_tier2 for Django)
  // Row 3+: Data

  const newData = [
    tier2, // Human-readable row (reference)
    flattenedHeaders, // Flattened row (Django-compatible)
    ...dataRows // All data rows unchanged
  ];

  console.log('📊 New structure:');
  console.log('  Row 1: Human-readable labels (reference)');
  console.log('  Row 2: Flattened headers (Django-compatible)');
  console.log(`  Row 3+: Data (${dataRows.length} rows)`);
  console.log('');

  const auth = createGoogleClient();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('💾 Writing flattened structure to Master Scenario Convert...');

  // Clear existing data
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: 'Master Scenario Convert!A1:ZZ250'
  });

  // Write new structure
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'Master Scenario Convert!A1',
    valueInputOption: 'RAW',
    requestBody: {
      values: newData
    }
  });

  console.log('✅ Flattened headers applied!');
  console.log('');

  return { flattenedHeaders, dataRowCount: dataRows.length };
}

async function saveHeaderMapping(tier1, tier2, flattened) {
  console.log('📝 Saving header mapping documentation...');

  const mapping = [];
  mapping.push('# Header Flattening Mapping\n');
  mapping.push('**Date**: ' + new Date().toISOString() + '\n');
  mapping.push('**Total Columns**: ' + flattened.length + '\n\n');
  mapping.push('## Mapping Table\n\n');
  mapping.push('| # | Tier 1 | Tier 2 | Flattened |\n');
  mapping.push('|---|--------|--------|----------|\n');

  for (let i = 0; i < flattened.length; i++) {
    mapping.push(`| ${i + 1} | ${tier1[i] || '(empty)'} | ${tier2[i] || '(empty)'} | ${flattened[i] || '(empty)'} |\n`);
  }

  const mappingFile = path.join(__dirname, '..', 'HEADER_MAPPING.md');
  fs.writeFileSync(mappingFile, mapping.join(''));

  console.log('✅ Saved to HEADER_MAPPING.md');
  console.log('');
}

async function main() {
  try {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  HEADER FLATTENING SYSTEM');
    console.log('  Backup → Flatten → Apply');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    // Phase 1: Backup
    const { allData, backupSheetName } = await backupCurrentHeaders();

    console.log('✅ PHASE 1 COMPLETE: Backup saved');
    console.log(`   Sheet: ${backupSheetName}`);
    console.log('');

    // Phase 2: Flatten and apply
    const { flattenedHeaders, dataRowCount } = await applyFlattenedHeaders(allData);

    // Save mapping documentation
    await saveHeaderMapping(allData[0], allData[1], flattenedHeaders);

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ HEADER FLATTENING COMPLETE!');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('Summary:');
    console.log(`  ✅ Backup created: ${backupSheetName}`);
    console.log(`  ✅ Headers flattened: ${flattenedHeaders.length} columns`);
    console.log(`  ✅ Data preserved: ${dataRowCount} rows`);
    console.log(`  ✅ Mapping saved: HEADER_MAPPING.md`);
    console.log('');
    console.log('New Structure:');
    console.log('  Row 1: Human-readable labels (for your reference)');
    console.log('  Row 2: Flattened headers (Django-compatible)');
    console.log('  Row 3+: All data (unchanged)');
    console.log('');
    console.log('Next Steps:');
    console.log('  1. Verify new headers in Google Sheets');
    console.log('  2. Update Apps Script to use Row 2 as headers');
    console.log('  3. Update all import/export scripts');
    console.log('  4. Update OpenAI prompts with new field names');
    console.log('  5. Test end-to-end workflow with 1-2 scenarios');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ HEADER FLATTENING FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    console.error('');
    console.error('Recovery:');
    console.error('  Your data is safe in backup sheet: BACKUP_2Tier_Headers');
    console.error('  You can manually restore from backup if needed');
    console.error('');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { backupCurrentHeaders, flattenHeaders, applyFlattenedHeaders };
