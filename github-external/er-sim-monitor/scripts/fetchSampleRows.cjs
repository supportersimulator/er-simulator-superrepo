#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SCRIPT_ID = '1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6';
const SHEET_NAME = 'Master Scenario Convert';

async function fetchSamples() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({version: 'v4', auth: oAuth2Client});

  // Get headers
  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!2:2`
  });

  const headers = headerResponse.data.values[0];

  // Find relevant columns
  const memoryAnchorIdx = headers.findIndex(h => h.includes('Memory_Anchor'));
  const sparkIdx = headers.findIndex(h => h.includes('Spark_Title'));
  const revealIdx = headers.findIndex(h => h.includes('Reveal_Title'));
  const caseIdIdx = headers.findIndex(h => h.includes('Case_ID'));

  console.log('\n📊 Found columns:');
  console.log(`   Memory_Anchor: Column ${memoryAnchorIdx + 1}`);
  console.log(`   Spark_Title: Column ${sparkIdx + 1}`);
  console.log(`   Reveal_Title: Column ${revealIdx + 1}`);
  console.log('');

  // Get first 15 data rows
  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!3:17`
  });

  const rows = dataResponse.data.values;

  console.log('🎭 MEMORY ANCHORS FROM FIRST 15 CASES:');
  console.log('════════════════════════════════════════════════════\n');

  rows.forEach((row, i) => {
    const caseId = row[caseIdIdx] || `Row ${i+3}`;
    const memoryAnchor = row[memoryAnchorIdx] || '(empty)';
    const spark = row[sparkIdx] || '(empty)';

    if (memoryAnchor && memoryAnchor !== '(empty)') {
      console.log(`${i+1}. ${caseId}`);
      console.log(`   Memory Anchor: ${memoryAnchor}`);
      console.log(`   Spark Title: ${spark}`);
      console.log('');
    }
  });

  console.log('════════════════════════════════════════════════════');
}

fetchSamples().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
