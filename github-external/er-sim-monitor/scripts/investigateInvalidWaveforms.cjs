#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SHEET_NAME = 'Master Scenario Convert';

async function investigate() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({version: 'v4', auth: oAuth2Client});

  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!3:200`
  });

  const rows = dataResponse.data.values || [];

  const validWaveforms = [
    'sinus_ecg', 'afib_ecg', 'vtach_ecg', 'vfib_ecg',
    'asystole_ecg', 'nsr_ecg', 'stemi_ecg', 'nstemi_ecg'
  ];

  const vitalsIdx = 55; // Column 56
  const caseIdIdx = 0;  // Column 1

  console.log('\n🔍 INVESTIGATING 31 INVALID WAVEFORMS\n');

  const waveformCount = {};
  const invalidRows = [];

  rows.forEach((row, i) => {
    const rowNum = i + 3;
    const vitals = row[vitalsIdx];
    const caseId = row[caseIdIdx];

    if (!vitals) return;

    try {
      const vitalsObj = JSON.parse(vitals);
      const waveform = vitalsObj.waveform;

      waveformCount[waveform] = (waveformCount[waveform] || 0) + 1;

      if (!validWaveforms.includes(waveform)) {
        invalidRows.push({
          row: rowNum,
          caseId,
          waveform
        });
      }
    } catch (e) {
      // Skip invalid JSON
    }
  });

  console.log('📊 Waveform Distribution:\n');
  Object.entries(waveformCount).sort((a, b) => b[1] - a[1]).forEach(([waveform, count]) => {
    const isValid = validWaveforms.includes(waveform);
    const icon = isValid ? '✅' : '❌';
    console.log(`${icon} ${waveform}: ${count} rows`);
  });

  console.log(`\n❌ Invalid Waveforms (${invalidRows.length} rows):\n`);
  invalidRows.forEach(({row, caseId, waveform}) => {
    console.log(`Row ${row} (${caseId}): "${waveform}"`);
  });

  console.log('\n💡 Suggested Mappings:\n');
  const uniqueInvalid = [...new Set(invalidRows.map(r => r.waveform))];
  uniqueInvalid.forEach(wf => {
    console.log(`"${wf}" → ?`);
  });
}

investigate().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
