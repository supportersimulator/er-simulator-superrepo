/**
 * List All 49 Missing Cases with Details
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Detailed List of 49 Missing Cases\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  // Get Master sheet
  const masterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Master Scenario Convert!A3:S300'
  });

  const masterData = masterRes.data.values || [];

  // Get Results sheet
  const resultsRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'AI_Categorization_Results!A2:O300'
  });

  const resultsData = resultsRes.data.values || [];

  const missing = [];

  masterData.forEach((row, idx) => {
    const caseID = row[0] || '';
    const colP = row[15] || '';
    const colR = row[17] || '';
    
    if (!colP && !colR) {
      // Find in Results
      const resultsRow = resultsData.find(r => r[0] === caseID);
      
      missing.push({
        masterRow: idx + 3,
        caseID: caseID,
        inResults: !!resultsRow,
        finalSymptom: resultsRow ? resultsRow[12] : '',
        finalSystem: resultsRow ? resultsRow[13] : ''
      });
    }
  });

  console.log('Total missing: ' + missing.length + '\n');
  console.log('Row | Case_ID      | In Results? | Final_Symptom | Final_System\n');
  console.log('----+--------------+-------------+---------------+--------------\n');

  missing.forEach(m => {
    const row = String(m.masterRow).padStart(3);
    const id = m.caseID.padEnd(13);
    const inRes = m.inResults ? '✅ YES' : '❌ NO ';
    const symptom = (m.finalSymptom || '(none)').padEnd(14);
    const system = (m.finalSystem || '(none)').substring(0, 13);
    
    console.log(row + ' | ' + id + '| ' + inRes + '      | ' + symptom + '| ' + system);
  });

  console.log('\n══════════════════════════════════════════════════════════════\n');

  const renamedIDs = [
    'CARD0002-2', 'CARD0007-2', 'CARD0012-2', 'CARD0017-2',
    'CARD0050-2', 'CARD0022-2', 'CARD0023-2', 'CARD0051-2',
    'CARD0025-2', 'CARD0025-3', 'CARD0025-4', 'CARD0025-5',
    'CARD0042-2', 'CARD0042-3', 'NEUR0023-2', 'CARD0045-2', 'CARD0045-3'
  ];

  const isRenamed = missing.filter(m => renamedIDs.includes(m.caseID));
  const notRenamed = missing.filter(m => !renamedIDs.includes(m.caseID));

  console.log('Analysis:\n');
  console.log('  Renamed Case_IDs (we just created): ' + isRenamed.length);
  console.log('  Regular Case_IDs (original): ' + notRenamed.length + '\n');

  if (isRenamed.length > 0) {
    console.log('Renamed Case_IDs missing (' + isRenamed.length + '):');
    isRenamed.forEach(m => console.log('  - ' + m.caseID));
    console.log('');
  }

  if (notRenamed.length > 0) {
    console.log('Regular Case_IDs missing (' + notRenamed.length + '):');
    notRenamed.slice(0, 20).forEach(m => console.log('  - ' + m.caseID));
    if (notRenamed.length > 20) console.log('  ... and ' + (notRenamed.length - 20) + ' more');
    console.log('');
  }

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('💡 Solution:\n');
  
  if (isRenamed.length === 17 && notRenamed.length === 32) {
    console.log('Option 1: Re-run Apply (will handle the 17 renamed cases)');
    console.log('Option 2: Investigate why 32 original cases were not applied\n');
  } else {
    console.log('Just refresh sheet and click "Apply Selected Categories to Master"\n');
    console.log('Expected result: ' + missing.length + ' cases updated\n');
  }
}

main().catch(console.error);
