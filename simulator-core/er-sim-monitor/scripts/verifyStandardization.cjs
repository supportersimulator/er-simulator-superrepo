#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SHEET_NAME = 'Master Scenario Convert';

async function verify() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({version: 'v4', auth: oAuth2Client});

  // Get row 3 (first data row)
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!BD3` // Column 56
  });

  console.log('\n🔍 VERIFYING STANDARDIZATION\n');
  console.log('Reading cell BD3 (vitals column, row 3):\n');
  console.log(response.data.values[0][0]);
  console.log('\n');

  const vitals = JSON.parse(response.data.values[0][0]);
  console.log('Parsed object keys:', Object.keys(vitals));
  console.log('waveform:', vitals.waveform);
  console.log('bp type:', typeof vitals.bp);
  console.log('bp value:', vitals.bp);
}

verify().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
