#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

async function cleanupInputRow2() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  console.log('');
  console.log('🧹 CLEANING UP INPUT SHEET ROW 2');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // First, check current state
  const currentResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Input!A2:D2'
  });

  const currentRow = currentResponse.data.values?.[0] || [];
  console.log('Current Row 2:');
  console.log(`  Column A: ${currentRow[0] || '(empty)'}`);
  console.log(`  Column B: ${currentRow[1] ? currentRow[1].substring(0, 60) + '...' : '(empty)'}`);
  console.log(`  Column C: ${currentRow[2] ? currentRow[2].substring(0, 60) + '...' : '(empty)'}`);
  console.log(`  Column D: ${currentRow[3] || '(empty)'}`);
  console.log('');

  // Clear column A (set to empty string)
  console.log('Setting Column A to empty...');

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'Input!A2',
    valueInputOption: 'RAW',
    requestBody: {
      values: [['']]
    }
  });

  console.log('✅ Column A cleared successfully');
  console.log('');

  // Verify
  const verifyResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Input!A2:D2'
  });

  const verifyRow = verifyResponse.data.values?.[0] || [];
  console.log('Verified Row 2:');
  console.log(`  Column A: ${verifyRow[0] || '(empty)'}`);
  console.log(`  Column B: ${verifyRow[1] ? verifyRow[1].substring(0, 60) + '...' : '(empty)'}`);
  console.log(`  Column C: ${verifyRow[2] ? verifyRow[2].substring(0, 60) + '...' : '(empty)'}`);
  console.log(`  Column D: ${verifyRow[3] || '(empty)'}`);
  console.log('');

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ CLEANUP COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
}

if (require.main === module) {
  cleanupInputRow2().catch(error => {
    console.error('');
    console.error('❌ CLEANUP FAILED');
    console.error('═══════════════════════════════════════════════════');
    console.error(error.message);
    process.exit(1);
  });
}
