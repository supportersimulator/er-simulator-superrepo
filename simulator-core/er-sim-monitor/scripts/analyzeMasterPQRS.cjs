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

async function analyzeMasterColumns() {
  const auth = getOAuth2Client();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('🔍 Analyzing Master sheet columns P, Q, R, S...\n');

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Master Scenario Convert!A2:S5'
  });

  const rows = response.data.values;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('MASTER SHEET CURRENT DATA (Rows 2-5)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  rows.forEach((row, i) => {
    console.log(`Row ${i + 2} - Case: ${row[0]}`);
    console.log(`  P (idx 15): "${row[15] || 'EMPTY'}"`);
    console.log(`  Q (idx 16): "${row[16] || 'EMPTY'}"`);
    console.log(`  R (idx 17): "${row[17] || 'EMPTY'}"`);
    console.log(`  S (idx 18): "${row[18] || 'EMPTY'}"`);
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Check pattern
  const row0 = rows[0];
  const pValue = row0[15];
  const qValue = row0[16];
  const rValue = row0[17];
  const sValue = row0[18];

  console.log('Checking pattern in Row 2:');
  console.log(`  P="${pValue}" vs R="${rValue}" → ${pValue === rValue ? 'SAME (duplicate)' : 'DIFFERENT'}`);
  console.log(`  Q="${qValue}" vs S="${sValue}" → ${qValue === sValue ? 'SAME (duplicate)' : 'DIFFERENT'}`);
  console.log('');

  if (pValue === rValue && qValue === sValue) {
    console.log('⚠️  CURRENT STRUCTURE (OLD):');
    console.log('  P: Symptom Code (e.g., "PSY")');
    console.log('  Q: System Name (e.g., "Psychiatric")');
    console.log('  R: Symptom Code (duplicate of P)');
    console.log('  S: System Name (duplicate of Q)');
    console.log('');
    console.log('❌ PROBLEM: Missing systemCode and symptomName!');
  } else {
    console.log('✅ APPEARS TO BE NEW STRUCTURE:');
    console.log('  P: Symptom Code');
    console.log('  Q: System Code');
    console.log('  R: Symptom Name');
    console.log('  S: System Name');
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('WHAT THE CODE WILL WRITE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('applyUltimateCategorizationToMaster() writes:');
  console.log('  P (column 16): finalSymptomCode   (e.g., "CP")');
  console.log('  Q (column 17): finalSystemCode    (e.g., "CARD")');
  console.log('  R (column 18): finalSymptomName   (e.g., "Chest Pain")');
  console.log('  S (column 19): finalSystemName    (e.g., "Cardiovascular")');
  console.log('');
  console.log('This is the CORRECT structure! ✅');

  console.log('\n═══════════════════════════════════════════════════════════════');
}

analyzeMasterColumns();
