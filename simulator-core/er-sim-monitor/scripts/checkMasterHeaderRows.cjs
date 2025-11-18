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

async function checkHeaderRows() {
  const auth = getOAuth2Client();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('🔍 Checking Master Scenario Convert header rows...\n');

  // Read rows 1, 2, and 3
  const response = await sheets.spreadsheets.values.get({
    spreadshetId: SPREADSHEET_ID,
    range: "'Master Scenario Convert'!A1:S3"
  });

  const rows = response.data.values;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('ROW 1:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  if (rows[0]) {
    rows[0].forEach((cell, i) => {
      const col = String.fromCharCode(65 + i);
      console.log(`  ${col}: ${cell || 'EMPTY'}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('ROW 2:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  if (rows[1]) {
    rows[1].forEach((cell, i) => {
      const col = String.fromCharCode(65 + i);
      console.log(`  ${col}: ${cell || 'EMPTY'}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('ROW 3 (First data row):');
  console.log('═══════════════════════════════════════════════════════════════\n');
  if (rows[2]) {
    rows[2].forEach((cell, i) => {
      const col = String.fromCharCode(65 + i);
      console.log(`  ${col}: ${cell || 'EMPTY'}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('ANALYSIS:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (rows[0] && rows[0][0] && rows[0][0].includes('Case')) {
    console.log('✅ Row 1 appears to contain headers');
  }

  if (rows[1] && rows[1][0] && rows[1][0].includes('Case')) {
    console.log('✅ Row 2 appears to contain headers');
  }

  if (rows[2] && rows[2][0] && !rows[2][0].includes('Case')) {
    console.log('✅ Row 3 appears to contain data (Case ID like GAST0001)');
  }
}

checkHeaderRows().catch(console.error);
