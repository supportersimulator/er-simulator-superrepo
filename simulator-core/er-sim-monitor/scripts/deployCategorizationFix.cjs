const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCRIPT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

function getOAuth2Client() {
  const clasprcPath = path.join(process.env.HOME, '.clasprc.json');
  const credentials = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));
  const token = credentials.tokens.default;

  const oauth2Client = new google.auth.OAuth2(
    token.client_id,
    token.client_secret
  );

  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_type: token.token_type,
    expiry_date: token.expiry_date
  });

  return oauth2Client;
}

// The 4 updated functions as strings
const EXTRACTION_FUNCTION = `
function extractCasesForCategorization(data, headers) {
  const cases = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const caseID = row[0] || '';  // Column A: Case_Organization_Case_ID
    if (caseID && caseID !== 'Case_Organization_Case_ID') {  // Skip header row if present
      cases.push({
        rowIndex: i + 3,                      // Actual row number in sheet (data starts row 3)
        caseID: caseID,                       // A (idx 0): Case_Organization_Case_ID
        sparkTitle: row[1] || '',             // B (idx 1): Case_Organization_Spark_Title
        revealTitle: row[2] || '',            // C (idx 2): Case_Organization_Reveal_Title
        legacyCaseID: row[8] || '',           // I (idx 8): Case_Organization_Legacy_Case_ID
        currentSymptomCode: row[15] || '',    // P (idx 15): Case_Organization_Category_Symptom_Code
        currentSystemCode: row[16] || '',     // Q (idx 16): Case_Organization_Category_System_Code
        currentSymptomName: row[17] || '',    // R (idx 17): Case_Organization_Category_Symptom
        currentSystemName: row[18] || ''      // S (idx 18): Case_Organization_Category_System
      });
    }
  }
  return cases;
}
`;

const PROMPT_FUNCTION = `
function buildCategorizationPrompt(cases, validSymptoms, validSystems) {
  // Get the actual mapping data from the sheet
  const mapping = getAccronymMapping();

  // Build the standardized symptom list from mapping
  let symptomMappingText = 'STANDARDIZED SYMPTOM CODES AND NAMES (from accronym_symptom_system_mapping sheet):\\n';
  symptomMappingText += 'You MUST match these EXACTLY:\\n\\n';

  for (let code in mapping) {
    symptomMappingText += '  ' + code + ' → ' + mapping[code] + '\\n';
  }

  let prompt = 'You are a medical education expert categorizing emergency medicine simulation cases.\\n\\n';
  prompt += 'This data will be returned to a spreadsheet with 4 specific fields. Please follow these rules:\\n\\n';

  prompt += symptomMappingText + '\\n';

  prompt += 'SYSTEM CODES:\\n';
  prompt += 'Create SHORT codes for systems (this is challenging to standardize, so do your best).\\n';
  prompt += 'Examples: CARD (Cardiovascular), RESP (Respiratory), GI (Gastrointestinal), NEURO (Neurological), ENDO (Endocrine), INF (Infectious), TRAUMA (Trauma), PEDS (Pediatric), OB (Obstetric), GYN (Gynecological), PSYCH (Psychiatric), ENV (Environmental), TOX (Toxicology), HEM (Hematologic), DERM (Dermatologic), EYE (Ophthalmologic), ENT (Ear/Nose/Throat)\\n\\n';

  prompt += 'CRITICAL CATEGORIZATION RULES:\\n';
  prompt += '1. symptomCode: MUST be from the standardized list above (acronym only, e.g., "CP", "SOB")\\n';
  prompt += '2. symptomName: MUST EXACTLY MATCH the full name from the standardized list (e.g., "Chest Pain", NOT variations)\\n';
  prompt += '3. systemCode: Create a short code that makes sense (e.g., "CARD", "RESP")\\n';
  prompt += '4. systemName: FULL name (e.g., "Cardiovascular", "Respiratory", "Gastrointestinal")\\n';
  prompt += '5. Base categorization on the MEDICAL DIAGNOSIS (Reveal Title), not educational metadata\\n';
  prompt += '6. Ignore case series names, difficulty labels, or terms like "nightmare"\\n';
  prompt += '7. Focus on PRIMARY presenting symptom and PRIMARY affected body system\\n\\n';

  prompt += 'RETURN FORMAT: The data goes into a spreadsheet with these 4 fields:\\n';
  prompt += '  - symptomCode: Acronym from standardized list\\n';
  prompt += '  - symptomName: EXACT full name from standardized list\\n';
  prompt += '  - systemCode: Short code you create\\n';
  prompt += '  - systemName: Full system name\\n\\n';

  prompt += 'CASES TO CATEGORIZE:\\n[\\n';
  cases.forEach(function(c, i) {
    prompt += '  {\\n';
    prompt += '    "caseID": "' + c.caseID + '",\\n';
    prompt += '    "sparkTitle": "' + c.sparkTitle + '",\\n';
    prompt += '    "revealTitle": "' + c.revealTitle + '"\\n';
    prompt += '  }' + (i < cases.length - 1 ? ',' : '') + '\\n';
  });
  prompt += ']\\n\\n';

  prompt += 'Return ONLY a JSON array:\\n[\\n';
  prompt += '  {\\n';
  prompt += '    "symptomCode": "CP",\\n';
  prompt += '    "symptomName": "Chest Pain",\\n';
  prompt += '    "systemCode": "CARD",\\n';
  prompt += '    "systemName": "Cardiovascular",\\n';
  prompt += '    "reasoning": "brief explanation"\\n';
  prompt += '  }\\n';
  prompt += ']\\n\\n';
  prompt += 'ALL fields REQUIRED. symptomName must EXACTLY match standardized list. Return ONLY valid JSON.\\n';

  return prompt;
}
`;

const WRITE_FUNCTION = `
function writeCategorizationResults(cases, categorizations) {
  addUltimateCategorizationLog('     📝 writeCategorizationResults() - Starting...');
  addUltimateCategorizationLog('       Cases to write: ' + cases.length);
  addUltimateCategorizationLog('       Categorizations received: ' + categorizations.length);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let resultsSheet = ss.getSheetByName('AI_Categorization_Results');

  if (!resultsSheet) {
    addUltimateCategorizationLog('       📋 Results sheet not found - creating new sheet...');
    resultsSheet = ss.insertSheet('AI_Categorization_Results');
    resultsSheet.getRange(1, 1, 1, 16).setValues([[
      'Case_Organization_Case_ID',
      'Legacy_Case_ID',
      'Row_Index',
      'Case_Organization_Spark_Title',
      'Case_Organization_Reveal_Title',
      'Suggested_Symptom_Code',
      'Suggested_Symptom_Name',
      'Suggested_System_Code',
      'Suggested_System_Name',
      'AI_Reasoning',
      'Status',
      'User_Decision',
      'Final_Symptom_Code',
      'Final_System_Code',
      'Final_Symptom_Name',
      'Final_System_Name'
    ]]);
    addUltimateCategorizationLog('       ✅ Created new sheet with 16 columns (A-P)');
  } else {
    addUltimateCategorizationLog('       ✅ Results sheet found');
  }

  const existingLastRow = resultsSheet.getLastRow();
  addUltimateCategorizationLog('       Current last row: ' + existingLastRow);

  let existingCaseIDs = new Set();
  if (existingLastRow > 1) {
    addUltimateCategorizationLog('       🔍 Checking for duplicate Case IDs...');
    const existingData = resultsSheet.getRange(2, 1, existingLastRow - 1, 16).getValues();
    existingData.forEach(function(row) { if (row[0]) existingCaseIDs.add(row[0]); });
    addUltimateCategorizationLog('       Found ' + existingCaseIDs.size + ' existing Case IDs');
  }

  let nextRow = resultsSheet.getLastRow() + 1;
  addUltimateCategorizationLog('       Next available row: ' + nextRow);

  let newRowsWritten = 0;
  let duplicatesSkipped = 0;

  const mapping = getAccronymMapping();

  cases.forEach(function(caseData, idx) {
    if (existingCaseIDs.has(caseData.caseID)) {
      duplicatesSkipped++;
      return;
    }

    const cat = categorizations[idx] || {};
    const suggestedSymptomCode = cat.symptomCode || '';
    const suggestedSymptomName = cat.symptomName || mapping[cat.symptomCode] || '';
    const suggestedSystemCode = cat.systemCode || '';
    const suggestedSystemName = cat.systemName || '';

    let status = 'new';
    if (caseData.currentSymptomCode && caseData.currentSymptomCode === suggestedSymptomCode) {
      status = 'match';
    } else if (caseData.currentSymptomCode && caseData.currentSymptomCode !== suggestedSymptomCode) {
      status = 'conflict';
    }

    if (idx < 3) {
      addUltimateCategorizationLog('       🔍 DEBUG Case ' + (idx + 1) + ' (' + caseData.caseID + '):');
      addUltimateCategorizationLog('         GPT symptomCode: "' + (cat.symptomCode || 'UNDEFINED') + '"');
      addUltimateCategorizationLog('         GPT symptomName: "' + (cat.symptomName || 'UNDEFINED') + '"');
      addUltimateCategorizationLog('         GPT systemCode: "' + (cat.systemCode || 'UNDEFINED') + '"');
      addUltimateCategorizationLog('         GPT systemName: "' + (cat.systemName || 'UNDEFINED') + '"');
      addUltimateCategorizationLog('         Fallback mapping[' + cat.symptomCode + ']: "' + (mapping[cat.symptomCode] || 'UNDEFINED') + '"');
    }

    resultsSheet.getRange(nextRow, 1, 1, 16).setValues([[
      caseData.caseID,                     // A: Case_Organization_Case_ID
      caseData.legacyCaseID,               // B: Legacy_Case_ID
      caseData.rowIndex,                   // C: Row_Index
      caseData.sparkTitle,                 // D: Case_Organization_Spark_Title
      caseData.revealTitle,                // E: Case_Organization_Reveal_Title
      suggestedSymptomCode,                // F: Suggested_Symptom_Code
      suggestedSymptomName,                // G: Suggested_Symptom_Name
      suggestedSystemCode,                 // H: Suggested_System_Code
      suggestedSystemName,                 // I: Suggested_System_Name
      cat.reasoning || '',                 // J: AI_Reasoning
      status,                              // K: Status
      '',                                  // L: User_Decision
      suggestedSymptomCode,                // M: Final_Symptom_Code
      suggestedSystemCode,                 // N: Final_System_Code
      suggestedSymptomName,                // O: Final_Symptom_Name
      suggestedSystemName                  // P: Final_System_Name
    ]]);
    nextRow++;
    newRowsWritten++;
  });

  addUltimateCategorizationLog('       ✅ Write complete:');
  addUltimateCategorizationLog('         New rows written: ' + newRowsWritten);
  addUltimateCategorizationLog('         Duplicates skipped: ' + duplicatesSkipped);
  addUltimateCategorizationLog('         Final row: ' + (nextRow - 1));
}
`;

const APPLY_FUNCTION = `
function applyCategorizationToMaster() {
  addUltimateCategorizationLog('🔄 applyCategorizationToMaster() - Starting...');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resultsSheet = ss.getSheetByName('AI_Categorization_Results');

  if (!resultsSheet) {
    addUltimateCategorizationLog('❌ AI_Categorization_Results sheet not found');
    return;
  }

  const masterSheet = getMasterScenarioConvertSheet_();
  addUltimateCategorizationLog('✅ Found Master sheet: ' + masterSheet.getName());

  const resultsData = resultsSheet.getDataRange().getValues();
  const resultsHeaders = resultsData[0];

  const caseIDIdx = resultsHeaders.indexOf('Case_Organization_Case_ID');
  const finalSymptomCodeIdx = resultsHeaders.indexOf('Final_Symptom_Code');
  const finalSystemCodeIdx = resultsHeaders.indexOf('Final_System_Code');
  const finalSymptomNameIdx = resultsHeaders.indexOf('Final_Symptom_Name');
  const finalSystemNameIdx = resultsHeaders.indexOf('Final_System_Name');

  if (caseIDIdx === -1 || finalSymptomCodeIdx === -1 || finalSystemCodeIdx === -1 ||
      finalSymptomNameIdx === -1 || finalSystemNameIdx === -1) {
    addUltimateCategorizationLog('❌ Required columns not found in results sheet');
    return;
  }

  addUltimateCategorizationLog('✅ Found all required columns in results sheet');

  const masterData = masterSheet.getDataRange().getValues();
  const masterCaseIDIdx = 0;

  let updatedCount = 0;
  let matchedCount = 0;

  for (let i = 1; i < resultsData.length; i++) {
    const caseID = resultsData[i][caseIDIdx];
    if (!caseID) continue;

    const finalSymptomCode = resultsData[i][finalSymptomCodeIdx];
    const finalSystemCode = resultsData[i][finalSystemCodeIdx];
    const finalSymptomName = resultsData[i][finalSymptomNameIdx];
    const finalSystemName = resultsData[i][finalSystemNameIdx];

    for (let j = 2; j < masterData.length; j++) {
      if (masterData[j][masterCaseIDIdx] === caseID) {
        matchedCount++;

        masterSheet.getRange(j + 1, 16).setValue(finalSymptomCode);
        masterSheet.getRange(j + 1, 17).setValue(finalSystemCode);
        masterSheet.getRange(j + 1, 18).setValue(finalSymptomName);
        masterSheet.getRange(j + 1, 19).setValue(finalSystemName);

        updatedCount++;

        if (updatedCount <= 3) {
          addUltimateCategorizationLog('  ✅ Row ' + (j+1) + ' - ' + caseID + ':');
          addUltimateCategorizationLog('     P: ' + finalSymptomCode);
          addUltimateCategorizationLog('     Q: ' + finalSystemCode);
          addUltimateCategorizationLog('     R: ' + finalSymptomName);
          addUltimateCategorizationLog('     S: ' + finalSystemName);
        }
        break;
      }
    }
  }

  addUltimateCategorizationLog('');
  addUltimateCategorizationLog('✅ Apply to Master Complete:');
  addUltimateCategorizationLog('   Cases processed: ' + (resultsData.length - 1));
  addUltimateCategorizationLog('   Cases matched: ' + matchedCount);
  addUltimateCategorizationLog('   Cases updated: ' + updatedCount);
  addUltimateCategorizationLog('   Target columns: P, Q, R, S');
}
`;

async function deployFixes() {
  try {
    console.log('🔑 Authenticating with Apps Script API...');
    const auth = getOAuth2Client();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Fetching current project...\n');
    const getResponse = await script.projects.getContent({
      scriptId: SCRIPT_ID
    });

    const files = getResponse.data.files;
    const targetFile = files.find(f => f.name === 'Ultimate_Categorization_Tool_Complete');

    if (!targetFile) {
      console.log('❌ Ultimate_Categorization_Tool_Complete.gs not found');
      return;
    }

    console.log('✅ Found target file');
    console.log('📝 Replacing 4 functions...\n');

    let updatedCode = targetFile.source;

    // Replace each function
    const functions = [
      { name: 'extractCasesForCategorization', code: EXTRACTION_FUNCTION },
      { name: 'buildCategorizationPrompt', code: PROMPT_FUNCTION },
      { name: 'writeCategorizationResults', code: WRITE_FUNCTION },
      { name: 'applyCategorizationToMaster', code: APPLY_FUNCTION }
    ];

    functions.forEach(func => {
      const regex = new RegExp(`function ${func.name}[\\s\\S]*?\\n}(?=\\n(?:function|\\/))`);
      if (updatedCode.match(regex)) {
        updatedCode = updatedCode.replace(regex, func.code.trim());
        console.log(`✅ Replaced ${func.name}()`);
      } else {
        console.log(`⚠️  Could not find ${func.name}() - skipping`);
      }
    });

    targetFile.source = updatedCode;

    console.log('\n🚀 Deploying to Apps Script...');
    await script.projects.updateContent({
      scriptId: SCRIPT_ID,
      requestBody: {
        files: files
      }
    });

    console.log('✅ Deployment successful!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎉 ALL FIXES DEPLOYED!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Next steps:');
    console.log('1. Open your spreadsheet');
    console.log('2. Delete or clear AI_Categorization_Results sheet');
    console.log('3. Run Ultimate Categorization Tool');
    console.log('4. Test with 5-10 cases first');
    console.log('5. Check the debug logs for first 3 cases');
    console.log('6. Verify columns M, O, P have full names\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

deployFixes();
