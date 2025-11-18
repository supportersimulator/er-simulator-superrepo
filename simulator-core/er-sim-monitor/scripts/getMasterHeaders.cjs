const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';
const SHEET_GID = '1564998840';

function getOAuth2Client() {
  const clasprcPath = path.join(process.env.HOME, '.clasprc.json');
  const credentials = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));
  const token = credentials.tokens.default;

  const oauth2Client = new google.auth.OAuth2(
    token.client_id,
    token.client_secret
  );

  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_type: token.token_type,
    expiry_date: token.expiry_date
  });

  return oauth2Client;
}

async function getMasterHeaders() {
  try {
    console.log('🔑 Authenticating with Google Sheets API...');
    const auth = getOAuth2Client();
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📥 Fetching Master Scenario Convert headers...\n');

    // Get first 2 rows (headers are usually in row 1 or 2)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Master Scenario Convert!A1:Z2'
    });

    const rows = response.data.values;

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 MASTER SCENARIO CONVERT SHEET HEADERS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!rows || rows.length === 0) {
      console.log('❌ No data found');
      return;
    }

    const colLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    console.log('ROW 1 (Main Headers):');
    console.log('─'.repeat(63));
    rows[0].forEach((header, idx) => {
      console.log(`Column ${colLetters[idx].padEnd(2)}: ${header}`);
    });

    if (rows[1]) {
      console.log('\n\nROW 2 (Sub-headers or data):');
      console.log('─'.repeat(63));
      rows[1].forEach((header, idx) => {
        if (header) {
          console.log(`Column ${colLetters[idx].padEnd(2)}: ${header}`);
        }
      });
    }

    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('🎯 KEY COLUMNS FOR CATEGORIZATION');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('COLUMNS WE NEED FOR CHATGPT PROMPT:');
    console.log('  A: ' + (rows[0][0] || 'N/A'));
    console.log('  B: ' + (rows[0][1] || 'N/A') + ' ⭐ Spark Title');
    console.log('  C: ' + (rows[0][2] || 'N/A') + ' ⭐ Reveal Title');
    console.log('  E: ' + (rows[0][4] || 'N/A'));
    console.log('  F: ' + (rows[0][5] || 'N/A'));
    console.log('  G: ' + (rows[0][6] || 'N/A'));

    console.log('\nCOLUMNS WE READ (Current Values):');
    console.log('  R (idx 17): ' + (rows[0][17] || 'N/A'));
    console.log('  S (idx 18): ' + (rows[0][18] || 'N/A'));

    console.log('\nCOLUMNS WE WRITE (Final Values):');
    console.log('  R (idx 17): ' + (rows[0][17] || 'N/A') + ' ← Will write Final_Symptom here');
    console.log('  S (idx 18): ' + (rows[0][18] || 'N/A') + ' ← Will write Final_System here');

    // Save to file for reference
    const outputPath = path.join(__dirname, '..', 'MASTER_SHEET_HEADERS.json');
    const headerMap = {};
    rows[0].forEach((header, idx) => {
      headerMap[colLetters[idx]] = {
        index: idx,
        header: header,
        row2: rows[1] ? rows[1][idx] : null
      };
    });

    fs.writeFileSync(outputPath, JSON.stringify(headerMap, null, 2));
    console.log('\n\n✅ Headers saved to: ' + outputPath + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

getMasterHeaders();
