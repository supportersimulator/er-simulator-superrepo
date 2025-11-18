/**
 * Check Master Scenario Convert Sheet - Which 17 Cases Are Missing
 * 
 * Compares AI_Categorization_Results to Master sheet columns P, Q, R, S
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Checking Which Cases Are Missing in Master Sheet\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  console.log('📥 Step 1: Fetching AI_Categorization_Results (all Case_IDs)...\n');

  const resultsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'AI_Categorization_Results!A2:N300'
  });

  const resultsData = resultsRes.data.values || [];
  const expectedCases = new Set();
  
  resultsData.forEach(row => {
    const caseID = row[0];
    if (caseID) expectedCases.add(caseID);
  });

  console.log('Expected cases from Results sheet: ' + expectedCases.size + '\n');

  console.log('📥 Step 2: Fetching Master Scenario Convert (Case_ID + columns P, R)...\n');

  const masterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Master Scenario Convert!A3:S300'
  });

  const masterData = masterRes.data.values || [];

  console.log('Master sheet rows: ' + masterData.length + '\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  // Check which cases have data in columns P, R
  let foundCount = 0;
  let missingCount = 0;
  const missingCases = [];

  console.log('Checking which cases have data in columns P or R:\n');

  resultsData.forEach((resultRow, idx) => {
    const caseID = resultRow[0];
    const legacyCaseID = resultRow[1];
    
    // Find in Master sheet by Case_ID or Legacy_Case_ID
    let foundRow = null;
    
    for (let i = 0; i < masterData.length; i++) {
      const masterCaseID = masterData[i][0];
      const masterLegacyID = masterData[i][8]; // Column I
      
      if (masterCaseID === caseID || (legacyCaseID && masterLegacyID === legacyCaseID)) {
        foundRow = masterData[i];
        break;
      }
    }

    if (foundRow) {
      const colP = foundRow[15] || '';  // Column P (index 15)
      const colR = foundRow[17] || '';  // Column R (index 17)
      
      if (colP || colR) {
        foundCount++;
      } else {
        missingCount++;
        missingCases.push({
          resultRow: idx + 2,
          caseID: caseID,
          legacyCaseID: legacyCaseID || '(empty)',
          colP: colP,
          colR: colR
        });
      }
    } else {
      missingCount++;
      missingCases.push({
        resultRow: idx + 2,
        caseID: caseID,
        legacyCaseID: legacyCaseID || '(empty)',
        notFoundInMaster: true
      });
    }
  });

  console.log('📊 Results:\n');
  console.log('  Cases with data in columns P/R: ' + foundCount + ' ✅');
  console.log('  Cases WITHOUT data in columns P/R: ' + missingCount + ' ❌\n');

  if (foundCount === 190) {
    console.log('✅ CONFIRMED! ' + foundCount + ' cases have applied data.\n');
    console.log('This matches the "190 cases updated" message!\n');
  }

  if (missingCases.length > 0) {
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('❌ The ' + missingCases.length + ' Missing Cases:\n');
    console.log('Row | Case_ID    | Legacy_Case_ID       | Issue\n');
    console.log('----+------------+----------------------+------------------------\n');

    missingCases.forEach(c => {
      const rowNum = String(c.resultRow).padStart(3);
      const id = c.caseID.substring(0, 12).padEnd(12);
      const legacy = c.legacyCaseID.substring(0, 22).padEnd(22);
      const issue = c.notFoundInMaster ? 'NOT FOUND IN MASTER' : 'Found but no data in P/R';
      console.log(rowNum + ' | ' + id + ' | ' + legacy + ' | ' + issue);
    });

    console.log('\n══════════════════════════════════════════════════════════════\n');
    console.log('🔍 Root Cause Analysis:\n');
    
    const notFoundInMaster = missingCases.filter(c => c.notFoundInMaster).length;
    const foundButNoData = missingCases.filter(c => !c.notFoundInMaster).length;
    
    console.log('  ' + notFoundInMaster + ' cases: NOT FOUND in Master sheet (lookup failed)');
    console.log('  ' + foundButNoData + ' cases: Found in Master but no data written\n');
    
    if (notFoundInMaster > 0) {
      console.log('For cases NOT FOUND in Master:');
      console.log('  - findRowByLegacyCaseID() and findRowByCaseID() both failed');
      console.log('  - Either Case_ID or Legacy_Case_ID mismatch\n');
    }
  }
}

main().catch(console.error);
