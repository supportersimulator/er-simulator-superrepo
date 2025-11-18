/**
 * DIAGNOSTIC FUNCTION - Paste this into Apps Script and run it
 * This will show you exactly what's in the AI_Categorization_Results sheet
 */
function diagnoseAICategorizationSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('AI_Categorization_Results');

  if (!sheet) {
    Logger.log('❌ AI_Categorization_Results sheet not found');
    return;
  }

  Logger.log('📊 DIAGNOSTIC REPORT FOR AI_CATEGORIZATION_RESULTS');
  Logger.log('='.repeat(60));
  Logger.log('');

  // Get headers
  const headers = sheet.getRange(1, 1, 1, 15).getValues()[0];
  Logger.log('📋 HEADERS:');
  headers.forEach((header, idx) => {
    const col = String.fromCharCode(65 + idx);
    Logger.log(`   ${col} (idx ${idx}): ${header}`);
  });
  Logger.log('');

  // Get first 5 data rows
  const data = sheet.getRange(2, 1, Math.min(5, sheet.getLastRow() - 1), 15).getValues();

  Logger.log('📊 FIRST 5 DATA ROWS:');
  Logger.log('');

  data.forEach((row, idx) => {
    const rowNum = idx + 2;
    Logger.log(`ROW ${rowNum}:`);
    Logger.log(`  A (Case_ID): "${row[0]}"`);
    Logger.log(`  B (Legacy_Case_ID): "${row[1]}"`);
    Logger.log(`  C (Row_Index): "${row[2]}"`);
    Logger.log(`  D (Current_Symptom): "${row[3]}"`);
    Logger.log(`  E (Current_System): "${row[4]}"`);
    Logger.log(`  F (Suggested_Symptom): "${row[5]}"`);
    Logger.log(`  G (Suggested_Symptom_Name): "${row[6]}"`);
    Logger.log(`  H (Suggested_System): "${row[7]}"`);
    Logger.log(`  I (AI_Reasoning): "${row[8] ? row[8].substring(0, 50) + '...' : ''}"`);
    Logger.log(`  M (Final_Symptom): "${row[12]}"`);
    Logger.log(`  N (Final_System): "${row[13]}"`);
    Logger.log('');
  });

  Logger.log('='.repeat(60));
  Logger.log('✅ Diagnostic complete - check Execution log above');
}
