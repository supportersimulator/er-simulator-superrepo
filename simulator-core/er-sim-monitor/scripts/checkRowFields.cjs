#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SHEET_NAME = 'Master Scenario Convert';

async function checkFields() {
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

  console.log('\n📋 SHEET HEADERS (Row 16 context):');
  console.log('════════════════════════════════════════════════════\n');

  // Get row 16 data
  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!16:16`
  });

  const row16 = dataResponse.data.values[0];

  console.log('Looking for these fields:\n');

  const fieldsToFind = [
    'Diagnosis',
    'Learning_Outcomes:Diagnosis',
    'Chief_Complaint',
    'Patient_Presentation:Chief_Complaint',
    'Age',
    'Sex',
    'Vitals'
  ];

  fieldsToFind.forEach(field => {
    const idx = headers.findIndex(h => h.includes(field));
    if (idx !== -1) {
      console.log(`✅ Found: ${headers[idx]} (Column ${idx + 1})`);
      console.log(`   Value: ${row16[idx] || '(empty)'}`);
    } else {
      console.log(`❌ Not found: ${field}`);
    }
    console.log('');
  });

  console.log('\n🔍 All headers containing "Diagnosis":\n');
  headers.forEach((h, i) => {
    if (h.toLowerCase().includes('diagnosis')) {
      console.log(`   ${h} (Column ${i + 1})`);
      console.log(`   Value: ${row16[i] || '(empty)'}`);
    }
  });

  console.log('\n🔍 All headers containing "Chief":\n');
  headers.forEach((h, i) => {
    if (h.toLowerCase().includes('chief')) {
      console.log(`   ${h} (Column ${i + 1})`);
      console.log(`   Value: ${row16[i] || '(empty)'}`);
    }
  });
}

checkFields().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
