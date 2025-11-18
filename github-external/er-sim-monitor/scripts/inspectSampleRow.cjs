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

  // Get header row
  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!2:2`
  });
  const headers = headerResponse.data.values[0];

  // Get first data row
  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!3:3`
  });
  const row = dataResponse.data.values[0];

  const caseIdIdx = 0; // Column 1
  const vitalsIdx = 55; // Column 56
  const sparkTitleIdx = 1; // Column 2

  console.log('\n🔍 SAMPLE ROW INSPECTION (Row 3)\n');
  console.log('Case_ID:', row[caseIdIdx]);
  console.log('Spark_Title:', row[sparkTitleIdx]);
  console.log('\nVitals (raw):');
  console.log(row[vitalsIdx]);
  console.log('\nVitals (first 500 chars):');
  console.log((row[vitalsIdx] || '').substring(0, 500));

  // Try to parse vitals
  try {
    const parsed = JSON.parse(row[vitalsIdx]);
    console.log('\n✅ Vitals parses as JSON');
    console.log('Waveform:', parsed.waveform);
    console.log('HR:', parsed.hr);
    console.log('SpO2:', parsed.spo2);
  } catch (e) {
    console.log('\n❌ Vitals does NOT parse as JSON');
    console.log('Error:', e.message);
  }
}

inspectRow().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
