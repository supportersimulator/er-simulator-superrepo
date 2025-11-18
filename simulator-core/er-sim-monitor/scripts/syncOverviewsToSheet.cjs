#!/usr/bin/env node

/**
 * Sync Case Overviews to Google Sheet
 *
 * Reads AI_CASE_OVERVIEWS.json and populates Pre_Sim_Overview and Post_Sim_Overview
 * columns in the Google Sheet (columns J & K).
 *
 * Matches cases by Case_ID and stringifies JSON for storage.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const OVERVIEWS_PATH = path.join(__dirname, '..', 'AI_CASE_OVERVIEWS.json');

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

async function syncOverviewsToSheet() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  📊 SYNC CASE OVERVIEWS TO GOOGLE SHEET');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  try {
    // Step 1: Load AI-generated overviews
    console.log('1️⃣ Loading AI-generated overviews...');
    if (!fs.existsSync(OVERVIEWS_PATH)) {
      console.error('❌ ERROR: AI_CASE_OVERVIEWS.json not found!');
      console.error('');
      console.error('Please run the overview generator first:');
      console.error('  node scripts/generateOverviewsStandalone.cjs');
      console.error('');
      process.exit(1);
    }

    const overviews = JSON.parse(fs.readFileSync(OVERVIEWS_PATH, 'utf8'));
    console.log(`   ✅ Loaded ${overviews.length} case overviews`);
    console.log('');

    // Build case ID → overview lookup
    const overviewMap = new Map();
    overviews.forEach(item => {
      overviewMap.set(item.caseId, {
        preSimOverview: item.preSimOverview,
        postSimOverview: item.postSimOverview
      });
    });

    // Step 2: Connect to Google Sheets
    console.log('2️⃣ Connecting to Google Sheets...');
    const auth = createGoogleClient();
    const sheets = google.sheets({ version: 'v4', auth });
    console.log('   ✅ Connected');
    console.log('');

    // Step 3: Read current sheet data
    console.log('3️⃣ Reading sheet data...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Master Scenario Convert!A1:ZZ250'
    });

    const rows = response.data.values || [];
    const headerRow1 = rows[0] || [];
    const headerRow2 = rows[1] || [];
    const dataRows = rows.slice(2);

    console.log(`   Row 1 headers: ${headerRow1.length} columns`);
    console.log(`   Row 2 headers: ${headerRow2.length} columns`);
    console.log(`   Data rows: ${dataRows.length} cases`);
    console.log('');

    // Step 4: Find column indices
    console.log('4️⃣ Locating overview columns...');

    // Find Case_ID column (should be in Case_Organization category)
    const caseIdColIndex = headerRow2.findIndex(h =>
      h === 'Case_Organization_Case_ID' || h === 'Case_Organization:Case_ID'
    );

    // Find overview columns
    const preSimColIndex = headerRow1.findIndex(h => h === 'Pre_Sim_Overview');
    const postSimColIndex = headerRow1.findIndex(h => h === 'Post_Sim_Overview');

    if (caseIdColIndex === -1) {
      console.error('❌ ERROR: Could not find Case_ID column!');
      console.error('   Searched for: Case_Organization_Case_ID or Case_Organization:Case_ID');
      process.exit(1);
    }

    if (preSimColIndex === -1 || postSimColIndex === -1) {
      console.error('❌ ERROR: Overview columns not found!');
      console.error('');
      console.error('Please run the column creation script first:');
      console.error('  node scripts/addOverviewColumnsToSheet.cjs');
      console.error('');
      process.exit(1);
    }

    console.log(`   ✅ Case_ID column: ${getColumnLetter(caseIdColIndex)} (index ${caseIdColIndex})`);
    console.log(`   ✅ Pre_Sim_Overview column: ${getColumnLetter(preSimColIndex)} (index ${preSimColIndex})`);
    console.log(`   ✅ Post_Sim_Overview column: ${getColumnLetter(postSimColIndex)} (index ${postSimColIndex})`);
    console.log('');

    // Step 5: Prepare updates
    console.log('5️⃣ Preparing overview updates...');

    const updates = [];
    let matchedCount = 0;
    let unmatchedCount = 0;
    const unmatchedCases = [];

    dataRows.forEach((row, idx) => {
      const caseId = row[caseIdColIndex] || '';

      if (!caseId) {
        return; // Skip empty rows
      }

      if (overviewMap.has(caseId)) {
        const { preSimOverview, postSimOverview } = overviewMap.get(caseId);

        // Stringify JSON for storage
        row[preSimColIndex] = JSON.stringify(preSimOverview);
        row[postSimColIndex] = JSON.stringify(postSimOverview);

        matchedCount++;
      } else {
        unmatchedCount++;
        unmatchedCases.push(caseId);
      }
    });

    console.log(`   📊 Statistics:`);
    console.log(`      Matched: ${matchedCount} cases`);
    console.log(`      Unmatched: ${unmatchedCount} cases`);

    if (unmatchedCases.length > 0 && unmatchedCases.length <= 10) {
      console.log('');
      console.log('   ⚠️  Unmatched Case IDs:');
      unmatchedCases.forEach(id => console.log(`      - ${id}`));
    }
    console.log('');

    // Step 6: Write updates back to sheet
    console.log('6️⃣ Writing overviews to Google Sheet...');

    const updateRange = `Master Scenario Convert!A3:${getColumnLetter(Math.max(headerRow1.length, headerRow2.length) - 1)}${dataRows.length + 2}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: updateRange,
      valueInputOption: 'RAW',
      resource: {
        values: dataRows
      }
    });

    console.log('   ✅ Successfully wrote overviews to sheet');
    console.log('');

    // Success summary
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ SYNC COMPLETE!');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log(`📊 Summary:`);
    console.log(`   • ${matchedCount} cases updated with AI-generated overviews`);
    console.log(`   • Pre-Sim Overview: Column ${getColumnLetter(preSimColIndex)}`);
    console.log(`   • Post-Sim Overview: Column ${getColumnLetter(postSimColIndex)}`);
    console.log('');

    if (unmatchedCount > 0) {
      console.log(`⚠️  ${unmatchedCount} cases in sheet have no matching overviews`);
      console.log('   (These cases may not have been in the AI research data)');
      console.log('');
    }

    console.log('💡 Next Steps:');
    console.log('   1. Open your Google Sheet to verify the overviews');
    console.log('   2. Spot-check a few cases for quality');
    console.log('   3. Overviews are stored as JSON strings in columns J & K');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR syncing overviews:');
    console.error(error.message);
    if (error.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  syncOverviewsToSheet();
}

module.exports = { syncOverviewsToSheet };
