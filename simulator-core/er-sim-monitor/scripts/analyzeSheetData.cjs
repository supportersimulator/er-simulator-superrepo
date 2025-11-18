const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Spreadsheet ID from the URL
const SPREADSHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';

function getOAuth2Client() {
  const clasprcPath = path.join(process.env.HOME, '.clasprc.json');
  const credentials = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));
  const token = credentials.tokens.default;
  const oauth2Client = new google.auth.OAuth2(token.client_id, token.client_secret);
  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_type: token.token_type,
    expiry_date: token.expiry_date
  });
  return oauth2Client;
}

async function analyzeSheet() {
  const auth = getOAuth2Client();
  const sheets = google.sheets({ version: 'v4', auth });

  console.log('🔍 Reading AI_Categorization_Results sheet via Sheets API...\n');

  try {
    // Read the entire sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'AI_Categorization_Results!A1:P10'  // Headers + first 9 data rows
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log('❌ No data found in AI_Categorization_Results sheet');
      return;
    }

    const headers = rows[0];

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('SHEET STRUCTURE');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Total rows returned:', rows.length);
    console.log('Total columns:', headers.length);
    console.log('');

    console.log('HEADERS:');
    headers.forEach((h, i) => {
      const col = String.fromCharCode(65 + i);
      console.log(`  ${col}: ${h}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('SAMPLE DATA (First 3 Cases)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Analyze first 3 data rows
    for (let i = 1; i <= Math.min(3, rows.length - 1); i++) {
      const row = rows[i] || [];

      console.log(`CASE ${i}:`);
      console.log(`  A - Case ID: ${row[0] || 'EMPTY'}`);
      console.log(`  B - Legacy ID: ${row[1] || 'EMPTY'}`);
      console.log(`  C - Row Index: ${row[2] || 'EMPTY'}`);
      console.log(`  D - Spark Title: ${row[3] || 'EMPTY'}`);
      console.log(`  E - Reveal Title: ${row[4] || 'EMPTY'}`);
      console.log('');
      console.log('  SUGGESTED (from ChatGPT):');
      console.log(`    F - Symptom Code: "${row[5] || 'EMPTY'}"`);
      console.log(`    G - Symptom Name: "${row[6] || 'EMPTY'}"`);
      console.log(`    H - System Code:  "${row[7] || 'EMPTY'}"`);
      console.log(`    I - System Name:  "${row[8] || 'EMPTY'}"`);
      console.log('');
      console.log('  FINAL (to Master):');
      console.log(`    M - Symptom Code: "${row[12] || 'EMPTY'}"`);
      console.log(`    N - System Code:  "${row[13] || 'EMPTY'}"`);
      console.log(`    O - Symptom Name: "${row[14] || 'EMPTY'}"`);
      console.log(`    P - System Name:  "${row[15] || 'EMPTY'}"`);
      console.log('');
      console.log(`  J - AI Reasoning: ${(row[9] || 'EMPTY').substring(0, 80)}`);
      console.log(`  K - Status: ${row[10] || 'EMPTY'}`);
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('DIAGNOSIS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Check for issues
    const issues = [];

    // Check columns D & E (Spark/Reveal titles)
    let sparkEmpty = true;
    let revealEmpty = true;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][3] && rows[i][3] !== '') sparkEmpty = false;
      if (rows[i] && rows[i][4] && rows[i][4] !== '') revealEmpty = false;
    }

    if (sparkEmpty) {
      issues.push('❌ CRITICAL: Column D (Spark Title) is EMPTY');
      issues.push('   → extractCasesForCategorization() not extracting row[1] (sparkTitle)');
      issues.push('   → OR Master sheet columns B/C are empty');
    }

    if (revealEmpty) {
      issues.push('❌ CRITICAL: Column E (Reveal Title) is EMPTY');
      issues.push('   → extractCasesForCategorization() not extracting row[2] (revealTitle)');
      issues.push('   → OR Master sheet columns B/C are empty');
    }

    // Check columns F-I (ChatGPT suggestions)
    let symptomCodeEmpty = true;
    let symptomNameEmpty = true;
    let systemCodeEmpty = true;
    let systemNameEmpty = true;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][5] && rows[i][5] !== '') symptomCodeEmpty = false;
      if (rows[i] && rows[i][6] && rows[i][6] !== '') symptomNameEmpty = false;
      if (rows[i] && rows[i][7] && rows[i][7] !== '') systemCodeEmpty = false;
      if (rows[i] && rows[i][8] && rows[i][8] !== '') systemNameEmpty = false;
    }

    if (symptomCodeEmpty) {
      issues.push('❌ CRITICAL: Column F (Suggested Symptom Code) is EMPTY');
      issues.push('   → ChatGPT not returning "symptomCode" field');
      issues.push('   → OR writeCategorizationResults() not reading cat.symptomCode');
      issues.push('   → OR processBatchWithOpenAI() parsing error');
    }

    if (symptomNameEmpty) {
      issues.push('❌ CRITICAL: Column G (Suggested Symptom Name) is EMPTY');
      issues.push('   → ChatGPT not returning "symptomName" field');
      issues.push('   → OR writeCategorizationResults() not reading cat.symptomName');
      issues.push('   → OR processBatchWithOpenAI() parsing error');
    }

    if (systemCodeEmpty) {
      issues.push('❌ CRITICAL: Column H (Suggested System Code) is EMPTY');
      issues.push('   → ChatGPT not returning "systemCode" field');
      issues.push('   → OR writeCategorizationResults() not reading cat.systemCode');
    }

    if (systemNameEmpty) {
      issues.push('❌ CRITICAL: Column I (Suggested System Name) is EMPTY');
      issues.push('   → ChatGPT not returning "systemName" field');
      issues.push('   → OR writeCategorizationResults() not reading cat.systemName');
    }

    // Check if columns M-P match F-I
    if (!symptomCodeEmpty && rows[1] && rows[1][12] !== rows[1][5]) {
      issues.push('⚠️  WARNING: Column M (Final Symptom Code) does not match Column F (Suggested)');
    }

    if (issues.length > 0) {
      console.log('ISSUES FOUND:\n');
      issues.forEach(issue => console.log(issue));

      console.log('\n\nNEXT STEPS:');
      console.log('1. Check the execution logs in Apps Script (View → Executions)');
      console.log('2. Look for debug logs showing what ChatGPT returned');
      console.log('3. Verify the prompt is asking for symptomCode, symptomName, systemCode, systemName');
      console.log('4. Check if ChatGPT is returning the old field names (symptom, system)');
    } else {
      console.log('✅ All columns appear to have data!');
      console.log('\nNo obvious issues detected. The fix appears to be working correctly.');
    }

    console.log('\n═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error reading sheet:', error.message);
    if (error.code === 404 || error.message.includes('not found')) {
      console.log('\n⚠️  Sheet "AI_Categorization_Results" might not exist yet');
      console.log('    Run the Ultimate Categorization Tool to create it');
    } else {
      console.error('Full error:', error);
    }
  }
}

analyzeSheet().catch(console.error);
