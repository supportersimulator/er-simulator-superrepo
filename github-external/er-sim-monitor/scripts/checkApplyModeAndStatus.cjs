/**
 * Check applyMode Filter and Status Column
 * 
 * The Apply function has this filter:
 * if (applyMode === 'conflicts-only' && status !== 'conflict') { continue; }
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Checking applyMode Filter and Status Column\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  console.log('📥 Fetching AI_Categorization_Results data (including Status column)...\n');

  const resultsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'AI_Categorization_Results!A2:O300'
  });

  const resultsData = resultsRes.data.values || [];

  console.log('Total rows: ' + resultsData.length + '\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  // Count status values
  const statusCounts = {};
  const emptyStatusCases = [];

  console.log('Analyzing Status column (Column K, index 10):\n');

  resultsData.forEach((row, idx) => {
    const caseID = row[0] || '';
    const status = row[10] || '';  // Column K
    const finalSymptom = row[12] || '';
    const finalSystem = row[13] || '';

    if (!status || status.trim() === '') {
      emptyStatusCases.push({
        row: idx + 2,
        caseID: caseID,
        finalSymptom: finalSymptom,
        finalSystem: finalSystem
      });
    }

    const statusKey = status || '(empty)';
    statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
  });

  console.log('Status Column Distribution:\n');
  Object.keys(statusCounts).sort().forEach(status => {
    const count = String(statusCounts[status]).padStart(3);
    console.log('  ' + count + ' cases with status: "' + status + '"');
  });

  console.log('\n══════════════════════════════════════════════════════════════\n');
  console.log('🔍 Apply Function Logic:\n');
  console.log('The function has TWO filters:\n');
  console.log('1. if (applyMode === "conflicts-only" && status !== "conflict") { skip }');
  console.log('2. if (finalSymptom && finalSystem) { include }\n');

  console.log('Since user clicked "Apply Selected Categories to Master",');
  console.log('the applyMode is likely "all", NOT "conflicts-only".\n');
  console.log('So filter #1 should let ALL cases through.\n');

  if (emptyStatusCases.length > 0) {
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('⚠️  Found ' + emptyStatusCases.length + ' cases with EMPTY Status:\n');
    console.log('Row | Case_ID    | Final_Symptom | Final_System\n');
    console.log('----+------------+---------------+-------------\n');

    emptyStatusCases.forEach(c => {
      const rowNum = String(c.row).padStart(3);
      const id = c.caseID.substring(0, 12).padEnd(12);
      const symptom = c.finalSymptom.substring(0, 15).padEnd(15);
      const system = c.finalSystem.substring(0, 13);
      console.log(rowNum + ' | ' + id + ' | ' + symptom + ' | ' + system);
    });

    console.log('\n══════════════════════════════════════════════════════════════\n');
    console.log('🤔 Hypothesis:\n');
    console.log('If applyMode is NOT checking status, then these empty-status cases');
    console.log('should still be included in the 190.\n');
    console.log('\nLet me check the ACTUAL Master sheet to see which cases were written...\n');
  }

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Next: Check Master Scenario Convert to see which 17 cases are missing\n');
}

main().catch(console.error);
