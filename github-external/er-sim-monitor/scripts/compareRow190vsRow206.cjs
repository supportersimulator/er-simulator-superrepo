#!/usr/bin/env node

/**
 * Compare Row 190 (working) vs Row 206 (failing)
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

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

async function compareRows() {
  console.log('\n📊 COMPARING ROW 190 (WORKING) VS ROW 206 (FAILING)\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Get headers
    const headers = await sheets.spreadsheets.values.get({
      spreadsheetId: TEST_SHEET_ID,
      range: 'Input!1:2'
    });

    const tier2 = headers.data.values[1];

    // Get Row 190
    console.log('Reading Row 190 (working example from screenshot)...\n');

    const row190 = await sheets.spreadsheets.values.get({
      spreadsheetId: TEST_SHEET_ID,
      range: 'Input!A190:J190'
    });

    const data190 = row190.data.values ? row190.data.values[0] : [];

    console.log('ROW 190 DATA (First 10 columns):\n');
    for (let i = 0; i < Math.min(10, data190.length); i++) {
      const header = tier2[i] || `Column ${String.fromCharCode(65 + i)}`;
      const value = data190[i] || '(empty)';
      const display = value.length > 100 ? value.substring(0, 100) + '...' : value;
      console.log(`   ${String.fromCharCode(65 + i)}. ${header}: ${display}`);
    }
    console.log('');

    // Get Row 206
    console.log('Reading Row 206 (failing)...\n');

    const row206 = await sheets.spreadsheets.values.get({
      spreadsheetId: TEST_SHEET_ID,
      range: 'Input!A206:J206'
    });

    const data206 = row206.data.values ? row206.data.values[0] : [];

    console.log('ROW 206 DATA (First 10 columns):\n');
    for (let i = 0; i < Math.min(10, data206.length); i++) {
      const header = tier2[i] || `Column ${String.fromCharCode(65 + i)}`;
      const value = data206[i] || '(empty)';
      const display = value.length > 100 ? value.substring(0, 100) + '...' : value;
      console.log(`   ${String.fromCharCode(65 + i)}. ${header}: ${display}`);
    }
    console.log('');

    // Comparison
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 COMPARISON ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('KEY DIFFERENCES:\n');

    // Check Sim ID
    const simId190 = data190[0] || '';
    const simId206 = data206[0] || '';

    console.log(`1. Sim ID:`);
    console.log(`   Row 190: "${simId190}" ${simId190 ? '✅' : '❌ EMPTY'}`);
    console.log(`   Row 206: "${simId206}" ${simId206 ? '✅' : '❌ EMPTY'}`);
    console.log('');

    // Check data quality
    const hasHtml190 = data190.some(cell => cell && cell.includes('<article'));
    const hasHtml206 = data206.some(cell => cell && cell.includes('<article'));

    console.log(`2. Data Format:`);
    console.log(`   Row 190: ${hasHtml190 ? '⚠️  Contains HTML' : '✅ Clean data'}`);
    console.log(`   Row 206: ${hasHtml206 ? '⚠️  Contains HTML' : '✅ Clean data'}`);
    console.log('');

    // Root cause
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('💡 ROOT CAUSE IDENTIFIED');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!simId206) {
      console.log('❌ PROBLEM: Row 206 missing Sim ID (Column A is empty)\n');
      console.log('   Processing CANNOT proceed without a Sim ID.');
      console.log('   The code checks for Sim ID first and exits if missing.\n');
    }

    if (hasHtml206) {
      console.log('❌ PROBLEM: Row 206 contains raw HTML instead of parsed data\n');
      console.log('   Data appears to be from web scraping that wasn\'t cleaned.');
      console.log('   Should contain structured scenario data, not HTML markup.\n');
    }

    console.log('SOLUTION:\n');
    console.log('   Option 1: Fix Row 206 data (clean HTML, add Sim ID)');
    console.log('   Option 2: Test with Row 190 instead (known to have clean data)');
    console.log('   Option 3: Copy a working row to Row 206 for testing\n');

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

compareRows().catch(error => {
  console.error('\nComparison failed:', error.message);
  process.exit(1);
});
