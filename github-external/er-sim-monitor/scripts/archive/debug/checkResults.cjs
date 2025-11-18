#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

async function checkResults() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  console.log('');
  console.log('🔍 CHECKING MASTER SCENARIO CONVERT SHEET');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // Get all rows
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Master Scenario Convert!A1:K20'
  });

  const rows = response.data.values || [];
  console.log(`Total rows: ${rows.length}`);
  console.log('');

  // Show tier headers
  console.log('Tier 1 headers:');
  console.log(rows[0]?.slice(0, 10).join(' | '));
  console.log('');
  console.log('Tier 2 headers:');
  console.log(rows[1]?.slice(0, 10).join(' | '));
  console.log('');

  // Show data rows
  console.log('Data rows (rows 3+):');
  for (let i = 2; i < rows.length; i++) {
    const caseId = rows[i][0] || '(empty)';
    const sparkTitle = rows[i][1] || '(empty)';
    console.log(`Row ${i + 1}: ${caseId} | ${sparkTitle}`);
  }
  console.log('');

  // Check Batch_Reports sheet
  console.log('');
  console.log('📋 CHECKING BATCH_REPORTS SHEET (Latest Report)');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const reportsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Batch_Reports!A1:Z10'
  });

  const reportRows = reportsResponse.data.values || [];
  reportRows.forEach((row, idx) => {
    console.log(`Row ${idx + 1}: ${row.join(' | ')}`);
  });
  console.log('');
}

if (require.main === module) {
  checkResults().catch(error => {
    console.error('');
    console.error('❌ ERROR');
    console.error('═══════════════════════════════════════════════════');
    console.error(error.message);
    process.exit(1);
  });
}
