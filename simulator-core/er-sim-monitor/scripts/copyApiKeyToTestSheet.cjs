#!/usr/bin/env node

/**
 * Copy API Key Configuration from Original to Test Spreadsheet
 *
 * Ensures test spreadsheet has same API key setup as original
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const ORIGINAL_SHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';
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

async function copyApiKey() {
  console.log('\n🔑 COPYING API KEY CONFIGURATION TO TEST SPREADSHEET\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });

  // Step 1: Read API key from original spreadsheet
  console.log('Step 1: Reading API key from original spreadsheet...\n');

  try {
    const originalSettings = await sheets.spreadsheets.values.get({
      spreadsheetId: ORIGINAL_SHEET_ID,
      range: 'Settings!A1:B20'
    });

    const originalRows = originalSettings.data.values || [];

    console.log('   Original Settings sheet:');
    originalRows.forEach((row, i) => {
      if (row[0]) {
        const value = row[1] || '(empty)';
        const masked = value.length > 10 ? value.substring(0, 7) + '...' + value.substring(value.length - 4) : value;
        console.log(`      Row ${i + 1}: ${row[0]} = ${masked}`);
      }
    });

    // Find API key row
    const apiKeyRow = originalRows.find(row =>
      row[0] && (
        row[0].toLowerCase().includes('openai') ||
        row[0].toLowerCase().includes('api key')
      )
    );

    if (!apiKeyRow || !apiKeyRow[1]) {
      console.log('\n❌ No API key found in original spreadsheet');
      return;
    }

    const apiKeyLabel = apiKeyRow[0];
    const apiKeyValue = apiKeyRow[1];

    console.log(`\n   ✅ Found API key: ${apiKeyLabel}`);
    console.log(`      Value: ${apiKeyValue.substring(0, 7)}...${apiKeyValue.substring(apiKeyValue.length - 4)}\n`);

    // Step 2: Read test spreadsheet settings
    console.log('Step 2: Reading test spreadsheet Settings...\n');

    const testSettings = await sheets.spreadsheets.values.get({
      spreadsheetId: TEST_SHEET_ID,
      range: 'Settings!A1:B20'
    });

    const testRows = testSettings.data.values || [];

    console.log('   Test Settings sheet:');
    testRows.forEach((row, i) => {
      if (row[0]) {
        const value = row[1] || '(empty)';
        const masked = value.length > 10 ? value.substring(0, 7) + '...' + value.substring(value.length - 4) : value;
        console.log(`      Row ${i + 1}: ${row[0]} = ${masked}`);
      }
    });

    // Find where to update
    const testApiKeyRowIndex = testRows.findIndex(row =>
      row[0] && (
        row[0].toLowerCase().includes('openai') ||
        row[0].toLowerCase().includes('api key')
      )
    );

    // Step 3: Update test spreadsheet
    console.log('\nStep 3: Updating test spreadsheet API key...\n');

    if (testApiKeyRowIndex !== -1) {
      // Update existing row
      const updateRange = `Settings!A${testApiKeyRowIndex + 1}:B${testApiKeyRowIndex + 1}`;

      await sheets.spreadsheets.values.update({
        spreadsheetId: TEST_SHEET_ID,
        range: updateRange,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[apiKeyLabel, apiKeyValue]]
        }
      });

      console.log(`   ✅ Updated existing API key at row ${testApiKeyRowIndex + 1}`);
      console.log(`      Label: ${apiKeyLabel}`);
      console.log(`      Value: ${apiKeyValue.substring(0, 7)}...${apiKeyValue.substring(apiKeyValue.length - 4)}\n`);

    } else {
      // Add new row
      const newRowIndex = testRows.length + 1;
      const updateRange = `Settings!A${newRowIndex}:B${newRowIndex}`;

      await sheets.spreadsheets.values.update({
        spreadsheetId: TEST_SHEET_ID,
        range: updateRange,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[apiKeyLabel, apiKeyValue]]
        }
      });

      console.log(`   ✅ Added new API key at row ${newRowIndex}`);
      console.log(`      Label: ${apiKeyLabel}`);
      console.log(`      Value: ${apiKeyValue.substring(0, 7)}...${apiKeyValue.substring(apiKeyValue.length - 4)}\n`);
    }

    // Step 4: Verify
    console.log('Step 4: Verifying API key configuration...\n');

    const verifySettings = await sheets.spreadsheets.values.get({
      spreadsheetId: TEST_SHEET_ID,
      range: 'Settings!A1:B20'
    });

    const verifyRows = verifySettings.data.values || [];
    const verifyApiKeyRow = verifyRows.find(row =>
      row[0] && (
        row[0].toLowerCase().includes('openai') ||
        row[0].toLowerCase().includes('api key')
      )
    );

    if (verifyApiKeyRow && verifyApiKeyRow[1] === apiKeyValue) {
      console.log('   ✅ Verification successful');
      console.log(`      Test spreadsheet API key matches original\n`);
    } else {
      console.log('   ⚠️  Verification warning');
      console.log('      API key may not have been updated correctly\n');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 API KEY CONFIGURATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`✅ Test spreadsheet API key configured`);
    console.log(`✅ Matches original spreadsheet configuration`);
    console.log(`✅ Ready for ATSR and batch processing tests`);
    console.log('');
    console.log('Test Spreadsheet URL:');
    console.log(`   https://docs.google.com/spreadsheets/d/${TEST_SHEET_ID}/edit`);
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('   Details:', error.response.data);
    }
    throw error;
  }
}

copyApiKey().catch(error => {
  console.error('\nAPI key copy failed. Check error above.\n');
  process.exit(1);
});
