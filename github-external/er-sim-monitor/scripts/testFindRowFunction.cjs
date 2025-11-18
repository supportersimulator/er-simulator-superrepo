/**
 * Test findRowByCaseID Function Directly
 * 
 * Simulates what the Apply function does to find row numbers
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Testing findRowByCaseID Logic\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  // Get Master sheet (just Case_ID column)
  const masterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Master Scenario Convert!A3:A300'
  });

  const masterData = masterRes.data.values || [];

  console.log('Simulating findRowByCaseID() logic:\n');
  console.log('(Apps Script function searches column A for Case_ID)\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  // Test with missing cases
  const testCases = ['PEDMU03', 'RESP0013', 'PEDMU05', 'TRAU0007', 'NEUR0035'];

  console.log('Test Case_ID | Found at Index | Row Number Returned | Actual Master Row\n');
  console.log('-------------+----------------+---------------------+------------------\n');

  testCases.forEach(testID => {
    // This is what findRowByCaseID does
    let foundIndex = -1;
    for (let i = 0; i < masterData.length; i++) {
      if (masterData[i][0] === testID) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex >= 0) {
      // Apps Script returns: dataStartRow + foundIndex
      // dataStartRow = 3 (first data row after 2 headers)
      const returnedRow = 3 + foundIndex;
      const actualMasterRow = foundIndex + 3;
      
      const id = testID.padEnd(13);
      const idx = String(foundIndex).padStart(16);
      const returned = String(returnedRow).padStart(21);
      const actual = String(actualMasterRow).padStart(18);
      
      console.log(id + '| ' + idx + '| ' + returned + '| ' + actual);
    } else {
      console.log(testID.padEnd(13) + '| NOT FOUND');
    }
  });

  console.log('\n══════════════════════════════════════════════════════════════\n');
  console.log('Analysis:\n');
  console.log('If "Row Number Returned" matches "Actual Master Row", lookup is correct.\n');
  console.log('If they differ, the Apply function is writing to the WRONG row!\n');
  
  // Now check what the Apply function actually wrote
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Let me check if data was written to DIFFERENT rows...\n');
  
  // Get all of columns P-S
  const fullMasterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Master Scenario Convert!A3:S300'
  });

  const fullMasterData = fullMasterRes.data.values || [];
  
  let categorizedRows = [];
  fullMasterData.forEach((row, idx) => {
    const caseID = row[0] || '';
    const colR = row[17] || '';
    if (colR) {
      categorizedRows.push({
        row: idx + 3,
        caseID: caseID,
        symptom: colR
      });
    }
  });

  console.log('Found ' + categorizedRows.length + ' rows WITH categories\n');
  console.log('First 10 categorized rows:\n');
  console.log('Row | Case_ID      | Column R Value\n');
  console.log('----+--------------+---------------\n');

  categorizedRows.slice(0, 10).forEach(r => {
    const rowNum = String(r.row).padStart(3);
    const id = r.caseID.padEnd(14);
    console.log(rowNum + ' | ' + id + '| ' + r.symptom);
  });

  console.log('\nLast 10 categorized rows:\n');
  console.log('Row | Case_ID      | Column R Value\n');
  console.log('----+--------------+---------------\n');

  categorizedRows.slice(-10).forEach(r => {
    const rowNum = String(r.row).padStart(3);
    const id = r.caseID.padEnd(14);
    console.log(rowNum + ' | ' + id + '| ' + r.symptom);
  });
}

main().catch(console.error);
