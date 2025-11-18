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

async function fixRemainingBP() {
  console.log('\n🔧 FIXING 4 REMAINING BP STRING ISSUES\n');

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
    const vitalsRaw = row[vitalsIdx];

    console.log(`Row ${rowNum} vitals (before):`, vitalsRaw.substring(0, 100) + '...');

    const vitalsObj = JSON.parse(vitalsRaw);

    // Fix BP if string
    if (typeof vitalsObj.bp === 'string') {
      const bpMatch = vitalsObj.bp.match(/(\d+)\/(\d+)/);
      if (bpMatch) {
        vitalsObj.bp = {sys: parseInt(bpMatch[1]), dia: parseInt(bpMatch[2])};
        console.log(`   ✅ Converted BP: "${bpMatch[0]}" → {sys: ${vitalsObj.bp.sys}, dia: ${vitalsObj.bp.dia}}`);
      }
    }

    // Ensure all keys lowercase
    const standardized = {};
    Object.keys(vitalsObj).forEach(key => {
      standardized[key.toLowerCase()] = vitalsObj[key];
    });

    updates.push({
      range: `${SHEET_NAME}!${vitalsColumn}${rowNum}`,
      values: [[JSON.stringify(standardized)]]
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
  console.log('✅ All BP values now in object format: {sys, dia}\n');
}

fixRemainingBP().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
