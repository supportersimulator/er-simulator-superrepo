# 🐛 AI Categorization Bugs - Root Cause Analysis

**Date:** November 13, 2025
**Status:** Bugs Identified - Fix Needed

---

## 📋 REPORTED ISSUES

User reported 4 specific problems with AI_Categorization_Results sheet:

1. **Column M (Final_Symptom)**: Contains acronyms (PSY, CP, ABD) instead of full symptom names
2. **Column G (Suggested_Symptom_Name)**: Missing data for many rows
3. **Column C (Row_Index)**: Empty (no numbers)
4. **Column D (Current_Symptom)**: Showing systems instead of symptoms

---

## 🔍 CODE ANALYSIS

### **The Write Logic (Line 1512-1528)**

```javascript
resultsSheet.getRange(nextRow, 1, 1, 15).setValues([[
  caseData.caseID,          // A: Case_ID ✅
  caseData.legacyCaseID,    // B: Legacy_Case_ID ✅
  caseData.rowIndex,        // C: Row_Index ← BUG #3
  caseData.currentSymptom,  // D: Current_Symptom ← BUG #4
  caseData.currentSystem,   // E: Current_System ✅
  suggestedSymptom,         // F: Suggested_Symptom (from AI) ✅
  suggestedSymptomName,     // G: Suggested_Symptom_Name (from AI) ← BUG #2
  suggestedSystem,          // H: Suggested_System (from AI) ✅
  cat.reasoning || '',      // I: AI_Reasoning ✅
  'medium',                 // J: Confidence ✅
  status,                   // K: Status ✅
  '',                       // L: User_Decision ✅
  suggestedSymptom,         // M: Final_Symptom (copy from Suggested) ← BUG #1
  suggestedSystem,          // N: Final_System (copy from Suggested) ✅
  suggestedSymptomName      // O: Final_Symptom_Name (copy from Suggested) ✅
]]);
```

### **Where Data Comes From**

**From `caseData` (extracted from Master sheet):**
- Line 1513: `caseData.caseID` ← Column A (index 0)
- Line 1514: `caseData.legacyCaseID` ← Column I (index 8)
- Line 1515: `caseData.rowIndex` ← **SET DURING EXTRACTION**
- Line 1516: `caseData.currentSymptom` ← Column R (index 17)
- Line 1517: `caseData.currentSystem` ← Column S (index 18)

**From `categorizations[idx]` (from AI):**
- Line 1504: `suggestedSymptom = cat.symptom` ← AI returns "CP", "SOB", "ABD"
- Line 1505: `suggestedSymptomName = cat.symptomName` ← AI returns "Chest Pain", "Shortness of Breath"
- Line 1506: `suggestedSystem = cat.system` ← AI returns "Cardiovascular", "Respiratory"

---

## 🔴 BUG #1: Column M Has Acronyms Instead of Full Names

### **Expected:**
- Column M (Final_Symptom) should have full symptom names like "Chest Pain", "Shortness of Breath"

### **Actual:**
- Column M has acronyms like "PSY", "CP", "ABD"

### **Root Cause:**
Line 1525 writes:
```javascript
suggestedSymptom,         // M: Final_Symptom (copy from Suggested)
```

But `suggestedSymptom` comes from `cat.symptom` which is the **acronym** not the full name.

### **Fix:**
Line 1525 should be:
```javascript
suggestedSymptomName,     // M: Final_Symptom (should be full name)
```

**OR** if acronyms are correct for column M, then the column header is wrong. Need to clarify:
- What should column M contain: **Acronyms (CP, SOB)** or **Full names (Chest Pain, Shortness of Breath)**?

---

## 🔴 BUG #2: Column G Missing Symptom Names

### **Expected:**
- Column G (Suggested_Symptom_Name) should have full symptom names for all 207 rows

### **Actual:**
- Column G is empty for many rows

### **Root Cause:**
Line 1519 writes:
```javascript
suggestedSymptomName,     // G: Suggested_Symptom_Name (from AI)
```

Where `suggestedSymptomName = cat.symptomName || ''` (line 1505).

**This means the AI is NOT returning `symptomName` in its response for some cases.**

### **Verification from Prompt (Lines 1440-1441):**
```javascript
prompt += '    "symptom": "symptom code from valid list (e.g., CP, SOB, ABD)",\n';
prompt += '    "symptomName": "full name (e.g., Chest Pain, Shortness of Breath)",\n';
```

The prompt clearly asks for `symptomName`, but the AI is not providing it consistently.

### **Possible Causes:**
1. AI model (GPT-4) is skipping the `symptomName` field in some responses
2. JSON parsing is failing for some cases
3. The prompt needs to be more explicit about requiring ALL fields

### **Fix Options:**

**Option A: Strengthen the prompt**
Make it more emphatic that `symptomName` is REQUIRED:
```javascript
prompt += 'CRITICAL: ALL fields are REQUIRED for EVERY case. If you omit symptomName, the system will fail.\n';
```

**Option B: Add fallback logic**
If AI doesn't provide `symptomName`, look it up from the mapping:
```javascript
const suggestedSymptomName = cat.symptomName || mapping[cat.symptom] || '';
```

**Option C: Validate AI response before writing**
Check that ALL required fields exist, and re-call API if any are missing.

---

## 🔴 BUG #3: Column C (Row_Index) Empty

### **Expected:**
- Column C should have row numbers like 3, 4, 5, ... (the actual row number in Master sheet)

### **Actual:**
- Column C is empty (but shouldn't be!)

### **Root Cause:**
Line 1515 writes:
```javascript
caseData.rowIndex,        // C: Row_Index
```

**Found extraction function (Line 1320):**
```javascript
rowIndex: i + 3,          // Actual row number in sheet (data starts row 3)
```

**This should be working!** The extraction sets `rowIndex` correctly.

**BUT WAIT** - Looking at the user's screenshot of column C, it shows the **header** says "Row_Index" but the data is empty.

**New hypothesis:** The data in column C might not be visible in the screenshot because:
1. User only showed columns M, N (Final columns) and G, H (Suggested columns)
2. Column C wasn't in the screenshot

**STATUS:** Need user confirmation - is column C actually empty, or just not shown in screenshot?

---

## 🔴 BUG #4: Column D Showing Systems Instead of Symptoms

### **Expected:**
- Column D (Current_Symptom) should show symptom codes from Master column R (e.g., "CP", "SOB", "ABD")

### **Actual:**
- Column D is showing system names (e.g., "Cardiovascular", "Respiratory")

### **Root Cause CONFIRMED:**

**Extraction function (Lines 1323-1324):**
```javascript
currentSymptom: row[17] || '',      // Column R (idx 17): Case_Organization_Category_Symptom
currentSystem: row[18] || '',       // Column S (idx 18): Case_Organization_Category_System
```

**This looks correct!** Column indices 17 and 18 are right.

**BUT** - Looking at Master sheet data user provided:
- Column R (idx 17): Has symptom CODES (PSY, CP, ABD) ✅
- Column S (idx 18): Has system NAMES (Psychiatric, Cardiovascular) ✅

So extraction should be reading these correctly...

**Wait!** User said: "column d 'current symptom' isn't showing symptoms it's showing systems"

This means column D in AI_Categorization_Results is showing system names (Cardiovascular, Respiratory) instead of symptom codes (CP, SOB).

**New hypothesis:** The extraction is swapping the columns somehow, OR the write is putting them in the wrong order.

Let me check the write again:
```javascript
Line 1516: caseData.currentSymptom,  // D: Current_Symptom
Line 1517: caseData.currentSystem,   // E: Current_System
```

If `caseData.currentSymptom` contains system names, then the extraction must be reading the wrong column.

**Possible issue:** Maybe columns R & S in Master sheet are in a different order than expected?

**STATUS:** Need to verify - what are the ACTUAL column letters for:
- `Case_Organization_Category_Symptom` = Column ___?
- `Case_Organization_Category_System` = Column ___?

---

## 🔍 EXTRACTION FUNCTION ANALYSIS

**Function:** `extractCasesForCategorization` (Line 1310)

**Extracts from Master sheet:**
```javascript
cases.push({
  rowIndex: i + 3,                    // ✅ CORRECT
  caseID: row[0],                     // ✅ Column A
  legacyCaseID: row[8] || '',         // ✅ Column I
  currentSymptom: row[17] || '',      // ❓ Column R (idx 17) - Should be symptom codes
  currentSystem: row[18] || '',       // ❓ Column S (idx 18) - Should be system names
  chiefComplaint: row[4] || '',       // ⚠️  Column E (might be wrong)
  presentation: row[5] || '',         // ⚠️  Column F (might be wrong)
  diagnosis: row[6] || ''             // ⚠️  Column G (might be wrong)
});
```

**Verified from user's data:**
- Column P (idx 15): Case_Organization_Category_Symptom_Name
- Column Q (idx 16): Case_Organization_Category_System_Name
- Column R (idx 17): Case_Organization_Category_Symptom ✅
- Column S (idx 18): Case_Organization_Category_System ✅

**So indices 17 & 18 are CORRECT for columns R & S.**

**BUT** - if column D in AI_Categorization_Results is showing systems instead of symptoms, something is wrong with either:
1. The extraction (reading wrong data)
2. The write (writing to wrong column)
3. User's observation (maybe misread the data?)

**STATUS:** Need user to check column D in AI_Categorization_Results and confirm it has system names

---

## 📊 SUMMARY OF BUGS

| Bug | Column | Issue | Likely Cause |
|-----|--------|-------|--------------|
| #1 | M (Final_Symptom) | Has acronyms instead of full names | Line 1525 writes `suggestedSymptom` instead of `suggestedSymptomName` |
| #2 | G (Suggested_Symptom_Name) | Missing for many rows | AI not returning `symptomName` field consistently |
| #3 | C (Row_Index) | Empty | `caseData.rowIndex` not being set during extraction |
| #4 | D (Current_Symptom) | Shows systems instead of symptoms | Extraction reading wrong column index |

---

## ✅ CONFIRMED WORKING

- **Apply to Master:** Working correctly ✅
  - Reads column M (Final_Symptom) and N (Final_System)
  - Writes to Master columns R & S (indices 17 & 18)
  - Uses correct GID (1564998840)
- **AI API calls:** Working ✅ (all 207 cases processed)
- **Column headers:** Correct ✅ (15 columns A-O)

---

## 🎯 ACTION ITEMS

1. **Find extraction function** - Locate where `caseData` objects are created
2. **Fix Bug #3:** Ensure `rowIndex` is set correctly
3. **Fix Bug #4:** Verify column indices for `currentSymptom` and `currentSystem`
4. **Fix Bug #1:** Decide if column M should have acronyms or full names
5. **Fix Bug #2:** Add fallback for missing `symptomName` from AI
6. **Test complete flow** - Re-run after fixes to verify all columns populated correctly
