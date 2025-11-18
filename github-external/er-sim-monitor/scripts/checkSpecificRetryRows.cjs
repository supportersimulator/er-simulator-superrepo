/**
 * Check Specific Rows That Were Retried
 *
 * The logs show rows 27, 37, 47, 130 were retried (CARD0005, PEDNE26, CARD0046, CARD0033).
 * Let's check if these specific rows have data in columns F-K.
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Checking specific retry rows in AI_Categorization_Results\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
  const spreadsheetId = process.env.SHEET_ID;

  // Rows from the retry logs
  const targetRows = [27, 37, 47, 130];

  console.log('📊 Fetching rows: ' + targetRows.join(', '));
  console.log('');

  for (const rowNum of targetRows) {
    // Fetch entire row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'AI_Categorization_Results!A' + rowNum + ':N' + rowNum
    });

    const row = response.data.values ? response.data.values[0] : [];

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Row ' + rowNum + ':');
    console.log('');
    console.log('  A (Case_ID): ' + (row[0] || '(empty)'));
    console.log('  B (Legacy_Case_ID): ' + (row[1] || '(empty)'));
    console.log('  C (Master_Row): ' + (row[2] || '(empty)'));
    console.log('  D (Current_Symptom): ' + (row[3] || '(empty)'));
    console.log('  E (Current_System): ' + (row[4] || '(empty)'));
    console.log('');
    console.log('  F (Suggested_Symptom): ' + (row[5] || '❌ EMPTY'));
    console.log('  G (Suggested_Symptom_Name): ' + (row[6] || '❌ EMPTY'));
    console.log('  H (Suggested_System): ' + (row[7] || '❌ EMPTY'));
    console.log('  I (Reasoning): ' + ((row[8] || '❌ EMPTY').substring(0, 80) + '...'));
    console.log('  J (Confidence): ' + (row[9] || '❌ EMPTY'));
    console.log('  K (Status): ' + (row[10] || '❌ EMPTY'));
    console.log('');
    console.log('  M (Final_Symptom): ' + (row[12] || '❌ EMPTY'));
    console.log('  N (Final_System): ' + (row[13] || '❌ EMPTY'));
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('💡 Analysis:');
  console.log('');
  console.log('If columns F-K are EMPTY:');
  console.log('  → Retry write-back is failing (validation skipping writes)');
  console.log('  → Need to check validation logic (lines 853-856)');
  console.log('');
  console.log('If columns F-K have data:');
  console.log('  → Retry DID write data successfully!');
  console.log('  → User may be looking at wrong sheet or outdated view');
  console.log('  → Suggest refreshing Google Sheet (F5)');
  console.log('');
}

main().catch(console.error);
