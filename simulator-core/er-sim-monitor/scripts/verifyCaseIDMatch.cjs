/**
 * Verify Case_IDs Match Between Sheets for Missing Cases
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Verifying Case_ID Match Between Sheets\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  // Get Master sheet Case_IDs
  console.log('📥 Fetching Master Scenario Convert Case_IDs...\n');
  
  const masterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Master Scenario Convert!A3:S300'
  });

  const masterData = masterRes.data.values || [];

  // Get Results sheet Case_IDs
  console.log('📥 Fetching AI_Categorization_Results Case_IDs...\n');
  
  const resultsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'AI_Categorization_Results!A2:O300'
  });

  const resultsData = resultsRes.data.values || [];

  // Build Results lookup
  const resultsLookup = {};
  resultsData.forEach((row, idx) => {
    const caseID = row[0] || '';
    resultsLookup[caseID] = {
      row: idx + 2,
      finalSymptom: row[12] || '',
      finalSystem: row[13] || ''
    };
  });

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Checking Missing Cases:\n');
  console.log('Master Row | Master Case_ID | In Results? | Match?\n');
  console.log('-----------+----------------+-------------+-------\n');

  let perfectMatches = 0;
  let notInResults = 0;
  let mismatches = [];

  masterData.forEach((row, idx) => {
    const masterCaseID = row[0] || '';
    const colP = row[15] || '';
    const colR = row[17] || '';
    
    // Only check missing cases
    if (!colP && !colR) {
      const masterRow = idx + 3;
      const inResults = resultsLookup[masterCaseID];
      
      const rowNum = String(masterRow).padStart(10);
      const caseID = masterCaseID.padEnd(16);
      
      if (inResults) {
        perfectMatches++;
        console.log(rowNum + ' | ' + caseID + '| ✅ YES       | ✅ MATCH');
      } else {
        notInResults++;
        console.log(rowNum + ' | ' + caseID + '| ❌ NO        | ❌ MISMATCH');
        mismatches.push({
          masterRow: masterRow,
          masterCaseID: masterCaseID
        });
      }
    }
  });

  console.log('\n══════════════════════════════════════════════════════════════\n');
  console.log('Summary:\n');
  console.log('  Perfect matches (Case_ID identical): ' + perfectMatches + ' ✅');
  console.log('  Not found in Results sheet: ' + notInResults + ' ❌\n');

  if (notInResults > 0) {
    console.log('🚨 PROBLEM FOUND!\n');
    console.log(notInResults + ' cases in Master sheet do NOT exist in AI_Categorization_Results!\n');
    console.log('Missing Case_IDs:\n');
    mismatches.forEach(m => {
      console.log('  Row ' + m.masterRow + ': ' + m.masterCaseID);
    });
    console.log('\nThis explains why Apply failed for these cases - they were never categorized!\n');
    console.log('Solution: Run AI Categorization for these ' + notInResults + ' cases\n');
  } else {
    console.log('✅ ALL MISSING CASES HAVE MATCHING CASE_IDs!\n');
    console.log('The lookup SHOULD work. Let me check Legacy_Case_ID matches too...\n');
  }

  // If all match, check Legacy_Case_ID too
  if (notInResults === 0 && perfectMatches > 0) {
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('Checking Legacy_Case_ID Match:\n');
    console.log('Master Row | Case_ID      | Master Legacy      | Results Legacy     | Match?\n');
    console.log('-----------+--------------+--------------------+--------------------+-------\n');

    let legacyMatches = 0;
    let legacyMismatches = 0;

    masterData.slice(0, 10).forEach((row, idx) => {
      const masterCaseID = row[0] || '';
      const colP = row[15] || '';
      const colR = row[17] || '';
      
      if (!colP && !colR) {
        const masterRow = idx + 3;
        const masterLegacy = row[8] || '(empty)';
        
        // Find in Results
        const resultsRow = resultsData.find(r => r[0] === masterCaseID);
        const resultsLegacy = resultsRow ? (resultsRow[1] || '(empty)') : '(not found)';
        
        const rowNum = String(masterRow).padStart(10);
        const caseID = masterCaseID.substring(0, 14).padEnd(14);
        const masterLeg = masterLegacy.substring(0, 20).padEnd(20);
        const resultsLeg = resultsLegacy.substring(0, 20).padEnd(20);
        
        const match = masterLegacy === resultsLegacy;
        if (match) legacyMatches++;
        else legacyMismatches++;
        
        console.log(rowNum + ' | ' + caseID + '| ' + masterLeg + '| ' + resultsLeg + '| ' + (match ? '✅' : '❌'));
      }
    });

    console.log('\n(Showing first 10 missing cases)\n');
    console.log('Legacy_Case_ID matches: ' + legacyMatches);
    console.log('Legacy_Case_ID mismatches: ' + legacyMismatches + '\n');
    
    if (legacyMismatches > 0) {
      console.log('⚠️  Some Legacy_Case_IDs don\'t match!\n');
      console.log('But this is OK - Apply has fallback to use Case_ID\n');
    }
  }
}

main().catch(console.error);
