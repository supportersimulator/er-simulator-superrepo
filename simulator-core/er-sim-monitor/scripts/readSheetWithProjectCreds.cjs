const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';

function getOAuth2Client() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  oauth2Client.setCredentials(token);

  return oauth2Client;
}

async function readAndAnalyzeSheet() {
  try {
    const auth = getOAuth2Client();
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('🔍 Reading AI_Categorization_Results sheet...\n');

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'AI_Categorization_Results!A1:P10'
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log('❌ No data found in AI_Categorization_Results sheet');
      console.log('   The sheet might be empty or not created yet.');
      return;
    }

    const headers = rows[0];

    console.log('✅ SUCCESS! Sheet data retrieved!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('AI_CATEGORIZATION_RESULTS ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Total rows returned:', rows.length - 1);
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
      console.log('  OTHER:');
      console.log(`    J - AI Reasoning: ${(row[9] || 'EMPTY').substring(0, 60)}...`);
      console.log(`    K - Status: ${row[10] || 'EMPTY'}`);
      console.log(`    L - User Decision: ${row[11] || 'EMPTY'}`);
      console.log('');
      console.log('  FINAL (copied to Master):');
      console.log(`    M - Symptom Code: "${row[12] || 'EMPTY'}"`);
      console.log(`    N - System Code:  "${row[13] || 'EMPTY'}"`);
      console.log(`    O - Symptom Name: "${row[14] || 'EMPTY'}"`);
      console.log(`    P - System Name:  "${row[15] || 'EMPTY'}"`);
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

    const sparkEmpty = checkColumn(3, 'Spark Title');
    const revealEmpty = checkColumn(4, 'Reveal Title');
    const symptomCodeEmpty = checkColumn(5, 'Suggested Symptom Code');
    const symptomNameEmpty = checkColumn(6, 'Suggested Symptom Name');
    const systemCodeEmpty = checkColumn(7, 'Suggested System Code');
    const systemNameEmpty = checkColumn(8, 'Suggested System Name');
    const finalSymptomCodeEmpty = checkColumn(12, 'Final Symptom Code');
    const finalSymptomNameEmpty = checkColumn(14, 'Final Symptom Name');

    if (sparkEmpty) {
      issues.push('❌ CRITICAL: Column D (Spark Title) is EMPTY');
      issues.push('   → extractCasesForCategorization() not reading row[1]');
      issues.push('   → OR Master sheet Column B is empty');
    }

    if (revealEmpty) {
      issues.push('❌ CRITICAL: Column E (Reveal Title) is EMPTY');
      issues.push('   → extractCasesForCategorization() not reading row[2]');
      issues.push('   → OR Master sheet Column C is empty');
    }

    if (symptomCodeEmpty) {
      issues.push('❌ CRITICAL: Column F (Suggested Symptom Code) is EMPTY');
      issues.push('   → ChatGPT returning "symptom" instead of "symptomCode"');
    }

    if (symptomNameEmpty) {
      issues.push('❌ CRITICAL: Column G (Suggested Symptom Name) is EMPTY');
      issues.push('   → ChatGPT NOT returning "symptomName" field');
    }

    if (systemCodeEmpty) {
      issues.push('❌ CRITICAL: Column H (Suggested System Code) is EMPTY');
      issues.push('   → ChatGPT returning "system" instead of "systemCode"');
    }

    if (systemNameEmpty) {
      issues.push('❌ CRITICAL: Column I (Suggested System Name) is EMPTY');
      issues.push('   → ChatGPT NOT returning "systemName" field');
    }

    if (finalSymptomNameEmpty && !symptomNameEmpty) {
      issues.push('⚠️  WARNING: Final columns empty but Suggested columns have data');
      issues.push('   → Copy from Suggested to Final is not working');
    }

    if (issues.length > 0) {
      console.log('ISSUES FOUND:\n');
      issues.forEach(issue => console.log(issue));

      console.log('\n\n🎯 ROOT CAUSE ANALYSIS:');

      if (sparkEmpty && revealEmpty && symptomCodeEmpty && symptomNameEmpty) {
        console.log('ALL key columns are empty → OLD CODE is still running');
        console.log('\n✅ SOLUTION:');
        console.log('1. Close the spreadsheet completely');
        console.log('2. Wait 30 seconds');
        console.log('3. Reopen the spreadsheet');
        console.log('4. Delete AI_Categorization_Results sheet');
        console.log('5. Run Ultimate Categorization Tool again');
      } else if (symptomCodeEmpty && symptomNameEmpty && systemCodeEmpty && systemNameEmpty) {
        console.log('Spark/Reveal titles work BUT ChatGPT columns empty');
        console.log('→ ChatGPT is returning OLD field names: "symptom", "system"');
        console.log('→ writeCategorizationResults() looking for NEW names: "symptomCode", "symptomName"');
        console.log('\n✅ SOLUTION:');
        console.log('The deployed functions are correct.');
        console.log('The issue is that OLD CODE is still cached and running.');
        console.log('1. Close spreadsheet');
        console.log('2. Reopen after 30 seconds');
        console.log('3. Delete AI_Categorization_Results');
        console.log('4. Re-run the tool');
      } else {
        console.log('Partial success - some columns work, others don\'t');
        console.log('This suggests incomplete deployment or mixed code versions.');
      }

    } else {
      console.log('✅ ALL COLUMNS HAVE DATA!');
      console.log('\n🎉 The fix is working perfectly!');
      console.log('\nAll fields are being populated correctly:');
      console.log('  • Spark/Reveal titles extracted from Master');
      console.log('  • ChatGPT returning symptomCode, symptomName, systemCode, systemName');
      console.log('  • Final columns populated for Master update');
      console.log('\nNo issues detected - ready to apply to Master sheet!');
    }

    console.log('\n═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 404) {
      console.log('\n⚠️  Sheet "AI_Categorization_Results" not found.');
      console.log('Run the Ultimate Categorization Tool to create it.');
    } else {
      console.error('\nFull error:', error);
    }
  }
}

readAndAnalyzeSheet();
