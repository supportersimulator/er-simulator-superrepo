# 🔧 Ultimate Categorization Tool - Bug Fixes

**Date:** November 13, 2025
**Bugs:** 4 confirmed issues with data population

---

## 🐛 CONFIRMED BUGS

Based on user verification of AI_Categorization_Results sheet:

1. **Column C (Row_Index):** Has symptom acronyms (PSY, CP, ABD) instead of row numbers (3, 4, 5, ...)
2. **Column D (Current_Symptom):** Has system names (Psychiatric, Cardiovascular) instead of symptom codes (PSY, CP, ABD)
3. **Column M (Final_Symptom):** Has acronyms (CP, SOB) instead of full names ("Chest Pain", "Shortness of Breath")
4. **Column G (Suggested_Symptom_Name):** Missing data for many rows

---

## 🔍 ROOT CAUSE ANALYSIS

### **Pattern Recognition**

Looking at what's IN each column vs what SHOULD be there:

| Column | Should Have | Actually Has | Analysis |
|--------|-------------|--------------|----------|
| C | Row numbers (3, 4, 5...) | Symptom acronyms (PSY, CP) | Getting data from `suggestedSymptom` |
| D | Symptom codes (PSY, CP) | System names (Psychiatric, Cardiovascular) | Getting data from `suggestedSystem` |

**This suggests columns C & D are getting data from the WRONG variables!**

### **The Smoking Gun**

If we map what's actually appearing:
- Column C has: PSY, CP, ABD → These are `suggestedSymptom` values (should be in column F)
- Column D has: Psychiatric, Cardiovascular → These are `suggestedSystem` values (should be in column H)

**Hypothesis:** The write operation is somehow getting scrambled data, OR there's an array index mismatch.

### **Deeper Investigation Needed**

The code at lines 1512-1528 looks structurally correct:
```javascript
resultsSheet.getRange(nextRow, 1, 1, 15).setValues([[
  caseData.caseID,          // A
  caseData.legacyCaseID,    // B
  caseData.rowIndex,        // C
  caseData.currentSymptom,  // D
  ...
]]);
```

BUT - if column C is showing `suggestedSymptom` values, that means either:
1. `caseData.rowIndex` contains suggestedSymptom (impossible - it's set to `i + 3`)
2. The array is being written with wrong values
3. There's a mismatch between `caseData` and `categorizations` indices

**WAIT!** I think I found it!

Look at line 1503:
```javascript
const cat = categorizations[idx] || {};
```

If `categorizations[idx]` doesn't align with `cases[idx]`, the data would be mismatched!

But that still doesn't explain how symptom acronyms get into column C...

---

## 💡 ALTERNATIVE THEORY

What if the `caseData` object itself has the wrong structure from the extraction?

Let me check if there could be a case where:
- `caseData.rowIndex` actually contains a symptom code
- `caseData.currentSymptom` actually contains a system name

This would only happen if the extraction function is reading the wrong columns OR if `caseData` is being corrupted/reassigned somewhere.

---

## 🎯 THE ACTUAL FIXES

Since the code structure looks correct, I'm going to provide fixes for the KNOWN issues:

### **FIX #1: Column M Should Have Full Symptom Names**

**Current code (Line 1525):**
```javascript
suggestedSymptom,         // M: Final_Symptom (copy from Suggested, user can edit)
```

**Fixed code:**
```javascript
suggestedSymptomName,     // M: Final_Symptom (full name, user can edit)
```

---

### **FIX #2: Add Fallback for Missing Symptom Names**

**Current code (Lines 1504-1506):**
```javascript
const suggestedSymptom = cat.symptom || '';
const suggestedSymptomName = cat.symptomName || '';
const suggestedSystem = cat.system || '';
```

**Fixed code:**
```javascript
const suggestedSymptom = cat.symptom || '';
const suggestedSymptomName = cat.symptomName || mapping[cat.symptom] || '';  // ← FALLBACK
const suggestedSystem = cat.system || '';
```

This uses the `mapping` object (accronym_symptom_system_mapping sheet) as a fallback if AI doesn't provide symptomName.

---

### **FIX #3 & #4: Debug Logging for Column Mismatch**

Add logging BEFORE the write to see what's actually in the variables:

**Add after line 1510:**
```javascript
// DEBUG: Log first 3 cases to verify data structure
if (newRowsWritten < 3) {
  addUltimateCategorizationLog('       DEBUG Case ' + (newRowsWritten + 1) + ':');
  addUltimateCategorizationLog('         caseData.caseID: ' + caseData.caseID);
  addUltimateCategorizationLog('         caseData.rowIndex: ' + caseData.rowIndex);
  addUltimateCategorizationLog('         caseData.currentSymptom: ' + caseData.currentSymptom);
  addUltimateCategorizationLog('         caseData.currentSystem: ' + caseData.currentSystem);
  addUltimateCategorizationLog('         suggestedSymptom: ' + suggestedSymptom);
  addUltimateCategorizationLog('         suggestedSymptomName: ' + suggestedSymptomName);
  addUltimateCategorizationLog('         suggestedSystem: ' + suggestedSystem);
}
```

This will help us see if the data is correct BEFORE writing, which will tell us if the bug is in extraction or write.

---

## 📝 COMPLETE FIXED FUNCTION

Here's the complete `writeCategorizationResults` function with all fixes:

```javascript
function writeCategorizationResults(cases, categorizations) {
  addUltimateCategorizationLog('     📝 writeCategorizationResults() - Starting...');
  addUltimateCategorizationLog('       Cases to write: ' + cases.length);
  addUltimateCategorizationLog('       Categorizations received: ' + categorizations.length);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let resultsSheet = ss.getSheetByName('AI_Categorization_Results');

  if (!resultsSheet) {
    addUltimateCategorizationLog('       📋 Results sheet not found - creating new sheet...');
    resultsSheet = ss.insertSheet('AI_Categorization_Results');
    // Create header structure with Final columns (15 columns: A-O)
    resultsSheet.getRange(1, 1, 1, 15).setValues([[
      'Case_ID', 'Legacy_Case_ID', 'Row_Index', 'Current_Symptom', 'Current_System',
      'Suggested_Symptom', 'Suggested_Symptom_Name', 'Suggested_System',
      'AI_Reasoning', 'Confidence', 'Status', 'User_Decision',
      'Final_Symptom', 'Final_System', 'Final_Symptom_Name'
    ]]);
    addUltimateCategorizationLog('       ✅ Created new sheet with headers (15 columns including Final columns)');
  } else {
    addUltimateCategorizationLog('       ✅ Results sheet found');
    // Check if Final columns exist, add them if missing
    const lastCol = resultsSheet.getLastColumn();
    if (lastCol < 15) {
      addUltimateCategorizationLog('       📋 Adding Final columns to existing sheet...');
      resultsSheet.getRange(1, 13, 1, 3).setValues([['Final_Symptom', 'Final_System', 'Final_Symptom_Name']]);
      addUltimateCategorizationLog('       ✅ Final columns added');
    }
  }

  const existingLastRow = resultsSheet.getLastRow();
  addUltimateCategorizationLog('       Current last row: ' + existingLastRow);

  let existingCaseIDs = new Set();
  if (existingLastRow > 1) {
    addUltimateCategorizationLog('       🔍 Checking for duplicate Case IDs...');
    const existingData = resultsSheet.getRange(2, 1, existingLastRow - 1, 15).getValues();
    existingData.forEach(function(row) { if (row[0]) existingCaseIDs.add(row[0]); });
    addUltimateCategorizationLog('       Found ' + existingCaseIDs.size + ' existing Case IDs');
  }

  let nextRow = resultsSheet.getLastRow() + 1;
  addUltimateCategorizationLog('       Next available row: ' + nextRow);

  let newRowsWritten = 0;
  let duplicatesSkipped = 0;

  // FIX #2: Get mapping for fallback symptom names
  const mapping = getAccronymMapping();

  cases.forEach(function(caseData, idx) {
    if (existingCaseIDs.has(caseData.caseID)) {
      duplicatesSkipped++;
      return;
    }

    const cat = categorizations[idx] || {};
    const suggestedSymptom = cat.symptom || '';
    const suggestedSymptomName = cat.symptomName || mapping[cat.symptom] || '';  // FIX #2: Fallback to mapping
    const suggestedSystem = cat.system || '';
    let status = 'new';
    if (caseData.currentSymptom && caseData.currentSymptom === suggestedSymptom) status = 'match';
    else if (caseData.currentSymptom && caseData.currentSymptom !== suggestedSymptom) status = 'conflict';

    // FIX #3: Debug logging for first 3 cases
    if (newRowsWritten < 3) {
      addUltimateCategorizationLog('       DEBUG Case ' + (newRowsWritten + 1) + ':');
      addUltimateCategorizationLog('         caseData.caseID: ' + caseData.caseID);
      addUltimateCategorizationLog('         caseData.rowIndex: ' + caseData.rowIndex);
      addUltimateCategorizationLog('         caseData.currentSymptom: ' + caseData.currentSymptom);
      addUltimateCategorizationLog('         caseData.currentSystem: ' + caseData.currentSystem);
      addUltimateCategorizationLog('         suggestedSymptom: ' + suggestedSymptom);
      addUltimateCategorizationLog('         suggestedSymptomName: ' + suggestedSymptomName);
      addUltimateCategorizationLog('         suggestedSystem: ' + suggestedSystem);
    }

    // Write results in correct column order (A through O) with Final columns
    resultsSheet.getRange(nextRow, 1, 1, 15).setValues([[
      caseData.caseID,          // A: Case_ID
      caseData.legacyCaseID,    // B: Legacy_Case_ID
      caseData.rowIndex,        // C: Row_Index
      caseData.currentSymptom,  // D: Current_Symptom
      caseData.currentSystem,   // E: Current_System
      suggestedSymptom,         // F: Suggested_Symptom (from AI)
      suggestedSymptomName,     // G: Suggested_Symptom_Name (from AI or fallback)
      suggestedSystem,          // H: Suggested_System (from AI)
      cat.reasoning || '',      // I: AI_Reasoning
      'medium',                 // J: Confidence
      status,                   // K: Status
      '',                       // L: User_Decision
      suggestedSymptomName,     // M: Final_Symptom ← FIX #1: Use full name instead of acronym
      suggestedSystem,          // N: Final_System (copy from Suggested, user can edit)
      suggestedSymptomName      // O: Final_Symptom_Name (copy from Suggested, user can edit)
    ]]);
    nextRow++;
    newRowsWritten++;
  });

  addUltimateCategorizationLog('       ✅ Write complete:');
  addUltimateCategorizationLog('         New rows written: ' + newRowsWritten);
  addUltimateCategorizationLog('         Duplicates skipped: ' + duplicatesSkipped);
  addUltimateCategorizationLog('         Final row: ' + (nextRow - 1));
}
```

---

## 🧪 TESTING PLAN

1. **Deploy fixed code**
2. **Clear AI_Categorization_Results** sheet
3. **Run AI Categorization** on a small batch (5-10 cases first)
4. **Check debug logs** - Look for the DEBUG output showing what's in each variable
5. **Verify columns:**
   - Column C: Should have row numbers (3, 4, 5, ...)
   - Column D: Should have symptom codes (PSY, CP, ABD)
   - Column G: Should have full symptom names for ALL rows
   - Column M: Should have full symptom names
6. **If still broken:** The debug logs will show us EXACTLY where the data is getting corrupted

---

## ❓ REMAINING MYSTERY

The biggest mystery is why columns C & D are getting wrong data when the code structure looks correct. The debug logging will reveal this!

**Possible scenarios:**
1. `caseData` object is malformed from extraction
2. Array index mismatch between `cases` and `categorizations`
3. Some other code is modifying `caseData` after extraction
4. Sheet API is doing something unexpected with the array write

**The debug logs will tell us which scenario is happening.**
