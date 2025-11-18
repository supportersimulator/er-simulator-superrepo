/**
 * Check Current State of Master Sheet After Second Apply
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Checking Master Sheet Current State\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  console.log('📥 Fetching Master Scenario Convert (columns A, P, Q, R, S)...\n');

  const masterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Master Scenario Convert!A3:S300'
  });

  const masterData = masterRes.data.values || [];

  let withData = 0;
  let withoutData = 0;
  const stillMissing = [];

  masterData.forEach((row, idx) => {
    const caseID = row[0] || '';
    const colP = row[15] || '';
    const colQ = row[16] || '';
    const colR = row[17] || '';
    const colS = row[18] || '';
    
    if (colP || colQ || colR || colS) {
      withData++;
    } else {
      withoutData++;
      stillMissing.push({
        row: idx + 3,
        caseID: caseID
      });
    }
  });

  console.log('Current Status:\n');
  console.log('  Cases WITH categories: ' + withData + ' ✅');
  console.log('  Cases WITHOUT categories: ' + withoutData + ' ❌\n');

  if (withoutData === 0) {
    console.log('🎉 SUCCESS! All 207 cases now have categories!\n');
  } else if (withData === 158) {
    console.log('⚠️  SAME AS BEFORE - Still only 158 cases categorized\n');
    console.log('The Apply function ran but did NOT write the 49 missing cases!\n');
  } else {
    console.log('Status changed:\n');
    console.log('  Before: 158 cases');
    console.log('  Now: ' + withData + ' cases');
    console.log('  Progress: +' + (withData - 158) + ' cases ✅\n');
  }

  if (withoutData > 0) {
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('Still Missing (' + withoutData + ' cases):\n');
    console.log('Row | Case_ID\n');
    console.log('----+--------------\n');

    stillMissing.slice(0, 15).forEach(m => {
      const rowNum = String(m.row).padStart(3);
      console.log(rowNum + ' | ' + m.caseID);
    });

    if (stillMissing.length > 15) {
      console.log('... and ' + (stillMissing.length - 15) + ' more\n');
    }

    console.log('\n══════════════════════════════════════════════════════════════\n');
    console.log('🔍 Possible Causes:\n');
    console.log('1. Apply function says "updated" but actually writes to wrong location');
    console.log('2. Apply function has validation that silently fails for these cases');
    console.log('3. Write happens but Google Sheets API not persisting it');
    console.log('4. Columns P, Q, R, S are protected/locked for these specific rows\n');
    
    console.log('Let me check one specific case to see what\'s happening...\n');
    
    // Check first missing case in detail
    const firstMissing = stillMissing[0];
    console.log('Checking row ' + firstMissing.row + ' (Case_ID: ' + firstMissing.caseID + '):\n');
    
    const detailRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'Master Scenario Convert!A' + firstMissing.row + ':S' + firstMissing.row
    });
    
    const rowData = detailRes.data.values ? detailRes.data.values[0] : [];
    
    console.log('  Column A (Case_ID): ' + (rowData[0] || '(empty)'));
    console.log('  Column P (index 15): ' + (rowData[15] || '(empty)'));
    console.log('  Column Q (index 16): ' + (rowData[16] || '(empty)'));
    console.log('  Column R (index 17): ' + (rowData[17] || '(empty)'));
    console.log('  Column S (index 18): ' + (rowData[18] || '(empty)'));
    console.log('');
  }
}

main().catch(console.error);
