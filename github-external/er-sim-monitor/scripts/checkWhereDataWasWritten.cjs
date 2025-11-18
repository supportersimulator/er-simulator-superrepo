/**
 * Check Entire Google Sheet for Recent Data Writes
 *
 * This script searches ALL tabs for the categories that should have been written
 * (ACLS, PGEN, CP) to see if they're being written to the wrong location.
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Checking entire Google Sheet for data writes\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
  const spreadsheetId = process.env.SHEET_ID;

  // Get all sheets in the spreadsheet
  console.log('📋 Getting list of all tabs...\n');

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: spreadsheetId
  });

  const allSheets = spreadsheet.data.sheets.map(s => s.properties.title);
  console.log('Found ' + allSheets.length + ' tabs:');
  allSheets.forEach(name => console.log('  - ' + name));
  console.log('');

  // Known case IDs from the logs
  const knownCaseIDs = ['CARD0005', 'PEDNE26', 'CARD0046', 'CARD0033'];
  const knownCategories = ['ACLS', 'PGEN', 'CP'];

  console.log('🔎 Searching for these Case IDs: ' + knownCaseIDs.join(', '));
  console.log('🔎 Searching for these categories: ' + knownCategories.join(', '));
  console.log('');

  // Search each sheet
  for (const sheetName of allSheets) {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📄 Checking: ' + sheetName);
      console.log('');

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: sheetName + '!A1:Z1000'  // Check first 1000 rows
      });

      const data = response.data.values || [];

      if (data.length === 0) {
        console.log('   (Empty sheet)');
        console.log('');
        continue;
      }

      // Search for known case IDs
      const foundCases = [];
      const foundCategories = [];

      data.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const cellStr = String(cell).toUpperCase();

          // Check for case IDs
          knownCaseIDs.forEach(caseID => {
            if (cellStr.includes(caseID)) {
              foundCases.push({
                caseID: caseID,
                row: rowIndex + 1,
                col: String.fromCharCode(65 + colIndex),
                value: cell
              });
            }
          });

          // Check for categories
          knownCategories.forEach(cat => {
            if (cellStr === cat) {
              foundCategories.push({
                category: cat,
                row: rowIndex + 1,
                col: String.fromCharCode(65 + colIndex),
                value: cell,
                context: row.slice(Math.max(0, colIndex - 2), colIndex + 3).join(' | ')
              });
            }
          });
        });
      });

      // Report findings
      if (foundCases.length > 0) {
        console.log('   ✅ Found Case IDs:');
        foundCases.forEach(f => {
          console.log('      ' + f.caseID + ' at ' + f.col + f.row + ': "' + f.value + '"');
        });
        console.log('');
      }

      if (foundCategories.length > 0) {
        console.log('   ✅ Found Categories:');
        foundCategories.forEach(f => {
          console.log('      ' + f.category + ' at ' + f.col + f.row);
          console.log('         Context: ' + f.context);
        });
        console.log('');
      }

      if (foundCases.length === 0 && foundCategories.length === 0) {
        console.log('   (No matches found)');
        console.log('');
      }

    } catch (err) {
      console.log('   ❌ Error reading sheet: ' + err.message);
      console.log('');
    }
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('💡 Next Steps:');
  console.log('');
  console.log('If we found the data:');
  console.log('  → Check which sheet and rows contain ACLS, PGEN, CP');
  console.log('  → Compare to expected location (AI_Categorization_Results rows 27+)');
  console.log('  → This will reveal if data is being written to wrong tab/rows');
  console.log('');
  console.log('If we did NOT find the data anywhere:');
  console.log('  → Data is not being written to the sheet at all');
  console.log('  → Need to add detailed logging to write-back loop');
  console.log('  → Check if validation (lines 853-856) is skipping all rows');
  console.log('');
}

main().catch(console.error);
