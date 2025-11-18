const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function checkSheet() {
  console.log('📊 Checking AI_Categorization_Results sheet status...\n');
  
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);
  
  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
  const sheetId = process.env.SHEET_ID;
  
  try {
    // Get all sheet metadata
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: sheetId
    });
    
    // Find AI_Categorization_Results sheet
    const resultsSheet = spreadsheet.data.sheets.find(
      s => s.properties.title === 'AI_Categorization_Results'
    );
    
    if (!resultsSheet) {
      console.log('✅ Sheet does NOT exist - clear is working (sheet was removed)');
      return;
    }
    
    console.log('📄 Sheet exists with these properties:');
    console.log('   Sheet ID:', resultsSheet.properties.sheetId);
    console.log('   Grid rows:', resultsSheet.properties.gridProperties.rowCount);
    console.log('   Grid cols:', resultsSheet.properties.gridProperties.columnCount);
    console.log('');
    
    // Check if it has data
    const data = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'AI_Categorization_Results!A1:Z10'
    });
    
    if (!data.data.values || data.data.values.length === 0) {
      console.log('✅ Sheet is EMPTY - clear is working!');
    } else {
      console.log('❌ Sheet has ' + data.data.values.length + ' rows of data');
      console.log('');
      console.log('First 5 rows:');
      data.data.values.slice(0, 5).forEach((row, i) => {
        console.log('Row ' + (i + 1) + ':', row.slice(0, 3).join(' | '));
      });
      console.log('');
      console.log('🔍 Analysis: Clear function exists in code but sheet still has data');
      console.log('Possible reasons:');
      console.log('  1. User did not actually run the function yet');
      console.log('  2. Function errored before reaching clear code');
      console.log('  3. Clear ran but new data was added afterward');
    }
  } catch (error) {
    console.log('Error checking sheet:', error.message);
  }
}

checkSheet().catch(console.error);
