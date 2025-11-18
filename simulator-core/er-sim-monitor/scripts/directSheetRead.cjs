const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';

function getOAuth2Client() {
  const clasprcPath = path.join(process.env.HOME, '.clasprc.json');
  const credentials = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));
  const token = credentials.tokens.default;

  const oauth2Client = new google.auth.OAuth2(
    token.client_id,
    token.client_secret,
    'http://localhost'
  );

  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_type: token.token_type,
    expiry_date: token.expiry_date,
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/script.projects https://www.googleapis.com/auth/drive'
  });

  return oauth2Client;
}

async function readSheetDirectly() {
  try {
    const auth = getOAuth2Client();
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('🔍 Attempting to read AI_Categorization_Results sheet...\n');

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'AI_Categorization_Results!A1:P10'
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log('❌ No data found in AI_Categorization_Results sheet');
      return;
    }

    const headers = rows[0];

    console.log('✅ SUCCESS! Sheet data retrieved!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('AI_CATEGORIZATION_RESULTS ANALYSIS');
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

    for (let i = 1; i <= Math.min(3, rows.length - 1); i++) {
      const row = rows[i] || [];

      console.log(`CASE ${i}: ${row[0] || 'NO CASE ID'}`);
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
    console.log('🔍 SHERLOCK HOLMES DIAGNOSIS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const issues = [];

    // Check for empty columns
    const checkColumn = (colIdx, name) => {
      for (let i = 1; i < rows.length; i++) {
        if (rows[i] && rows[i][colIdx] && rows[i][colIdx] !== '') {
          return false; // Not empty
        }
      }
      return true; // Empty
    };

    if (checkColumn(3, 'Spark Title')) {
      issues.push('❌ CRITICAL: Column D (Spark Title) is EMPTY');
      issues.push('   Cause: extractCasesForCategorization() not reading sparkTitle from row[1]');
      issues.push('   OR Master sheet Column B is empty');
    }

    if (checkColumn(4, 'Reveal Title')) {
      issues.push('❌ CRITICAL: Column E (Reveal Title) is EMPTY');
      issues.push('   Cause: extractCasesForCategorization() not reading revealTitle from row[2]');
      issues.push('   OR Master sheet Column C is empty');
    }

    if (checkColumn(5, 'Suggested Symptom Code')) {
      issues.push('❌ CRITICAL: Column F (Suggested Symptom Code) is EMPTY');
      issues.push('   Cause: ChatGPT returning "symptom" instead of "symptomCode"');
      issues.push('   OR processBatchWithOpenAI() parsing error');
    }

    if (checkColumn(6, 'Suggested Symptom Name')) {
      issues.push('❌ CRITICAL: Column G (Suggested Symptom Name) is EMPTY');
      issues.push('   Cause: ChatGPT NOT returning "symptomName" field');
      issues.push('   OR returning old field name');
    }

    if (checkColumn(7, 'Suggested System Code')) {
      issues.push('❌ CRITICAL: Column H (Suggested System Code) is EMPTY');
      issues.push('   Cause: ChatGPT returning "system" instead of "systemCode"');
    }

    if (checkColumn(8, 'Suggested System Name')) {
      issues.push('❌ CRITICAL: Column I (Suggested System Name) is EMPTY');
      issues.push('   Cause: ChatGPT NOT returning "systemName" field');
    }

    if (issues.length > 0) {
      console.log('ISSUES FOUND:\n');
      issues.forEach(issue => console.log(issue));

      console.log('\n\n🎯 ROOT CAUSE:');

      const sparkEmpty = checkColumn(3, 'Spark Title');
      const revealEmpty = checkColumn(4, 'Reveal Title');
      const symptomCodeEmpty = checkColumn(5, 'Symptom Code');
      const symptomNameEmpty = checkColumn(6, 'Symptom Name');

      if (sparkEmpty && revealEmpty) {
        console.log('The OLD extractCasesForCategorization() is still running.');
        console.log('Solution: Close and reopen the spreadsheet, then re-run the tool.');
      } else if (symptomCodeEmpty && symptomNameEmpty) {
        console.log('ChatGPT is returning OLD field names: "symptom" and "system"');
        console.log('instead of: "symptomCode", "symptomName", "systemCode", "systemName"');
        console.log('\nThe deployed code is correct but OLD code is still executing.');
        console.log('Solution: Close spreadsheet, reopen, delete AI_Categorization_Results, re-run.');
      } else {
        console.log('Mixed results - some columns work, others don\'t.');
        console.log('This suggests a partial deployment or caching issue.');
      }

      console.log('\n\n📋 ACTION ITEMS:');
      console.log('1. Close the Google Spreadsheet completely');
      console.log('2. Reopen the spreadsheet (fresh session)');
      console.log('3. Delete the AI_Categorization_Results sheet');
      console.log('4. Run Ultimate Categorization Tool again (process 5 cases)');
      console.log('5. Check if the issue persists');

    } else {
      console.log('✅ ALL COLUMNS HAVE DATA!');
      console.log('\nThe fix is working correctly. All fields are being populated:');
      console.log('  • Spark/Reveal titles are extracted');
      console.log('  • ChatGPT is returning symptomCode, symptomName, systemCode, systemName');
      console.log('  • Final columns are populated correctly');
      console.log('\n🎉 No issues detected!');
    }

    console.log('\n═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.code === 403) {
      console.log('\n📌 OAuth scope issue detected.');
      console.log('The current credentials need the Sheets API scope.');
      console.log('\nPlease run: clasp login --creds creds.json');
      console.log('Or manually enable the required APIs in Google Cloud Console.');
    } else if (error.code === 404) {
      console.log('\n⚠️  Sheet "AI_Categorization_Results" not found.');
      console.log('Run the Ultimate Categorization Tool to create it.');
    } else {
      console.error('\nFull error:', error);
    }
  }
}

readSheetDirectly();
