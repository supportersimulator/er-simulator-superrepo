/**
 * Verify Apply Categorizations Column Mapping
 *
 * This script checks the Master Scenario Convert sheet to verify that the
 * Apply function will write to the correct columns (X, Y, 16, 17).
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Verifying Apply Categorizations Column Mapping\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
  const spreadsheetId = process.env.SHEET_ID;

  // Read the header row from Master Scenario Convert
  console.log('📋 Reading Master Scenario Convert headers...\n');

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: 'Master Scenario Convert!A1:Z1'
  });

  const headers = response.data.values[0];

  // Find column indices (A=0, B=1, C=2, ... X=23, Y=24)
  const columnMapping = {};

  headers.forEach((header, index) => {
    const letter = String.fromCharCode(65 + index); // A=65 in ASCII
    columnMapping[letter] = {
      index: index,
      name: header
    };
  });

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 Current Column Mapping:\n');

  // Check Column X (index 23)
  const colX = columnMapping['X'];
  console.log('Column X (index 23):');
  console.log('   Current header: "' + (colX ? colX.name : 'NOT FOUND') + '"');
  console.log('   Expected: "Category_Symptom"');
  console.log('   Status: ' + (colX && colX.name === 'Category_Symptom' ? '✅ CORRECT' : '❌ MISMATCH'));
  console.log('');

  // Check Column Y (index 24)
  const colY = columnMapping['Y'];
  console.log('Column Y (index 24):');
  console.log('   Current header: "' + (colY ? colY.name : 'NOT FOUND') + '"');
  console.log('   Expected: "Category_System"');
  console.log('   Status: ' + (colY && colY.name === 'Category_System' ? '✅ CORRECT' : '❌ MISMATCH'));
  console.log('');

  // Check Column 16 (index 15, which is P)
  const col16 = columnMapping['P'];
  console.log('Column 16 (P, index 15):');
  console.log('   Current header: "' + (col16 ? col16.name : 'NOT FOUND') + '"');
  console.log('   Expected: "Category_Symptom_Name"');
  console.log('   Status: ' + (col16 && col16.name === 'Category_Symptom_Name' ? '✅ CORRECT' : '❌ MISMATCH'));
  console.log('');

  // Check Column 17 (index 16, which is Q)
  const col17 = columnMapping['Q'];
  console.log('Column 17 (Q, index 16):');
  console.log('   Current header: "' + (col17 ? col17.name : 'NOT FOUND') + '"');
  console.log('   Expected: "Category_System_Name"');
  console.log('   Status: ' + (col17 && col17.name === 'Category_System_Name' ? '✅ CORRECT' : '❌ MISMATCH'));
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  // Read the Apply function from Code.gs to verify it's using correct columns
  console.log('🔧 Checking Apply function in Code.gs...\n');

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  const project = await script.projects.getContent({ scriptId });
  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.log('❌ Code.gs not found');
    return;
  }

  // Extract the applyFinalCategorizationsToMaster function
  const applyMatch = codeFile.source.match(/function applyFinalCategorizationsToMaster[\s\S]*?(?=\n\nfunction|\n\n\/\*\*|$)/);

  if (!applyMatch) {
    console.log('❌ applyFinalCategorizationsToMaster function not found');
    return;
  }

  const applyFunction = applyMatch[0];

  // Check for column references in the function
  const columnReferences = {
    'Column X': applyFunction.includes('24') || applyFunction.includes('getRange(i, 24'),
    'Column Y': applyFunction.includes('25') || applyFunction.includes('getRange(i, 25'),
    'Column 16': applyFunction.includes('16') || applyFunction.includes('getRange(i, 16'),
    'Column 17': applyFunction.includes('17') || applyFunction.includes('getRange(i, 17')
  };

  console.log('Function Code Analysis:');
  Object.entries(columnReferences).forEach(([col, found]) => {
    console.log('   ' + col + ': ' + (found ? '✅ Referenced' : '❌ NOT FOUND'));
  });
  console.log('');

  // Show relevant lines from the function
  const setValuesMatch = applyFunction.match(/setValues\(\[\[[\s\S]*?\]\]\)/);
  if (setValuesMatch) {
    console.log('📝 SetValues code found:');
    console.log('   ' + setValuesMatch[0].replace(/\n/g, '\n   '));
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('💡 Summary:\n');

  // Determine if everything is correct
  const allCorrect =
    colX && colX.name === 'Category_Symptom' &&
    colY && colY.name === 'Category_System' &&
    col16 && col16.name === 'Category_Symptom_Name' &&
    col17 && col17.name === 'Category_System_Name';

  if (allCorrect) {
    console.log('✅ All columns are correctly mapped!');
    console.log('');
    console.log('The Apply function will write to:');
    console.log('   - Category_Symptom (Column X, index 24)');
    console.log('   - Category_System (Column Y, index 25)');
    console.log('   - Category_Symptom_Name (Column P, index 16)');
    console.log('   - Category_System_Name (Column Q, index 17)');
    console.log('');
    console.log('🎯 Safe to proceed with Apply!');
  } else {
    console.log('⚠️  WARNING: Column mapping mismatch detected!');
    console.log('');
    console.log('Please verify the Apply function before running it.');
  }

  console.log('');
}

main().catch(console.error);
