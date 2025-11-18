#!/usr/bin/env node

/**
 * CHECK PRODUCTION HEADER STRUCTURE
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_SPREADSHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';

console.log('\n🔍 CHECKING PRODUCTION HEADER STRUCTURE\n');
console.log('═══════════════════════════════════════════════════════════════\n');

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function check() {
  try {
    const auth = await authorize();
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📥 Reading "Master Scenario Convert" sheet...\n');

    // Get first 3 rows to check structure
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: PRODUCTION_SPREADSHEET_ID,
      range: 'Master Scenario Convert!A1:E3'
    });

    const rows = response.data.values;

    console.log('First 3 rows (columns A-E):\n');
    console.log('Row 1:', rows[0] ? rows[0].join(' | ') : '(empty)');
    console.log('Row 2:', rows[1] ? rows[1].join(' | ') : '(empty)');
    console.log('Row 3:', rows[2] ? rows[2].join(' | ') : '(empty)');
    console.log('');

    // Check if row 1 looks like tier1 headers
    const row1Sample = rows[0] ? rows[0][0] : '';
    const row2Sample = rows[1] ? rows[1][0] : '';

    console.log('🔍 Analysis:\n');

    if (row1Sample && row2Sample && row1Sample !== row2Sample) {
      console.log('   ⚠️  DETECTED: 2-TIER HEADER STRUCTURE');
      console.log('   Row 1: Tier1 headers (e.g., "Case", "Organization")');
      console.log('   Row 2: Tier2 headers (e.g., "Case_ID", "Spark_Title")');
      console.log('   Row 3: First data row\n');
      console.log('   ❌ PROBLEM: performHolisticAnalysis_() expects FLATTENED headers');
      console.log('      It reads row 2 (index 1) expecting merged format like');
      console.log('      "Case_Organization_Case_ID"\n');
      console.log('   🔧 FIX NEEDED: Either flatten headers or update code\n');
    } else if (row1Sample && row1Sample.includes('_')) {
      console.log('   ✅ DETECTED: FLATTENED HEADER STRUCTURE');
      console.log('   Row 1: Flattened merged headers');
      console.log('   Row 2: First data row\n');
      console.log('   ✅ This should work with performHolisticAnalysis_()\n');
    } else {
      console.log('   ⚠️  UNKNOWN STRUCTURE\n');
    }

    // Get total row count
    const metadataResponse = await sheets.spreadsheets.get({
      spreadsheetId: PRODUCTION_SPREADSHEET_ID,
      ranges: ['Master Scenario Convert!A:A']
    });

    const sheetData = metadataResponse.data.sheets[0];
    const rowCount = sheetData.properties.gridProperties.rowCount;
    console.log(`📊 Total rows in sheet: ${rowCount}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

check();
