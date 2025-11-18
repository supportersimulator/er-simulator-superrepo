# 🔄 ULTIMATE CATEGORIZATION TOOL - COMPLETE DATA FLOW

**Visual guide to understand exactly how data flows through the system**

---

## 📊 THE COMPLETE DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MASTER SCENARIO CONVERT SHEET                        │
│                        (GID: 1564998840)                                │
│                                                                         │
│  Row 3: CARD0001  |  ...  |  Column R          |  Column S             │
│                   |       |  (idx 17)          |  (idx 18)             │
│                   |       |  Symptom           |  System               │
│                   |       |  "CP"              |  "Cardiovascular"     │
│                                                                         │
│  Row 4: CARD0002  |  ...  |  ""                |  ""                   │
│                                     ↓                ↓                  │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                    ╔════════════════════════════════╗
                    ║   PHASE 2A: EXTRACTION         ║
                    ║   extractCasesForCategorization ║
                    ║                                ║
                    ║   Reads Master Column R (17)   ║
                    ║   Reads Master Column S (18)   ║
                    ╚════════════════════════════════╝
                                     │
                                     ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                  AI_CATEGORIZATION_RESULTS SHEET                        │
│                       (Created by Phase 2A)                             │
│                                                                         │
│  Row 1: Headers (A through O, 15 columns)                              │
│                                                                         │
│  Row 2 (CARD0001):                                                      │
│   A: Case_ID = "CARD0001"                                               │
│   B: Legacy_Case_ID = "..."                                             │
│   C: Row_Index = 3                                                      │
│   D: Current_Symptom = "CP" ←───────┐ (from Master R)                  │
│   E: Current_System = "Cardiovascular" ←─┐ (from Master S)             │
│   F: Suggested_Symptom = "CP" ←──────────┐ (AI recommendation)         │
│   G: Suggested_Symptom_Name = "Chest Pain"                             │
│   H: Suggested_System = "Cardiovascular" ←─┐ (AI recommendation)       │
│   I: AI_Reasoning = "Classic ACS presentation..."                      │
│   J: Confidence = "medium"                                              │
│   K: Status = "match" (Current = Suggested)                             │
│   L: User_Decision = "" (empty for user input)                          │
│   M: Final_Symptom = "CP" ←──────────┐ (EDITABLE, defaults to F)       │
│   N: Final_System = "Cardiovascular" ←─┐ (EDITABLE, defaults to H)     │
│   O: Final_Symptom_Name = "Chest Pain" (EDITABLE, defaults to G)       │
│                                                                         │
│  Row 3 (CARD0002):                                                      │
│   A: Case_ID = "CARD0002"                                               │
│   D: Current_Symptom = "" (empty)                                       │
│   E: Current_System = "" (empty)                                        │
│   F: Suggested_Symptom = "SOB" ←──AI analyzed case                     │
│   H: Suggested_System = "Respiratory"                                   │
│   K: Status = "new" (no current value)                                  │
│   M: Final_Symptom = "SOB" ←──User can edit this                       │
│   N: Final_System = "Respiratory"                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │
                    ╔════════════════════════════════╗
                    ║   USER REVIEW & EDIT           ║
                    ║   (Optional)                   ║
                    ║                                ║
                    ║   Browse by Symptom/System     ║
                    ║   Edit Final columns M & N     ║
                    ║   Approve/Reject suggestions   ║
                    ╚════════════════════════════════╝
                                     │
                                     │
                    ╔════════════════════════════════╗
                    ║   PHASE 2C: APPLY TO MASTER    ║
                    ║   applyUltimateCategorizationToMaster ║
                    ║                                ║
                    ║   Reads AI Results Column M    ║
                    ║   Reads AI Results Column N    ║
                    ║   Writes to Master Column R    ║
                    ║   Writes to Master Column S    ║
                    ╚════════════════════════════════╝
                                     │
                                     ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    MASTER SCENARIO CONVERT SHEET                        │
│                        (GID: 1564998840)                                │
│                          **UPDATED**                                    │
│                                                                         │
│  Row 3: CARD0001  |  ...  |  Column R          |  Column S             │
│                   |       |  "CP" ✅           |  "Cardiovascular" ✅  │
│                   |       |  (unchanged)       |  (unchanged)          │
│                                                                         │
│  Row 4: CARD0002  |  ...  |  "SOB" 🆕         |  "Respiratory" 🆕     │
│                   |       |  (AI filled)       |  (AI filled)          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 CRITICAL COLUMN INDICES

### **Master Scenario Convert Sheet**
```javascript
Column A (index 0):  Case_Organization_Case_ID
Column I (index 8):  Case_Organization_Legacy_Case_ID
Column R (index 17): Case_Organization_Category_Symptom    ← TARGET
Column S (index 18): Case_Organization_Category_System     ← TARGET
```

### **AI_Categorization_Results Sheet**
```javascript
Column A (index 0):  Case_ID
Column B (index 1):  Legacy_Case_ID
Column C (index 2):  Row_Index (where it lives in Master)
Column D (index 3):  Current_Symptom (snapshot from Master R)
Column E (index 4):  Current_System (snapshot from Master S)
Column F (index 5):  Suggested_Symptom (AI recommendation)
Column G (index 6):  Suggested_Symptom_Name (full name)
Column H (index 7):  Suggested_System (AI recommendation)
Column I (index 8):  AI_Reasoning (why)
Column J (index 9):  Confidence (always "medium")
Column K (index 10): Status (match/conflict/new)
Column L (index 11): User_Decision (empty for user input)
Column M (index 12): Final_Symptom ← APPLIES BACK TO MASTER R
Column N (index 13): Final_System  ← APPLIES BACK TO MASTER S
Column O (index 14): Final_Symptom_Name
```

---

## 🔧 CODE IMPLEMENTATION DETAILS

### **Phase 2A: Extraction**

```javascript
function extractCasesForCategorization(data, headers) {
  const cases = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const caseID = row[0]; // Column A

    if (caseID && caseID !== 'Case_Organization_Case_ID') {
      cases.push({
        rowIndex: i + 3,              // Actual row in sheet
        caseID: caseID,               // Column A
        legacyCaseID: row[8],         // Column I
        currentSymptom: row[17],      // Column R ← CRITICAL
        currentSystem: row[18],       // Column S ← CRITICAL
        chiefComplaint: row[4],       // For AI context
        presentation: row[5],         // For AI context
        diagnosis: row[6]             // For AI context
      });
    }
  }
  return cases;
}
```

**Data Flow:**
```
Master Row 3, Column R (idx 17) = "CP"
    ↓
cases[0].currentSymptom = "CP"
    ↓
AI Results Row 2, Column D = "CP"
```

---

### **Phase 2C: Apply Back to Master**

```javascript
function applyUltimateCategorizationToMaster() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const resultsSheet = ss.getSheetByName('AI_Categorization_Results');

  // Read results with Final columns (15 columns: A-O)
  const resultsData = resultsSheet.getRange(2, 1, resultsLastRow - 1, 15).getValues();

  // Get Master sheet using GID (THE FIX)
  const masterSheet = getMasterScenarioConvertSheet_(); // Uses GID 1564998840

  // Column indices for Master sheet
  const caseIDIdx = 0;       // Column A
  const symptomIdx = 17;     // Column R ← CRITICAL
  const systemIdx = 18;      // Column S ← CRITICAL

  // Build Case ID → Row Index map
  const masterData = masterSheet.getRange(3, 1, masterLastRow - 2, masterSheet.getLastColumn()).getValues();
  const caseIDtoRowIndex = {};
  masterData.forEach(function(row, idx) {
    if (row[caseIDIdx]) {
      caseIDtoRowIndex[row[caseIDIdx]] = idx + 3; // Actual row number
    }
  });

  // Apply updates
  resultsData.forEach(function(resultRow) {
    const caseID = resultRow[0];             // A: Case_ID
    const finalSymptom = resultRow[12];      // M: Final_Symptom ← CRITICAL
    const finalSystem = resultRow[13];       // N: Final_System ← CRITICAL
    const masterRowNum = caseIDtoRowIndex[caseID];

    if (masterRowNum && finalSymptom && finalSystem) {
      // Write to Column R (index 17 + 1 for getRange)
      masterSheet.getRange(masterRowNum, symptomIdx + 1).setValue(finalSymptom);

      // Write to Column S (index 18 + 1 for getRange)
      masterSheet.getRange(masterRowNum, systemIdx + 1).setValue(finalSystem);

      updatedCount++;
    }
  });

  return { success: true, updated: updatedCount };
}
```

**Data Flow:**
```
AI Results Row 2, Column M (idx 12) = "CP"
    ↓
finalSymptom = "CP"
    ↓
Master Row 3, Column R (idx 17 → getRange col 18) = "CP" ✅
```

---

## 🔍 WHY THE GID FIX MATTERS

### **The Problem (Before Fix)**

```javascript
// OLD CODE (BROKEN):
const masterSheet = ss.getSheetByName('Master Scenario Convert');
```

**Issue:**
- If multiple sheets named "Master Scenario Convert" exist (original + backups)
- `getSheetByName()` returns THE FIRST MATCH
- Could return backup sheet instead of production sheet
- Data writes to wrong location

**Scenario:**
```
Sheet List:
1. Master Scenario Convert (backup from Nov 10) ← getSheetByName() returns THIS
2. Master Scenario Convert (backup from Nov 11)
3. Master Scenario Convert (production, GID 1564998840) ← Should write HERE
```

---

### **The Solution (After Fix)**

```javascript
// NEW CODE (FIXED):
const MASTER_SCENARIO_CONVERT_GID = 1564998840;

function getSheetByGid_(gid) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const allSheets = ss.getSheets();

  for (let i = 0; i < allSheets.length; i++) {
    if (allSheets[i].getSheetId() == gid) {
      return allSheets[i];
    }
  }

  return null;
}

function getMasterScenarioConvertSheet_() {
  const sheet = getSheetByGid_(MASTER_SCENARIO_CONVERT_GID);

  if (!sheet) {
    throw new Error('Master sheet not found (GID: ' + MASTER_SCENARIO_CONVERT_GID + ')');
  }

  return sheet;
}

// USE IT:
const masterSheet = getMasterScenarioConvertSheet_();
```

**Why This Works:**
- Sheet GID is UNIQUE (from URL: `gid=1564998840`)
- Doesn't matter how many sheets share the same name
- ALWAYS returns the correct production sheet
- Throws clear error if sheet deleted/missing

**How to Find GID:**
1. Open the sheet in browser
2. Look at URL: `https://docs.google.com/spreadsheets/d/.../edit?gid=1564998840`
3. GID = `1564998840`

---

## 📋 STATUS LOGIC

### **How Status is Determined**

```javascript
let status = 'new';

if (caseData.currentSymptom && caseData.currentSymptom === suggestedSymptom) {
  status = 'match';
} else if (caseData.currentSymptom && caseData.currentSymptom !== suggestedSymptom) {
  status = 'conflict';
}
```

### **Status Meanings**

| Status | Current Symptom | Suggested Symptom | Meaning |
|--------|----------------|-------------------|---------|
| **🆕 new** | Empty | "CP" | No categorization exists, AI suggests CP |
| **✅ match** | "CP" | "CP" | Current matches AI suggestion (validation) |
| **⚠️ conflict** | "SOB" | "CP" | Current differs from AI (needs review) |

---

## 🎯 TESTING CHECKLIST

Use this to verify data flow is working correctly:

### **Test 1: Extraction (Master → AI Results)**

1. ✅ Pick a case in Master with Symptom "CP" and System "Cardiovascular"
2. ✅ Run AI Categorization
3. ✅ Check AI_Categorization_Results for that Case_ID
4. ✅ Verify Column D (Current_Symptom) = "CP"
5. ✅ Verify Column E (Current_System) = "Cardiovascular"

**✅ PASS:** Current columns accurately reflect Master data

---

### **Test 2: AI Processing**

1. ✅ Check AI_Categorization_Results Column F (Suggested_Symptom)
2. ✅ Should have valid symptom code (CP, SOB, ABD, etc.)
3. ✅ Check Column G (Suggested_Symptom_Name)
4. ✅ Should have full name ("Chest Pain", "Shortness of Breath", etc.)
5. ✅ Check Column H (Suggested_System)
6. ✅ Should have valid system (Cardiovascular, Respiratory, etc.)
7. ✅ Check Column I (AI_Reasoning)
8. ✅ Should have explanation text

**✅ PASS:** AI provided valid suggestions with reasoning

---

### **Test 3: Final Column Defaults**

1. ✅ Check AI_Categorization_Results Column M (Final_Symptom)
2. ✅ Should match Column F (Suggested_Symptom) by default
3. ✅ Check Column N (Final_System)
4. ✅ Should match Column H (Suggested_System) by default
5. ✅ Check Column O (Final_Symptom_Name)
6. ✅ Should match Column G (Suggested_Symptom_Name) by default

**✅ PASS:** Final columns correctly initialized from Suggested

---

### **Test 4: Apply Back (AI Results → Master)**

1. ✅ Note AI_Categorization_Results Row 2 (CARD0001):
   - Column M (Final_Symptom) = "CP"
   - Column N (Final_System) = "Cardiovascular"

2. ✅ Click "Apply to Master"

3. ✅ Check Master Scenario Convert Row 3 (CARD0001):
   - Column R should now = "CP"
   - Column S should now = "Cardiovascular"

**✅ PASS:** Data successfully written back to Master

---

### **Test 5: User Edit Flow**

1. ✅ In AI_Categorization_Results, manually edit Column M from "CP" to "SOB"
2. ✅ Save (Ctrl+S)
3. ✅ Click "Apply to Master" again
4. ✅ Check Master Column R - should now be "SOB" (user's edit, not AI's original)

**✅ PASS:** User edits respected during apply

---

## 🚨 FAILURE MODES TO WATCH FOR

### **1. Wrong Sheet Written**
**Symptom:** Apply shows success but Master sheet unchanged
**Cause:** Writing to backup sheet instead of production
**Fix:** Verify GID = 1564998840

---

### **2. Wrong Columns Written**
**Symptom:** Master columns other than R/S get updated
**Cause:** Column index mismatch
**Fix:** Verify `symptomIdx = 17` and `systemIdx = 18`

---

### **3. Case ID Mismatch**
**Symptom:** 0 cases updated even though AI Results has data
**Cause:** Case_ID format doesn't match between sheets
**Fix:** Verify Case_ID in both sheets matches exactly (case-sensitive)

---

### **4. Final Columns Empty**
**Symptom:** Apply skips cases even though Suggested columns filled
**Cause:** Final columns (M & N) not getting defaults
**Fix:** Verify `writeCategorizationResults()` copies Suggested to Final

---

## 📊 SUMMARY

The Ultimate Categorization Tool implements a **complete round-trip data flow**:

```
Master Sheet (Production Data)
    ↓
Extract current categorization
    ↓
AI analyzes and suggests improvements
    ↓
Write to AI_Categorization_Results sheet
    ↓
User reviews and optionally edits Final columns
    ↓
Apply writes Final columns back to Master
    ↓
Master Sheet (Updated with AI categorization) ✅
```

**Key Success Factors:**
1. ✅ GID-based sheet lookup (not name-based)
2. ✅ Hardcoded column indices (17 & 18 for Symptom & System)
3. ✅ Separate Current/Suggested/Final columns for full workflow
4. ✅ Case ID matching for accurate row updates
5. ✅ User-editable Final columns before applying

**The system is production-ready and functioning as designed.**
