/**
 * Check Master Scenario Convert for Duplicate Case_IDs
 * 
 * Compare with AI_Categorization_Results duplicates
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Checking Master Scenario Convert for Duplicate Case_IDs\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  console.log('📥 Fetching Master Scenario Convert (Case_ID column)...\n');

  const masterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Master Scenario Convert!A3:I300'
  });

  const masterData = masterRes.data.values || [];

  console.log('Total rows in Master sheet: ' + masterData.length + '\n');

  // Count occurrences of each Case_ID
  const caseIDCounts = {};
  
  masterData.forEach((row, idx) => {
    const caseID = row[0] || '';
    if (!caseIDCounts[caseID]) {
      caseIDCounts[caseID] = [];
    }
    caseIDCounts[caseID].push(idx + 3); // Row number (data starts row 3)
  });

  const uniqueCaseIDs = Object.keys(caseIDCounts).filter(id => id !== '');
  const duplicates = Object.keys(caseIDCounts).filter(id => caseIDCounts[id].length > 1 && id !== '');

  console.log('Unique Case_IDs: ' + uniqueCaseIDs.length);
  console.log('Duplicate Case_IDs: ' + duplicates.length + '\n');

  if (duplicates.length > 0) {
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('⚠️  DUPLICATE CASE_IDs IN MASTER SHEET!\n');
    console.log('Case_ID    | Appears in Rows | Count\n');
    console.log('-----------+-----------------+------\n');

    duplicates.forEach(caseID => {
      const rows = caseIDCounts[caseID];
      const id = caseID.padEnd(11);
      const rowList = rows.join(', ').padEnd(17);
      console.log(id + '| ' + rowList + '| ' + rows.length);
    });

    console.log('\n══════════════════════════════════════════════════════════════\n');
    console.log('🔍 Comparing with AI_Categorization_Results Duplicates:\n');

    // Known duplicates from Results sheet
    const resultsDuplicates = [
      'CARD0002', 'CARD0007', 'CARD0012', 'CARD0017', 'CARD0050',
      'CARD0022', 'CARD0023', 'CARD0051', 'CARD0025', 'CARD0042',
      'NEUR0023', 'CARD0045'
    ];

    const matchingDuplicates = duplicates.filter(id => resultsDuplicates.includes(id));

    console.log('Duplicates in Results sheet: ' + resultsDuplicates.length);
    console.log('Duplicates in Master sheet: ' + duplicates.length);
    console.log('Matching duplicates (in both): ' + matchingDuplicates.length + '\n');

    if (matchingDuplicates.length === duplicates.length) {
      console.log('✅ SAME DUPLICATES in both sheets!\n');
      console.log('This means the Master sheet ALSO has duplicate scenarios.\n');
    } else {
      console.log('⚠️  Different duplicates between sheets!\n');
      const onlyInMaster = duplicates.filter(id => !resultsDuplicates.includes(id));
      const onlyInResults = resultsDuplicates.filter(id => !duplicates.includes(id));
      
      if (onlyInMaster.length > 0) {
        console.log('Only in Master: ' + onlyInMaster.join(', '));
      }
      if (onlyInResults.length > 0) {
        console.log('Only in Results: ' + onlyInResults.join(', '));
      }
      console.log('');
    }

    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('💡 Understanding the Duplicate Issue:\n');
    console.log('When Apply function searches for a Case_ID:');
    console.log('  - findRowByCaseID() returns the FIRST match');
    console.log('  - Other duplicate rows are IGNORED');
    console.log('  - This means some duplicate scenarios don\'t get categorized\n');

    console.log('Example: CARD0025 appears in rows ' + caseIDCounts['CARD0025'].join(', '));
    console.log('  - Apply function only updates the FIRST occurrence');
    console.log('  - Other CARD0025 rows remain uncategorized\n');

    console.log('🤔 Questions:');
    console.log('  1. Are these duplicate Case_IDs INTENTIONAL?');
    console.log('     (Same scenario used in multiple contexts?)');
    console.log('  2. Or should each scenario have a UNIQUE Case_ID?');
    console.log('     (Duplicates are a data error?)\n');

  } else {
    console.log('✅ No duplicate Case_IDs in Master sheet!\n');
    console.log('This is good - each scenario has a unique identifier.\n');
  }

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Total rows: ' + masterData.length);
  console.log('Unique Case_IDs: ' + uniqueCaseIDs.length);
  console.log('Difference: ' + (masterData.length - uniqueCaseIDs.length) + ' (duplicate rows)\n');
}

main().catch(console.error);
