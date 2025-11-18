/**
 * Find which case is causing "Case not found" error
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Searching for missing case in Apply function\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
  const spreadsheetId = process.env.SHEET_ID;

  // Get all Legacy_Case_IDs from Results
  console.log('📊 Reading AI_Categorization_Results...\n');
  const resultsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: 'AI_Categorization_Results!A2:N250'
  });

  const resultsData = resultsResponse.data.values || [];

  // Get all Legacy_Case_IDs from Master
  console.log('📊 Reading Master Scenario Convert...\n');
  const masterResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: 'Master Scenario Convert!A3:I250'
  });

  const masterData = masterResponse.data.values || [];

  // Build lookup map of Master Legacy IDs
  const masterLegacyMap = {};
  masterData.forEach((row, i) => {
    const caseID = row[0];
    const legacyID = row[8];
    if (legacyID) {
      masterLegacyMap[legacyID] = {
        row: i + 3,
        caseID: caseID
      };
    }
  });

  console.log('✅ Master has ' + Object.keys(masterLegacyMap).length + ' cases with Legacy_Case_ID\n');

  // Check each Results case
  const missingCases = [];
  const foundCases = [];

  resultsData.forEach((row, i) => {
    const caseID = row[0];
    const legacyID = row[1];
    const finalSymptom = row[12];
    const finalSystem = row[13];

    // Only check cases that have final values (would be applied)
    if (finalSymptom && finalSystem) {
      if (!legacyID) {
        missingCases.push({
          resultsRow: i + 2,
          caseID: caseID,
          legacyID: '(empty)',
          reason: 'No Legacy_Case_ID in Results'
        });
      } else if (!masterLegacyMap[legacyID]) {
        missingCases.push({
          resultsRow: i + 2,
          caseID: caseID,
          legacyID: legacyID,
          reason: 'Legacy_Case_ID not found in Master'
        });
      } else {
        foundCases.push({
          caseID: caseID,
          legacyID: legacyID,
          masterRow: masterLegacyMap[legacyID].row
        });
      }
    }
  });

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 Apply Analysis:\n');
  console.log('Total cases with final categories: ' + (missingCases.length + foundCases.length));
  console.log('✅ Would be applied successfully: ' + foundCases.length);
  console.log('❌ Would fail (not found): ' + missingCases.length);
  console.log('');

  if (missingCases.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('❌ Cases That Will Fail:\n');

    missingCases.forEach(c => {
      console.log('Row ' + c.resultsRow + ' in Results:');
      console.log('   Case_ID: ' + c.caseID);
      console.log('   Legacy_Case_ID: ' + c.legacyID);
      console.log('   Reason: ' + c.reason);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n💡 Solution:\n');
    console.log('These cases are missing Legacy_Case_ID. This happens when:');
    console.log('  1. Case was added after initial import (new cases)');
    console.log('  2. Legacy_Case_ID column (I) is empty in Master sheet');
    console.log('');
    console.log('Options:');
    console.log('  A) Skip these cases (they will show as errors)');
    console.log('  B) Use Case_ID instead of Legacy_Case_ID for matching');
    console.log('  C) Manually add Legacy_Case_IDs to these rows in Master');
    console.log('');
  } else {
    console.log('✅ All cases have matching Legacy_Case_IDs!');
    console.log('   Apply function should work correctly.');
  }

  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
