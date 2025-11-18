# 📊 AI Categorization Results - Complete Column Guide

**Date:** November 13, 2025
**Purpose:** Explain EXACTLY what each column contains and where the data comes from

---

## 🗂️ THE 15 COLUMNS (A-O)

### **📌 SECTION 1: Case Information (Columns A-E)**
*Data extracted from Master Scenario Convert sheet*

#### **Column A: Case_ID**
- **Source:** Master sheet Column A (index 0)
- **Example:** "CARD0001", "RESP0003"
- **Purpose:** Unique identifier for each case
- **Type:** String (readonly - from Master)

#### **Column B: Legacy_Case_ID**
- **Source:** Master sheet Column I (index 8)
- **Example:** "Legacy_001", "OLD_CARD_005"
- **Purpose:** Original case ID before renaming
- **Type:** String (readonly - from Master)

#### **Column C: Row_Index**
- **Source:** Calculated as `i + 3` (row number in Master sheet)
- **Example:** 3, 4, 5, ... 209
- **Purpose:** Tells you which row in Master sheet this case came from
- **Type:** Number (calculated during extraction)
- **Why +3:** Master sheet data starts at row 3 (rows 1-2 are headers)

#### **Column D: Current_Symptom**
- **Source:** Master sheet Column R (index 17)
- **Example:** "CP", "SOB", "ABD" (or empty if not yet categorized)
- **Purpose:** The CURRENT symptom code already in Master sheet
- **Type:** String (readonly - from Master)
- **Note:** This is what was ALREADY there before AI categorization

#### **Column E: Current_System**
- **Source:** Master sheet Column S (index 18)
- **Example:** "Cardiovascular", "Respiratory" (or empty)
- **Purpose:** The CURRENT system already in Master sheet
- **Type:** String (readonly - from Master)
- **Note:** This is what was ALREADY there before AI categorization

---

### **📌 SECTION 2: AI Suggestions (Columns F-I)**
*Data returned by ChatGPT API*

#### **Column F: Suggested_Symptom**
- **Source:** ChatGPT response field `symptom`
- **Example:** "CP", "SOB", "ABD"
- **Purpose:** AI's suggested symptom CODE (acronym)
- **Type:** String (from ChatGPT JSON)
- **Prompt field:** `"symptom": "symptom code from valid list"`

#### **Column G: Suggested_Symptom_Name**
- **Source:** ChatGPT response field `symptomName` OR fallback to mapping
- **Example:** "Chest Pain", "Shortness of Breath", "Abdominal Pain"
- **Purpose:** AI's suggested symptom FULL NAME
- **Type:** String (from ChatGPT JSON or fallback)
- **Prompt field:** `"symptomName": "full name (e.g., Chest Pain)"`
- **Fallback logic:**
  ```javascript
  cat.symptomName || mapping[cat.symptom] || ''
  ```
  1. Try ChatGPT's `symptomName` field
  2. If empty, lookup `cat.symptom` in `accronym_symptom_system_mapping` sheet
  3. If still empty, use empty string

#### **Column H: Suggested_System**
- **Source:** ChatGPT response field `system`
- **Example:** "Cardiovascular", "Respiratory", "Gastrointestinal"
- **Purpose:** AI's suggested body system
- **Type:** String (from ChatGPT JSON)
- **Prompt field:** `"system": "system from valid list"`

#### **Column I: AI_Reasoning**
- **Source:** ChatGPT response field `reasoning`
- **Example:** "Patient presents with acute chest pain radiating to left arm, consistent with cardiac etiology."
- **Purpose:** AI's explanation for why it chose this categorization
- **Type:** String (from ChatGPT JSON)
- **Prompt field:** `"reasoning": "brief explanation"`

---

### **📌 SECTION 3: Metadata (Columns J-L)**
*Derived values and user input fields*

#### **Column J: Confidence**
- **Source:** Hardcoded as `"medium"`
- **Example:** "medium"
- **Purpose:** Confidence level (currently always "medium")
- **Type:** String (hardcoded)
- **Future:** Could be enhanced to use AI-provided confidence scores

#### **Column K: Status**
- **Source:** Calculated by comparing Current vs Suggested
- **Possible values:**
  - `"new"` - Master sheet had no symptom, this is a new categorization
  - `"match"` - Current symptom matches AI suggestion (agreement)
  - `"conflict"` - Current symptom differs from AI suggestion (disagreement)
- **Logic:**
  ```javascript
  if (caseData.currentSymptom && caseData.currentSymptom === suggestedSymptom)
    status = 'match';
  else if (caseData.currentSymptom && caseData.currentSymptom !== suggestedSymptom)
    status = 'conflict';
  else
    status = 'new';
  ```

#### **Column L: User_Decision**
- **Source:** Empty by default, for manual user input
- **Example:** "approved", "rejected", "modified"
- **Purpose:** Allows you to track which suggestions you accepted/rejected
- **Type:** String (user editable)

---

### **📌 SECTION 4: Final Values (Columns M-O)**
*The values that get applied to Master sheet*

#### **Column M: Final_Symptom** ⭐ **MOST IMPORTANT**
- **Source:** Copy of `suggestedSymptomName` (Column G)
- **Example:** "Chest Pain", "Shortness of Breath"
- **Purpose:** The FINAL symptom that will be written to Master sheet
- **Type:** String (user editable)
- **Applied to:** Master sheet Column R when you click "Apply to Master"
- **CODE:**
  ```javascript
  suggestedSymptomName,     // M: Final_Symptom (full name like "Chest Pain")
  ```
- **WHY EDITABLE:** You can manually change this if you disagree with AI
- **CRITICAL:** This should be FULL NAME, not acronym!

#### **Column N: Final_System**
- **Source:** Copy of `suggestedSystem` (Column H)
- **Example:** "Cardiovascular", "Respiratory"
- **Purpose:** The FINAL system that will be written to Master sheet
- **Type:** String (user editable)
- **Applied to:** Master sheet Column S when you click "Apply to Master"

#### **Column O: Final_Symptom_Name**
- **Source:** Copy of `suggestedSymptomName` (Column G)
- **Example:** "Chest Pain", "Shortness of Breath"
- **Purpose:** Backup/reference of the full symptom name
- **Type:** String (user editable)
- **Note:** Redundant with Column M, but kept for reference

---

## 🔄 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│ MASTER SHEET (Source)                                        │
│  Column A → Case_ID                                          │
│  Column I → Legacy_Case_ID                                   │
│  Column R → Current_Symptom (existing categorization)        │
│  Column S → Current_System (existing categorization)         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ EXTRACTION (extractCasesForCategorization)                   │
│  Creates caseData objects with:                              │
│   • caseID, legacyCaseID, rowIndex                           │
│   • currentSymptom, currentSystem                            │
│   • chiefComplaint, presentation, diagnosis                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ CHATGPT API (callGPT4)                                       │
│  Prompt: "Categorize these cases..."                         │
│  Response: Array of objects with:                            │
│   {                                                           │
│     "symptom": "CP",                ← Acronym                 │
│     "symptomName": "Chest Pain",    ← Full Name              │
│     "system": "Cardiovascular",                              │
│     "reasoning": "..."                                        │
│   }                                                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ PARSING (writeCategorizationResults)                         │
│  For each case:                                              │
│   const cat = categorizations[idx] || {};                    │
│   const suggestedSymptom = cat.symptom || '';                │
│   const suggestedSymptomName = cat.symptomName               │
│                                 || mapping[cat.symptom]      │
│                                 || '';                       │
│   const suggestedSystem = cat.system || '';                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ AI_CATEGORIZATION_RESULTS SHEET (15 columns A-O)            │
│  A: caseData.caseID                                          │
│  B: caseData.legacyCaseID                                    │
│  C: caseData.rowIndex                                        │
│  D: caseData.currentSymptom                                  │
│  E: caseData.currentSystem                                   │
│  F: suggestedSymptom          (ChatGPT "symptom")            │
│  G: suggestedSymptomName      (ChatGPT "symptomName")        │
│  H: suggestedSystem           (ChatGPT "system")             │
│  I: cat.reasoning             (ChatGPT "reasoning")          │
│  J: "medium"                  (hardcoded)                    │
│  K: status                    (calculated)                   │
│  L: ""                        (user editable)                │
│  M: suggestedSymptomName      ⭐ FULL NAME                   │
│  N: suggestedSystem           ⭐ SYSTEM                      │
│  O: suggestedSymptomName      (redundant backup)             │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ (User reviews, edits if needed)
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ APPLY TO MASTER (applyCategorizationToMaster)                │
│  For each row in AI_Categorization_Results:                  │
│   Read Column M (Final_Symptom)                              │
│   Read Column N (Final_System)                               │
│   Find matching Case_ID in Master sheet                      │
│   Write to Master Column R ← Column M                        │
│   Write to Master Column S ← Column N                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ MASTER SHEET (Updated)                                       │
│  Column R → Final_Symptom (FULL NAME like "Chest Pain")     │
│  Column S → Final_System ("Cardiovascular")                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🐛 DEBUGGING: Why is Column M showing acronyms?

### **Possible Causes:**

#### **1. Old Data**
- **Problem:** You're looking at data from BEFORE the fix was deployed
- **Solution:** Clear AI_Categorization_Results and re-run
- **Check:** Look at Column G - if it has full names, but Column M has acronyms, this is the issue

#### **2. Mapping Sheet Has Acronyms**
- **Problem:** The `accronym_symptom_system_mapping` sheet Column B has acronyms instead of full names
- **Solution:** Check the mapping sheet, ensure Column B has "Chest Pain" not "CP"
- **Check:** Open `accronym_symptom_system_mapping` sheet and verify Column B

#### **3. ChatGPT Not Returning symptomName**
- **Problem:** ChatGPT's response doesn't include `symptomName` field
- **Solution:** The fallback to `mapping[cat.symptom]` should handle this
- **Check:** If Column G is empty, ChatGPT isn't returning symptomName AND mapping failed

#### **4. Code Not Saved/Deployed**
- **Problem:** The fix wasn't saved to the live Apps Script project
- **Solution:** Verify line 1534 in Apps Script editor
- **Check:** We already confirmed this is correct via API

---

## 🔧 TROUBLESHOOTING STEPS

### **Step 1: Check the Mapping Sheet**
1. Open `accronym_symptom_system_mapping` sheet
2. Verify structure:
   - Column A: Acronyms (CP, SOB, ABD, PSY, etc.)
   - Column B: Full names ("Chest Pain", "Shortness of Breath", etc.)
3. If Column B has acronyms, update them to full names

### **Step 2: Clear and Re-Run**
1. Delete or clear AI_Categorization_Results sheet
2. Run "AI Categorization" tool
3. Check Column M in new data

### **Step 3: Compare Columns**
In the new data:
- Column F should have: "CP", "SOB", "ABD" (codes)
- Column G should have: "Chest Pain", "Shortness of Breath" (names)
- Column M should have: "Chest Pain", "Shortness of Breath" (names - SAME AS G)

If Column M doesn't match Column G, there's still a bug.

---

## 📝 SUMMARY

**What Column M SHOULD contain:**
- Full symptom names like "Chest Pain", "Shortness of Breath"
- NOT acronyms like "CP", "SOB"

**Where Column M gets its data:**
1. Tries ChatGPT's `symptomName` field
2. Falls back to `mapping[cat.symptom]` if missing
3. Uses empty string if both fail

**Where Column M data goes:**
- Gets applied to Master sheet Column R when you click "Apply to Master"

**Why it matters:**
- Master sheet Column R should have human-readable full symptom names
- NOT cryptic acronyms
- This makes the data more usable and understandable

---

**Last Updated:** November 13, 2025
**Fix Status:** Code is correct, but data may be from before fix was deployed
**Action:** Check mapping sheet and re-run categorization
