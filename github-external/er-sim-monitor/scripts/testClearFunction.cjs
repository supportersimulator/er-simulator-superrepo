const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function testClear() {
  console.log('🧪 Testing clear functionality...\n');
  
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);
  
  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
  const sheetId = process.env.SHEET_ID;
  
  // Check current state
  console.log('BEFORE clear:');
  const dataBefore = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'AI_Categorization_Results!A1:C10'
  });
  
  if (dataBefore.data.values && dataBefore.data.values.length > 0) {
    console.log('  Sheet has ' + dataBefore.data.values.length + ' rows');
  } else {
    console.log('  Sheet is empty');
  }
  console.log('');
  
  // Get sheet ID
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: sheetId
  });
  
  const resultsSheet = spreadsheet.data.sheets.find(
    s => s.properties.title === 'AI_Categorization_Results'
  );
  
  if (!resultsSheet) {
    console.log('❌ Sheet not found');
    return;
  }
  
  const gid = resultsSheet.properties.sheetId;
  
  // Clear the sheet using batch update
  console.log('Clearing sheet...');
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
  
  console.log('✅ Clear command sent');
  console.log('');
  
  // Wait a moment for it to take effect
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check after clearing
  console.log('AFTER clear:');
  const dataAfter = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'AI_Categorization_Results!A1:C10'
  });
  
  if (dataAfter.data.values && dataAfter.data.values.length > 0) {
    console.log('  ❌ Sheet STILL has ' + dataAfter.data.values.length + ' rows');
    console.log('  Clear did not work properly');
  } else {
    console.log('  ✅ Sheet is now empty');
    console.log('  Clear worked!');
  }
}

testClear().catch(console.error);
