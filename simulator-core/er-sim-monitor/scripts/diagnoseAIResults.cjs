const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';

function getOAuth2Client() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

async function diagnoseResults() {
  const auth = getOAuth2Client();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('🔍 Diagnosing AI_Categorization_Results sheet...\n');

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'AI_Categorization_Results!A1:P10'
  });

  const rows = response.data.values;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('HEADERS:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (rows[0]) {
    rows[0].forEach((header, idx) => {
      const col = String.fromCharCode(65 + idx);
      console.log(`  ${col} (idx ${idx}): ${header}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('FIRST 3 DATA ROWS:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  for (let i = 1; i <= Math.min(4, rows.length - 1); i++) {
    const row = rows[i];
    console.log(`ROW ${i + 1}: ${row[0]}`);
    console.log(`  A - Case_Organization_Case_ID:          "${row[0] || 'EMPTY'}"`);
    console.log(`  B - Case_Organization_Legacy_Case_ID:   "${row[1] || 'EMPTY'}"`);
    console.log(`  C - Row_Index:                           "${row[2] || 'EMPTY'}"`);
    console.log(`  D - Case_Organization_Spark_Title:       "${row[3] || 'EMPTY'}"`);
    console.log(`  E - Case_Organization_Reveal_Title:      "${row[4] || 'EMPTY'}"`);
    console.log(`  F - Suggested_Symptom_Code:              "${row[5] || 'EMPTY'}"`);
    console.log(`  G - Suggested_Symptom_Name:              "${row[6] || 'EMPTY'}"`);
    console.log(`  H - Suggested_System_Code:               "${row[7] || 'EMPTY'}"`);
    console.log(`  I - Suggested_System_Name:               "${row[8] || 'EMPTY'}"`);
    console.log(`  J - AI_Reasoning:                        "${row[9] || 'EMPTY'}"`);
    console.log(`  K - Status:                              "${row[10] || 'EMPTY'}"`);
    console.log(`  L - User_Decision:                       "${row[11] || 'EMPTY'}"`);
    console.log(`  M - Case_Organization_Final_Symptom_Code: "${row[12] || 'EMPTY'}"`);
    console.log(`  N - Case_Organization_Final_System_Code:  "${row[13] || 'EMPTY'}"`);
    console.log(`  O - Case_Organization_Final_Symptom_Name: "${row[14] || 'EMPTY'}"`);
    console.log(`  P - Case_Organization_Final_System_Name:  "${row[15] || 'EMPTY'}"`);
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DIAGNOSIS:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Check row 2 (index 1)
  if (rows.length > 1) {
    const row = rows[1];
    console.log('Checking Row 2:');
    console.log(`  Suggested_Symptom_Code (F): "${row[5]}"`);
    console.log(`  Suggested_Symptom_Name (G): "${row[6]}"`);
    console.log(`  Suggested_System_Code (H): "${row[7]}"`);
    console.log(`  Suggested_System_Name (I): "${row[8]}"`);
    console.log('');

    if (!row[6] || row[6].trim() === '') {
      console.log('❌ PROBLEM: Suggested_Symptom_Name is EMPTY');
      console.log('   This means ChatGPT did NOT return symptomName OR parsing failed');
    } else {
      console.log('✅ Suggested_Symptom_Name is populated');
    }

    if (!row[8] || row[8].trim() === '') {
      console.log('❌ PROBLEM: Suggested_System_Name is EMPTY');
      console.log('   This means ChatGPT did NOT return systemName OR parsing failed');
    } else {
      console.log('✅ Suggested_System_Name is populated');
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
}

diagnoseResults().catch(console.error);
