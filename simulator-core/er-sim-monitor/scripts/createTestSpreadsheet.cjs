#!/usr/bin/env node

/**
 * Create Test Spreadsheet for Feature-Based Code Testing
 *
 * Creates a copy of Convert_Master_Sim_CSV_Template_with_Input
 * for testing the isolated feature-based Apps Script modules
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Original spreadsheet ID (from .env)
const ORIGINAL_SHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM'; // Convert_Master_Sim_CSV_Template_with_Input

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

async function createTestSpreadsheet() {
  console.log('\n📋 CREATING TEST SPREADSHEET FOR FEATURE-BASED CODE TESTING\n');

  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });
  const sheets = google.sheets({ version: 'v4', auth });

  // Step 1: Copy the original spreadsheet
  console.log('Step 1: Copying original spreadsheet...\n');

  const copyRequest = {
    fileId: ORIGINAL_SHEET_ID,
    requestBody: {
      name: 'TEST_Convert_Master_Sim_CSV_Template_with_Input',
      description: 'Test copy for feature-based isolated code testing. Created: ' + new Date().toISOString()
    }
  };

  const copyResponse = await drive.files.copy(copyRequest);
  const testSheetId = copyResponse.data.id;

  console.log(`✅ Test spreadsheet created!`);
  console.log(`   Name: TEST_Convert_Master_Sim_CSV_Template_with_Input`);
  console.log(`   ID: ${testSheetId}`);
  console.log(`   URL: https://docs.google.com/spreadsheets/d/${testSheetId}/edit\n`);

  // Step 2: Get sheet structure
  console.log('Step 2: Analyzing sheet structure...\n');

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: testSheetId
  });

  const sheetNames = spreadsheet.data.sheets.map(sheet => sheet.properties.title);
  console.log(`   Found ${sheetNames.length} sheets:`);
  sheetNames.forEach(name => console.log(`   • ${name}`));
  console.log('');

  // Step 3: Get row count from Master Scenario Convert tab
  const masterTab = 'Master Scenario Convert';

  if (sheetNames.includes(masterTab)) {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: testSheetId,
      range: `${masterTab}!A:A`
    });

    const rowCount = response.data.values ? response.data.values.length : 0;
    console.log(`   Master Scenario Convert: ${rowCount} rows\n`);
  }

  // Step 4: Add a note to the spreadsheet
  console.log('Step 3: Adding test spreadsheet marker...\n');

  // Add a note sheet
  const addSheetRequest = {
    spreadsheetId: testSheetId,
    requestBody: {
      requests: [{
        addSheet: {
          properties: {
            title: '⚠️ TEST SPREADSHEET',
            tabColor: {
              red: 1.0,
              green: 0.5,
              blue: 0.0
            }
          }
        }
      }]
    }
  };

  await sheets.spreadsheets.batchUpdate(addSheetRequest);

  // Add warning text
  const warningText = [
    ['⚠️ TEST SPREADSHEET - DO NOT USE IN PRODUCTION'],
    [''],
    ['This is a test copy for validating feature-based isolated code.'],
    [''],
    ['Created:', new Date().toISOString()],
    ['Purpose:', 'Test ATSR and Batch Processing features with isolated code'],
    ['Original:', `https://docs.google.com/spreadsheets/d/${ORIGINAL_SHEET_ID}/edit`],
    [''],
    ['Next Steps:'],
    ['1. Deploy feature-based Apps Script code'],
    ['2. Test ATSR title generation'],
    ['3. Test batch processing'],
    ['4. Compare outputs with original'],
    ['5. Validate all golden prompts preserved']
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: testSheetId,
    range: '⚠️ TEST SPREADSHEET!A1',
    valueInputOption: 'RAW',
    requestBody: {
      values: warningText
    }
  });

  console.log('✅ Test marker added\n');

  // Summary
  console.log('='.repeat(70));
  console.log('📊 TEST SPREADSHEET READY');
  console.log('='.repeat(70));
  console.log(`Spreadsheet ID: ${testSheetId}`);
  console.log(`URL: https://docs.google.com/spreadsheets/d/${testSheetId}/edit`);
  console.log('');
  console.log('Next Steps:');
  console.log('  1. Open the test spreadsheet');
  console.log('  2. Go to Extensions > Apps Script');
  console.log('  3. Deploy feature-based code modules:');
  console.log('     • ATSR_Title_Generator_Feature.gs');
  console.log('     • Batch_Processing_Sidebar_Feature.gs');
  console.log('     • Core_Processing_Engine.gs');
  console.log('  4. Test ATSR on a few rows');
  console.log('  5. Test batch processing');
  console.log('  6. Compare outputs with original spreadsheet');
  console.log('='.repeat(70) + '\n');

  // Save config
  const config = {
    timestamp: new Date().toISOString(),
    purpose: 'Feature-based code testing',
    originalSheetId: ORIGINAL_SHEET_ID,
    testSheetId: testSheetId,
    testSheetUrl: `https://docs.google.com/spreadsheets/d/${testSheetId}/edit`,
    sheets: sheetNames,
    nextSteps: [
      'Deploy feature-based Apps Script code',
      'Test ATSR title generation',
      'Test batch processing',
      'Compare outputs with original',
      'Validate golden prompts preserved'
    ]
  };

  const configPath = path.join(__dirname, '../config/test-spreadsheet.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`📋 Config saved: ${configPath}\n`);

  return config;
}

createTestSpreadsheet().catch(console.error);
