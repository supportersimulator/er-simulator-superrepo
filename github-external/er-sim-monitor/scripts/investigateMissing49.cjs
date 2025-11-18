/**
 * Investigate the 49 Missing Cases
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Investigating 49 Missing Cases\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  // Get Results sheet
  const resultsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'AI_Categorization_Results!A2:O300'
  });

  const resultsData = resultsRes.data.values || [];

  // Get Master sheet
  const masterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Master Scenario Convert!A3:S300'
  });

  const masterData = masterRes.data.values || [];

  // Find missing cases
  const missing = [];
  
  masterData.forEach((row, idx) => {
    const caseID = row[0] || '';
    const colP = row[15] || '';
    const colR = row[17] || '';
    
    if (!colP && !colR) {
      missing.push({
        masterRow: idx + 3,
        caseID: caseID
      });
    }
  });

  console.log('Found ' + missing.length + ' cases without categories in Master\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  console.log('Checking if they exist in AI_Categorization_Results:\n');

  let inResults = 0;
  let notInResults = 0;

  missing.slice(0, 10).forEach(m => {
    const found = resultsData.find(r => r[0] === m.caseID);
    
    if (found) {
      inResults++;
      const finalSymptom = found[12] || '';
      const finalSystem = found[13] || '';
      console.log('✅ ' + m.caseID.padEnd(12) + ' - IN Results (Symptom: ' + finalSymptom.substring(0, 15) + ', System: ' + finalSystem.substring(0, 15) + ')');
    } else {
      notInResults++;
      console.log('❌ ' + m.caseID.padEnd(12) + ' - NOT in Results sheet');
    }
  });

  console.log('\n...(checking remaining ' + (missing.length - 10) + ' cases)...\n');

  missing.slice(10).forEach(m => {
    const found = resultsData.find(r => r[0] === m.caseID);
    if (found) inResults++;
    else notInResults++;
  });

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Summary:\n');
  console.log('  In Results sheet: ' + inResults);
  console.log('  NOT in Results sheet: ' + notInResults + '\n');

  if (notInResults > 0) {
    console.log('🔍 Root Cause: ' + notInResults + ' cases in Master sheet are NOT in AI_Categorization_Results!\n');
    console.log('This means they were never processed through AI categorization.\n');
  }

  if (inResults > 0) {
    console.log('⚠️  ' + inResults + ' cases ARE in Results but were not applied.\n');
    console.log('Possible reasons:');
    console.log('  1. Case_ID mismatch between sheets');
    console.log('  2. findRowByCaseID() lookup failed');
    console.log('  3. Write to Master failed silently\n');
  }
}

main().catch(console.error);
