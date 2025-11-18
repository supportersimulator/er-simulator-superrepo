// ═══════════════════════════════════════════════════════════════
// DIAGNOSTIC FUNCTION - Paste this into Apps Script Editor
//
// Instructions:
// 1. Open your Google Spreadsheet
// 2. Go to Extensions → Apps Script
// 3. Paste this function at the END of Ultimate_Categorization_Tool_Complete.gs
// 4. Save the file
// 5. Run the function "DIAGNOSTIC_analyzeAICategorizationResults"
// 6. View the execution log (View → Logs or Ctrl+Enter)
// 7. Share the output with me
// ═══════════════════════════════════════════════════════════════

function DIAGNOSTIC_analyzeAICategorizationResults() {
  try {
    Logger.log('═══════════════════════════════════════════════════════════════');
    Logger.log('DIAGNOSTIC: AI_Categorization_Results Analysis');
    Logger.log('═══════════════════════════════════════════════════════════════\n');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const resultsSheet = ss.getSheetByName('AI_Categorization_Results');

    if (!resultsSheet) {
      Logger.log('❌ ERROR: AI_Categorization_Results sheet not found');
      Logger.log('   The sheet has not been created yet.');
      Logger.log('   Run the Ultimate Categorization Tool first.\n');
      return;
    }

    const data = resultsSheet.getDataRange().getValues();
    const headers = data[0];

    Logger.log('✅ Sheet found!');
    Logger.log('   Total rows: ' + (data.length - 1));
    Logger.log('   Total columns: ' + headers.length + '\n');

    Logger.log('HEADERS:');
    for (let i = 0; i < headers.length; i++) {
      const col = String.fromCharCode(65 + i);
      Logger.log('  ' + col + ': ' + headers[i]);
    }
    Logger.log('');

    // Check for empty columns
    Logger.log('CHECKING FOR EMPTY COLUMNS (first 10 rows)...');
    const emptyColumns = [];
    for (let colIdx = 0; colIdx < headers.length; colIdx++) {
      let isEmpty = true;
      for (let rowIdx = 1; rowIdx < Math.min(data.length, 11); rowIdx++) {
        if (data[rowIdx][colIdx] && data[rowIdx][colIdx] !== '') {
          isEmpty = false;
          break;
        }
      }
      if (isEmpty) {
        const col = String.fromCharCode(65 + colIdx);
        emptyColumns.push(col + ': ' + headers[colIdx]);
      }
    }

    if (emptyColumns.length > 0) {
      Logger.log('⚠️  EMPTY COLUMNS DETECTED:');
      emptyColumns.forEach(function(col) {
        Logger.log('     ' + col);
      });
      Logger.log('');
    } else {
      Logger.log('✅ All columns have data!\n');
    }

    Logger.log('═══════════════════════════════════════════════════════════════');
    Logger.log('SAMPLE DATA (First 3 Cases)');
    Logger.log('═══════════════════════════════════════════════════════════════\n');

    // Show first 3 data rows
    for (let i = 1; i <= Math.min(3, data.length - 1); i++) {
      const row = data[i];

      Logger.log('CASE ' + i + ': ' + (row[0] || 'NO CASE ID'));
      Logger.log('  A - Case ID: ' + (row[0] || 'EMPTY'));
      Logger.log('  B - Legacy ID: ' + (row[1] || 'EMPTY'));
      Logger.log('  C - Row Index: ' + (row[2] || 'EMPTY'));
      Logger.log('  D - Spark Title: ' + (row[3] || 'EMPTY'));
      Logger.log('  E - Reveal Title: ' + (row[4] || 'EMPTY'));
      Logger.log('');
      Logger.log('  SUGGESTED (from ChatGPT):');
      Logger.log('    F - Symptom Code: "' + (row[5] || 'EMPTY') + '"');
      Logger.log('    G - Symptom Name: "' + (row[6] || 'EMPTY') + '"');
      Logger.log('    H - System Code:  "' + (row[7] || 'EMPTY') + '"');
      Logger.log('    I - System Name:  "' + (row[8] || 'EMPTY') + '"');
      Logger.log('');
      Logger.log('  FINAL (to Master):');
      Logger.log('    M - Symptom Code: "' + (row[12] || 'EMPTY') + '"');
      Logger.log('    N - System Code:  "' + (row[13] || 'EMPTY') + '"');
      Logger.log('    O - Symptom Name: "' + (row[14] || 'EMPTY') + '"');
      Logger.log('    P - System Name:  "' + (row[15] || 'EMPTY') + '"');
      Logger.log('');
      Logger.log('  J - AI Reasoning: ' + ((row[9] || 'EMPTY').substring(0, 80)));
      Logger.log('  K - Status: ' + (row[10] || 'EMPTY'));
      Logger.log('');
    }

    Logger.log('═══════════════════════════════════════════════════════════════');
    Logger.log('🔍 DIAGNOSIS');
    Logger.log('═══════════════════════════════════════════════════════════════\n');

    // Diagnose issues
    const issues = [];

    if (emptyColumns.some(function(col) { return col.includes('Spark_Title'); })) {
      issues.push('❌ CRITICAL: Column D (Spark Title) is EMPTY');
      issues.push('   → extractCasesForCategorization() not reading row[1]');
      issues.push('   → OR Master sheet Column B is empty');
    }

    if (emptyColumns.some(function(col) { return col.includes('Reveal_Title'); })) {
      issues.push('❌ CRITICAL: Column E (Reveal Title) is EMPTY');
      issues.push('   → extractCasesForCategorization() not reading row[2]');
      issues.push('   → OR Master sheet Column C is empty');
    }

    if (emptyColumns.some(function(col) { return col.includes('Suggested_Symptom_Code'); })) {
      issues.push('❌ CRITICAL: Column F (Suggested Symptom Code) is EMPTY');
      issues.push('   → ChatGPT returning wrong field name (e.g., "symptom" not "symptomCode")');
      issues.push('   → OR parsing error in processBatchWithOpenAI()');
    }

    if (emptyColumns.some(function(col) { return col.includes('Suggested_Symptom_Name'); })) {
      issues.push('❌ CRITICAL: Column G (Suggested Symptom Name) is EMPTY');
      issues.push('   → ChatGPT not returning "symptomName" field');
      issues.push('   → OR returning "symptom" instead');
    }

    if (emptyColumns.some(function(col) { return col.includes('Suggested_System_Code'); })) {
      issues.push('❌ CRITICAL: Column H (Suggested System Code) is EMPTY');
      issues.push('   → ChatGPT not returning "systemCode" field');
    }

    if (emptyColumns.some(function(col) { return col.includes('Suggested_System_Name'); })) {
      issues.push('❌ CRITICAL: Column I (Suggested System Name) is EMPTY');
      issues.push('   → ChatGPT not returning "systemName" field');
    }

    if (issues.length > 0) {
      Logger.log('ISSUES FOUND:\n');
      issues.forEach(function(issue) {
        Logger.log(issue);
      });

      Logger.log('\n\n🎯 NEXT STEPS:');
      Logger.log('1. Check the categorization execution logs');
      Logger.log('2. Look for debug logs showing ChatGPT response');
      Logger.log('3. Run: getUltimateCategorizationLogs()');
      Logger.log('4. Share the logs with your developer');
    } else {
      Logger.log('✅ All columns have data!');
      Logger.log('   The fix appears to be working correctly.');
    }

    Logger.log('\n═══════════════════════════════════════════════════════════════');
    Logger.log('Also run: getUltimateCategorizationLogs() to see full execution logs');
    Logger.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    Logger.log('❌ ERROR: ' + error.message);
    Logger.log('Stack: ' + error.stack);
  }
}

// Quick helper to view the categorization logs
function VIEW_categorizationLogs() {
  const logs = getUltimateCategorizationLogs();
  logs.forEach(function(log) {
    Logger.log(log);
  });
}
