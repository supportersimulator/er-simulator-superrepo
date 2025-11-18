#!/usr/bin/env node

/**
 * Check Input Tab for Row 206 Data
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

async function checkInputTab() {
  console.log('\n🔍 CHECKING INPUT TAB FOR ROW 206\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Check Input tab headers first
    console.log('Step 1: Reading Input tab headers...\n');

    const headersData = await sheets.spreadsheets.values.get({
      spreadsheetId: TEST_SHEET_ID,
      range: 'Input!1:2'
    });

    if (!headersData.data.values || headersData.data.values.length < 2) {
      console.log('   ⚠️  Could not read Input tab headers\n');
      return;
    }

    const tier1 = headersData.data.values[0];
    const tier2 = headersData.data.values[1];

    console.log('   ✓ Input tab has 2-tier headers');
    console.log(`   ✓ Tier 1: ${tier1.slice(0, 10).join(', ')}...`);
    console.log(`   ✓ Tier 2: ${tier2.slice(0, 10).join(', ')}...\n`);

    // Check Row 206 in Input tab
    console.log('Step 2: Checking Input tab Row 206...\n');

    const inputRow206 = await sheets.spreadsheets.values.get({
      spreadsheetId: TEST_SHEET_ID,
      range: 'Input!A206:Z206'
    });

    if (!inputRow206.data.values || inputRow206.data.values.length === 0) {
      console.log('   ❌ Row 206 is EMPTY in Input tab\n');
      console.log('   This explains why processing failed - no input data exists!\n');

      // Check how many rows Input tab has
      const allInputData = await sheets.spreadsheets.values.get({
        spreadsheetId: TEST_SHEET_ID,
        range: 'Input!A:A'
      });

      const rowCount = allInputData.data.values ? allInputData.data.values.length : 0;
      console.log(`   Input tab has ${rowCount} rows total (including headers)\n`);
      console.log(`   Data rows: ${Math.max(0, rowCount - 2)} (excluding 2-tier headers)\n`);

    } else {
      const row = inputRow206.data.values[0];
      console.log('   ✅ Row 206 HAS DATA in Input tab\n');

      // Show first 10 columns
      console.log('   First 10 columns of Input Row 206:\n');
      for (let i = 0; i < Math.min(10, row.length); i++) {
        const header = tier2[i] || `Column ${String.fromCharCode(65 + i)}`;
        const value = row[i] || '(empty)';
        console.log(`      ${header}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
      }
      console.log('');

      // Check for required fields
      console.log('   Checking required input fields:\n');
      const simId = row[0] || '';
      const category = row[1] || '';
      const title = row[2] || '';

      console.log(`      Sim ID: ${simId || '❌ MISSING'}`);
      console.log(`      Category: ${category || '❌ MISSING'}`);
      console.log(`      Title: ${title || '❌ MISSING'}`);
      console.log('');
    }

    // Check Master Scenario Convert Row 206
    console.log('Step 3: Checking Master Scenario Convert Row 206 (output)...\n');

    const outputRow206 = await sheets.spreadsheets.values.get({
      spreadsheetId: TEST_SHEET_ID,
      range: 'Master Scenario Convert!A206:Z206'
    });

    if (!outputRow206.data.values || outputRow206.data.values.length === 0) {
      console.log('   ℹ️  Row 206 is EMPTY in Master Scenario Convert (expected - not processed yet)\n');
    } else {
      const row = outputRow206.data.values[0];
      const hasData = row.some(cell => cell && cell.trim());

      if (hasData) {
        console.log('   ⚠️  Row 206 already has some data in Master Scenario Convert\n');
        console.log('   First 5 columns:\n');
        for (let i = 0; i < Math.min(5, row.length); i++) {
          if (row[i]) {
            console.log(`      Column ${String.fromCharCode(65 + i)}: ${row[i].substring(0, 50)}${row[i].length > 50 ? '...' : ''}`);
          }
        }
        console.log('');
      } else {
        console.log('   ✓ Row 206 is empty in Master Scenario Convert (ready for output)\n');
      }
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 ROW 206 STATUS SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const hasInput = inputRow206.data.values && inputRow206.data.values.length > 0;
    const hasOutput = outputRow206.data.values &&
                      outputRow206.data.values.length > 0 &&
                      outputRow206.data.values[0].some(cell => cell && cell.trim());

    console.log('Input Tab (Source):');
    console.log(`   Row 206 Status: ${hasInput ? '✅ HAS DATA' : '❌ EMPTY'}`);
    console.log('');

    console.log('Master Scenario Convert Tab (Destination):');
    console.log(`   Row 206 Status: ${hasOutput ? '⚠️  HAS DATA (already processed?)' : '✓ EMPTY (ready for output)'}`);
    console.log('');

    if (!hasInput) {
      console.log('❌ PROBLEM IDENTIFIED:');
      console.log('   Input tab Row 206 is empty - nothing to process!');
      console.log('');
      console.log('Solutions:');
      console.log('   1. Add scenario data to Input tab Row 206');
      console.log('   2. Or test with a row that has input data (check Input tab for populated rows)');
      console.log('   3. Or copy an existing input row to Row 206 for testing');
    } else if (hasOutput) {
      console.log('⚠️  DUPLICATE DETECTED:');
      console.log('   Row 206 already has output - enable "Force Reprocess" to override');
    } else {
      console.log('✅ READY TO PROCESS:');
      console.log('   Input tab Row 206 has data');
      console.log('   Master Scenario Convert Row 206 is empty');
      console.log('   Processing should work!');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

checkInputTab().catch(error => {
  console.error('\nCheck failed:', error.message);
  process.exit(1);
});
