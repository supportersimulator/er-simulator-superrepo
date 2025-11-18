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

async function analyzeResults() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });

  console.log('🔍 Analyzing AI_Categorization_Results sheet...\n');

  // Create analysis function to run on Apps Script
  const runResponse = await script.scripts.run({
    scriptId: SCRIPT_ID,
    requestBody: {
      function: 'analyzeAICategorizationResults',
      devMode: true
    }
  });

  if (runResponse.data.error) {
    console.error('❌ Error running analysis:', runResponse.data.error.details[0].errorMessage);
    console.log('\nLet me check the execution logs instead...\n');

    // Try to get the latest categorization log
    const logResponse = await script.scripts.run({
      scriptId: SCRIPT_ID,
      requestBody: {
        function: 'getUltimateCategorizationLog',
        devMode: true
      }
    });

    if (logResponse.data.error) {
      console.error('❌ Could not get logs:', logResponse.data.error.details[0].errorMessage);
      return;
    }

    const logs = logResponse.data.response.result;
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('CATEGORIZATION EXECUTION LOGS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(logs);
    return;
  }

  const result = runResponse.data.response.result;

  if (result.error) {
    console.log('❌', result.error);
    return;
  }

  console.log('✅ Analysis Complete\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SHEET OVERVIEW');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Total data rows:', result.totalRows);
  console.log('Total columns:', result.headers.length);
  console.log('');

  console.log('HEADERS (16 columns):');
  result.headers.forEach((h, i) => {
    const col = String.fromCharCode(65 + i);
    console.log(`  ${col}: ${h}`);
  });
  console.log('');

  if (result.emptyColumns.length > 0) {
    console.log('⚠️  EMPTY COLUMNS (checking first 20 rows):');
    result.emptyColumns.forEach(col => console.log(`  - ${col}`));
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SAMPLE DATA (First 5 Cases)');
  console.log('═══════════════════════════════════════════════════════════════');

  result.sampleRows.forEach((row, i) => {
    console.log(`\nCASE ${i + 1}: ${row.Case_Organization_Case_ID}`);
    console.log(`  Spark Title: ${row.Case_Organization_Spark_Title || 'EMPTY'}`);
    console.log(`  Reveal Title: ${row.Case_Organization_Reveal_Title || 'EMPTY'}`);
    console.log('');
    console.log('  SUGGESTED (from ChatGPT):');
    console.log(`    F - Symptom Code: "${row.Suggested_Symptom_Code || 'EMPTY'}"`);
    console.log(`    G - Symptom Name: "${row.Suggested_Symptom_Name || 'EMPTY'}"`);
    console.log(`    H - System Code:  "${row.Suggested_System_Code || 'EMPTY'}"`);
    console.log(`    I - System Name:  "${row.Suggested_System_Name || 'EMPTY'}"`);
    console.log('');
    console.log('  FINAL (copied to Master):');
    console.log(`    M - Symptom Code: "${row.Final_Symptom_Code || 'EMPTY'}"`);
    console.log(`    N - System Code:  "${row.Final_System_Code || 'EMPTY'}"`);
    console.log(`    O - Symptom Name: "${row.Final_Symptom_Name || 'EMPTY'}"`);
    console.log(`    P - System Name:  "${row.Final_System_Name || 'EMPTY'}"`);
    console.log('');
    console.log(`  Status: ${row.Status || 'EMPTY'}`);
    if (row.AI_Reasoning) {
      console.log(`  AI Reasoning: ${row.AI_Reasoning.substring(0, 100)}...`);
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('DIAGNOSIS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Analyze what went wrong
  const issues = [];

  if (result.emptyColumns.includes('Suggested_Symptom_Name')) {
    issues.push('❌ CRITICAL: Suggested_Symptom_Name (column G) is empty');
    issues.push('   → ChatGPT is not returning "symptomName" field');
  }

  if (result.emptyColumns.includes('Suggested_System_Name')) {
    issues.push('❌ CRITICAL: Suggested_System_Name (column I) is empty');
    issues.push('   → ChatGPT is not returning "systemName" field');
  }

  if (result.emptyColumns.includes('Case_Organization_Spark_Title')) {
    issues.push('❌ CRITICAL: Spark Title (column D) is empty');
    issues.push('   → extractCasesForCategorization() not extracting sparkTitle from column B');
  }

  if (result.emptyColumns.includes('Case_Organization_Reveal_Title')) {
    issues.push('❌ CRITICAL: Reveal Title (column E) is empty');
    issues.push('   → extractCasesForCategorization() not extracting revealTitle from column C');
  }

  // Check if Final columns match Suggested
  let mismatch = false;
  result.sampleRows.forEach((row, i) => {
    if (row.Suggested_Symptom_Name !== row.Final_Symptom_Name) {
      if (!mismatch) {
        issues.push(`❌ MISMATCH: Final_Symptom_Name doesn't match Suggested_Symptom_Name`);
        mismatch = true;
      }
    }
  });

  if (issues.length > 0) {
    issues.forEach(issue => console.log(issue));
  } else {
    console.log('✅ No obvious issues detected in the data structure');
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
}

// First, we need to add the analysis function to the Apps Script project
async function addAnalysisFunction() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });

  console.log('📝 Adding temporary analysis function to Apps Script...\n');

  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;

  // Check if analysis function already exists
  const targetFile = files.find(f => f.name === 'Ultimate_Categorization_Tool_Complete');
  if (targetFile && targetFile.source.includes('function analyzeAICategorizationResults()')) {
    console.log('✅ Analysis function already exists, running analysis...\n');
    await analyzeResults();
    return;
  }

  // Add the analysis function
  const analysisFunction = `
function analyzeAICategorizationResults() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resultsSheet = ss.getSheetByName('AI_Categorization_Results');

  if (!resultsSheet) {
    return { error: 'AI_Categorization_Results sheet not found' };
  }

  const data = resultsSheet.getDataRange().getValues();
  const headers = data[0];

  // Get first 5 data rows for analysis
  const sampleRows = data.slice(1, 6).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });

  // Check for empty columns
  const emptyColumns = [];
  headers.forEach((header, idx) => {
    let isEmpty = true;
    for (let i = 1; i < Math.min(data.length, 20); i++) {
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
}
`;

  targetFile.source += analysisFunction;

  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: {
      files: files
    }
  });

  console.log('✅ Analysis function added, running analysis...\n');
  await analyzeResults();
}

addAnalysisFunction().catch(console.error);
