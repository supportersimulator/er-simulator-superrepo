#!/usr/bin/env node

/**
 * Add Overview Columns to Google Sheet
 *
 * Adds two new columns to Case_Organization category:
 * - Pre_Sim_Overview (JSON): Sells case without spoiling mystery
 * - Post_Sim_Overview (JSON): Reinforces learning with clinical pearls
 *
 * Two-tier header structure:
 * - Row 1: Pre_Sim_Overview | Post_Sim_Overview
 * - Row 2: Case_Organization_Pre_Sim_Overview | Case_Organization_Post_Sim_Overview
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

function createGoogleClient() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

function getColumnLetter(idx) {
  let letter = '';
  while (idx >= 0) {
    letter = String.fromCharCode(65 + (idx % 26)) + letter;
    idx = Math.floor(idx / 26) - 1;
  }
  return letter;
}

async function addOverviewColumns() {
  console.log('📝 Adding Overview Columns to Case_Organization Category');
  console.log('');

  const auth = createGoogleClient();
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Step 1: Get sheet metadata to find correct sheet ID
    console.log('1️⃣ Finding Master Scenario Convert sheet...');
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID
    });

    const masterSheet = sheetMetadata.data.sheets.find(s =>
      s.properties.title === 'Master Scenario Convert'
    );

    if (!masterSheet) {
      console.error('❌ Could not find Master Scenario Convert sheet!');
      process.exit(1);
    }

    const masterSheetId = masterSheet.properties.sheetId;
    console.log('   Found sheet ID: ' + masterSheetId);
    console.log('');

    // Step 2: Get current headers (both rows)
    console.log('2️⃣ Reading current column headers (2 rows)...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Master Scenario Convert!A1:ZZ2'
    });

    const rows = response.data.values || [];
    const row1 = rows[0] || []; // Simple headers
    const row2 = rows[1] || []; // Full qualified names

    console.log('   Row 1 (simple headers): ' + row1.length + ' columns');
    console.log('   Row 2 (qualified names): ' + row2.length + ' columns');
    console.log('');

    // Step 3: Find the last Case_Organization column
    let lastCaseOrgIndex = -1;
    for (let i = 0; i < row2.length; i++) {
      if (row2[i] && row2[i].startsWith('Case_Organization_')) {
        lastCaseOrgIndex = i;
      }
    }

    if (lastCaseOrgIndex === -1) {
      console.error('❌ Could not find Case_Organization category!');
      process.exit(1);
    }

    console.log('3️⃣ Found Case_Organization category:');
    console.log('   Last column: ' + getColumnLetter(lastCaseOrgIndex) + ' (' + row1[lastCaseOrgIndex] + ')');
    console.log('');

    // Step 4: Check if columns already exist
    const hasPreSim = row1.some(h => h === 'Pre_Sim_Overview');
    const hasPostSim = row1.some(h => h === 'Post_Sim_Overview');

    if (hasPreSim && hasPostSim) {
      console.log('✅ Overview columns already exist!');
      const preSimIdx = row1.indexOf('Pre_Sim_Overview');
      const postSimIdx = row1.indexOf('Post_Sim_Overview');
      console.log('   Pre_Sim_Overview: Column ' + getColumnLetter(preSimIdx));
      console.log('   Post_Sim_Overview: Column ' + getColumnLetter(postSimIdx));
      return;
    }

    // Step 5: Insert new columns after last Case_Organization column
    console.log('4️⃣ Inserting overview columns after Case_Organization...');

    // We need to INSERT columns, not just append
    // Position to insert: after lastCaseOrgIndex
    const insertPosition = lastCaseOrgIndex + 1;

    // Insert 2 new columns at this position
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      resource: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId: masterSheetId, // Use actual sheet ID
                dimension: 'COLUMNS',
                startIndex: insertPosition,
                endIndex: insertPosition + 2 // Insert 2 columns
              },
              inheritFromBefore: false
            }
          }
        ]
      }
    });

    console.log('   ✅ Inserted 2 new columns at position ' + insertPosition);
    console.log('');

    // Step 6: Write headers for new columns
    console.log('5️⃣ Writing column headers...');

    const newCol1 = getColumnLetter(insertPosition);
    const newCol2 = getColumnLetter(insertPosition + 1);

    // Update row 1 (simple headers)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Master Scenario Convert!${newCol1}1:${newCol2}1`,
      valueInputOption: 'RAW',
      resource: {
        values: [['Pre_Sim_Overview', 'Post_Sim_Overview']]
      }
    });

    // Update row 2 (qualified names)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Master Scenario Convert!${newCol1}2:${newCol2}2`,
      valueInputOption: 'RAW',
      resource: {
        values: [['Case_Organization_Pre_Sim_Overview', 'Case_Organization_Post_Sim_Overview']]
      }
    });

    console.log('   ✅ Row 1: Pre_Sim_Overview | Post_Sim_Overview');
    console.log('   ✅ Row 2: Case_Organization_Pre_Sim_Overview | Case_Organization_Post_Sim_Overview');
    console.log('');
    console.log('✅ Successfully added overview columns to Case_Organization category!');
    console.log('');
    console.log('📋 Column Structure:');
    console.log('   Pre_Sim_Overview: Column ' + newCol1);
    console.log('   Post_Sim_Overview: Column ' + newCol2);
    console.log('   (Inserted after ' + row1[lastCaseOrgIndex] + ')');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Run: node scripts/aiEnhancedRenaming.cjs');
    console.log('   2. This will generate AI_CASE_OVERVIEWS.json');
    console.log('   3. Then run: node scripts/syncOverviewsToSheet.cjs');
    console.log('   4. This will populate the new columns with AI-generated overviews');
    console.log('');

  } catch (error) {
    console.error('❌ Error adding overview columns:');
    console.error(error.message);
    if (error.response) {
      console.error('   API Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

if (require.main === module) {
  addOverviewColumns();
}

module.exports = { addOverviewColumns };
