# 🔧 Categorization Fix Plan

**Date:** November 13, 2025
**Issue:** Column M shows acronyms (PSY, CP, ABD) instead of full names ("Psychiatric", "Chest Pain")

---

## 🐛 THE MYSTERY

**Code says:**
```javascript
Line 1514: const suggestedSymptomName = cat.symptomName || mapping[cat.symptom] || '';
Line 1534: suggestedSymptomName,  // M: Final_Symptom (full name like "Chest Pain")
```

**Data shows:**
- Column M: PSY, CP, ABD, SOB, AMS (acronyms)
- Column O: (empty)
- Column G: "Psychiatric", "Chest Pain", "Abdominal Pain" (full names) ✅

**This is impossible!** Columns M and O should be identical to Column G since they all use `suggestedSymptomName`.

---

## 💡 HYPOTHESIS

**There might be TWO DIFFERENT categorization functions running!**

Possibility 1: There's an OLD version of the categorization tool in a different file
Possibility 2: There's cached code that hasn't been refreshed
Possibility 3: The sheet you're looking at was created by an older version of the code

---

## 🔍 EVIDENCE TO GATHER

1. **Check Column G vs Column M vs Column O**
   - Column G: Full names ✅
   - Column M: Acronyms ❌
   - Column O: Empty ❌

   This is VERY strange because Column O should equal Column M (both use `suggestedSymptomName`)

2. **User confirmed mapping sheet is correct**
   - accronym_symptom_system_mapping Column B has full names ✅

---

## 🎯 THE FIX: Two-Part Solution

### **Part 1: Add Debugging to See What ChatGPT Returns**

Add logging right after parsing ChatGPT response to see what's actually in `cat.symptomName`:

```javascript
const cat = categorizations[idx] || {};
const suggestedSymptom = cat.symptom || '';

// DEBUG: Log first 3 cases to see what ChatGPT actually returned
if (idx < 3) {
  addUltimateCategorizationLog('DEBUG Case ' + (idx + 1) + ':');
  addUltimateCategorizationLog('  cat.symptom: "' + (cat.symptom || 'undefined') + '"');
  addUltimateCategorizationLog('  cat.symptomName: "' + (cat.symptomName || 'undefined') + '"');
  addUltimateCategorizationLog('  mapping[' + cat.symptom + ']: "' + (mapping[cat.symptom] || 'undefined') + '"');
}

const suggestedSymptomName = cat.symptomName || mapping[cat.symptom] || '';
```

### **Part 2: Enhance ChatGPT Prompt (Per User Request)**

Add more context to help ChatGPT categorize better:

**Current extraction:**
```javascript
chiefComplaint: row[4] || '',     // Column E
presentation: row[5] || '',       // Column F
diagnosis: row[6] || ''           // Column G
```

**User requested addition:**
```javascript
sparkTitle: row[1] || '',         // Column B: Case_Organization_Spark_Title
revealTitle: row[2] || '',        // Column C: Case_Organization_Reveal_Title
```

**Updated prompt to include:**
```javascript
prompt += '  "sparkTitle": "' + c.sparkTitle + '",\n';
prompt += '  "revealTitle": "' + c.revealTitle + '",\n';
prompt += '  "chiefComplaint": "' + c.chiefComplaint + '",\n';
```

---

## 📝 IMPLEMENTATION STEPS

### Step 1: Add Debug Logging

Insert after line 1512 in `Ultimate_Categorization_Tool_Complete.gs`:

```javascript
cases.forEach(function(caseData, idx) {
  if (existingCaseIDs.has(caseData.caseID)) {
    duplicatesSkipped++;
    return;
  }

  const cat = categorizations[idx] || {};
  const suggestedSymptom = cat.symptom || '';

  // DEBUG LOGGING (REMOVE AFTER TESTING)
  if (idx < 3) {
    addUltimateCategorizationLog('       🐛 DEBUG Case ' + (idx + 1) + ' (' + caseData.caseID + '):');
    addUltimateCategorizationLog('         cat.symptom: "' + (cat.symptom || 'UNDEFINED') + '"');
    addUltimateCategorizationLog('         cat.symptomName: "' + (cat.symptomName || 'UNDEFINED') + '"');
    addUltimateCategorizationLog('         mapping[' + cat.symptom + ']: "' + (mapping[cat.symptom] || 'UNDEFINED') + '"');
  }

  const suggestedSymptomName = cat.symptomName || mapping[cat.symptom] || '';
  // ... rest of function
```

### Step 2: Update Extraction Function

Find `extractCasesForCategorization` and update to include Spark and Reveal titles:

```javascript
function extractCasesForCategorization() {
  // ... existing code ...

  const data = sheet.getRange(3, 1, lastRow - 2, lastCol).getValues();
  const cases = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;

    cases.push({
      rowIndex: i + 3,
      caseID: row[0],                     // A: Case_ID
      sparkTitle: row[1] || '',           // B: Case_Organization_Spark_Title ⭐ NEW
      revealTitle: row[2] || '',          // C: Case_Organization_Reveal_Title ⭐ NEW
      chiefComplaint: row[4] || '',       // E: Chief Complaint
      presentation: row[5] || '',         // F: Presentation
      diagnosis: row[6] || '',            // G: Diagnosis
      legacyCaseID: row[8] || '',         // I: Legacy Case ID
      currentSymptom: row[17] || '',      // R: Current symptom
      currentSystem: row[18] || ''        // S: Current system
    });
  }

  return cases;
}
```

### Step 3: Update ChatGPT Prompt

Find `buildCategorizationPrompt` and add Spark/Reveal titles:

```javascript
function buildCategorizationPrompt(cases, validSymptoms, validSystems) {
  let prompt = 'You are a medical education expert. Categorize these emergency medicine simulation cases.\n\n';
  prompt += 'VALID SYMPTOM CODES:\n' + validSymptoms + '\n\n';
  prompt += 'VALID SYSTEM CATEGORIES:\n' + validSystems + '\n\n';

  // ... existing rules ...

  prompt += 'CASES TO CATEGORIZE:\n[\n';

  cases.forEach(function(c, i) {
    prompt += '  {\n';
    prompt += '    "caseID": "' + c.caseID + '",\n';
    prompt += '    "sparkTitle": "' + c.sparkTitle + '",\n';           // ⭐ NEW
    prompt += '    "revealTitle": "' + c.revealTitle + '",\n';         // ⭐ NEW
    prompt += '    "chiefComplaint": "' + c.chiefComplaint + '",\n';
    prompt += '    "presentation": "' + c.presentation + '",\n';
    prompt += '    "diagnosis": "' + c.diagnosis + '"\n';
    prompt += '  }' + (i < cases.length - 1 ? ',' : '') + '\n';
  });

  prompt += ']\n\n';
  prompt += 'Return a JSON array with this EXACT structure:\n';
  prompt += '[\n';
  prompt += '  {\n';
  prompt += '    "symptom": "symptom code from valid list",\n';
  prompt += '    "symptomName": "FULL NAME like Chest Pain or Shortness of Breath",\n';  // ⭐ CLARIFIED
  prompt += '    "system": "system from valid list",\n';
  prompt += '    "reasoning": "brief explanation"\n';
  prompt += '  }\n';
  prompt += ']\n\n';
  prompt += 'CRITICAL: The "symptomName" field MUST be the FULL English name, NOT an acronym!\n';  // ⭐ NEW
  prompt += 'Example: "Chest Pain" not "CP", "Shortness of Breath" not "SOB"\n';          // ⭐ NEW

  return prompt;
}
```

---

## 🧪 TESTING PLAN

1. **Deploy the debug logging version**
2. **Clear AI_Categorization_Results sheet**
3. **Run categorization on 5 test cases**
4. **Check the Ultimate Categorization log** to see:
   - What `cat.symptom` contains (should be "CP", "SOB", etc.)
   - What `cat.symptomName` contains (should be "Chest Pain", "Shortness of Breath" OR undefined)
   - What `mapping[cat.symptom]` returns (should be "Chest Pain", "Shortness of Breath")
5. **Check Column M** - should now show full names

---

## 🎯 EXPECTED OUTCOMES

### If ChatGPT IS returning symptomName correctly:
- Debug log will show: `cat.symptomName: "Chest Pain"`
- Column M will show: "Chest Pain"
- **Root cause:** Something else was wrong (old data, caching, etc.)

### If ChatGPT is NOT returning symptomName:
- Debug log will show: `cat.symptomName: UNDEFINED`
- Debug log will show: `mapping[CP]: "Chest Pain"`
- Column M will show: "Chest Pain" (from fallback)
- **Root cause:** ChatGPT not including symptomName field

### If ChatGPT is returning symptomName AS acronym:
- Debug log will show: `cat.symptomName: "CP"`
- This is the bug! ChatGPT is putting acronym in symptomName field
- **Root cause:** Prompt needs to be more explicit about FULL NAMES

---

## 📌 NEXT STEPS

1. Add debug logging
2. Add Spark/Reveal titles to extraction and prompt
3. Clarify prompt to emphasize FULL NAMES not acronyms
4. Deploy and test with 5 cases
5. Review debug logs
6. Determine root cause
7. Apply appropriate fix

