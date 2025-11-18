#!/usr/bin/env node

/**
 * Analyze AI_Categorization_Results sheet structure
 * Helps determine if sheet has all required columns (A-O)
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SPREADSHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';
const AI_RESULTS_SHEET_NAME = 'AI_Categorization_Results';

/**
 * Get OAuth token from .clasprc.json
 */
function getAccessToken() {
  const clasprcPath = path.join(process.env.HOME, '.clasprc.json');

  if (!fs.existsSync(clasprcPath)) {
    throw new Error('No .clasprc.json found. Run: clasp login --no-localhost');
  }

  const clasprc = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));

  // Support both token formats
  return clasprc.tokens?.default?.access_token || clasprc.token?.access_token;
}

/**
 * Main analysis function
 */
async function analyzeSheet() {
  try {
    const accessToken = getAccessToken();

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    // Create Sheets API client
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    console.log('📊 Analyzing AI_Categorization_Results sheet...\n');

    // Get sheet metadata to find column count
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'sheets(properties(sheetId,title,gridProperties))'
    });

    const aiSheet = sheetMetadata.data.sheets.find(
      s => s.properties.title === AI_RESULTS_SHEET_NAME
    );

    if (!aiSheet) {
      console.log('❌ AI_Categorization_Results sheet NOT FOUND');
      console.log('\nAvailable sheets:');
      sheetMetadata.data.sheets.forEach(s => {
        console.log(`  - ${s.properties.title}`);
      });
      return;
    }

    console.log('✅ Sheet found!');
    console.log(`   Rows: ${aiSheet.properties.gridProperties.rowCount}`);
    console.log(`   Columns: ${aiSheet.properties.gridProperties.columnCount}\n`);

    // Get header row to see actual column names
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${AI_RESULTS_SHEET_NAME}!A1:Z1`
    });

    const headers = headerResponse.data.values?.[0] || [];

    console.log('📋 Column Headers:');
    headers.forEach((header, idx) => {
      const columnLetter = String.fromCharCode(65 + idx);
      console.log(`   ${columnLetter} (idx ${idx}): ${header}`);
    });

    console.log('\n🔍 Expected Columns (v2.0.1):');
    const expectedColumns = [
      'A (0): Case_ID',
      'B (1): Legacy_Case_ID',
      'C (2): Row_Index',
      'D (3): Current_Symptom',
      'E (4): Current_System',
      'F (5): Suggested_Symptom',
      'G (6): Suggested_Symptom_Name',
      'H (7): Suggested_System',
      'I (8): AI_Reasoning',
      'J (9): Confidence',
      'K (10): Status',
      'L (11): User_Decision',
      'M (12): Final_Symptom ← CRITICAL for Apply',
      'N (13): Final_System ← CRITICAL for Apply',
      'O (14): Final_Symptom_Name'
    ];

    expectedColumns.forEach(col => console.log(`   ${col}`));

    // Check for critical columns
    console.log('\n✅ Critical Column Check:');

    const hasFinalSymptom = headers[12] && headers[12].includes('Final_Symptom');
    const hasFinalSystem = headers[13] && headers[13].includes('Final_System');

    if (hasFinalSymptom) {
      console.log(`   ✅ Column M (Final_Symptom): ${headers[12]}`);
    } else {
      console.log(`   ❌ Column M (Final_Symptom): MISSING or wrong name`);
    }

    if (hasFinalSystem) {
      console.log(`   ✅ Column N (Final_System): ${headers[13]}`);
    } else {
      console.log(`   ❌ Column N (Final_System): MISSING or wrong name`);
    }

    // Sample a few rows to check if Final columns have data
    console.log('\n📊 Sampling rows to check for data in Final columns...');

    const sampleResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${AI_RESULTS_SHEET_NAME}!A2:O10`
    });

    const sampleRows = sampleResponse.data.values || [];

    console.log('\nFirst 8 data rows (showing columns M & N):');
    sampleRows.forEach((row, idx) => {
      const caseID = row[0] || 'N/A';
      const finalSymptom = row[12] || '(empty)';
      const finalSystem = row[13] || '(empty)';
      console.log(`   Row ${idx + 2}: ${caseID} | Final_Symptom: ${finalSymptom} | Final_System: ${finalSystem}`);
    });

    // Summary
    console.log('\n📈 SUMMARY:');

    if (headers.length >= 15 && hasFinalSymptom && hasFinalSystem) {
      console.log('   ✅ Sheet has complete structure (15 columns A-O)');
      console.log('   ✅ Final_Symptom and Final_System columns exist');
      console.log('\n   ➡️  Next step: Check if Final columns have data');
      console.log('   ➡️  If they have data: Run "Apply to Master"');
      console.log('   ➡️  If they\'re empty: Run AI Categorization first');
    } else if (headers.length < 15) {
      console.log('   ⚠️  Sheet has incomplete structure');
      console.log(`   ⚠️  Only ${headers.length} columns instead of 15`);
      console.log('\n   ➡️  Next step: Re-run Ultimate Categorization Tool v2.0.1');
      console.log('   ➡️  This will create complete sheet with all columns');
    } else {
      console.log('   ⚠️  Sheet structure unclear');
      console.log('\n   ➡️  Review column headers above and compare to expected');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('Request had insufficient authentication')) {
      console.error('\n💡 OAuth token expired. Run: clasp login --no-localhost');
    } else if (error.code === 403) {
      console.error('\n💡 Google Sheets API may not be enabled');
      console.error('   However, Apps Script can still access sheets directly');
    }
  }
}

// Run analysis
analyzeSheet();
