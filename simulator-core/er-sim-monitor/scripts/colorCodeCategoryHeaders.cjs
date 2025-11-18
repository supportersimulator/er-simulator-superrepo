#!/usr/bin/env node

/**
 * Color Code Category Headers for Visual Clarity
 *
 * Purpose:
 * Add alternating rainbow colors to header rows to visually distinguish categories.
 * Helps humans quickly see which columns belong to which category.
 *
 * Pattern:
 * - Category 1: No color (white/default)
 * - Category 2: Light red
 * - Category 3: No color
 * - Category 4: Light orange
 * - Category 5: No color
 * - Category 6: Light yellow
 * - Category 7: No color
 * - Category 8: Light green
 * - Category 9: No color
 * - Category 10: Light blue
 * - Category 11: No color
 * - (If more categories: cycle through lighter shades of rainbow)
 *
 * Rainbow Colors (Light Pastel Shades for Readability):
 * - Red: #ffcccc
 * - Orange: #ffe0cc
 * - Yellow: #ffffcc
 * - Green: #ccffcc
 * - Blue: #ccf2ff
 * - Purple: #e6ccff
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const RAINBOW_COLORS = [
  '#ffcccc',  // Light red
  '#ffe0cc',  // Light orange
  '#ffffcc',  // Light yellow
  '#ccffcc',  // Light green
  '#ccf2ff',  // Light blue
  '#e6ccff'   // Light purple
];

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

async function colorCodeCategories() {
  console.log('🎨 Color Coding Category Headers for Visual Clarity');
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

    // Step 2: Read current headers
    console.log('2️⃣ Reading current column headers...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Master Scenario Convert!A1:ZZ2'
    });

    const rows = response.data.values || [];
    const row1 = rows[0] || [];
    const row2 = rows[1] || [];

    console.log('   Row 1 (simple headers): ' + row1.length + ' columns');
    console.log('   Row 2 (qualified names): ' + row2.length + ' columns');
    console.log('');

    // Step 3: Detect category boundaries
    console.log('3️⃣ Detecting category boundaries...');

    const categories = [];
    let currentCategory = null;
    let currentStart = 0;

    for (let i = 0; i < row2.length; i++) {
      const fullName = row2[i] || '';

      // Extract category from full name (part before first underscore or colon)
      let category = 'Unknown';
      if (fullName.includes('_')) {
        category = fullName.split('_')[0];
      } else if (fullName.includes(':')) {
        category = fullName.split(':')[0];
      }

      // Check if we're starting a new category
      if (category !== currentCategory) {
        // Save previous category
        if (currentCategory !== null) {
          categories.push({
            name: currentCategory,
            startCol: currentStart,
            endCol: i - 1,
            columnCount: i - currentStart
          });
        }

        // Start new category
        currentCategory = category;
        currentStart = i;
      }
    }

    // Save last category
    if (currentCategory !== null) {
      categories.push({
        name: currentCategory,
        startCol: currentStart,
        endCol: row2.length - 1,
        columnCount: row2.length - currentStart
      });
    }

    console.log('   Found ' + categories.length + ' categories:');
    categories.forEach((cat, idx) => {
      const colorIdx = Math.floor(idx / 2); // Every other category gets color
      const hasColor = idx % 2 === 1; // Odd indices (1, 3, 5...) get color
      const color = hasColor ? RAINBOW_COLORS[colorIdx % RAINBOW_COLORS.length] : 'No color';
      console.log('   ' + (idx + 1) + '. ' + cat.name + ' (Cols ' + (cat.startCol + 1) + '-' + (cat.endCol + 1) + ', ' + cat.columnCount + ' cols) → ' + color);
    });
    console.log('');

    // Step 4: Build formatting requests
    console.log('4️⃣ Building color formatting requests...');

    const requests = [];

    categories.forEach((cat, idx) => {
      const hasColor = idx % 2 === 1; // Odd indices get color

      if (hasColor) {
        const colorIdx = Math.floor(idx / 2);
        const color = RAINBOW_COLORS[colorIdx % RAINBOW_COLORS.length];

        // Convert hex to RGB
        const r = parseInt(color.slice(1, 3), 16) / 255;
        const g = parseInt(color.slice(3, 5), 16) / 255;
        const b = parseInt(color.slice(5, 7), 16) / 255;

        // Format both header rows for this category
        requests.push({
          repeatCell: {
            range: {
              sheetId: masterSheetId, // Use actual sheet ID
              startRowIndex: 0,
              endRowIndex: 2, // Rows 1 and 2 (0-indexed)
              startColumnIndex: cat.startCol,
              endColumnIndex: cat.endCol + 1
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: {
                  red: r,
                  green: g,
                  blue: b
                }
              }
            },
            fields: 'userEnteredFormat.backgroundColor'
          }
        });
      }
    });

    console.log('   Created ' + requests.length + ' formatting requests');
    console.log('');

    // Step 5: Apply formatting
    console.log('5️⃣ Applying color formatting to headers...');

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      resource: {
        requests: requests
      }
    });

    console.log('   ✅ Color formatting applied!');
    console.log('');

    console.log('✅ SUCCESS: Category headers color-coded for visual clarity!');
    console.log('');
    console.log('🎨 Color Pattern Applied:');
    categories.forEach((cat, idx) => {
      const hasColor = idx % 2 === 1;
      const colorIdx = Math.floor(idx / 2);
      const color = hasColor ? RAINBOW_COLORS[colorIdx % RAINBOW_COLORS.length] : 'None';
      const colorName = hasColor ?
        ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'][colorIdx % 6] :
        'Default';

      console.log('   ' + (idx + 1) + '. ' + cat.name.padEnd(30) + ' → ' + colorName);
    });
    console.log('');
    console.log('💡 Benefits:');
    console.log('   - Quickly identify category boundaries at a glance');
    console.log('   - Alternating pattern prevents color overload');
    console.log('   - Light pastel colors maintain text readability');
    console.log('   - Rainbow sequence is visually memorable');
    console.log('');

  } catch (error) {
    console.error('❌ Error color coding headers:');
    console.error(error.message);
    if (error.response) {
      console.error('   API Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

if (require.main === module) {
  colorCodeCategories();
}

module.exports = { colorCodeCategories };
