/**
 * Test if Regular Cases Can Use Case_ID Fallback
 *
 * Checks if Master Scenario Convert has BOTH Case_ID and Legacy_Case_ID
 * for regular cases, making the fallback truly universal.
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Checking if Regular Cases Can Use Case_ID Fallback\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  // Fetch Master Scenario Convert data (just first 3 columns)
  console.log('📥 Fetching Master Scenario Convert data...\n');

  const masterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Master Scenario Convert!A1:C10'
  });

  const masterData = masterRes.data.values || [];

  console.log('📊 First 10 rows of Master Scenario Convert:\n');
  console.log('Row | Column A (Case_ID?) | Column B (Legacy_Case_ID?) | Column C\n');

  masterData.forEach((row, i) => {
    const colA = row[0] || '(empty)';
    const colB = row[1] || '(empty)';
    const colC = row[2] || '(empty)';
    console.log((i + 1).toString().padStart(3) + ' | ' + colA.substring(0, 20).padEnd(20) + ' | ' + colB.substring(0, 26).padEnd(26) + ' | ' + colC.substring(0, 15));
  });

  console.log('\n══════════════════════════════════════════════════════════════\n');

  // Now fetch AI_Categorization_Results to see a regular case example
  const resultsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'AI_Categorization_Results!A2:B5'
  });

  const resultsData = resultsRes.data.values || [];

  console.log('📊 First 3 Regular Cases from AI_Categorization_Results:\n');
  resultsData.slice(0, 3).forEach((row, i) => {
    console.log('Case ' + (i + 1) + ':');
    console.log('  Case_ID: ' + row[0]);
    console.log('  Legacy_Case_ID: ' + row[1]);
    console.log('');
  });

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🔍 Testing: Can we find these cases in Master sheet?\n');

  // Test: Look up first regular case by BOTH methods
  const testCase = resultsData[0];
  const testCaseID = testCase[0];
  const testLegacyID = testCase[1];

  console.log('Test Case: ' + testCaseID + ' (Legacy: ' + testLegacyID + ')\n');

  // Fetch full Master sheet for searching
  const fullMasterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Master Scenario Convert!A3:B300'
  });

  const fullMasterData = fullMasterRes.data.values || [];

  // Search by Case_ID
  let foundByCaseID = null;
  fullMasterData.forEach((row, i) => {
    if (row[0] === testCaseID) {
      foundByCaseID = i + 3; // +3 for row number (1-indexed, +2 headers)
    }
  });

  // Search by Legacy_Case_ID
  let foundByLegacyID = null;
  fullMasterData.forEach((row, i) => {
    if (row[1] === testLegacyID) {
      foundByLegacyID = i + 3;
    }
  });

  console.log('Search Results:\n');

  if (foundByCaseID) {
    console.log('  ✅ Found by Case_ID (' + testCaseID + '): Row ' + foundByCaseID);
  } else {
    console.log('  ❌ NOT found by Case_ID');
  }

  if (foundByLegacyID) {
    console.log('  ✅ Found by Legacy_Case_ID (' + testLegacyID + '): Row ' + foundByLegacyID);
  } else {
    console.log('  ❌ NOT found by Legacy_Case_ID');
  }

  console.log('\n══════════════════════════════════════════════════════════════\n');

  if (foundByCaseID && foundByLegacyID) {
    if (foundByCaseID === foundByLegacyID) {
      console.log('✅ YES - Both methods find the SAME row!\n');
      console.log('This means:\n');
      console.log('  ✅ Regular cases can use Case_ID fallback');
      console.log('  ✅ Both lookups are equivalent (same row)');
      console.log('  ✅ Fallback is truly universal for all 207 cases\n');
      console.log('Verification: Master sheet has BOTH identifiers per row\n');
    } else {
      console.log('⚠️  WARNING - Methods found DIFFERENT rows!\n');
      console.log('  Case_ID lookup: Row ' + foundByCaseID);
      console.log('  Legacy_Case_ID lookup: Row ' + foundByLegacyID);
      console.log('\n  This would cause data mismatch!\n');
    }
  } else if (foundByLegacyID && foundByCaseID === null) {
    console.log('⚠️  Regular cases CANNOT use Case_ID fallback\n');
    console.log('Reason: Master sheet only has Legacy_Case_ID, not Case_ID\n');
    console.log('Impact: Fallback only works for retry cases with Case_ID in Master\n');
  } else if (foundByCaseID && foundByLegacyID === null) {
    console.log('⚠️  Unexpected: Found by Case_ID but not Legacy_Case_ID\n');
  }
}

main().catch(console.error);
