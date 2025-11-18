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

async function readMasterHeaders() {
  const auth = getOAuth2Client();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('🔍 Reading Master sheet headers...\n');

  // Get all sheets to find the one with GID 1564998840
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID
  });

  const masterSheet = metadata.data.sheets.find(s => s.properties.sheetId === 1564998840);
  if (!masterSheet) {
    console.log('❌ Could not find sheet with GID 1564998840');
    return;
  }

  const sheetTitle = masterSheet.properties.title;
  console.log('✅ Found Master sheet: ' + sheetTitle + '\n');

  // Read headers and first 3 data rows
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetTitle + '!A1:S4'  // Headers + 3 data rows, columns A-S
  });

  const rows = response.data.values;
  const headers = rows[0];

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('MASTER SHEET STRUCTURE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('Sheet name:', sheetTitle);
  console.log('Total columns:', headers.length);
  console.log('');
  console.log('HEADERS:');
  headers.forEach((h, i) => {
    const col = String.fromCharCode(65 + i);
    console.log(`  ${col} (idx ${i}): ${h}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SAMPLE DATA (Row 3)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (rows[2]) {
    console.log('Key columns we need to extract:');
    console.log(`  A (idx 0) - Case ID: "${rows[2][0] || 'EMPTY'}"`);
    console.log(`  B (idx 1) - Column B: "${rows[2][1] || 'EMPTY'}"`);
    console.log(`  C (idx 2) - Column C: "${rows[2][2] || 'EMPTY'}"`);
    console.log(`  I (idx 8) - Legacy ID: "${rows[2][8] || 'EMPTY'}"`);
    console.log('');
    console.log('Target columns for categorization (P, Q, R, S):');
    console.log(`  P (idx 15) - ${headers[15]}: "${rows[2][15] || 'EMPTY'}"`);
    console.log(`  Q (idx 16) - ${headers[16]}: "${rows[2][16] || 'EMPTY'}"`);
    console.log(`  R (idx 17) - ${headers[17]}: "${rows[2][17] || 'EMPTY'}"`);
    console.log(`  S (idx 18) - ${headers[18]}: "${rows[2][18] || 'EMPTY'}"`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
}

readMasterHeaders().catch(console.error);
