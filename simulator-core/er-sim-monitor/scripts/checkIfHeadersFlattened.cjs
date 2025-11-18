#!/usr/bin/env node

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

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: PRODUCTION_SPREADSHEET_ID,
      range: 'Master Scenario Convert!A1:J3'
    });

    const rows = response.data.values;

    console.log('First 3 rows (columns A-J):\n');
    console.log('Row 1:', rows[0] ? rows[0].join(' | ') : '(empty)');
    console.log('Row 2:', rows[1] ? rows[1].join(' | ') : '(empty)');
    console.log('Row 3:', rows[2] ? rows[2].join(' | ') : '(empty)');
    console.log('');

    const row1 = rows[0] || [];
    const row2 = rows[1] || [];

    console.log('🔍 Analysis:\n');

    // Check if row 1 has underscores (flattened format like Case_Organization_Case_ID)
    const row1HasUnderscores = row1.some(h => String(h).includes('_'));
    const row2HasUnderscores = row2.some(h => String(h).includes('_'));
    const row1Sample = String(row1[0] || '');
    const row2Sample = String(row2[0] || '');

    console.log('   Row 1 has underscores:', row1HasUnderscores);
    console.log('   Row 2 has underscores:', row2HasUnderscores);
    console.log('');

    if (row1HasUnderscores && !row2HasUnderscores && row2Sample && row2Sample !== row1Sample) {
      console.log('   ✅ FLATTENED HEADER STRUCTURE');
      console.log('   Row 1: Flattened merged headers (e.g., Case_Organization_Case_ID)');
      console.log('   Row 2: First data row\n');
      console.log('   📋 Data starts at: Row 2 (index 1)\n');
      console.log('   ⚠️  PROBLEM: Current code expects 2-tier headers!');
      console.log('   ⚠️  refreshHeaders() reads Row 1 and Row 2 as tier1/tier2');
      console.log('   ⚠️  But your Row 2 is DATA, not headers!\n');
    } else if (!row1HasUnderscores && !row2HasUnderscores && row1Sample !== row2Sample) {
      console.log('   ✅ TWO-TIER HEADER STRUCTURE');
      console.log('   Row 1: Tier1 headers (e.g., "Case", "Organization")');
      console.log('   Row 2: Tier2 headers (e.g., "Case_ID", "Spark_Title")');
      console.log('   Row 3: First data row\n');
      console.log('   📋 Data starts at: Row 3 (index 2)\n');
      console.log('   ✅ This matches what the code expects!\n');
    } else if (row1HasUnderscores && row2HasUnderscores) {
      console.log('   ⚠️  BOTH ROWS HAVE UNDERSCORES');
      console.log('   Could be:');
      console.log('   - Row 1 is flattened headers, Row 2 is more headers');
      console.log('   - Or both are data rows\n');
    } else {
      console.log('   ⚠️  UNKNOWN STRUCTURE\n');
    }

    console.log('Sample headers from Row 1:');
    row1.slice(0, 10).forEach((h, i) => {
      console.log(`   [${i}]: ${h}`);
    });
    console.log('');

    console.log('Sample from Row 2:');
    row2.slice(0, 10).forEach((h, i) => {
      console.log(`   [${i}]: ${h}`);
    });
    console.log('');

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Recommendation
    if (row1HasUnderscores && !row2HasUnderscores && row2Sample) {
      console.log('🔧 RECOMMENDED FIX:\n');
      console.log('   Option 1: Update code to handle flattened headers (single row)');
      console.log('   Option 2: Add a second header row (Tier2) to match code expectations\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

check();
