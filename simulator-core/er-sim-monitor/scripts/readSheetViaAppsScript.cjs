const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCRIPT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

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

async function addAndRunAnalysisFunction() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });

  console.log('📝 Adding analysis function to Apps Script project...\n');

  // First, get the current project content
  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;

  // Find the Ultimate_Categorization_Tool_Complete file
  const targetFile = files.find(f => f.name === 'Ultimate_Categorization_Tool_Complete');

  if (!targetFile) {
    console.log('❌ Target file not found');
    return;
  }

  // Add the temporary analysis function
  const analysisFunction = `

// ═══════════════════════════════════════════════════════════════
// TEMPORARY DIAGNOSTIC FUNCTION - Added by deployment script
// ═══════════════════════════════════════════════════════════════

function TEMP_analyzeAICategorizationResults() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const resultsSheet = ss.getSheetByName('AI_Categorization_Results');

    if (!resultsSheet) {
      return { error: 'AI_Categorization_Results sheet not found' };
    }

    const data = resultsSheet.getDataRange().getValues();
    const headers = data[0];

    // Get first 3 data rows
    const sampleRows = [];
    for (let i = 1; i <= Math.min(3, data.length - 1); i++) {
      const row = data[i];
      sampleRows.push({
        caseID: row[0] || '',
        legacyID: row[1] || '',
        rowIndex: row[2] || '',
        sparkTitle: row[3] || '',
        revealTitle: row[4] || '',
        suggestedSymptomCode: row[5] || '',
        suggestedSymptomName: row[6] || '',
        suggestedSystemCode: row[7] || '',
        suggestedSystemName: row[8] || '',
        aiReasoning: row[9] || '',
        status: row[10] || '',
        userDecision: row[11] || '',
        finalSymptomCode: row[12] || '',
        finalSystemCode: row[13] || '',
        finalSymptomName: row[14] || '',
        finalSystemName: row[15] || ''
      });
    }

    // Check for empty columns
    const emptyColumns = [];
    headers.forEach((header, idx) => {
      let isEmpty = true;
      for (let i = 1; i < Math.min(data.length, 10); i++) {
        if (data[i][idx] && data[i][idx] !== '') {
          isEmpty = false;
          break;
        }
      }
      if (isEmpty) emptyColumns.push(header);
    });

    return {
      totalRows: data.length - 1,
      headers: headers,
      emptyColumns: emptyColumns,
      sampleRows: sampleRows
    };
  } catch (error) {
    return { error: error.message, stack: error.stack };
  }
}
`;

  // Check if function already exists
  if (targetFile.source.includes('function TEMP_analyzeAICategorizationResults()')) {
    console.log('✅ Analysis function already exists\n');
  } else {
    console.log('📝 Adding analysis function...\n');
    targetFile.source += analysisFunction;

    await script.projects.updateContent({
      scriptId: SCRIPT_ID,
      requestBody: { files: files }
    });

    console.log('✅ Analysis function added\n');
  }

  // Now run the function
  console.log('🔍 Running analysis...\n');

  const runResponse = await script.scripts.run({
    scriptId: SCRIPT_ID,
    requestBody: {
      function: 'TEMP_analyzeAICategorizationResults',
      devMode: false
    }
  });

  if (runResponse.data.error) {
    console.error('❌ Error:', runResponse.data.error.details[0].errorMessage);
    return;
  }

  const result = runResponse.data.response.result;

  if (result.error) {
    console.log('❌ Error from function:', result.error);
    if (result.stack) console.log('Stack:', result.stack);
    return;
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('AI_CATEGORIZATION_RESULTS ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('Total data rows:', result.totalRows);
  console.log('Total columns:', result.headers.length);
  console.log('');

  console.log('HEADERS:');
  result.headers.forEach((h, i) => {
    const col = String.fromCharCode(65 + i);
    console.log(`  ${col}: ${h}`);
  });
  console.log('');

  if (result.emptyColumns.length > 0) {
    console.log('⚠️  EMPTY COLUMNS (first 10 rows):');
    result.emptyColumns.forEach(col => console.log(`  - ${col}`));
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SAMPLE DATA (First 3 Cases)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  result.sampleRows.forEach((row, i) => {
    console.log(`CASE ${i + 1}: ${row.caseID}`);
    console.log(`  D - Spark Title: ${row.sparkTitle || 'EMPTY'}`);
    console.log(`  E - Reveal Title: ${row.revealTitle || 'EMPTY'}`);
    console.log('');
    console.log('  SUGGESTED (from ChatGPT):');
    console.log(`    F - Symptom Code: "${row.suggestedSymptomCode || 'EMPTY'}"`);
    console.log(`    G - Symptom Name: "${row.suggestedSymptomName || 'EMPTY'}"`);
    console.log(`    H - System Code:  "${row.suggestedSystemCode || 'EMPTY'}"`);
    console.log(`    I - System Name:  "${row.suggestedSystemName || 'EMPTY'}"`);
    console.log('');
    console.log('  FINAL (to Master):');
    console.log(`    M - Symptom Code: "${row.finalSymptomCode || 'EMPTY'}"`);
    console.log(`    N - System Code:  "${row.finalSystemCode || 'EMPTY'}"`);
    console.log(`    O - Symptom Name: "${row.finalSymptomName || 'EMPTY'}"`);
    console.log(`    P - System Name:  "${row.finalSystemName || 'EMPTY'}"`);
    console.log('');
    console.log(`  Status: ${row.status || 'EMPTY'}`);
    if (row.aiReasoning) {
      console.log(`  AI Reasoning: ${row.aiReasoning.substring(0, 80)}...`);
    }
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 SHERLOCK HOLMES DIAGNOSIS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const issues = [];

  // Check Spark/Reveal titles
  if (result.emptyColumns.includes('Case_Organization_Spark_Title')) {
    issues.push('❌ CRITICAL: Spark Title (Column D) is EMPTY');
    issues.push('   Cause: extractCasesForCategorization() not reading row[1]');
    issues.push('   OR Master sheet Column B is empty');
  }

  if (result.emptyColumns.includes('Case_Organization_Reveal_Title')) {
    issues.push('❌ CRITICAL: Reveal Title (Column E) is EMPTY');
    issues.push('   Cause: extractCasesForCategorization() not reading row[2]');
    issues.push('   OR Master sheet Column C is empty');
  }

  // Check ChatGPT suggestions
  if (result.emptyColumns.includes('Suggested_Symptom_Code')) {
    issues.push('❌ CRITICAL: Suggested Symptom Code (Column F) is EMPTY');
    issues.push('   Cause: ChatGPT returning wrong field name (e.g., "symptom" instead of "symptomCode")');
    issues.push('   OR processBatchWithOpenAI() parsing error');
  }

  if (result.emptyColumns.includes('Suggested_Symptom_Name')) {
    issues.push('❌ CRITICAL: Suggested Symptom Name (Column G) is EMPTY');
    issues.push('   Cause: ChatGPT returning wrong field name (e.g., "symptom" instead of "symptomName")');
    issues.push('   OR not returning symptomName at all');
  }

  if (result.emptyColumns.includes('Suggested_System_Code')) {
    issues.push('❌ CRITICAL: Suggested System Code (Column H) is EMPTY');
    issues.push('   Cause: ChatGPT returning wrong field name (e.g., "system" instead of "systemCode")');
  }

  if (result.emptyColumns.includes('Suggested_System_Name')) {
    issues.push('❌ CRITICAL: Suggested System Name (Column I) is EMPTY');
    issues.push('   Cause: ChatGPT returning wrong field name OR not returning systemName');
  }

  if (issues.length > 0) {
    console.log('ISSUES FOUND:\n');
    issues.forEach(issue => console.log(issue));

    console.log('\n\n🎯 RECOMMENDED FIX:');
    console.log('The deployed functions are correct. The issue is likely:');
    console.log('1. The OLD CODE is still running (script not refreshed)');
    console.log('2. OR ChatGPT is returning old field names');
    console.log('\nNext steps:');
    console.log('1. Close and reopen the spreadsheet');
    console.log('2. Delete AI_Categorization_Results sheet');
    console.log('3. Run Ultimate Categorization Tool again');
    console.log('4. Check the debug logs for what ChatGPT actually returns');
  } else {
    console.log('✅ All columns have data! The fix is working correctly.');
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
}

addAndRunAnalysisFunction().catch(console.error);
