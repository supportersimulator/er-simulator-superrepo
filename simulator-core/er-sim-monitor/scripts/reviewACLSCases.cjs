/**
 * Review 19 ACLS Cases - Are They Actual Cardiac Arrests?
 *
 * Analyzes presenting complaints and scenarios to determine
 * if cases truly require ACLS categorization.
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  // Fetch Input sheet to see presenting complaints
  const inputResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Input!A3:C300'
  });
  const inputData = inputResponse.data.values || [];

  const aclsCaseIDs = [
    'CARD0002', 'RESP0001', 'CARD0004', 'CARD0005', 'CARD0006',
    'CARD0007', 'MULT0001', 'CARD0009', 'CARD0013', 'CARD0018',
    'CARD0019', 'RESP0018', 'CARD0040', 'CARD0056', 'CARD0042',
    'CARD0023-2', 'CARD0025-5', 'CARD0045-3', 'CARD0017-2'
  ];

  console.log('🔍 Reviewing 19 ACLS Cases - Are They Actual Cardiac Arrests?\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const reviews = [];

  inputData.forEach((row, idx) => {
    const caseID = row[0] || '';
    const presentingComplaint = row[1] || '';
    const scenario = row[2] || '';

    if (aclsCaseIDs.includes(caseID)) {
      // Analyze if this is actual cardiac arrest
      const lowerComplaint = presentingComplaint.toLowerCase();
      const lowerScenario = scenario.toLowerCase();
      const combined = lowerComplaint + ' ' + lowerScenario;

      const arrestKeywords = [
        'unresponsive', 'not breathing', 'no pulse',
        'cardiac arrest', 'code blue', 'cpr', 'resuscitation',
        'collapsed', 'found down', 'asystole', 'vfib', 'v-fib',
        'pulseless', 'apneic'
      ];

      const isArrest = arrestKeywords.some(keyword => combined.includes(keyword));

      reviews.push({
        row: idx + 3,
        caseID: caseID,
        presenting: presentingComplaint,
        scenario: scenario.substring(0, 200),
        isArrest: isArrest
      });
    }
  });

  // Separate actual arrests from non-arrests
  const actualArrests = reviews.filter(r => r.isArrest);
  const notArrests = reviews.filter(r => !r.isArrest);

  console.log('✅ LIKELY ACTUAL CARDIAC ARRESTS (' + actualArrests.length + '):\n');
  console.log('(These should keep ACLS categorization)\n');

  actualArrests.forEach(r => {
    console.log('  ' + r.caseID + ' (Input Row ' + r.row + ')');
    console.log('    Presenting: ' + r.presenting);
    console.log('    Scenario: ' + r.scenario.substring(0, 120) + '...');
    console.log('');
  });

  if (actualArrests.length === 0) {
    console.log('  (None found - all appear to be non-arrest scenarios)\n');
  }

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('❌ NOT CARDIAC ARRESTS (' + notArrests.length + '):\n');
  console.log('(These should be re-categorized to AMIN, CP, PE, etc.)\n');

  notArrests.forEach(r => {
    console.log('  ' + r.caseID + ' (Input Row ' + r.row + ')');
    console.log('    Presenting: ' + r.presenting);
    console.log('    Scenario: ' + r.scenario.substring(0, 120) + '...');
    console.log('');
  });

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('📊 Summary:\n');
  console.log('  Actual cardiac arrests (keep ACLS): ' + actualArrests.length);
  console.log('  NOT cardiac arrests (need re-categorization): ' + notArrests.length);
  console.log('  Total ACLS cases reviewed: ' + reviews.length + '\n');

  if (notArrests.length > 0) {
    console.log('🎯 Action Plan:\n');
    console.log('  1. Deploy ACLS protections (filter + enhanced prompt)');
    console.log('  2. Re-run AI categorization for ' + notArrests.length + ' non-arrest cases');
    console.log('  3. Keep ' + actualArrests.length + ' actual arrest cases as ACLS\n');

    console.log('Case IDs needing re-categorization:\n');
    notArrests.forEach(r => console.log('  - ' + r.caseID));
    console.log('');
  }

  // Write to file for next script to use
  fs.writeFileSync(
    './data/acls_recategorize_list.json',
    JSON.stringify(notArrests.map(r => r.caseID), null, 2)
  );

  console.log('✅ Saved re-categorization list to: ./data/acls_recategorize_list.json\n');
}

main().catch(console.error);
