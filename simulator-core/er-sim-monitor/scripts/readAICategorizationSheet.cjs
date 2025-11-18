#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SPREADSHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';
const SHEET_NAME = 'AI_Categorization_Results';

function getAccessToken() {
  const clasprcPath = path.join(process.env.HOME, '.clasprc.json');
  if (!fs.existsSync(clasprcPath)) {
    throw new Error('No .clasprc.json found');
  }
  const clasprc = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));
  return clasprc.tokens?.default?.access_token || clasprc.token?.access_token;
}

async function readSheet() {
  try {
    const accessToken = getAccessToken();
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    console.log('📊 Reading AI_Categorization_Results sheet...\n');

    // Read first 10 rows, all columns
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:O10`
    });

    const rows = response.data.values || [];

    if (rows.length === 0) {
      console.log('❌ No data found');
      return;
    }

    // Show headers
    console.log('📋 HEADERS (Row 1):');
    const headers = rows[0];
    headers.forEach((header, idx) => {
      const col = String.fromCharCode(65 + idx);
      console.log(`   ${col}: ${header}`);
    });

    console.log('\n📊 FIRST 3 DATA ROWS:\n');

    for (let i = 1; i <= Math.min(3, rows.length - 1); i++) {
      const row = rows[i];
      console.log(`Row ${i + 1}:`);
      console.log(`  A (Case_ID): ${row[0] || '(empty)'}`);
      console.log(`  B (Legacy_Case_ID): ${row[1] || '(empty)'}`);
      console.log(`  C (Row_Index): ${row[2] || '(empty)'}`);
      console.log(`  D (Current_Symptom): ${row[3] || '(empty)'}`);
      console.log(`  E (Current_System): ${row[4] || '(empty)'}`);
      console.log(`  F (Suggested_Symptom): ${row[5] || '(empty)'}`);
      console.log(`  G (Suggested_Symptom_Name): ${row[6] || '(empty)'}`);
      console.log(`  H (Suggested_System): ${row[7] || '(empty)'}`);
      console.log(`  M (Final_Symptom): ${row[12] || '(empty)'}`);
      console.log(`  N (Final_System): ${row[13] || '(empty)'}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 403) {
      console.error('\n💡 Sheets API may not be enabled for this OAuth token');
      console.error('   The token was created for Apps Script API, not Sheets API');
    }
  }
}

readSheet();
