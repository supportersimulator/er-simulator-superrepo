#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SHEET_NAME = 'Master Scenario Convert';

async function debugRow() {
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
  
  const data = Object.fromEntries(headers.map((h,i)=>[h, values[i]]));

  console.log('\n📋 AVAILABLE NON-EMPTY FIELDS:\n');
  
  Object.entries(data)
    .filter(([k,v]) => v && v !== '')
    .forEach(([key, value]) => {
      const preview = value.length > 100 ? value.substring(0, 100) + '...' : value;
      console.log(`${key}:`);
      console.log(`  ${preview}\n`);
    });
}

debugRow().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
