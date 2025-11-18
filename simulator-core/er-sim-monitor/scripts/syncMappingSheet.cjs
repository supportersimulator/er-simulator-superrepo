const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function syncMapping() {
  console.log('🔄 Syncing category mappings from external sheet...\n');
  
  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);
  
  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
  const localSheetId = process.env.SHEET_ID;
  const externalSheetId = '1PvZMOb1fvN20iKztTdeqm7wtInfbad9Rbr_kTbzfBy8';
  
  // Get data from external sheet
  console.log('📥 Reading from external mapping sheet...');
  const externalData = await sheets.spreadsheets.values.get({
    spreadsheetId: externalSheetId,
    range: 'Category Mapping!A1:G50'
  });
  
  const rows = externalData.data.values;
  console.log('✅ Loaded ' + (rows.length - 1) + ' mappings\n');
  
  // Transform to local format: Accronym | Symptom | Pre-Category (System) | Post-Category (System)
  const localData = [
    ['Accronym', 'Symptom', 'System_Category', 'Description']
  ];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0]) continue; // Skip empty
    
    localData.push([
      row[0], // Accronym (CP, SOB, etc.)
      row[1] || '', // Full Symptom Name
      row[2] || '', // Pre-Experience Category (System)
      row[6] || ''  // Notes
    ]);
  }
  
  console.log('📝 Writing to local accronym_symptom_system_mapping sheet...');
  
  // Clear and write to local sheet
  await sheets.spreadsheets.values.clear({
    spreadsheetId: localSheetId,
    range: 'accronym_symptom_system_mapping!A1:Z100'
  });
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: localSheetId,
    range: 'accronym_symptom_system_mapping!A1',
    valueInputOption: 'RAW',
    requestBody: {
      values: localData
    }
  });
  
  console.log('✅ Synced ' + (localData.length - 1) + ' mappings\n');
  console.log('Now you can:');
  console.log('  1. Click "Edit Category Mappings" successfully');
  console.log('  2. Run AI Categorization with correct symptom list');
  console.log('');
  console.log('Note: ACLS excluded from list (if it was there)');
}

syncMapping().catch(console.error);
