/**
 * Debug Why PEDMU03 Failed to Apply
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Debugging Case: PEDMU03\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  // Find in Results
  const resultsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'AI_Categorization_Results!A2:O300'
  });

  const resultsData = resultsRes.data.values || [];
  const resultsRow = resultsData.find(r => r[0] === 'PEDMU03');

  console.log('In AI_Categorization_Results:\n');
  console.log('  Case_ID: ' + (resultsRow[0] || '(empty)'));
  console.log('  Legacy_Case_ID: ' + (resultsRow[1] || '(empty)'));
  console.log('  Final_Symptom: ' + (resultsRow[12] || '(empty)'));
  console.log('  Final_System: ' + (resultsRow[13] || '(empty)'));
  console.log('');

  // Find in Master
  const masterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Master Scenario Convert!A3:I300'
  });

  const masterData = masterRes.data.values || [];
  
  let foundInMaster = false;
  let masterRowNum = 0;
  
  masterData.forEach((row, idx) => {
    if (row[0] === 'PEDMU03') {
      foundInMaster = true;
      masterRowNum = idx + 3;
      console.log('In Master Scenario Convert:\n');
      console.log('  Row: ' + masterRowNum);
      console.log('  Case_ID (Col A): ' + (row[0] || '(empty)'));
      console.log('  Legacy_Case_ID (Col I): ' + (row[8] || '(empty)'));
      console.log('');
    }
  });

  if (!foundInMaster) {
    console.log('❌ NOT FOUND in Master Scenario Convert!\n');
    console.log('This is why Apply failed - findRowByCaseID() returned null.\n');
  } else {
    console.log('✅ FOUND in Master sheet at row ' + masterRowNum + '\n');
    console.log('So why didn\'t Apply write to it?\n');
    console.log('Checking if Apply function has try/catch that suppressed error...\n');
  }
}

main().catch(console.error);
