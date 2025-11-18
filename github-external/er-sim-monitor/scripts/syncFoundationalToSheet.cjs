#!/usr/bin/env node

/**
 * Sync Foundational Flags to Google Sheets
 *
 * Pushes isFoundational flags from local JSON to Google Sheets:
 * - Adds "Is_Foundational" column if missing
 * - Updates all rows with TRUE/FALSE values
 * - Preserves existing data
 * - Uses OAuth authentication
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const CASE_MAPPING_PATH = path.join(__dirname, '..', 'AI_ENHANCED_CASE_ID_MAPPING.json');
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');

// Google Sheet configuration
const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';
const SHEET_TAB = 'Master Scenario Convert';

async function getAuthClient() {
  if (!fs.existsSync(TOKEN_PATH)) {
    console.error('❌ OAuth token not found. Run: npm run auth-google');
    process.exit(1);
  }

  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('❌ OAuth credentials not found at config/credentials.json');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

  const { client_id, client_secret, redirect_uris } = credentials.web || credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);

  return oAuth2Client;
}

async function syncFoundationalFlags() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🔄 SYNC FOUNDATIONAL FLAGS TO GOOGLE SHEETS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  try {
    // Step 1: Load local data
    console.log('1️⃣ Loading local foundational flag data...');

    if (!fs.existsSync(CASE_MAPPING_PATH)) {
      console.error('   ❌ Case mapping file not found');
      process.exit(1);
    }

    const cases = JSON.parse(fs.readFileSync(CASE_MAPPING_PATH, 'utf8'));
    console.log(`   ✅ Loaded ${cases.length} cases`);

    const foundationalCount = cases.filter(c => c.isFoundational === true).length;
    console.log(`   📊 ${foundationalCount} foundational, ${cases.length - foundationalCount} advanced`);
    console.log('');

    // Step 2: Connect to Google Sheets
    console.log('2️⃣ Connecting to Google Sheets...');
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    console.log('   ✅ Connected to Google Sheets API');
    console.log('');

    // Step 3: Read existing sheet structure
    console.log('3️⃣ Reading sheet structure...');
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!1:2`
    });

    const headers = headerResponse.data.values;
    if (!headers || headers.length < 2) {
      console.error('   ❌ Could not read sheet headers');
      process.exit(1);
    }

    const tier1Headers = headers[0];
    const tier2Headers = headers[1];

    // Find Case_ID column (in tier1 headers)
    let caseIdColIndex = -1;
    for (let i = 0; i < tier1Headers.length; i++) {
      if (tier1Headers[i] === 'Case_ID') {
        caseIdColIndex = i;
        break;
      }
    }

    if (caseIdColIndex === -1) {
      console.error('   ❌ Could not find Case_ID column');
      process.exit(1);
    }

    console.log(`   ✅ Found Case_ID in column ${String.fromCharCode(65 + caseIdColIndex)} (index ${caseIdColIndex})`);

    // Find or create Is_Foundational column (in tier1 headers)
    let foundationalColIndex = -1;
    for (let i = 0; i < tier1Headers.length; i++) {
      if (tier1Headers[i] === 'Is_Foundational') {
        foundationalColIndex = i;
        break;
      }
    }

    if (foundationalColIndex === -1) {
      // Add new column after Medical_Category (column L = index 11)
      foundationalColIndex = 12; // Column M
      console.log('   ⚠️  Is_Foundational column not found - will create at column M');

      // Update headers
      const columnLetter = String.fromCharCode(65 + foundationalColIndex);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_TAB}!${columnLetter}1`,
        valueInputOption: 'RAW',
        resource: { values: [['Case_Organization']] }
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_TAB}!${columnLetter}2`,
        valueInputOption: 'RAW',
        resource: { values: [['Is_Foundational']] }
      });

      console.log(`   ✅ Created Is_Foundational column at ${columnLetter}`);
    } else {
      console.log(`   ✅ Found Is_Foundational in column ${String.fromCharCode(65 + foundationalColIndex)}`);
    }
    console.log('');

    // Step 4: Read all case data
    console.log('4️⃣ Reading existing case data...');
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A3:Z`
    });

    const rows = dataResponse.data.values || [];
    console.log(`   ✅ Read ${rows.length} data rows`);
    console.log('');

    // Step 5: Build update batch
    console.log('5️⃣ Building foundational flag updates...');
    const updates = [];
    let updatedCount = 0;
    let unchangedCount = 0;
    let notFoundCount = 0;

    rows.forEach((row, idx) => {
      const rowNumber = idx + 3; // Data starts at row 3
      const caseId = row[caseIdColIndex];

      if (!caseId) {
        return; // Skip empty rows
      }

      // Find matching case in local data
      const caseData = cases.find(c => (c.newId || c.oldId) === caseId);

      if (!caseData) {
        notFoundCount++;
        return;
      }

      const isFoundational = caseData.isFoundational === true;
      const currentValue = row[foundationalColIndex];
      const newValue = isFoundational ? 'TRUE' : 'FALSE';

      if (currentValue !== newValue) {
        const columnLetter = String.fromCharCode(65 + foundationalColIndex);
        updates.push({
          range: `${SHEET_TAB}!${columnLetter}${rowNumber}`,
          values: [[newValue]]
        });
        updatedCount++;
      } else {
        unchangedCount++;
      }
    });

    console.log(`   📊 ${updatedCount} cells to update, ${unchangedCount} unchanged`);
    if (notFoundCount > 0) {
      console.log(`   ⚠️  ${notFoundCount} case IDs not found in local data`);
    }
    console.log('');

    // Step 6: Execute batch update
    if (updates.length > 0) {
      console.log('6️⃣ Updating Google Sheets...');

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        resource: {
          valueInputOption: 'RAW',
          data: updates
        }
      });

      console.log(`   ✅ Updated ${updates.length} cells successfully`);
      console.log('');
    } else {
      console.log('6️⃣ No updates needed - all flags already synced');
      console.log('');
    }

    // Final summary
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ SYNC COMPLETE');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('Summary:');
    console.log(`   • Total cases: ${cases.length}`);
    console.log(`   • Foundational: ${foundationalCount} (${(foundationalCount / cases.length * 100).toFixed(1)}%)`);
    console.log(`   • Advanced: ${cases.length - foundationalCount} (${((cases.length - foundationalCount) / cases.length * 100).toFixed(1)}%)`);
    console.log(`   • Cells updated: ${updatedCount}`);
    console.log(`   • Cells unchanged: ${unchangedCount}`);
    if (notFoundCount > 0) {
      console.log(`   • Cases not found: ${notFoundCount}`);
    }
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   • Open Google Sheet to verify updates');
    console.log('   • Run: npm run validate-system (verify integrity)');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Sync failed:', error.message);
    console.error('');
    if (error.code === 'ENOENT') {
      console.error('💡 Make sure you have run: npm run auth-google');
    }
    process.exit(1);
  }
}

if (require.main === module) {
  syncFoundationalFlags().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  });
}

module.exports = { syncFoundationalFlags };
