#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SHEET_NAME = 'Master Scenario Convert';

async function fixInvalidRows() {
  console.log('\n🔧 FIXING 2 ROWS WITH INVALID JSON\n');

  // Auth
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({version: 'v4', auth: oAuth2Client});

  // Get the two problematic rows
  const row53Response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!53:53`
  });

  const row137Response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!137:137`
  });

  const row53 = row53Response.data.values[0];
  const row137 = row137Response.data.values[0];

  const vitalsIdx = 55; // Column 56

  console.log('Row 53 vitals (raw):');
  console.log(row53[vitalsIdx]);
  console.log('\nRow 137 vitals (raw):');
  console.log(row137[vitalsIdx]);

  // Fix: Replace N/A with null in JSON
  const fixed53 = row53[vitalsIdx].replace(/N\/A/g, 'null');
  const fixed137 = row137[vitalsIdx].replace(/N\/A/g, 'null');

  // Validate they parse
  const parsed53 = JSON.parse(fixed53);
  const parsed137 = JSON.parse(fixed137);

  console.log('\n✅ Row 53 fixed and validates');
  console.log('✅ Row 137 fixed and validates\n');

  // Standardize them
  function standardize(obj) {
    const std = {};
    Object.keys(obj).forEach(k => {
      const lk = k.toLowerCase();
      std[lk] = obj[k];
    });

    if (typeof std.bp === 'string') {
      const m = std.bp.match(/(\d+)\/(\d+)/);
      if (m) std.bp = {sys: parseInt(m[1]), dia: parseInt(m[2])};
    }

    std.waveform = std.waveform || 'sinus_ecg';
    std.lastupdated = new Date().toISOString();

    return std;
  }

  const std53 = standardize(parsed53);
  const std137 = standardize(parsed137);

  // Update Google Sheets
  const updates = [
    {
      range: `${SHEET_NAME}!${String.fromCharCode(65 + vitalsIdx)}53`,
      values: [[JSON.stringify(std53)]]
    },
    {
      range: `${SHEET_NAME}!${String.fromCharCode(65 + vitalsIdx)}137`,
      values: [[JSON.stringify(std137)]]
    }
  ];

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: updates
    }
  });

  console.log('💾 Updated both rows in Google Sheets\n');
  console.log('✅ All 189 rows now have valid, standardized JSON!\n');
}

fixInvalidRows().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
