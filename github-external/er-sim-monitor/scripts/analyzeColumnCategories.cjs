#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

async function analyzeFullStructure() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  // Get first 2 rows (headers)
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Master Scenario Convert!A1:ZZ2'
  });

  const rows = response.data.values || [];
  const row1 = rows[0] || []; // Simple headers
  const row2 = rows[1] || []; // Full qualified names

  console.log('═══════════════════════════════════════════════════');
  console.log('COMPLETE COLUMN STRUCTURE ANALYSIS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // Extract categories from row2
  const categories = {};

  row2.forEach((fullName, idx) => {
    if (!fullName) return;

    const fieldName = row1[idx] || fullName;

    // Extract category from fullName
    let category = 'Unknown';

    if (fullName.includes('Case_Organization_')) {
      category = 'Case_Organization';
    } else if (fullName.includes('image sync_') || fullName.includes('Image_')) {
      category = 'Image_Sync';
    } else if (fullName.startsWith('Default_')) {
      category = 'Defaults';
    } else if (fullName.includes('Attribution') || fullName.includes('Version') || fullName.includes('Date') || fullName.includes('Developer') || fullName.includes('Institution')) {
      category = 'Metadata';
    } else {
      // Extract first part before underscore
      const parts = fullName.split('_');
      category = parts[0] || 'Unknown';
    }

    if (!categories[category]) {
      categories[category] = [];
    }

    const colLetter = getColumnLetter(idx);
    categories[category].push({
      column: colLetter,
      simpleHeader: fieldName,
      fullHeader: fullName,
      index: idx
    });
  });

  // Display categories
  console.log('📊 FOUND ' + Object.keys(categories).length + ' CATEGORIES:');
  console.log('');

  Object.keys(categories).sort().forEach(category => {
    const fields = categories[category];
    console.log('📁 CATEGORY: ' + category);
    console.log('   (' + fields.length + ' fields)');
    console.log('');
    fields.forEach(f => {
      console.log('   ' + f.column + ': ' + f.simpleHeader);
      console.log('       Full: ' + f.fullHeader);
    });
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════');
  console.log('RECOMMENDATION FOR OVERVIEW COLUMNS:');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('✅ RECOMMENDED: Add to Case_Organization category');
  console.log('   Row 1: Pre_Sim_Overview | Post_Sim_Overview');
  console.log('   Row 2: Case_Organization_Pre_Sim_Overview | Case_Organization_Post_Sim_Overview');
  console.log('');
  console.log('   Rationale:');
  console.log('   - Overviews are descriptive case content (like Spark_Title, Reveal_Title)');
  console.log('   - Fits naturally with existing Case_Organization fields');
  console.log('   - No new category needed');
  console.log('');
  console.log('Alternative: Create Educational_Content category');
  console.log('   Row 1: Pre_Sim_Overview | Post_Sim_Overview');
  console.log('   Row 2: Educational_Content_Pre_Sim_Overview | Educational_Content_Post_Sim_Overview');
  console.log('');
  console.log('   Rationale:');
  console.log('   - Separates learner-facing content');
  console.log('   - Future-proof for additional educational fields');
  console.log('');
}

function getColumnLetter(idx) {
  let letter = '';
  while (idx >= 0) {
    letter = String.fromCharCode(65 + (idx % 26)) + letter;
    idx = Math.floor(idx / 26) - 1;
  }
  return letter;
}

if (require.main === module) {
  analyzeFullStructure().catch(console.error);
}

module.exports = { analyzeFullStructure };
