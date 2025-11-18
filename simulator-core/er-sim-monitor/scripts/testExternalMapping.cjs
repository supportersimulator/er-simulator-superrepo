const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function test() {
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);
  
  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
  const externalSheetId = '1PvZMOb1fvN20iKztTdeqm7wtInfbad9Rbr_kTbzfBy8';
  
  try {
    console.log('Testing access to external mapping sheet...\n');
    
    const data = await sheets.spreadsheets.values.get({
      spreadsheetId: externalSheetId,
      range: 'Category Mapping!A1:G50'
    });
    
    if (data.data.values && data.data.values.length > 0) {
      console.log('✅ External sheet is accessible!\n');
      console.log('Headers:', data.data.values[0].join(' | '));
      console.log('Total rows:', data.data.values.length - 1);
      console.log('');
      console.log('Sample mappings:');
      for (let i = 1; i < Math.min(6, data.data.values.length); i++) {
        const row = data.data.values[i];
        console.log('  ' + row[0] + ': ' + row[1]);
      }
    }
  } catch (error) {
    console.log('❌ Cannot access external sheet');
    console.log('Error:', error.message);
    console.log('');
    console.log('Solution: Use local sheet instead');
  }
}

test().catch(console.error);
