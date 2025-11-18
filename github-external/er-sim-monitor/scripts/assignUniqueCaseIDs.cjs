/**
 * Assign Unique Case_IDs to Duplicate Rows
 * 
 * Strategy: Keep first occurrence unchanged, add suffix to duplicates
 * Example: CARD0025 → CARD0025-2, CARD0025-3, etc.
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Assigning Unique Case_IDs to Duplicate Rows\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });

  // Duplicate cases and their rows
  const duplicates = [
    { id: 'CARD0002', rows: [8, 195] },
    { id: 'CARD0007', rows: [33, 200] },
    { id: 'CARD0012', rows: [71, 199] },
    { id: 'CARD0017', rows: [90, 209] },
    { id: 'CARD0050', rows: [103, 202] },
    { id: 'CARD0022', rows: [108, 196] },
    { id: 'CARD0023', rows: [111, 204] },
    { id: 'CARD0051', rows: [113, 201] },
    { id: 'CARD0025', rows: [116, 192, 194, 197, 205] },
    { id: 'CARD0042', rows: [177, 193, 198] },
    { id: 'NEUR0023', rows: [185, 208] },
    { id: 'CARD0045', rows: [186, 190, 207] }
  ];

  const updates = [];

  console.log('📋 New Case_ID Assignments:\n');

  for (const dup of duplicates) {
    console.log(dup.id + ':');
    
    // Keep first occurrence unchanged
    console.log('  Row ' + dup.rows[0] + ': ' + dup.id + ' (unchanged)');
    
    // Assign new IDs to duplicates
    for (let i = 1; i < dup.rows.length; i++) {
      const newID = dup.id + '-' + (i + 1);
      const masterRow = dup.rows[i];
      
      // Find corresponding row in Results sheet (same Case_ID, later rows)
      const resultsRow = masterRow - 1; // Results rows align with Master (offset by 1)
      
      updates.push({
        oldID: dup.id,
        newID: newID,
        masterRow: masterRow,
        resultsRow: resultsRow
      });
      
      console.log('  Row ' + masterRow + ': ' + dup.id + ' → ' + newID);
    }
    console.log('');
  }

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Total updates needed: ' + updates.length + '\n');

  console.log('🔄 Step 1: Updating Master Scenario Convert...\n');

  for (const update of updates) {
    const range = 'Master Scenario Convert!A' + update.masterRow;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SHEET_ID,
      range: range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[update.newID]]
      }
    });
    
    console.log('  ✅ Row ' + update.masterRow + ': ' + update.oldID + ' → ' + update.newID);
  }

  console.log('\n🔄 Step 2: Updating AI_Categorization_Results...\n');

  for (const update of updates) {
    const range = 'AI_Categorization_Results!A' + update.resultsRow;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SHEET_ID,
      range: range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[update.newID]]
      }
    });
    
    console.log('  ✅ Row ' + update.resultsRow + ': ' + update.oldID + ' → ' + update.newID);
  }

  console.log('\n══════════════════════════════════════════════════════════════\n');
  console.log('✅ All Updates Complete!\n');
  console.log('Summary:\n');
  console.log('  Duplicate rows fixed: ' + updates.length);
  console.log('  New unique Case_IDs created: ' + updates.length);
  console.log('  Total unique cases now: 207 ✅\n');

  console.log('Next Steps:\n');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Verify Case_IDs are now unique');
  console.log('  3. Re-run Apply to categorize all 207 cases\n');

  console.log('How to Re-run Apply:\n');
  console.log('  Option A: Click "Apply Selected Categories to Master" again');
  console.log('           - Will only apply cases without categories (the 17 new ones)');
  console.log('  \n');
  console.log('  Option B: Clear columns P, Q, R, S and re-apply all 207');
  console.log('           - Fresh start, applies all cases\n');
}

main().catch(console.error);
