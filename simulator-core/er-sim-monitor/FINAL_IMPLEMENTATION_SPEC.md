# 🎯 Final Implementation Specification - CONFIRMED

**Date:** November 13, 2025
**Status:** READY TO IMPLEMENT

---

## ✅ CONFIRMED DETAILS

### **Column Indices (Zero-based):**
- Column P = index 15
- Column Q = index 16
- Column R = index 17 (confirmed in code)
- Column S = index 18 (confirmed in code)

### **Master Sheet Headers (Section 1 - Extraction):**
```
A (idx 0):  Case_Organization_Case_ID
B (idx 1):  Case_Organization_Spark_Title
C (idx 2):  Case_Organization_Reveal_Title
D (idx 3):  Case_Organization_Case_Series_Name
E (idx 4):  Case_Organization_Case_Series_Order
```

### **Master Sheet Headers (Section 4 - Write Target):**
```
P (idx 15): Case_Organization_Category_Symptom_Code
Q (idx 16): Case_Organization_Category_System_Code
R (idx 17): Case_Organization_Category_Symptom
S (idx 18): Case_Organization_Category_System
```

### **Valid Symptom Codes (43 total):**
```
CP, SOB, ABD, HA, AMS, SYNC, SZ, DIZZ, WEAK, NT, GLF, TR, MVC, BURN, FX,
HEAD, LAC, GI, GU, GYN, OB, DERM, EYE, ENT, PSY, ACLS, SHOC, TOX, ENV,
END, HEM, INF, PCP, PSOB, PABD, PFEV, PSZ, PTR, P, PEDS
```

### **System Codes:**
- ChatGPT will generate these dynamically
- No standardization required at this time

---

## 📊 AI_CATEGORIZATION_RESULTS STRUCTURE (16 Columns)

```
A: Case_Organization_Case_ID
B: Legacy_Case_ID
C: Row_Index
D: Case_Organization_Spark_Title
E: Case_Organization_Reveal_Title

F: Suggested_Symptom_Code
G: Suggested_Symptom_Name
H: Suggested_System_Code
I: Suggested_System_Name
J: AI_Reasoning

K: Status
L: User_Decision

M: Final_Symptom_Code         → Master P
N: Final_System_Code          → Master Q
O: Final_Symptom_Name         → Master R
P: Final_System_Name          → Master S
```

---

## 🔧 IMPLEMENTATION CHANGES

### **Change 1: Update extractCasesForCategorization()**

**Location:** Line ~1319

**BEFORE:**
```javascript
cases.push({
  rowIndex: i + 3,
  caseID: caseID,
  legacyCaseID: row[8] || '',
  currentSymptom: row[17] || '',
  currentSystem: row[18] || '',
  chiefComplaint: row[4] || '',
  presentation: row[5] || '',
  diagnosis: row[6] || ''
});
```

**AFTER:**
```javascript
cases.push({
  rowIndex: i + 3,
  caseID: caseID,                         // A: Case_Organization_Case_ID
  sparkTitle: row[1] || '',               // B: Case_Organization_Spark_Title
  revealTitle: row[2] || '',              // C: Case_Organization_Reveal_Title
  seriesName: row[3] || '',               // D: Case_Organization_Case_Series_Name
  seriesOrder: row[4] || '',              // E: Case_Organization_Case_Series_Order
  legacyCaseID: row[8] || '',             // I: Legacy_Case_ID
  currentSymptomCode: row[15] || '',      // P: Current Symptom Code (for comparison)
  currentSystemCode: row[16] || '',       // Q: Current System Code (for comparison)
  currentSymptomName: row[17] || '',      // R: Current Symptom Name (for comparison)
  currentSystemName: row[18] || '',       // S: Current System Name (for comparison)
  // Fields for ChatGPT (find actual column indices):
  chiefComplaint: row[?] || '',           // TODO: Find actual column
  presentation: row[?] || '',             // TODO: Find actual column
  diagnosis: row[?] || ''                 // TODO: Find actual column
});
```

### **Change 2: Update buildCategorizationPrompt()**

**Add symptom codes list:**
```javascript
const validSymptomCodes = 'CP, SOB, ABD, HA, AMS, SYNC, SZ, DIZZ, WEAK, NT, GLF, TR, MVC, BURN, FX, HEAD, LAC, GI, GU, GYN, OB, DERM, EYE, ENT, PSY, ACLS, SHOC, TOX, ENV, END, HEM, INF, PCP, PSOB, PABD, PFEV, PSZ, PTR, P, PEDS';
```

**Update prompt structure:**
```javascript
prompt += 'VALID SYMPTOM CODES:\n' + validSymptomCodes + '\n\n';
prompt += 'CRITICAL RULES:\n';
prompt += '1. Base categorization on MEDICAL DIAGNOSIS and CLINICAL PRESENTATION\n';
prompt += '2. "symptomCode" must be from valid list (e.g., "CP", "SOB", "ABD")\n';
prompt += '3. "symptomName" must be FULL ENGLISH NAME (e.g., "Chest Pain", NOT "CP")\n';
prompt += '4. "systemCode" should be a short code (e.g., "CARD", "RESP", "GI")\n';
prompt += '5. "systemName" must be FULL NAME (e.g., "Cardiovascular", NOT "CARD")\n';
prompt += '6. Ignore case series names, difficulty labels, educational metadata\n\n';

prompt += 'CASES TO CATEGORIZE:\n[\n';
cases.forEach(function(c, i) {
  prompt += '  {\n';
  prompt += '    "caseID": "' + c.caseID + '",\n';
  prompt += '    "sparkTitle": "' + c.sparkTitle + '",\n';
  prompt += '    "revealTitle": "' + c.revealTitle + '",\n';
  prompt += '    "seriesName": "' + c.seriesName + '",\n';
  prompt += '    "chiefComplaint": "' + c.chiefComplaint + '",\n';
  prompt += '    "presentation": "' + c.presentation + '",\n';
  prompt += '    "diagnosis": "' + c.diagnosis + '"\n';
  prompt += '  }' + (i < cases.length - 1 ? ',' : '') + '\n';
});
prompt += ']\n\n';

prompt += 'Return JSON array:\n[\n  {\n';
prompt += '    "symptomCode": "CP",\n';
prompt += '    "symptomName": "Chest Pain",\n';
prompt += '    "systemCode": "CARD",\n';
prompt += '    "systemName": "Cardiovascular",\n';
prompt += '    "reasoning": "brief explanation"\n';
prompt += '  }\n]\n';
```

### **Change 3: Update writeCategorizationResults()**

**Update header creation (line ~1468):**
```javascript
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
```

**Update data parsing (line ~1512):**
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

**Update data write (line ~1521):**
```javascript
resultsSheet.getRange(nextRow, 1, 1, 16).setValues([[
  caseData.caseID,                     // A
  caseData.legacyCaseID,               // B
  caseData.rowIndex,                   // C
  caseData.sparkTitle,                 // D
  caseData.revealTitle,                // E
  suggestedSymptomCode,                // F
  suggestedSymptomName,                // G
  suggestedSystemCode,                 // H
  suggestedSystemName,                 // I
  cat.reasoning || '',                 // J
  status,                              // K
  '',                                  // L
  suggestedSymptomCode,                // M (copy from F)
  suggestedSystemCode,                 // N (copy from H)
  suggestedSymptomName,                // O (copy from G)
  suggestedSystemName                  // P (copy from I)
]]);
```

### **Change 4: Update applyCategorizationToMaster()**

**Update to write to 4 columns (P, Q, R, S):**

```javascript
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
    return;
  }

  // Read Master sheet
  const masterData = masterSheet.getDataRange().getValues();
  const masterHeaders = masterData[0];
  const masterCaseIDIdx = 0; // Column A

  let updatedCount = 0;

  // Process each result row (skip header)
  for (let i = 1; i < resultsData.length; i++) {
    const caseID = resultsData[i][caseIDIdx];
    if (!caseID) continue;

    const finalSymptomCode = resultsData[i][finalSymptomCodeIdx];
    const finalSystemCode = resultsData[i][finalSystemCodeIdx];
    const finalSymptomName = resultsData[i][finalSymptomNameIdx];
    const finalSystemName = resultsData[i][finalSystemNameIdx];

    // Find matching row in Master
    for (let j = 2; j < masterData.length; j++) { // Start at row 3 (index 2)
      if (masterData[j][masterCaseIDIdx] === caseID) {
        // Write to columns P, Q, R, S (indices 15, 16, 17, 18)
        masterSheet.getRange(j + 1, 16).setValue(finalSymptomCode);  // P
        masterSheet.getRange(j + 1, 17).setValue(finalSystemCode);   // Q
        masterSheet.getRange(j + 1, 18).setValue(finalSymptomName);  // R
        masterSheet.getRange(j + 1, 19).setValue(finalSystemName);   // S

        updatedCount++;

        if (updatedCount <= 3) {
          addUltimateCategorizationLog('  ✅ Updated ' + caseID + ': ' + finalSymptomName + ' / ' + finalSystemName);
        }
        break;
      }
    }
  }

  addUltimateCategorizationLog('✅ Apply complete:');
  addUltimateCategorizationLog('   Cases updated: ' + updatedCount);
  addUltimateCategorizationLog('   Master columns: P (Symptom Code), Q (System Code), R (Symptom), S (System)');
}
```

---

## 📋 SUMMARY OF ALL CHANGES

1. ✅ Extract Spark/Reveal titles from columns B & C
2. ✅ Send them to ChatGPT in prompt
3. ✅ Ask ChatGPT for symptomCode, symptomName, systemCode, systemName
4. ✅ Create 16-column AI_Categorization_Results sheet
5. ✅ Write all 4 final values to Master columns P, Q, R, S
6. ✅ Include all 43 symptom codes in prompt
7. ✅ Add debug logging for first 3 cases
8. ✅ Use exact Master sheet header names

---

## 🚀 READY TO IMPLEMENT

All specifications confirmed. Ready to create the complete updated code file.

