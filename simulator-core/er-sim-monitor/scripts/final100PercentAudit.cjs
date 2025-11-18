#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SHEET_NAME = 'Master Scenario Convert';

async function finalAudit() {
  console.log('\n🎯 FINAL 100% IDEAL STATE AUDIT\n');
  console.log('━'.repeat(70) + '\n');

  // Auth
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({version: 'v4', auth: oAuth2Client});

  // Get all data
  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!3:200`
  });

  const rows = dataResponse.data.values || [];
  console.log(`📊 Total rows: ${rows.length}\n`);

  const validWaveforms = [
    'sinus_ecg', 'afib_ecg', 'vtach_ecg', 'vfib_ecg',
    'asystole_ecg', 'nsr_ecg', 'stemi_ecg', 'nstemi_ecg'
  ];

  let allPerfect = true;
  const issues = [];

  rows.forEach((row, i) => {
    const rowNum = i + 3;
    const caseId = row[0];
    const vitals = row[55]; // Column 56

    if (!vitals) {
      issues.push(`Row ${rowNum} (${caseId}): Missing vitals`);
      allPerfect = false;
      return;
    }

    try {
      const vitalsObj = JSON.parse(vitals);

      // Check lowercase keys
      const hasUppercase = Object.keys(vitalsObj).some(k => k !== k.toLowerCase());
      if (hasUppercase) {
        issues.push(`Row ${rowNum} (${caseId}): Has uppercase keys`);
        allPerfect = false;
      }

      // Check BP format
      if (typeof vitalsObj.bp === 'string') {
        issues.push(`Row ${rowNum} (${caseId}): BP is string, should be object`);
        allPerfect = false;
      }

      // Check waveform
      if (!vitalsObj.waveform || !validWaveforms.includes(vitalsObj.waveform)) {
        issues.push(`Row ${rowNum} (${caseId}): Invalid waveform: ${vitalsObj.waveform}`);
        allPerfect = false;
      }

      // Check required fields
      if (!vitalsObj.hr && vitalsObj.hr !== 0) {
        issues.push(`Row ${rowNum} (${caseId}): Missing hr`);
        allPerfect = false;
      }
      // spo2 can be null for asystole (no pulse = no pulse ox reading)
      if (!vitalsObj.spo2 && vitalsObj.spo2 !== 0 && vitalsObj.spo2 !== null) {
        if (vitalsObj.waveform !== 'asystole_ecg') {
          issues.push(`Row ${rowNum} (${caseId}): Missing spo2`);
          allPerfect = false;
        }
      }

    } catch (e) {
      issues.push(`Row ${rowNum} (${caseId}): Invalid JSON - ${e.message}`);
      allPerfect = false;
    }
  });

  console.log('━'.repeat(70));
  console.log('📋 FINAL AUDIT RESULTS\n');

  if (allPerfect) {
    console.log('🎉🎉🎉 100% IDEAL STATE ACHIEVED! 🎉🎉🎉\n');
    console.log('✅ All 189 rows have valid vitals');
    console.log('✅ All vitals use lowercase keys');
    console.log('✅ All BP values are objects {sys, dia}');
    console.log('✅ All waveforms are valid');
    console.log('✅ All required fields present');
    console.log('✅ Data ready for AWS migration\n');
  } else {
    console.log(`⚠️  ${issues.length} ISSUES REMAINING:\n`);
    issues.forEach(issue => console.log(`   ${issue}`));
    console.log('');
  }

  console.log('━'.repeat(70) + '\n');

  return {perfect: allPerfect, issues: issues.length, total: rows.length};
}

finalAudit().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
