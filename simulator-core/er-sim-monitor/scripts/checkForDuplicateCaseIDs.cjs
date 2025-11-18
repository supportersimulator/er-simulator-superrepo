/**
 * Check for Duplicate Case_IDs in AI_Categorization_Results
 * 
 * The Results sheet has 207 rows but only 190 unique Case_IDs
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Checking for Duplicate Case_IDs\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  const resultsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'AI_Categorization_Results!A2:O300'
  });

  const resultsData = resultsRes.data.values || [];

  console.log('Total rows in Results sheet: ' + resultsData.length + '\n');

  // Count occurrences of each Case_ID
  const caseIDCounts = {};
  
  resultsData.forEach((row, idx) => {
    const caseID = row[0] || '';
    if (!caseIDCounts[caseID]) {
      caseIDCounts[caseID] = [];
    }
    caseIDCounts[caseID].push(idx + 2); // Row number
  });

  const uniqueCaseIDs = Object.keys(caseIDCounts).filter(id => id !== '');
  const duplicates = Object.keys(caseIDCounts).filter(id => caseIDCounts[id].length > 1 && id !== '');

  console.log('Unique Case_IDs: ' + uniqueCaseIDs.length);
  console.log('Duplicate Case_IDs: ' + duplicates.length + '\n');

  if (duplicates.length > 0) {
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('🔍 Duplicate Case_IDs Found:\n');
    console.log('Case_ID    | Appears in Rows | Count\n');
    console.log('-----------+-----------------+------\n');

    duplicates.forEach(caseID => {
      const rows = caseIDCounts[caseID];
      const id = caseID.padEnd(11);
      const rowList = rows.join(', ').padEnd(17);
      console.log(id + '| ' + rowList + '| ' + rows.length);
    });

    console.log('\n══════════════════════════════════════════════════════════════\n');
    console.log('💡 This Explains the Numbers!\n');
    console.log('  207 total rows in Results sheet');
    console.log('  ' + duplicates.length + ' cases appear multiple times');
    console.log('  ' + uniqueCaseIDs.length + ' unique Case_IDs\n');

    console.log('When Apply function builds dictionary with Case_ID as key:');
    console.log('  - Later rows OVERWRITE earlier rows (same key)');
    console.log('  - Dictionary ends up with ' + uniqueCaseIDs.length + ' entries');
    console.log('  - "190 cases updated" message is correct!\n');

    const totalDuplicateRows = duplicates.reduce((sum, id) => sum + caseIDCounts[id].length, 0);
    console.log('Total duplicate rows: ' + totalDuplicateRows);
    console.log('Unique cases from duplicates: ' + duplicates.length);
    console.log('Extra rows that got overwritten: ' + (totalDuplicateRows - duplicates.length) + '\n');

    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('🔍 Next Question: Why 25 Cases NOT Applied?\n');
    console.log('We have 190 unique Case_IDs in dictionary,');
    console.log('but only 182 cases actually got written to Master.\n');
    console.log('That means 8 cases (190 - 182 = 8) failed to write.\n');
    console.log('\nWait... the script said 25 missing, not 8.\n');
    console.log('Let me recheck the actual missing count...\n');
  } else {
    console.log('No duplicates found.\n');
  }
}

main().catch(console.error);
