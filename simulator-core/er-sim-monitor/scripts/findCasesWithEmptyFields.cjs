/**
 * Find Cases with Empty Final_Symptom or Final_System
 * 
 * This is the actual filter in the Apply function:
 * if (finalSymptom && finalSystem)
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Finding Cases with Empty Final_Symptom or Final_System\n');
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

  const resultsRes = await sheets.spreadshets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'AI_Categorization_Results!A2:O300'
  });

  const resultsData = resultsRes.data.values || [];

  console.log('Total rows: ' + resultsData.length + '\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  let passFilter = 0;
  let failFilter = 0;
  const failedCases = [];

  console.log('Apply function filter: if (finalSymptom && finalSystem)\n');
  console.log('Cases that FAIL this filter (excluded from Apply):\n');
  console.log('Row | Case_ID    | Final_Symptom | Final_System | Reason\n');
  console.log('----+------------+---------------+--------------+------------------\n');

  resultsData.forEach((row, idx) => {
    const caseID = row[0] || '';
    const finalSymptom = row[12] || '';  // Column M
    const finalSystem = row[13] || '';   // Column N

    // This is the EXACT filter from the Apply function
    const passes = finalSymptom && finalSystem;

    if (passes) {
      passFilter++;
    } else {
      failFilter++;
      
      const rowNum = String(idx + 2).padStart(3);
      const id = (caseID || '(empty)').substring(0, 12).padEnd(12);
      const symptom = (finalSymptom || '(empty)').substring(0, 15).padEnd(15);
      const system = (finalSystem || '(empty)').substring(0, 14).padEnd(14);
      
      let reason = '';
      if (!finalSymptom && !finalSystem) {
        reason = 'Both empty';
      } else if (!finalSymptom) {
        reason = 'Symptom empty';
      } else if (!finalSystem) {
        reason = 'System empty';
      }
      
      console.log(rowNum + ' | ' + id + ' | ' + symptom + ' | ' + system + ' | ' + reason);
      
      failedCases.push({
        row: idx + 2,
        caseID: caseID,
        finalSymptom: finalSymptom,
        finalSystem: finalSystem,
        reason: reason
      });
    }
  });

  console.log('\n══════════════════════════════════════════════════════════════\n');
  console.log('📊 Results:\n');
  console.log('  Cases that PASS filter (included in Apply): ' + passFilter + ' ✅');
  console.log('  Cases that FAIL filter (excluded): ' + failFilter + ' ❌\n');

  if (passFilter === 190) {
    console.log('✅ CONFIRMED! ' + passFilter + ' cases pass the filter.\n');
    console.log('This matches the "190 cases updated" message!\n');
  }

  if (failedCases.length > 0) {
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('🔧 How to Fix the ' + failedCases.length + ' Missing Cases:\n');
    console.log('Options:\n');
    console.log('1. Re-run AI categorization for these specific cases');
    console.log('2. Manually fill in Final_Symptom and Final_System columns');
    console.log('3. Investigate why AI categorization failed for these\n');
    
    console.log('Would you like to:');
    console.log('  A) Check if these cases have AI categorization data we can use');
    console.log('  B) Re-run AI categorization for these ' + failedCases.length + ' cases');
    console.log('  C) See what data exists in other columns for these cases\n');
  }
}

main().catch(console.error);
