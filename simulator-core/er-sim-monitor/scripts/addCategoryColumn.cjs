#!/usr/bin/env node

/**
 * Add Category Column to Google Sheet
 *
 * Adds a "Category" column to the Case_Organization group that displays
 * the medical system category (CARD, RESP, NEUR, GAST, etc.) for each case.
 *
 * Category is derived from the Case_ID prefix:
 * - CARD → Cardiac
 * - RESP → Respiratory
 * - NEUR → Neurological
 * - GAST → Gastrointestinal
 * - etc.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CASE_MAPPING_PATH = path.join(__dirname, '..', 'AI_ENHANCED_CASE_ID_MAPPING.json');

const CATEGORY_LABELS = {
  'CARD': 'Cardiac',
  'RESP': 'Respiratory',
  'NEUR': 'Neurological',
  'GAST': 'Gastrointestinal',
  'RENA': 'Renal',
  'ENDO': 'Endocrine',
  'HEME': 'Hematology',
  'MUSC': 'Musculoskeletal',
  'DERM': 'Dermatology',
  'INFD': 'Infectious Disease',
  'IMMU': 'Immunology',
  'OBST': 'Obstetrics',
  'GYNE': 'Gynecology',
  'TRAU': 'Trauma',
  'TOXI': 'Toxicology',
  'PSYC': 'Psychiatry',
  'ENVI': 'Environmental',
  'MULT': 'Multisystem',
  'PED': 'Pediatric' // For PEDXX cases
};

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

async function addCategoryColumn() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  📂 ADD CATEGORY COLUMN TO GOOGLE SHEET');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  try {
    // Step 1: Connect to Google Sheets
    console.log('1️⃣ Connecting to Google Sheets...');
    const auth = createGoogleClient();
    const sheets = google.sheets({ version: 'v4', auth });
    console.log('   ✅ Connected');
    console.log('');

    // Step 2: Get sheet metadata
    console.log('2️⃣ Finding Master Scenario Convert sheet...');
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
    console.log(`   ✅ Found sheet ID: ${masterSheetId}`);
    console.log('');

    // Step 3: Read current headers
    console.log('3️⃣ Reading current headers...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Master Scenario Convert!A1:ZZ2'
    });

    const rows = response.data.values || [];
    const row1 = rows[0] || [];
    const row2 = rows[1] || [];

    console.log(`   Row 1: ${row1.length} columns`);
    console.log(`   Row 2: ${row2.length} columns`);
    console.log('');

    // Step 4: Check if Category column already exists
    console.log('4️⃣ Checking for existing Category column...');

    const hasCategoryCol = row1.some(h => h === 'Category' || h === 'Medical_Category');

    if (hasCategoryCol) {
      console.log('   ✅ Category column already exists!');
      const categoryIdx = row1.findIndex(h => h === 'Category' || h === 'Medical_Category');
      console.log(`      Located at column ${getColumnLetter(categoryIdx)}`);
      console.log('');
      console.log('No changes needed.');
      console.log('');
      return;
    }

    console.log('   ⚠️  Category column not found - will create');
    console.log('');

    // Step 5: Find last Case_Organization column
    console.log('5️⃣ Finding insertion point (after Case_Organization category)...');

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

    const insertPosition = lastCaseOrgIndex + 1;
    console.log(`   ✅ Will insert after column ${getColumnLetter(lastCaseOrgIndex)} (${row1[lastCaseOrgIndex]})`);
    console.log(`      Insertion position: ${getColumnLetter(insertPosition)}`);
    console.log('');

    // Step 6: Insert new column
    console.log('6️⃣ Inserting Category column...');

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      resource: {
        requests: [{
          insertDimension: {
            range: {
              sheetId: masterSheetId,
              dimension: 'COLUMNS',
              startIndex: insertPosition,
              endIndex: insertPosition + 1
            },
            inheritFromBefore: false
          }
        }]
      }
    });

    console.log('   ✅ Column inserted');
    console.log('');

    // Step 7: Write headers
    console.log('7️⃣ Writing column headers...');

    const newCol = getColumnLetter(insertPosition);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Master Scenario Convert!${newCol}1`,
      valueInputOption: 'RAW',
      resource: {
        values: [['Medical_Category']]
      }
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Master Scenario Convert!${newCol}2`,
      valueInputOption: 'RAW',
      resource: {
        values: [['Case_Organization_Medical_Category']]
      }
    });

    console.log('   ✅ Headers written');
    console.log('');

    // Step 8: Populate category values
    console.log('8️⃣ Populating category values from case mapping data...');

    // Load case mapping to get system categories
    if (!fs.existsSync(CASE_MAPPING_PATH)) {
      console.log('   ⚠️  Case mapping file not found - skipping population');
      console.log('      Run aiEnhancedRenaming.cjs first to generate categories');
      console.log('');
    } else {
      const cases = JSON.parse(fs.readFileSync(CASE_MAPPING_PATH, 'utf8'));

      // Build case ID → category map
      const categoryMap = new Map();
      cases.forEach(c => {
        if (c.system) {
          categoryMap.set(c.newId || c.oldId, CATEGORY_LABELS[c.system] || c.system);
        }
      });

      // Read all data rows
      const dataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Master Scenario Convert!A3:ZZ250'
      });

      const dataRows = dataResponse.data.values || [];

      // Find Case_ID column
      const caseIdColIndex = row2.findIndex(h =>
        h === 'Case_Organization_Case_ID' || h === 'Case_Organization:Case_ID'
      );

      if (caseIdColIndex === -1) {
        console.log('   ⚠️  Case_ID column not found - skipping population');
        console.log('');
      } else {
        // Prepare category values
        const categoryValues = dataRows.map(row => {
          const caseId = row[caseIdColIndex] || '';
          if (categoryMap.has(caseId)) {
            return [categoryMap.get(caseId)];
          }
          return [''];
        });

        // Write category values
        if (categoryValues.length > 0) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `Master Scenario Convert!${newCol}3:${newCol}${categoryValues.length + 2}`,
            valueInputOption: 'RAW',
            resource: {
              values: categoryValues
            }
          });

          const populatedCount = categoryValues.filter(v => v[0] !== '').length;
          console.log(`   ✅ Populated ${populatedCount}/${categoryValues.length} categories`);
          console.log('');
        }
      }
    }

    // Success summary
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ CATEGORY COLUMN ADDED!');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log(`📊 Details:`);
    console.log(`   • Column: ${newCol}`);
    console.log(`   • Header Row 1: Medical_Category`);
    console.log(`   • Header Row 2: Case_Organization_Medical_Category`);
    console.log('');
    console.log('💡 Category Labels:');
    Object.entries(CATEGORY_LABELS).slice(0, 10).forEach(([code, label]) => {
      console.log(`   • ${code} → ${label}`);
    });
    console.log(`   ... and ${Object.keys(CATEGORY_LABELS).length - 10} more`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR adding category column:');
    console.error(error.message);
    if (error.response) {
      console.error('   API Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

if (require.main === module) {
  addCategoryColumn();
}

module.exports = { addCategoryColumn };
