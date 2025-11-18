const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';
const MASTER_SHEET_GID = 1564998840;

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

async function updateMasterHeaders() {
  const auth = getOAuth2Client();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('📝 Updating Master Scenario Convert headers for consistency...\n');

  // First, read current headers
  const currentResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "'Master Scenario Convert'!A2:S2"
  });

  const currentHeaders = currentResponse.data.values[0];

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('CURRENT HEADERS:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  currentHeaders.forEach((header, i) => {
    const col = String.fromCharCode(65 + i);
    console.log(`  ${col}: ${header}`);
  });

  // Define new headers with Case_Organization_ prefix on ALL columns for consistency
  const newHeaders = [
    'Case_Organization_Case_ID',                    // A
    'Case_Organization_Spark_Title',                // B
    'Case_Organization_Reveal_Title',               // C
    'Case_Organization_Case_Series_Name',           // D
    'Case_Organization_Case_Series_Order',          // E
    'Case_Organization_Pathway_or_Course_Name',     // F
    'Case_Organization_Difficulty_Level',           // G
    'Case_Organization_Original_Title',             // H
    'Case_Organization_Legacy_Case_ID',             // I
    'Case_Organization_Pre_Sim_Overview',           // J
    'Case_Organization_Post_Sim_Overview',          // K
    'Case_Organization_Medical_Category',           // L
    'Case_Organization_Is_Foundational',            // M
    'Case_Organization_Pathway_ID',                 // N
    'Case_Organization_Pathway_Name',               // O
    'Case_Organization_Category_Symptom_Code',      // P
    'Case_Organization_Category_System_Code',       // Q
    'Case_Organization_Category_Symptom',           // R
    'Case_Organization_Category_System'             // S
  ];

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('NEW HEADERS (with Case_Organization_ prefix):');
  console.log('═══════════════════════════════════════════════════════════════\n');
  newHeaders.forEach((header, i) => {
    const col = String.fromCharCode(65 + i);
    const changed = currentHeaders[i] !== header ? ' ← CHANGED' : '';
    console.log(`  ${col}: ${header}${changed}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('CHANGES SUMMARY:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('  A: Case_ID → Case_Organization_Case_ID');
  console.log('  B: Spark_Title → Case_Organization_Spark_Title');
  console.log('  C: Reveal_Title → Case_Organization_Reveal_Title');
  console.log('  I: Legacy_Case_ID → Case_Organization_Legacy_Case_ID');
  console.log('  P-S: Already have correct Case_Organization_Category_* format');
  console.log('');

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: "'Master Scenario Convert'!A2:S2",
      valueInputOption: 'RAW',
      requestBody: {
        values: [newHeaders]
      }
    });

    console.log('✅ Headers updated successfully!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('NEXT STEPS:');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('1. Update the code to use the new header names');
    console.log('2. Deploy updated code to Apps Script');
    console.log('3. Test the categorization tool');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateMasterHeaders();
