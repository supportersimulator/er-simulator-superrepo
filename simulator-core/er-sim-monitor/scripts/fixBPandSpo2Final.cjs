#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SHEET_NAME = 'Master Scenario Convert';

function getColumnLetter(colIndex) {
  let letter = '';
  while (colIndex >= 0) {
    letter = String.fromCharCode(65 + (colIndex % 26)) + letter;
    colIndex = Math.floor(colIndex / 26) - 1;
  }
  return letter;
}

async function fixFinalIssues() {
  console.log('\n🔧 FIXING FINAL BP AND SPO2 ISSUES\n');

  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({version: 'v4', auth: oAuth2Client});

  const rowsToFix = [53, 82, 137, 176];
  const vitalsIdx = 55;
  const vitalsColumn = getColumnLetter(vitalsIdx);

  const updates = [];

  for (const rowNum of rowsToFix) {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${SHEET_NAME}!${rowNum}:${rowNum}`
    });

    const row = response.data.values[0];
    let vitalsRaw = row[vitalsIdx];

    console.log(`\nRow ${rowNum}:`);
    console.log(`  Before: ${vitalsRaw.substring(0, 120)}...`);

    // Handle N/A and "null" strings before parsing
    vitalsRaw = vitalsRaw.replace(/:\s*N\/A\s*([,}])/g, ': null$1');
    vitalsRaw = vitalsRaw.replace(/:\s*"null"\s*([,}])/g, ': null$1');

    const vitalsObj = JSON.parse(vitalsRaw);

    // Convert BP to object if needed
    if (typeof vitalsObj.bp === 'string') {
      const bpMatch = vitalsObj.bp.match(/(\d+)\/(\d+)/);
      if (bpMatch) {
        vitalsObj.bp = {sys: parseInt(bpMatch[1]), dia: parseInt(bpMatch[2])};
      } else {
        // BP is "null" or invalid - set to null object
        vitalsObj.bp = {sys: null, dia: null};
      }
    }

    // Ensure all keys lowercase
    const standardized = {};
    Object.keys(vitalsObj).forEach(key => {
      standardized[key.toLowerCase()] = vitalsObj[key];
    });

    // Asystole cases need appropriate defaults
    if (standardized.waveform === 'asystole_ecg') {
      standardized.hr = standardized.hr || 0;
      standardized.rr = standardized.rr || 0;
      standardized.spo2 = standardized.spo2 || null;
      if (!standardized.bp || standardized.bp === null) {
        standardized.bp = {sys: null, dia: null};
      }
    }

    const finalJSON = JSON.stringify(standardized);
    console.log(`  After:  ${finalJSON.substring(0, 120)}...`);

    updates.push({
      range: `${SHEET_NAME}!${vitalsColumn}${rowNum}`,
      values: [[finalJSON]]
    });
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: updates
    }
  });

  console.log(`\n💾 Updated ${rowsToFix.length} rows in Google Sheets`);
  console.log('✅ All BP values in object format, all spo2 fields present\n');
}

fixFinalIssues().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
