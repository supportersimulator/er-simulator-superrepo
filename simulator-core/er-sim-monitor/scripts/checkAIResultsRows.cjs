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

async function checkRows() {
  const auth = getOAuth2Client();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('🔍 Checking AI_Categorization_Results sheet rows...\n');

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'AI_Categorization_Results!A1:P5'
  });

  const rows = response.data.values || [];

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('CURRENT STATE OF AI_CATEGORIZATION_RESULTS:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`Total rows returned: ${rows.length}\n`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    console.log(`ROW ${i + 1}:`);
    if (row && row.length > 0) {
      console.log(`  A: ${row[0] || 'EMPTY'}`);
      console.log(`  B: ${row[1] || 'EMPTY'}`);
      console.log(`  C: ${row[2] || 'EMPTY'}`);
    } else {
      console.log('  COMPLETELY EMPTY');
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('ANALYSIS:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (rows.length === 0) {
    console.log('❌ Sheet is completely empty (no rows at all)');
  } else if (rows.length === 1) {
    console.log('✅ Sheet has only header row (row 1)');
    console.log('   This is CORRECT after clearing');
  } else if (rows.length === 2 && rows[1] && rows[1][0] && rows[1][0].includes('Case')) {
    console.log('⚠️  Sheet has TWO header rows (row 1 and row 2)');
    console.log('   Row 2 might be a duplicate header or leftover');
  } else if (rows.length > 1) {
    console.log(`⚠️  Sheet has ${rows.length} rows`);
    if (rows[1] && rows[1][0]) {
      console.log(`   Row 2 contains: ${rows[1][0]}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
}

checkRows().catch(console.error);
