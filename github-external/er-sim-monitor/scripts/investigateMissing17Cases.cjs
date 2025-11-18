/**
 * Investigate Why Only 190 of 207 Cases Are Being Applied
 * 
 * Checks AI_Categorization_Results to identify the 17 missing cases
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Investigating Missing 17 Cases\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  console.log('📥 Fetching AI_Categorization_Results data...\n');

  const resultsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'AI_Categorization_Results!A2:O300'
  });

  const resultsData = resultsRes.data.values || [];

  console.log('Total rows in AI_Categorization_Results: ' + resultsData.length + '\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  // Analyze each row
  let withFinalCategories = 0;
  let withoutFinalCategories = 0;
  const missingCases = [];

  console.log('Analyzing each case:\n');
  console.log('Row | Case_ID | Final_Symptom | Final_System | Status\n');
  console.log('----+----------+---------------+--------------+--------\n');

  resultsData.forEach((row, idx) => {
    const caseID = row[0] || '';
    const finalSymptom = row[12] || '';  // Column M
    const finalSystem = row[13] || '';   // Column N
    const status = row[11] || '';        // Column L

    const hasCategories = finalSymptom && finalSystem;

    if (hasCategories) {
      withFinalCategories++;
    } else {
      withoutFinalCategories++;
      missingCases.push({
        row: idx + 2,
        caseID: caseID,
        finalSymptom: finalSymptom,
        finalSystem: finalSystem,
        status: status
      });

      const rowNum = String(idx + 2).padStart(3);
      const id = (caseID || '(empty)').padEnd(10);
      const symptom = (finalSymptom || '(empty)').padEnd(15);
      const system = (finalSystem || '(empty)').padEnd(14);
      const stat = status || '(empty)';
      
      console.log(rowNum + ' | ' + id + ' | ' + symptom + ' | ' + system + ' | ' + stat);
    }
  });

  console.log('\n══════════════════════════════════════════════════════════════\n');
  console.log('📊 Summary:\n');
  console.log('  Total cases: ' + resultsData.length);
  console.log('  With final categories: ' + withFinalCategories + ' ✅');
  console.log('  Without final categories: ' + withoutFinalCategories + ' ❌\n');

  if (withFinalCategories === 190) {
    console.log('✅ This matches! 190 cases have final categories.\n');
  }

  if (missingCases.length > 0) {
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('🔍 Detailed Analysis of Missing Cases:\n');

    missingCases.forEach((c, i) => {
      console.log((i + 1) + '. Row ' + c.row + ': ' + c.caseID);
      console.log('   Final_Symptom: ' + (c.finalSymptom || '(EMPTY)'));
      console.log('   Final_System: ' + (c.finalSystem || '(EMPTY)'));
      console.log('   Status: ' + (c.status || '(EMPTY)'));
      console.log('');
    });

    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('🤔 Why These Cases Are Missing:\n');
    console.log('Possible reasons:');
    console.log('  1. AI categorization failed for these cases');
    console.log('  2. Rows manually cleared or never processed');
    console.log('  3. Status marked as something other than "completed"');
    console.log('  4. Empty Final_Symptom or Final_System columns\n');

    console.log('Next Steps:');
    console.log('  1. Check if these cases exist in Master sheet');
    console.log('  2. Check if they need to be re-run through AI categorization');
    console.log('  3. Or manually categorize these ' + missingCases.length + ' cases\n');
  }
}

main().catch(console.error);
