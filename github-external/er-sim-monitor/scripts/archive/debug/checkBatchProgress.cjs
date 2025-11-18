#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

async function checkBatchProgress() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  console.log('');
  console.log('📊 CHECKING BATCH_PROGRESS SHEET (Latest Batch)');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const progressResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Batch_Progress!A1:Z30'
  });

  const progressRows = progressResponse.data.values || [];

  // Show header
  console.log('Headers:');
  console.log(progressRows[0]?.join(' | '));
  console.log('');

  // Show last 10 rows (most recent processing)
  console.log('Latest batch entries (last 10 rows):');
  const startRow = Math.max(1, progressRows.length - 10);
  for (let i = startRow; i < progressRows.length; i++) {
    console.log(`Row ${i + 1}: ${progressRows[i].join(' | ')}`);
  }
  console.log('');
}

if (require.main === module) {
  checkBatchProgress().catch(error => {
    console.error('');
    console.error('❌ ERROR');
    console.error('═══════════════════════════════════════════════════');
    console.error(error.message);
    process.exit(1);
  });
}
