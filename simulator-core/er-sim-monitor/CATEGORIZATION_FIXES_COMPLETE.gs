// ═══════════════════════════════════════════════════════════════
// UPDATED FUNCTIONS FOR ULTIMATE CATEGORIZATION TOOL
// Changes: Add Spark/Reveal titles, 4-column output (P,Q,R,S), system codes
// Date: November 13, 2025
// ═══════════════════════════════════════════════════════════════

// FUNCTION 1: Extract Cases (UPDATED)
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

// FUNCTION 2: Build Categorization Prompt (UPDATED)
function buildCategorizationPrompt(cases, validSymptoms, validSystems) {
  // All valid symptom codes from accronym_symptom_system_mapping sheet
  const symptomCodesList = 'CP, SOB, ABD, HA, AMS, SYNC, SZ, DIZZ, WEAK, NT, GLF, TR, MVC, BURN, FX, HEAD, LAC, GI, GU, GYN, OB, DERM, EYE, ENT, PSY, ACLS, SHOC, TOX, ENV, END, HEM, INF, PCP, PSOB, PABD, PFEV, PSZ, PTR, P, PEDS';

  let prompt = 'You are a medical education expert. Categorize these emergency medicine simulation cases for emergency department training.\n\n';

  prompt += 'VALID SYMPTOM CODES:\n' + symptomCodesList + '\n\n';
  prompt += 'VALID SYSTEM CATEGORIES (examples):\n' + validSystems + '\n\n';

  prompt += 'CRITICAL CATEGORIZATION RULES:\n';
  prompt += '1. Base categorization on the MEDICAL DIAGNOSIS revealed in the case title, not on metadata\n';
  prompt += '2. "Spark Title" is the initial presentation, "Reveal Title" is the actual diagnosis\n';
  prompt += '3. If a case mentions "nightmare" or other descriptive terms, ignore those - focus ONLY on the actual medical condition\n';
  prompt += '4. Categorize by PRIMARY presenting symptom and PRIMARY affected body system\n';
  prompt += '5. Psychiatric (PSY) should ONLY be used if the diagnosis itself is psychiatric\n';
  prompt += '6. Ignore case difficulty labels, teaching series names, or educational metadata\n\n';

  prompt += 'REQUIRED OUTPUT FORMAT:\n';
  prompt += 'Return a JSON array with these EXACT fields:\n';
  prompt += '  - "symptomCode": acronym from valid symptom codes list (e.g., "CP", "SOB")\n';
  prompt += '  - "symptomName": FULL ENGLISH NAME - NOT acronym (e.g., "Chest Pain", "Shortness of Breath")\n';
  prompt += '  - "systemCode": short code for system (e.g., "CARD", "RESP", "GI", "NEURO")\n';
  prompt += '  - "systemName": FULL NAME (e.g., "Cardiovascular", "Respiratory", "Gastrointestinal")\n';
  prompt += '  - "reasoning": brief explanation based on diagnosis\n\n';

  prompt += '⚠️ CRITICAL: \n';
  prompt += '  • "symptomName" must be FULL NAME like "Chest Pain" NOT "CP"\n';
  prompt += '  • "systemName" must be FULL NAME like "Cardiovascular" NOT "CARD"\n';
  prompt += '  • The codes go in "symptomCode" and "systemCode"\n\n';

  prompt += 'CASES TO CATEGORIZE:\n[\n';
  cases.forEach(function(c, i) {
    prompt += '  {\n';
    prompt += '    "caseID": "' + c.caseID + '",\n';
    prompt += '    "sparkTitle": "' + c.sparkTitle + '",\n';
    prompt += '    "revealTitle": "' + c.revealTitle + '"\n';
    prompt += '  }' + (i < cases.length - 1 ? ',' : '') + '\n';
  });
  prompt += ']\n\n';

  prompt += 'Return ONLY a JSON array with this structure:\n[\n';
  prompt += '  {\n';
  prompt += '    "symptomCode": "CP",\n';
  prompt += '    "symptomName": "Chest Pain",\n';
  prompt += '    "systemCode": "CARD",\n';
  prompt += '    "systemName": "Cardiovascular",\n';
  prompt += '    "reasoning": "brief explanation"\n';
  prompt += '  }\n';
  prompt += ']\n\n';
  prompt += 'ALL fields are REQUIRED for each case. Return ONLY valid JSON, no other text.\n';

  return prompt;
}

// FUNCTION 3: Write Categorization Results (UPDATED)
function writeCategorizationResults(cases, categorizations) {
  addUltimateCategorizationLog('     📝 writeCategorizationResults() - Starting...');
  addUltimateCategorizationLog('       Cases to write: ' + cases.length);
  addUltimateCategorizationLog('       Categorizations received: ' + categorizations.length);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let resultsSheet = ss.getSheetByName('AI_Categorization_Results');

  if (!resultsSheet) {
    addUltimateCategorizationLog('       📋 Results sheet not found - creating new sheet...');
    resultsSheet = ss.insertSheet('AI_Categorization_Results');
    // Create header structure with 16 columns (A-P)
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

  // Get mapping for fallback symptom names
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

    // Calculate status based on current values
    let status = 'new';
    if (caseData.currentSymptomCode && caseData.currentSymptomCode === suggestedSymptomCode) {
      status = 'match';
    } else if (caseData.currentSymptomCode && caseData.currentSymptomCode !== suggestedSymptomCode) {
      status = 'conflict';
    }

    // DEBUG: Log first 3 cases to verify ChatGPT response
    if (idx < 3) {
      addUltimateCategorizationLog('       🔍 DEBUG Case ' + (idx + 1) + ' (' + caseData.caseID + '):');
      addUltimateCategorizationLog('         GPT symptomCode: "' + (cat.symptomCode || 'UNDEFINED') + '"');
      addUltimateCategorizationLog('         GPT symptomName: "' + (cat.symptomName || 'UNDEFINED') + '"');
      addUltimateCategorizationLog('         GPT systemCode: "' + (cat.systemCode || 'UNDEFINED') + '"');
      addUltimateCategorizationLog('         GPT systemName: "' + (cat.systemName || 'UNDEFINED') + '"');
      addUltimateCategorizationLog('         Fallback mapping[' + cat.symptomCode + ']: "' + (mapping[cat.symptomCode] || 'UNDEFINED') + '"');
    }

    // Write results in correct column order (A through P) - 16 columns
    resultsSheet.getRange(nextRow, 1, 1, 16).setValues([[
      caseData.caseID,                     // A: Case_Organization_Case_ID
      caseData.legacyCaseID,               // B: Legacy_Case_ID
      caseData.rowIndex,                   // C: Row_Index
      caseData.sparkTitle,                 // D: Case_Organization_Spark_Title
      caseData.revealTitle,                // E: Case_Organization_Reveal_Title
      suggestedSymptomCode,                // F: Suggested_Symptom_Code (e.g., "CP")
      suggestedSymptomName,                // G: Suggested_Symptom_Name (e.g., "Chest Pain")
      suggestedSystemCode,                 // H: Suggested_System_Code (e.g., "CARD")
      suggestedSystemName,                 // I: Suggested_System_Name (e.g., "Cardiovascular")
      cat.reasoning || '',                 // J: AI_Reasoning
      status,                              // K: Status
      '',                                  // L: User_Decision
      suggestedSymptomCode,                // M: Final_Symptom_Code (copy from F)
      suggestedSystemCode,                 // N: Final_System_Code (copy from H)
      suggestedSymptomName,                // O: Final_Symptom_Name (copy from G)
      suggestedSystemName                  // P: Final_System_Name (copy from I)
    ]]);
    nextRow++;
    newRowsWritten++;
  });

  addUltimateCategorizationLog('       ✅ Write complete:');
  addUltimateCategorizationLog('         New rows written: ' + newRowsWritten);
  addUltimateCategorizationLog('         Duplicates skipped: ' + duplicatesSkipped);
  addUltimateCategorizationLog('         Final row: ' + (nextRow - 1));
}

// FUNCTION 4: Apply Categorization to Master (UPDATED)
function applyCategorizationToMaster() {
  addUltimateCategorizationLog('🔄 applyCategorizationToMaster() - Starting...');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resultsSheet = ss.getSheetByName('AI_Categorization_Results');

  if (!resultsSheet) {
    addUltimateCategorizationLog('❌ AI_Categorization_Results sheet not found');
    return;
  }

  // Get the Master Scenario Convert sheet by GID
  const masterGID = '1564998840';
  const sheets = ss.getSheets();
  let masterSheet = null;

  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId().toString() === masterGID) {
      masterSheet = sheets[i];
      break;
    }
  }

  if (!masterSheet) {
    addUltimateCategorizationLog('❌ Master Scenario Convert sheet not found (GID: ' + masterGID + ')');
    return;
  }

  addUltimateCategorizationLog('✅ Found Master sheet: ' + masterSheet.getName());

  // Read all results
  const resultsData = resultsSheet.getDataRange().getValues();
  const resultsHeaders = resultsData[0];

  // Find column indices in results sheet
  const caseIDIdx = resultsHeaders.indexOf('Case_Organization_Case_ID');
  const finalSymptomCodeIdx = resultsHeaders.indexOf('Final_Symptom_Code');      // M
  const finalSystemCodeIdx = resultsHeaders.indexOf('Final_System_Code');        // N
  const finalSymptomNameIdx = resultsHeaders.indexOf('Final_Symptom_Name');      // O
  const finalSystemNameIdx = resultsHeaders.indexOf('Final_System_Name');        // P

  if (caseIDIdx === -1 || finalSymptomCodeIdx === -1 || finalSystemCodeIdx === -1 ||
      finalSymptomNameIdx === -1 || finalSystemNameIdx === -1) {
    addUltimateCategorizationLog('❌ Required columns not found in results sheet');
    addUltimateCategorizationLog('   Looking for: Case_Organization_Case_ID, Final_Symptom_Code, Final_System_Code, Final_Symptom_Name, Final_System_Name');
    return;
  }

  addUltimateCategorizationLog('✅ Found all required columns in results sheet');

  // Read Master sheet
  const masterData = masterSheet.getDataRange().getValues();
  const masterCaseIDIdx = 0; // Column A

  let updatedCount = 0;
  let matchedCount = 0;

  // Process each result row (skip header)
  for (let i = 1; i < resultsData.length; i++) {
    const caseID = resultsData[i][caseIDIdx];
    if (!caseID) continue;

    const finalSymptomCode = resultsData[i][finalSymptomCodeIdx];
    const finalSystemCode = resultsData[i][finalSystemCodeIdx];
    const finalSymptomName = resultsData[i][finalSymptomNameIdx];
    const finalSystemName = resultsData[i][finalSystemNameIdx];

    // Find matching row in Master (data starts at row 3, which is index 2)
    for (let j = 2; j < masterData.length; j++) {
      if (masterData[j][masterCaseIDIdx] === caseID) {
        matchedCount++;

        // Write to columns P, Q, R, S (indices 15, 16, 17, 18)
        // Note: getRange uses 1-based indexing, so row j+1 and columns 16-19
        masterSheet.getRange(j + 1, 16).setValue(finalSymptomCode);  // Column P
        masterSheet.getRange(j + 1, 17).setValue(finalSystemCode);   // Column Q
        masterSheet.getRange(j + 1, 18).setValue(finalSymptomName);  // Column R
        masterSheet.getRange(j + 1, 19).setValue(finalSystemName);   // Column S

        updatedCount++;

        // Log first 3 updates for verification
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
  addUltimateCategorizationLog('   Target columns: P (Symptom Code), Q (System Code), R (Symptom Name), S (System Name)');
  addUltimateCategorizationLog('   Master sheet: ' + masterSheet.getName() + ' (GID: ' + masterGID + ')');
}

// ═══════════════════════════════════════════════════════════════
// END OF UPDATED FUNCTIONS
//
// INSTRUCTIONS:
// 1. Copy the 4 functions above
// 2. In Apps Script editor, find and replace each function with its updated version
// 3. Save the project
// 4. Test with 5 cases first
// ═══════════════════════════════════════════════════════════════
