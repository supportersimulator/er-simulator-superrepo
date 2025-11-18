# 🎯 Final Categorization Structure - FOR YOUR APPROVAL

**Date:** November 13, 2025
**Status:** AWAITING USER CONFIRMATION

---

## 📊 AI_CATEGORIZATION_RESULTS SHEET STRUCTURE

### **16 Columns (A-P)**

```
┌─────┬────────────────────────────────┬──────────────────────────────────────┐
│ Col │ Header Name                    │ Example Value                        │
├─────┴────────────────────────────────┴──────────────────────────────────────┤
│ SECTION 1: Case Information (from Master Sheet)                            │
├─────┬────────────────────────────────┬──────────────────────────────────────┤
│ A   │ Case_ID                        │ "CARD0001"                           │
│ B   │ Legacy_Case_ID                 │ "Legacy_001"                         │
│ C   │ Row_Index                      │ 3, 4, 5... (row number in Master)   │
│ D   │ Spark_Title                    │ "Crushing Chest Pain"                │
│ E   │ Reveal_Title                   │ "Acute Myocardial Infarction"        │
├─────┴────────────────────────────────┴──────────────────────────────────────┤
│ SECTION 2: AI Suggestions (from ChatGPT)                                   │
├─────┬────────────────────────────────┬──────────────────────────────────────┤
│ F   │ Suggested_Symptom_Code         │ "CP"                                 │
│ G   │ Suggested_Symptom_Name         │ "Chest Pain"                         │
│ H   │ Suggested_System_Code          │ "CARD"                               │
│ I   │ Suggested_System_Name          │ "Cardiovascular"                     │
│ J   │ AI_Reasoning                   │ "Patient presents with acute..."     │
├─────┴────────────────────────────────┴──────────────────────────────────────┤
│ SECTION 3: Metadata                                                         │
├─────┬────────────────────────────────┬──────────────────────────────────────┤
│ K   │ Status                         │ "new" / "match" / "conflict"         │
│ L   │ User_Decision                  │ (empty - user can edit)              │
├─────┴────────────────────────────────┴──────────────────────────────────────┤
│ SECTION 4: Final Values (Applied to Master P, Q, R, S)                     │
├─────┬────────────────────────────────┬──────────────────────────────────────┤
│ M   │ Final_Symptom_Code             │ "CP"          → Master Column P      │
│ N   │ Final_System_Code              │ "CARD"        → Master Column Q      │
│ O   │ Final_Symptom_Name             │ "Chest Pain"  → Master Column R      │
│ P   │ Final_System_Name              │ "Cardiovascular" → Master Column S   │
└─────┴────────────────────────────────┴──────────────────────────────────────┘
```

---

## 🗂️ MASTER SHEET COLUMN MAPPING

### **What We Read FROM Master (for extraction):**

```
Column A (idx 0)  → Case_ID
Column B (idx 1)  → Spark_Title (Case_Organization_Spark_Title)
Column C (idx 2)  → Reveal_Title (Case_Organization_Reveal_Title)
Column E (idx 4)  → Chief_Complaint (sent to ChatGPT)
Column F (idx 5)  → Presentation (sent to ChatGPT)
Column G (idx 6)  → Diagnosis (sent to ChatGPT)
Column I (idx 8)  → Legacy_Case_ID
Column P (idx 15) → Current_Symptom_Code (for comparison)
Column Q (idx 16) → Current_System_Code (for comparison)
Column R (idx 17) → Current_Symptom_Name (for comparison)
Column S (idx 18) → Current_System_Name (for comparison)
```

### **What We WRITE TO Master (when "Apply to Master"):**

```
Master Column P (idx 15) ← AI Results Column M (Final_Symptom_Code)
Master Column Q (idx 16) ← AI Results Column N (Final_System_Code)
Master Column R (idx 17) ← AI Results Column O (Final_Symptom_Name)
Master Column S (idx 18) ← AI Results Column P (Final_System_Name)
```

### **Master Column Headers (for confirmation):**

```
P: Case_Organization_Category_Symptom_Code
Q: Case_Organization_Category_System_Code
R: Case_Organization_Category_Symptom
S: Case_Organization_Category_System
```

---

## 🤖 CHATGPT PROMPT STRUCTURE

### **What We Send to ChatGPT:**

```json
{
  "caseID": "CARD0001",
  "sparkTitle": "Crushing Chest Pain",
  "revealTitle": "Acute Myocardial Infarction",
  "chiefComplaint": "63 y/o M with sudden onset chest pain",
  "presentation": "Patient is diaphoretic, clutching chest...",
  "diagnosis": "STEMI - Acute Myocardial Infarction"
}
```

### **What We Ask ChatGPT to Return:**

```json
{
  "symptomCode": "CP",
  "symptomName": "Chest Pain",
  "systemCode": "CARD",
  "systemName": "Cardiovascular",
  "reasoning": "Patient presents with acute chest pain radiating to left arm, consistent with cardiac etiology"
}
```

### **Prompt Instructions to ChatGPT:**

```
You are a medical education expert. Categorize emergency medicine simulation cases.

VALID SYMPTOM CODES:
CP - Chest Pain
SOB - Shortness of Breath
ABD - Abdominal Pain
AMS - Altered Mental Status
...etc...

VALID SYSTEM CODES AND NAMES:
CARD - Cardiovascular
RESP - Respiratory
GI - Gastrointestinal
NEURO - Neurological
...etc...

CRITICAL RULES:
1. "symptomCode" must be an acronym from the valid list (e.g., "CP", "SOB")
2. "symptomName" must be the FULL ENGLISH NAME (e.g., "Chest Pain", NOT "CP")
3. "systemCode" must be an acronym from the valid list (e.g., "CARD", "RESP")
4. "systemName" must be the FULL NAME (e.g., "Cardiovascular", NOT "CARD")
5. Base categorization on MEDICAL DIAGNOSIS, not case metadata
6. Ignore series names, difficulty labels, educational metadata

CASES TO CATEGORIZE:
[array of cases as shown above]

Return JSON array with EXACT structure shown above.
```

---

## 🗺️ MAPPING SHEET UPDATE

### **Current Structure:**
```
accronym_symptom_system_mapping sheet:
  Column A: Symptom Acronym (CP, SOB, ABD...)
  Column B: Symptom Full Name (Chest Pain, Shortness of Breath...)
```

### **Proposed New Structure:**
```
accronym_symptom_system_mapping sheet:
  Column A: Symptom Code (CP, SOB, ABD...)
  Column B: Symptom Name (Chest Pain, Shortness of Breath...)
  Column C: System Code (CARD, RESP, GI...) ⭐ NEW
  Column D: System Name (Cardiovascular, Respiratory, Gastrointestinal...) ⭐ NEW
```

### **Example Mapping Data:**

```
┌──────────┬──────────────────────┬─────────┬──────────────────┐
│ Symptom  │ Symptom              │ System  │ System           │
│ Code     │ Name                 │ Code    │ Name             │
├──────────┼──────────────────────┼─────────┼──────────────────┤
│ CP       │ Chest Pain           │ CARD    │ Cardiovascular   │
│ SOB      │ Shortness of Breath  │ RESP    │ Respiratory      │
│ ABD      │ Abdominal Pain       │ GI      │ Gastrointestinal │
│ AMS      │ Altered Mental Status│ NEURO   │ Neurological     │
│ FEVER    │ Fever                │ INF     │ Infectious       │
│ TRAUMA   │ Trauma               │ TRAUMA  │ Trauma           │
└──────────┴──────────────────────┴─────────┴──────────────────┘
```

---

## 🔄 COMPLETE DATA FLOW

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Extract from Master Sheet                          │
└─────────────────────────────────────────────────────────────┘
Master Row 3:
  Column A → caseID = "CARD0001"
  Column B → sparkTitle = "Crushing Chest Pain"
  Column C → revealTitle = "Acute MI"
  Column E → chiefComplaint = "63 y/o M with chest pain"
  Column F → presentation = "Diaphoretic, clutching chest"
  Column G → diagnosis = "STEMI"
  Column I → legacyCaseID = "Legacy_001"
  Column P → currentSymptomCode = "" (empty - not yet categorized)
  Column Q → currentSystemCode = "" (empty)
  Column R → currentSymptomName = "" (empty)
  Column S → currentSystemName = "" (empty)

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Send to ChatGPT                                     │
└─────────────────────────────────────────────────────────────┘
Prompt with case data → ChatGPT API

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ STEP 3: ChatGPT Returns                                     │
└─────────────────────────────────────────────────────────────┘
{
  "symptomCode": "CP",
  "symptomName": "Chest Pain",
  "systemCode": "CARD",
  "systemName": "Cardiovascular",
  "reasoning": "..."
}

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Parse with Fallback                                │
└─────────────────────────────────────────────────────────────┘
suggestedSymptomCode = cat.symptomCode || ''
suggestedSymptomName = cat.symptomName || mapping[cat.symptomCode]?.name || ''
suggestedSystemCode = cat.systemCode || ''
suggestedSystemName = cat.systemName || mapping[cat.systemCode]?.name || ''

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Write to AI_Categorization_Results (16 columns)    │
└─────────────────────────────────────────────────────────────┘
A: "CARD0001"
B: "Legacy_001"
C: 3
D: "Crushing Chest Pain"
E: "Acute MI"
F: "CP"                    ← ChatGPT symptomCode
G: "Chest Pain"            ← ChatGPT symptomName (or fallback)
H: "CARD"                  ← ChatGPT systemCode
I: "Cardiovascular"        ← ChatGPT systemName (or fallback)
J: "Patient presents..."   ← ChatGPT reasoning
K: "new"                   ← Status (calculated)
L: ""                      ← User_Decision (empty)
M: "CP"                    ← Final_Symptom_Code (copy from F)
N: "CARD"                  ← Final_System_Code (copy from H)
O: "Chest Pain"            ← Final_Symptom_Name (copy from G)
P: "Cardiovascular"        ← Final_System_Name (copy from I)

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ STEP 6: User Reviews (Optional)                            │
└─────────────────────────────────────────────────────────────┘
User can edit columns M, N, O, P if they disagree with AI

                    ↓

┌─────────────────────────────────────────────────────────────┐
│ STEP 7: Apply to Master Sheet                              │
└─────────────────────────────────────────────────────────────┘
Read AI_Categorization_Results:
  Column M → Write to Master Column P (Symptom Code)
  Column N → Write to Master Column Q (System Code)
  Column O → Write to Master Column R (Symptom Name)
  Column P → Write to Master Column S (System Name)

Result in Master Row 3:
  Column P: "CP"
  Column Q: "CARD"
  Column R: "Chest Pain"
  Column S: "Cardiovascular"
```

---

## ❓ QUESTIONS FOR YOUR CONFIRMATION

### **1. Master Sheet Column Names - Are these EXACT?**

Please confirm or correct:
- Column B: `Case_Organization_Spark_Title` ← CONFIRM? ___________
- Column C: `Case_Organization_Reveal_Title` ← CONFIRM? ___________
- Column P: `Case_Organization_Category_Symptom_Code` ← CONFIRM? ___________
- Column Q: `Case_Organization_Category_System_Code` ← CONFIRM? ___________
- Column R: `Case_Organization_Category_Symptom` ← CONFIRM? ___________
- Column S: `Case_Organization_Category_System` ← CONFIRM? ___________

### **2. System Codes - What are the valid codes?**

Please provide the complete list of system codes you want to use:
```
CARD - Cardiovascular
RESP - Respiratory
GI - Gastrointestinal
NEURO - Neurological
ENDO - Endocrine
INF - Infectious
TRAUMA - Trauma
PEDS - Pediatric
OB - Obstetric
PSYCH - Psychiatric
... others? Please list all
```

### **3. Symptom Codes - Are these your current codes?**

```
CP - Chest Pain
SOB - Shortness of Breath
ABD - Abdominal Pain
AMS - Altered Mental Status
PSY - Psychiatric
FEVER - Fever
TRAUMA - Trauma
ACLS - Advanced Cardiac Life Support
... others? Please list all
```

### **4. Mapping Sheet Update - Should I create this for you?**

Do you want me to:
- [ ] Create the updated mapping sheet with columns A, B, C, D
- [ ] Just tell you the structure and you'll update it manually
- [ ] Something else?

### **5. Column Indices - Please verify these are correct:**

```
Master Column P = index 15 ← CONFIRM? ___________
Master Column Q = index 16 ← CONFIRM? ___________
Master Column R = index 17 ← CONFIRM? ___________
Master Column S = index 18 ← CONFIRM? ___________
```

(Index 0 = Column A, Index 1 = Column B, etc.)

---

## ✅ APPROVAL CHECKLIST

Please check each item:

- [ ] I confirm the AI_Categorization_Results structure (16 columns A-P)
- [ ] I confirm the Master sheet column names (B, C, P, Q, R, S)
- [ ] I confirm the Master sheet column indices (P=15, Q=16, R=17, S=18)
- [ ] I have provided the complete list of valid System Codes
- [ ] I have provided the complete list of valid Symptom Codes
- [ ] I approve adding Spark/Reveal titles to ChatGPT prompt
- [ ] I approve the debug logging (temporary, for testing)
- [ ] I approve the enhanced prompt instructions

**Additional notes or changes:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

## 🚀 NEXT STEPS AFTER APPROVAL

Once you confirm everything above, I will:

1. ✅ Update `extractCasesForCategorization` function
2. ✅ Update `buildCategorizationPrompt` function
3. ✅ Update `writeCategorizationResults` function
4. ✅ Update `applyCategorizationToMaster` function
5. ✅ Add debug logging
6. ✅ Update all column headers
7. ✅ Deploy via Apps Script API
8. ✅ Test with 5 cases
9. ✅ Verify all columns populate correctly
10. ✅ Run full categorization on 207 cases

**Estimated implementation time:** 15-20 minutes after your approval

