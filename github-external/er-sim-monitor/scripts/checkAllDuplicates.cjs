/**
 * Check for Duplicate Case_IDs and Legacy_Case_IDs
 *
 * Scans both Master Scenario Convert and AI_Categorization_Results
 * to identify:
 * - Duplicate Case_IDs (should be 0 after previous fix)
 * - Duplicate Legacy_Case_IDs (intentional variations)
 *
 * Generates report showing which rows share identifiers.
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Checking for Duplicate Case_IDs and Legacy_Case_IDs\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  // Fetch Master Scenario Convert
  console.log('📥 Fetching Master Scenario Convert sheet...\n');
  const masterResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Master Scenario Convert!A3:I500'
  });
  const masterData = masterResponse.data.values || [];

  // Fetch AI_Categorization_Results
  console.log('📥 Fetching AI_Categorization_Results sheet...\n');
  const resultsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'AI_Categorization_Results!A2:B500'
  });
  const resultsData = resultsResponse.data.values || [];

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('📊 MASTER SCENARIO CONVERT ANALYSIS\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  // Check Master sheet for duplicate Case_IDs
  const masterCaseIDs = {};
  const masterLegacyIDs = {};

  masterData.forEach((row, idx) => {
    const caseID = row[0] || '';
    const legacyID = row[8] || ''; // Column I (index 8)
    const actualRow = idx + 3; // Data starts at row 3

    if (caseID) {
      if (!masterCaseIDs[caseID]) {
        masterCaseIDs[caseID] = [];
      }
      masterCaseIDs[caseID].push(actualRow);
    }

    if (legacyID) {
      if (!masterLegacyIDs[legacyID]) {
        masterLegacyIDs[legacyID] = [];
      }
      masterLegacyIDs[legacyID].push({ row: actualRow, caseID: caseID });
    }
  });

  // Report duplicate Case_IDs in Master
  const masterCaseIDDuplicates = Object.keys(masterCaseIDs).filter(id => masterCaseIDs[id].length > 1);

  console.log('🔑 CASE_ID DUPLICATES:\n');
  if (masterCaseIDDuplicates.length === 0) {
    console.log('✅ NO DUPLICATE CASE_IDs FOUND\n');
    console.log('All ' + Object.keys(masterCaseIDs).length + ' Case_IDs are unique!\n');
  } else {
    console.log('❌ FOUND ' + masterCaseIDDuplicates.length + ' DUPLICATE CASE_IDs:\n');
    masterCaseIDDuplicates.forEach(id => {
      console.log('  Case_ID: ' + id);
      console.log('  Rows: ' + masterCaseIDs[id].join(', ') + '\n');
    });
  }

  // Report duplicate Legacy_Case_IDs in Master
  const masterLegacyDuplicates = Object.keys(masterLegacyIDs).filter(id => masterLegacyIDs[id].length > 1);

  console.log('──────────────────────────────────────────────────────────────\n');
  console.log('🏷️  LEGACY_CASE_ID DUPLICATES:\n');
  if (masterLegacyDuplicates.length === 0) {
    console.log('✅ NO DUPLICATE LEGACY_CASE_IDs FOUND\n');
  } else {
    console.log('⚠️  FOUND ' + masterLegacyDuplicates.length + ' DUPLICATE LEGACY_CASE_IDs:\n');
    console.log('(These are INTENTIONAL variations - different learning outcomes)\n');

    masterLegacyDuplicates.forEach(legacyID => {
      console.log('  Legacy_Case_ID: ' + legacyID);
      console.log('  Appears in ' + masterLegacyIDs[legacyID].length + ' cases:');
      masterLegacyIDs[legacyID].forEach(entry => {
        console.log('    - Row ' + entry.row + ': Case_ID = ' + entry.caseID);
      });
      console.log('');
    });
  }

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('📊 AI_CATEGORIZATION_RESULTS ANALYSIS\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  // Check Results sheet for duplicate Case_IDs
  const resultsCaseIDs = {};
  const resultsLegacyIDs = {};

  resultsData.forEach((row, idx) => {
    const caseID = row[0] || '';
    const legacyID = row[1] || '';
    const actualRow = idx + 2; // Data starts at row 2

    if (caseID) {
      if (!resultsCaseIDs[caseID]) {
        resultsCaseIDs[caseID] = [];
      }
      resultsCaseIDs[caseID].push(actualRow);
    }

    if (legacyID) {
      if (!resultsLegacyIDs[legacyID]) {
        resultsLegacyIDs[legacyID] = [];
      }
      resultsLegacyIDs[legacyID].push({ row: actualRow, caseID: caseID });
    }
  });

  // Report duplicate Case_IDs in Results
  const resultsCaseIDDuplicates = Object.keys(resultsCaseIDs).filter(id => resultsCaseIDs[id].length > 1);

  console.log('🔑 CASE_ID DUPLICATES:\n');
  if (resultsCaseIDDuplicates.length === 0) {
    console.log('✅ NO DUPLICATE CASE_IDs FOUND\n');
    console.log('All ' + Object.keys(resultsCaseIDs).length + ' Case_IDs are unique!\n');
  } else {
    console.log('❌ FOUND ' + resultsCaseIDDuplicates.length + ' DUPLICATE CASE_IDs:\n');
    resultsCaseIDDuplicates.forEach(id => {
      console.log('  Case_ID: ' + id);
      console.log('  Rows: ' + resultsCaseIDs[id].join(', ') + '\n');
    });
  }

  // Report duplicate Legacy_Case_IDs in Results
  const resultsLegacyDuplicates = Object.keys(resultsLegacyIDs).filter(id => resultsLegacyIDs[id].length > 1);

  console.log('──────────────────────────────────────────────────────────────\n');
  console.log('🏷️  LEGACY_CASE_ID DUPLICATES:\n');
  if (resultsLegacyDuplicates.length === 0) {
    console.log('✅ NO DUPLICATE LEGACY_CASE_IDs FOUND\n');
  } else {
    console.log('⚠️  FOUND ' + resultsLegacyDuplicates.length + ' DUPLICATE LEGACY_CASE_IDs:\n');
    console.log('(These are INTENTIONAL variations - different learning outcomes)\n');

    resultsLegacyDuplicates.forEach(legacyID => {
      console.log('  Legacy_Case_ID: ' + legacyID);
      console.log('  Appears in ' + resultsLegacyIDs[legacyID].length + ' cases:');
      resultsLegacyIDs[legacyID].forEach(entry => {
        console.log('    - Row ' + entry.row + ': Case_ID = ' + entry.caseID);
      });
      console.log('');
    });
  }

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('📋 SUMMARY\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  console.log('Master Scenario Convert:');
  console.log('  Total rows: ' + masterData.length);
  console.log('  Unique Case_IDs: ' + Object.keys(masterCaseIDs).length);
  console.log('  Duplicate Case_IDs: ' + masterCaseIDDuplicates.length);
  console.log('  Unique Legacy_Case_IDs: ' + Object.keys(masterLegacyIDs).length);
  console.log('  Duplicate Legacy_Case_IDs: ' + masterLegacyDuplicates.length + '\n');

  console.log('AI_Categorization_Results:');
  console.log('  Total rows: ' + resultsData.length);
  console.log('  Unique Case_IDs: ' + Object.keys(resultsCaseIDs).length);
  console.log('  Duplicate Case_IDs: ' + resultsCaseIDDuplicates.length);
  console.log('  Unique Legacy_Case_IDs: ' + Object.keys(resultsLegacyIDs).length);
  console.log('  Duplicate Legacy_Case_IDs: ' + resultsLegacyDuplicates.length + '\n');

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 RECOMMENDATION FOR APPLY FUNCTION FIX:\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  if (masterCaseIDDuplicates.length === 0 && resultsCaseIDDuplicates.length === 0) {
    console.log('✅ All Case_IDs are unique - safe to use as PRIMARY lookup!\n');
    console.log('Recommended fix:\n');
    console.log('  1. Change Apply function to use Case_ID as PRIMARY lookup');
    console.log('  2. Use Legacy_Case_ID only as FALLBACK (if Case_ID fails)');
    console.log('  3. This ensures each categorization writes to correct unique row\n');
    console.log('Current problematic logic:');
    console.log('  ❌ Try Legacy_Case_ID first (returns FIRST match → wrong row)');
    console.log('  ✅ Fallback to Case_ID (unique, always correct)\n');
    console.log('Fixed logic:');
    console.log('  ✅ Try Case_ID first (unique, always correct)');
    console.log('  ✅ Fallback to Legacy_Case_ID (only if Case_ID missing)\n');
  } else {
    console.log('⚠️  WARNING: Duplicate Case_IDs found!\n');
    console.log('Must fix duplicates before proceeding with Apply function fix.\n');
  }
}

main().catch(console.error);
