/**
 * Find Category Columns in Master Scenario Convert
 *
 * Search all columns to find where Category_Symptom, Category_System, etc. are located
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Searching for Category columns in Master Scenario Convert\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
  const spreadsheetId = process.env.SHEET_ID;

  // Read ALL headers from Master Scenario Convert (up to column ZZ)
  console.log('📋 Reading all headers from Master Scenario Convert...\n');

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: 'Master Scenario Convert!1:1'
  });

  const headers = response.data.values[0];

  console.log('Found ' + headers.length + ' total columns\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  // Search for category-related columns
  const categoryColumns = {};
  const targetNames = [
    'Category_Symptom',
    'Category_System',
    'Category_Symptom_Name',
    'Category_System_Name'
  ];

  headers.forEach((header, index) => {
    if (targetNames.some(target => header.includes('Category'))) {
      const columnLetter = getColumnLetter(index);
      categoryColumns[header] = {
        index: index,
        letter: columnLetter,
        sheetIndex: index + 1  // Sheet indices are 1-based
      };
    }
  });

  console.log('🎯 Found Category Columns:\n');

  if (Object.keys(categoryColumns).length === 0) {
    console.log('❌ No Category columns found!\n');
    console.log('The columns may not exist yet. Let me show columns 1-30:\n');

    for (let i = 0; i < Math.min(30, headers.length); i++) {
      const letter = getColumnLetter(i);
      console.log('   ' + letter + ' (index ' + i + ', sheet ' + (i+1) + '): ' + headers[i]);
    }
  } else {
    Object.entries(categoryColumns).forEach(([name, info]) => {
      console.log('✅ ' + name);
      console.log('   Column letter: ' + info.letter);
      console.log('   Array index: ' + info.index);
      console.log('   Sheet column number: ' + info.sheetIndex);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📝 Correct Code for Apply Function:\n');

    const symptom = categoryColumns['Category_Symptom'];
    const system = categoryColumns['Category_System'];
    const symptomName = categoryColumns['Category_Symptom_Name'];
    const systemName = categoryColumns['Category_System_Name'];

    if (symptom && system && symptomName && systemName) {
      console.log('masterSheet.getRange(rowNum, ' + symptom.sheetIndex + ').setValue(finalSymptom);');
      console.log('masterSheet.getRange(rowNum, ' + system.sheetIndex + ').setValue(finalSystem);');
      console.log('masterSheet.getRange(rowNum, ' + symptomName.sheetIndex + ').setValue(symptomName);');
      console.log('masterSheet.getRange(rowNum, ' + systemName.sheetIndex + ').setValue(systemName);');
      console.log('');
      console.log('OR using setValues (more efficient):');
      console.log('');
      console.log('masterSheet.getRange(rowNum, ' + symptom.sheetIndex + ', 1, 4).setValues([[');
      console.log('  finalSymptom,  // Column ' + symptom.letter);
      console.log('  symptomName,   // Column ' + symptomName.letter);
      console.log('  finalSystem,   // Column ' + system.letter);
      console.log('  systemName     // Column ' + systemName.letter);
      console.log(']]);');
    }
  }

  console.log('');
}

function getColumnLetter(index) {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

main().catch(console.error);
