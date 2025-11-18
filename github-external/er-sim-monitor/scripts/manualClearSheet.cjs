const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function manualClear() {
  console.log('🧹 Manually clearing AI_Categorization_Results sheet...\n');
  
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);
  
  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
  const sheetId = process.env.SHEET_ID;
  
  // Get sheet metadata
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: sheetId
  });
  
  const resultsSheet = spreadsheet.data.sheets.find(
    s => s.properties.title === 'AI_Categorization_Results'
  );
  
  if (!resultsSheet) {
    console.log('Sheet does not exist - nothing to clear');
    return;
  }
  
  const gid = resultsSheet.properties.sheetId;
  
  console.log('Found sheet with ID: ' + gid);
  console.log('Clearing all data...');
  
  // Clear using batch update
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      requests: [
        {
          updateCells: {
            range: {
              sheetId: gid
            },
            fields: 'userEnteredValue'
          }
        }
      ]
    }
  });
  
  console.log('✅ Sheet cleared successfully');
  console.log('');
  console.log('Now try running AI Categorization again from the UI');
}

manualClear().catch(console.error);
