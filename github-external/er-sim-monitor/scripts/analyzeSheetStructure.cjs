#!/usr/bin/env node

/**
 * Analyze Sheet Structure
 *
 * Read the actual Google Sheets to see:
 * 1. What columns exist
 * 2. Sample data from rows 3-12
 * 3. Find the truly unique identifier
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SPREADSHEET_ID = process.env.SHEET_ID || process.env.GOOGLE_SHEET_ID;

async function analyzeSheetStructure() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ANALYZE SHEET STRUCTURE');
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

  console.log('Reading Input sheet structure...');
  console.log('');

  // Read row 1 (Tier 1 headers)
  const tier1Response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Input!1:1',
  });
  const tier1Headers = tier1Response.data.values[0];

  // Read row 2 (Tier 2 headers)
  const tier2Response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Input!2:2',
  });
  const tier2Headers = tier2Response.data.values[0];

  console.log('═══════════════════════════════════════════════════');
  console.log('COLUMN STRUCTURE:');
  console.log('═══════════════════════════════════════════════════');

  const columnLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  for (let i = 0; i < Math.min(tier2Headers.length, 26); i++) {
    const tier1 = tier1Headers[i] || '';
    const tier2 = tier2Headers[i] || '';
    console.log(`Column ${columnLetters[i]}: ${tier2} ${tier1 ? `(${tier1})` : ''}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('SAMPLE DATA (Rows 3-12):');
  console.log('═══════════════════════════════════════════════════');

  // Read rows 3-12 data
  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Input!A3:Z12',
  });
  const rows = dataResponse.data.values || [];

  // Show first few columns for each row
  console.log('');
  console.log('First 10 columns of each row:');
  console.log('');

  rows.forEach((row, idx) => {
    const rowNum = idx + 3;
    const first10 = row.slice(0, 10).map(cell => {
      const str = String(cell || '');
      return str.length > 15 ? str.substring(0, 12) + '...' : str;
    });
    console.log(`Row ${rowNum}: ${first10.join(' | ')}`);
  });

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('OUTPUT SHEET DATA (Rows 3-11):');
  console.log('═══════════════════════════════════════════════════');

  // Read output sheet
  const outputResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Master Scenario Convert!A3:J11',
  });
  const outputRows = outputResponse.data.values || [];

  console.log('');
  outputRows.forEach((row, idx) => {
    const rowNum = idx + 3;
    const first10 = row.slice(0, 10).map(cell => {
      const str = String(cell || '');
      return str.length > 15 ? str.substring(0, 12) + '...' : str;
    });
    console.log(`Output Row ${rowNum}: ${first10.join(' | ')}`);
  });

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('ANALYSIS:');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Looking for unique identifier column...');
  console.log('');

  // Look for common unique ID patterns
  const potentialIdColumns = [];

  for (let colIdx = 0; colIdx < tier2Headers.length; colIdx++) {
    const header = tier2Headers[colIdx].toLowerCase();

    if (header.includes('hash') ||
        header.includes('unique') ||
        header.includes('_id') ||
        header.includes('signature') ||
        header.includes('key')) {
      potentialIdColumns.push({
        column: columnLetters[colIdx],
        header: tier2Headers[colIdx],
        sample: rows[0] ? rows[0][colIdx] : 'N/A'
      });
    }
  }

  if (potentialIdColumns.length > 0) {
    console.log('Found potential unique ID columns:');
    console.log('');
    potentialIdColumns.forEach(col => {
      console.log(`  Column ${col.column}: ${col.header}`);
      console.log(`    Sample value: ${col.sample}`);
      console.log('');
    });
  } else {
    console.log('⚠️  No obvious unique ID column found');
    console.log('');
    console.log('Common unique ID column names to look for:');
    console.log('  - Hash, Unique_ID, Signature, Row_Key, etc.');
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('');
}

if (require.main === module) {
  analyzeSheetStructure().catch(error => {
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

module.exports = { analyzeSheetStructure };
