#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SHEET_NAME = 'Master Scenario Convert';

async function testATSR() {
  console.log('🧪 TESTING STANDALONE ATSR\n');

  // Get ATSR script ID from .env
  const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  const match = envContent.match(/ATSR_SCRIPT_ID=(.+)/);
  if (!match) {
    console.error('❌ ATSR_SCRIPT_ID not found in .env');
    process.exit(1);
  }
  const ATSR_SCRIPT_ID = match[1].trim();

  console.log(`📋 Script ID: ${ATSR_SCRIPT_ID}`);
  console.log(`   URL: https://script.google.com/d/${ATSR_SCRIPT_ID}/edit\n`);

  // Auth setup
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({version: 'v4', auth: oAuth2Client});
  const script = google.script({version: 'v1', auth: oAuth2Client});

  // Get a test row (row 16)
  console.log('📊 Fetching test row data (row 16)...\n');

  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!2:2`
  });

  const headers = headerResponse.data.values[0];

  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!16:16`
  });

  const row = dataResponse.data.values[0];

  // Build row object
  const rowData = {};
  headers.forEach((header, i) => {
    rowData[header] = row[i] || '';
  });

  console.log(`✅ Loaded row 16 data\n`);

  // Call ATSR function via Apps Script API
  console.log('🚀 Calling generateATSR() function...\n');

  try {
    const response = await script.scripts.run({
      scriptId: ATSR_SCRIPT_ID,
      requestBody: {
        function: 'generateATSR',
        parameters: [rowData],
        devMode: false
      }
    });

    if (response.data.error) {
      console.error('❌ ATSR FAILED:\n');
      console.error(JSON.stringify(response.data.error, null, 2));
      process.exit(1);
    }

    console.log('✅ ATSR EXECUTED SUCCESSFULLY!\n');

    if (response.data.response && response.data.response.result) {
      const result = response.data.response.result;
      console.log('📝 ATSR Output:\n');
      console.log(JSON.stringify(result, null, 2));
    }

    console.log('\n━'.repeat(60));
    console.log('🎉 STANDALONE ATSR IS WORKING PERFECTLY!');
    console.log('━'.repeat(60) + '\n');

  } catch (err) {
    console.error('❌ Error calling ATSR:', err.message);
    if (err.errors) {
      console.error(JSON.stringify(err.errors, null, 2));
    }
    process.exit(1);
  }
}

testATSR().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
