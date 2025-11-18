# 🚀 Manual Deployment Instructions

Since the automated deployment had issues with regex matching, here are step-by-step manual instructions:

## 📝 Functions to Update (4 total)

### **1. extractCasesForCategorization (Line ~1310)**

**Find this function and replace it with:**

```javascript
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
```

---

### **2. buildCategorizationPrompt (Line ~1420)**

**Find this function and replace it with:**

```javascript
function buildCategorizationPrompt(cases, validSymptoms, validSystems) {
  // Get the actual mapping data from the sheet
  const mapping = getAccronymMapping();

  // Build the standardized symptom list from mapping
  let symptomMappingText = 'STANDARDIZED SYMPTOM CODES AND NAMES (from accronym_symptom_system_mapping sheet):\n';
  symptomMappingText += 'You MUST match these EXACTLY:\n\n';

  for (let code in mapping) {
    symptomMappingText += '  ' + code + ' → ' + mapping[code] + '\n';
  }

  let prompt = 'You are a medical education expert categorizing emergency medicine simulation cases.\n\n';
  prompt += 'This data will be returned to a spreadsheet with 4 specific fields. Please follow these rules:\n\n';

  prompt += symptomMappingText + '\n';

  prompt += 'SYSTEM CODES:\n';
  prompt += 'Create SHORT codes for systems (this is challenging to standardize, so do your best).\n';
  prompt += 'Examples: CARD (Cardiovascular), RESP (Respiratory), GI (Gastrointestinal), NEURO (Neurological), ENDO (Endocrine), INF (Infectious), TRAUMA (Trauma), PEDS (Pediatric), OB (Obstetric), GYN (Gynecological), PSYCH (Psychiatric), ENV (Environmental), TOX (Toxicology), HEM (Hematologic), DERM (Dermatologic), EYE (Ophthalmologic), ENT (Ear/Nose/Throat)\n\n';

  prompt += 'CRITICAL CATEGORIZATION RULES:\n';
  prompt += '1. symptomCode: MUST be from the standardized list above (acronym only, e.g., "CP", "SOB")\n';
  prompt += '2. symptomName: MUST EXACTLY MATCH the full name from the standardized list (e.g., "Chest Pain", NOT variations)\n';
  prompt += '3. systemCode: Create a short code that makes sense (e.g., "CARD", "RESP")\n';
  prompt += '4. systemName: FULL name (e.g., "Cardiovascular", "Respiratory", "Gastrointestinal")\n';
  prompt += '5. Base categorization on the MEDICAL DIAGNOSIS (Reveal Title), not educational metadata\n';
  prompt += '6. Ignore case series names, difficulty labels, or terms like "nightmare"\n';
  prompt += '7. Focus on PRIMARY presenting symptom and PRIMARY affected body system\n\n';

  prompt += 'RETURN FORMAT: The data goes into a spreadsheet with these 4 fields:\n';
  prompt += '  - symptomCode: Acronym from standardized list\n';
  prompt += '  - symptomName: EXACT full name from standardized list\n';
  prompt += '  - systemCode: Short code you create\n';
  prompt += '  - systemName: Full system name\n\n';

  prompt += 'CASES TO CATEGORIZE:\n[\n';
  cases.forEach(function(c, i) {
    prompt += '  {\n';
    prompt += '    "caseID": "' + c.caseID + '",\n';
    prompt += '    "sparkTitle": "' + c.sparkTitle + '",\n';
    prompt += '    "revealTitle": "' + c.revealTitle + '"\n';
    prompt += '  }' + (i < cases.length - 1 ? ',' : '') + '\n';
  });
  prompt += ']\n\n';

  prompt += 'Return ONLY a JSON array:\n[\n';
  prompt += '  {\n';
  prompt += '    "symptomCode": "CP",\n';
  prompt += '    "symptomName": "Chest Pain",\n';
  prompt += '    "systemCode": "CARD",\n';
  prompt += '    "systemName": "Cardiovascular",\n';
  prompt += '    "reasoning": "brief explanation"\n';
  prompt += '  }\n';
  prompt += ']\n\n';
  prompt += 'ALL fields REQUIRED. symptomName must EXACTLY match standardized list. Return ONLY valid JSON.\n';

  return prompt;
}
```

---

### **3. writeCategorizationResults (Line ~1456)**

**Find this function and replace ONLY the parts indicated below:**

**Find the header creation section (around line 1468):**

Replace this line:
```javascript
resultsSheet.getRange(1, 1, 1, 15).setValues([[
```

With:
```javascript
resultsSheet.getRange(1, 1, 1, 16).setValues([[
```

And replace the header array with:
```javascript
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
```

**Find the data parsing section (around line 1512):**

Replace:
```javascript
    const cat = categorizations[idx] || {};
    const suggestedSymptom = cat.symptom || '';
    const suggestedSymptomName = cat.symptomName || mapping[cat.symptom] || '';
    const suggestedSystem = cat.system || '';
```

With:
```javascript
    const cat = categorizations[idx] || {};
    const suggestedSymptomCode = cat.symptomCode || '';
    const suggestedSymptomName = cat.symptomName || mapping[cat.symptomCode] || '';
    const suggestedSystemCode = cat.systemCode || '';
    const suggestedSystemName = cat.systemName || '';

    // DEBUG: Log first 3 cases
    if (idx < 3) {
      addUltimateCategorizationLog('       🔍 DEBUG Case ' + (idx + 1) + ' (' + caseData.caseID + '):');
      addUltimateCategorizationLog('         GPT symptomCode: "' + (cat.symptomCode || 'UNDEFINED') + '"');
      addUltimateCategorizationLog('         GPT symptomName: "' + (cat.symptomName || 'UNDEFINED') + '"');
      addUltimateCategorizationLog('         GPT systemCode: "' + (cat.systemCode || 'UNDEFINED') + '"');
      addUltimateCategorizationLog('         GPT systemName: "' + (cat.systemName || 'UNDEFINED') + '"');
      addUltimateCategorizationLog('         Fallback mapping[' + cat.symptomCode + ']: "' + (mapping[cat.symptomCode] || 'UNDEFINED') + '"');
    }
```

**Find the status calculation (around line 1516):**

Replace:
```javascript
    let status = 'new';
    if (caseData.currentSymptom && caseData.currentSymptom === suggestedSymptom) status = 'match';
    else if (caseData.currentSymptom && caseData.currentSymptom !== suggestedSymptom) status = 'conflict';
```

With:
```javascript
    let status = 'new';
    if (caseData.currentSymptomCode && caseData.currentSymptomCode === suggestedSymptomCode) {
      status = 'match';
    } else if (caseData.currentSymptomCode && caseData.currentSymptomCode !== suggestedSymptomCode) {
      status = 'conflict';
    }
```

**Find the data write section (around line 1521):**

Replace the setValues array (16 columns now instead of 15):
```javascript
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
```

---

### **4. applyCategorizationToMaster (Line ~1594)**

**Find this function and replace it with:**

```javascript
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

        masterSheet.getRange(j + 1, 16).setValue(finalSymptomCode);  // P
        masterSheet.getRange(j + 1, 17).setValue(finalSystemCode);   // Q
        masterSheet.getRange(j + 1, 18).setValue(finalSymptomName);  // R
        masterSheet.getRange(j + 1, 19).setValue(finalSystemName);   // S

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
```

---

## ✅ After Making Changes

1. Save the file in Apps Script editor
2. Delete or clear AI_Categorization_Results sheet
3. Run Ultimate Categorization Tool
4. Test with 5-10 cases first
5. Check debug logs for first 3 cases
6. Verify columns M, N, O, P have correct values

## 🔍 What to Check

After running:
- **Column D & E**: Should have Spark/Reveal titles
- **Column F & G**: Symptom Code & Name from ChatGPT
- **Column H & I**: System Code & Name from ChatGPT
- **Column M-P**: Final values (should match F-I)
- **Master P-S**: Should be populated after "Apply to Master"

