#!/usr/bin/env node

/**
 * Find Simulation_ID Column via Sheets API
 *
 * Read the Output sheet directly to find where Simulation_ID is stored
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || process.env.SHEET_ID;

async function findSimulationIdColumn() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FIND SIMULATION_ID COLUMN IN OUTPUT SHEET');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  // First, get the output sheet name from Settings sheet
  console.log('📖 Reading Settings sheet to find output sheet name...');
  const settingsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Settings!A1:B2'
  });

  const settingsData = settingsResponse.data.values || [];
  let outputSheetName = 'Master Scenario Convert'; // Default

  if (settingsData.length > 0 && settingsData[0][0]) {
    outputSheetName = settingsData[0][0];
  }

  console.log(`✅ Output sheet name: ${outputSheetName}`);
  console.log('');

  // Read the output sheet headers (rows 1-2) and some sample data
  console.log('📊 Reading Output sheet structure...');
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${outputSheetName}!A1:ZZ15` // Read first 15 rows across all columns
  });

  const data = response.data.values || [];

  if (data.length < 3) {
    console.log('❌ Output sheet has less than 3 rows (headers + data)');
    return;
  }

  const tier1Headers = data[0] || [];
  const tier2Headers = data[1] || [];
  const dataRows = data.slice(2); // Rows 3+

  console.log(`Last row in sample: ${data.length}`);
  console.log(`Total columns: ${tier1Headers.length}`);
  console.log('');

  // Display headers
  console.log('TIER 1 HEADERS:');
  console.log('─────────────────────────────────────────────────');
  tier1Headers.forEach((header, idx) => {
    if (header) {
      const colLetter = getColumnLetter(idx);
      console.log(`  Col ${colLetter} (${idx + 1}): ${header}`);
    }
  });
  console.log('');

  console.log('TIER 2 HEADERS:');
  console.log('─────────────────────────────────────────────────');
  tier2Headers.forEach((header, idx) => {
    if (header) {
      const colLetter = getColumnLetter(idx);
      console.log(`  Col ${colLetter} (${idx + 1}): ${header}`);
    }
  });
  console.log('');

  // Look for Simulation_ID column
  let simulationIdCol = -1;
  let simulationIdHeader = '';
  let simulationIdTier = '';

  // Check tier 1
  for (let i = 0; i < tier1Headers.length; i++) {
    const header = String(tier1Headers[i] || '').toLowerCase();
    if (header.includes('simulation') && header.includes('id')) {
      simulationIdCol = i;
      simulationIdHeader = tier1Headers[i];
      simulationIdTier = 'Tier 1';
      break;
    }
  }

  // Check tier 2 if not found
  if (simulationIdCol === -1) {
    for (let i = 0; i < tier2Headers.length; i++) {
      const header = String(tier2Headers[i] || '').toLowerCase();
      if (header.includes('simulation') && header.includes('id')) {
        simulationIdCol = i;
        simulationIdHeader = tier2Headers[i];
        simulationIdTier = 'Tier 2';
        break;
      }
    }
  }

  if (simulationIdCol !== -1) {
    const colLetter = getColumnLetter(simulationIdCol);
    console.log('✅ FOUND SIMULATION_ID COLUMN!');
    console.log('─────────────────────────────────────────────────');
    console.log(`  Column: ${colLetter} (index ${simulationIdCol + 1})`);
    console.log(`  Header (${simulationIdTier}): ${simulationIdHeader}`);
    console.log('');

    console.log('SAMPLE VALUES:');
    console.log('─────────────────────────────────────────────────');
    dataRows.slice(0, 10).forEach((row, idx) => {
      const rowNum = idx + 3; // Rows start at 3
      const simId = row[simulationIdCol] || '';
      if (simId) {
        console.log(`  Row ${rowNum}: ${simId}`);
      }
    });
    console.log('');

    // Collect all Simulation_IDs from the sample
    const allIds = dataRows
      .map(row => row[simulationIdCol])
      .filter(id => id && String(id).trim());

    console.log(`📊 Found ${allIds.length} Simulation_IDs in sample data`);
    console.log('');

    // Save analysis result
    const analysis = {
      outputSheetName,
      simulationIdCol,
      simulationIdColLetter: colLetter,
      simulationIdHeader,
      simulationIdTier,
      totalColumns: tier1Headers.length,
      sampleIds: allIds.slice(0, 10),
      tier1Headers,
      tier2Headers,
      analyzedAt: new Date().toISOString()
    };

    const analysisPath = path.join(__dirname, '..', 'data', 'output-sheet-analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));

    console.log(`💾 Analysis saved to: ${analysisPath}`);
    console.log('');

    return analysis;

  } else {
    console.log('⚠️  Could not find Simulation_ID column by name');
    console.log('');
    console.log('Searching for columns with format like: xxx_xxx_YYYYMMDD_HHMMSS');
    console.log('─────────────────────────────────────────────────');

    // Try to find it by pattern matching
    const idPattern = /^[a-z]{3}_[a-z]{3}_\d{8}_\d{6}$/;

    for (let colIdx = 0; colIdx < tier1Headers.length; colIdx++) {
      const sampleValues = dataRows.slice(0, 5).map(row => row[colIdx] || '');
      const matchCount = sampleValues.filter(val => idPattern.test(String(val).trim())).length;

      if (matchCount >= 3) { // At least 3 out of 5 match the pattern
        simulationIdCol = colIdx;
        simulationIdHeader = tier1Headers[colIdx] || tier2Headers[colIdx] || `Column ${colIdx + 1}`;
        const colLetter = getColumnLetter(colIdx);

        console.log(`✅ Found by pattern matching!`);
        console.log(`  Column: ${colLetter} (index ${colIdx + 1})`);
        console.log(`  Header: ${simulationIdHeader}`);
        console.log('');
        console.log('SAMPLE VALUES:');
        dataRows.slice(0, 10).forEach((row, idx) => {
          const rowNum = idx + 3;
          const val = row[colIdx] || '';
          if (val) console.log(`  Row ${rowNum}: ${val}`);
        });
        console.log('');

        const allIds = dataRows
          .map(row => row[colIdx])
          .filter(id => id && String(id).trim());

        const analysis = {
          outputSheetName,
          simulationIdCol,
          simulationIdColLetter: colLetter,
          simulationIdHeader,
          simulationIdTier: 'Found by pattern',
          totalColumns: tier1Headers.length,
          sampleIds: allIds.slice(0, 10),
          tier1Headers,
          tier2Headers,
          analyzedAt: new Date().toISOString()
        };

        const analysisPath = path.join(__dirname, '..', 'data', 'output-sheet-analysis.json');
        fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));

        console.log(`💾 Analysis saved to: ${analysisPath}`);
        console.log('');

        return analysis;
      }
    }

    console.log('❌ Could not find Simulation_ID column by pattern either');
    console.log('');
    console.log('SAMPLE DATA (First 5 columns, first 5 data rows):');
    console.log('─────────────────────────────────────────────────');
    dataRows.slice(0, 5).forEach((row, idx) => {
      const rowNum = idx + 3;
      console.log(`Row ${rowNum}:`);
      row.slice(0, 5).forEach((val, colIdx) => {
        const colLetter = getColumnLetter(colIdx);
        console.log(`  Col ${colLetter}: ${val}`);
      });
      console.log('');
    });
  }
}

function getColumnLetter(index) {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

if (require.main === module) {
  findSimulationIdColumn().catch(error => {
    console.error('');
    console.error('❌ FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { findSimulationIdColumn };
