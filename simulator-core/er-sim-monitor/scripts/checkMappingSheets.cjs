const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function checkSheets() {
  console.log('🔍 Checking for mapping sheets...\n');
  
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);
  
  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
  const sheetId = process.env.SHEET_ID;
  
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: sheetId
  });
  
  console.log('All sheets in spreadsheet:');
  spreadsheet.data.sheets.forEach(s => {
    console.log('  - ' + s.properties.title);
  });
  
  console.log('');
  
  const hasMappingSheet = spreadsheet.data.sheets.some(
    s => s.properties.title === 'accronym_symptom_system_mapping'
  );
  
  if (hasMappingSheet) {
    console.log('✅ accronym_symptom_system_mapping exists');
  } else {
    console.log('❌ accronym_symptom_system_mapping NOT FOUND');
    console.log('');
    console.log('This sheet is required for:');
    console.log('  - getAccronymMapping() function');
    console.log('  - Edit Category Mappings UI');
    console.log('  - AI categorization (to get valid symptoms list)');
  }
}

checkSheets().catch(console.error);
