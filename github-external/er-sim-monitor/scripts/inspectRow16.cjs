#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SHEET_NAME = 'Master Scenario Convert';

async function inspectRow() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({version: 'v4', auth: oAuth2Client});

  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!2:2`
  });

  const valuesResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!16:16`
  });

  const headers = headerResponse.data.values[0];
  const values = valuesResponse.data.values[0];

  console.log('\n🔍 ROW 16 DATA:\n');
  
  // Look for diagnosis-related fields
  headers.forEach((h, i) => {
    if (h.toLowerCase().includes('reveal') || 
        h.toLowerCase().includes('diagnosis') || 
        h.toLowerCase().includes('title')) {
      console.log(`${h}: ${values[i] || '(empty)'}`);
    }
  });
}

inspectRow().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
