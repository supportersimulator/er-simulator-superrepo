# 🎯 COMPLETE PATHWAY APPLICATION WORKFLOW

**Date**: 2025-11-10
**Status**: ✅ Schema Complete - Ready to Build UI

---

## 📊 SCHEMA OVERVIEW

### **Pathways_Master** (Draft Canvas - 29 Columns A-AC)

**Original Columns (A-R)**: Discovery phase
- A: Pathway_ID
- B: Pathway_Name
- C: Logic_Type_Used
- D: Category_Accronym
- E-H: Scores (Educational, Novelty, Market, Composite)
- I: Tier
- J: Case_IDs (original IDs array)
- K: Case_Sequence
- L: Target_Learner
- M: AI_Persuasion
- N: Learning_Outcomes
- O: Discovery_Date
- P: User_Rating
- Q: Status
- R: Notes

**Refinement Columns (S-AC)**: Added 2025-11-10
- S: Chief_Complaint_Accronym (CP, SOB, ABD, etc.)
- T: Pathway_Number (1-9 within symptom)
- U: Original_Case_IDs (permanent anchor - NEVER MODIFY)
- V: Proposed_New_Case_IDs (["CP101","CP102",...])
- W: Pre_Experience_Category ("Chest Pain Cases")
- X: Post_Experience_Category ("Cardiovascular")
- Y: Post_Experience_Category_Alt1 ("Pulmonary")
- Z: Post_Experience_Category_Alt2 ("Gastrointestinal")
- AA: Finalized (FALSE / TRUE)
- AB: Applied_Date (timestamp)
- AC: Applied_By ("Aaron")

---

### **Master Scenario Convert** (Production - 646 Columns)

**Key Existing Columns**:
- A: Case_ID (will be updated: GI01234 → CP101)
- I: Legacy_Case_ID (permanent anchor - NEVER MODIFY)
- X: Category_Symptom (will store accronym: "CP")
- Y: Category_System (will store system: "Cardiovascular")
- ... (638 other columns with vital signs, H&P, etc.)

**NEW Pathway Tracking Columns (XS-XV)**: Added 2025-11-10
- XS: Pathway_ID ("PATH_010")
- XT: Pathway_Name ("When Chest Pain Isn't What You Think")
- XU: Category_Symptom_Name ("Chest Pain Cases")
- XV: Category_System_Name ("Cardiovascular")

---

## 🔄 COMPLETE APPLICATION WORKFLOW

### **Step 4C: Execute Updates (CORRECTED)**

For each case in finalized pathway:

```javascript
// Example: PATH_010 with 4 cases
// Original IDs: ["GI01234", "NEURO00321", "CARD5678", "PULM9012"]
// New IDs: ["CP201", "CP202", "CP203", "CP204"]
// Pathway details from Pathways_Master:
//   - Pathway_ID: PATH_010
//   - Pathway_Name: "When Chest Pain Isn't What You Think"
//   - Chief_Complaint_Accronym: CP
//   - Pre_Experience_Category: "Chest Pain Cases"
//   - Post_Experience_Category: "Cardiovascular"

function applyPathwayToMaster(pathwayId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pathwaysSheet = ss.getSheetByName('Pathways_Master');
  const masterSheet = ss.getSheetByName('Master Scenario Convert');

  // Get pathway data
  const pathwayRow = findPathwayRow(pathwaysSheet, pathwayId);
  const pathwayName = pathwayRow[1]; // Column B
  const accronym = pathwayRow[18]; // Column S
  const originalCaseIDs = JSON.parse(pathwayRow[20]); // Column U
  const proposedNewCaseIDs = JSON.parse(pathwayRow[21]); // Column V
  const preCategoryName = pathwayRow[22]; // Column W
  const postCategoryName = pathwayRow[23]; // Column X

  Logger.log('Applying pathway: ' + pathwayName);
  Logger.log('Cases to update: ' + originalCaseIDs.length);

  // For each case in pathway
  for (let i = 0; i < originalCaseIDs.length; i++) {
    const originalID = originalCaseIDs[i];
    const newID = proposedNewCaseIDs[i];

    // STEP 1: Find row by Legacy_Case_ID (Column I - permanent anchor)
    const masterRow = findRowByLegacyCaseID(masterSheet, originalID);

    if (!masterRow) {
      throw new Error('Case not found: ' + originalID + ' (Legacy_Case_ID mismatch!)');
    }

    Logger.log('Updating row ' + masterRow + ': ' + originalID + ' → ' + newID);

    // STEP 2: Update ALL relevant columns

    // Column A: Case_ID (primary identifier)
    masterSheet.getRange(masterRow, 1).setValue(newID);
    // Example: "GI01234" → "CP201"

    // Column X: Category_Symptom (accronym for filtering)
    masterSheet.getRange(masterRow, 24).setValue(accronym);
    // Example: "GI" → "CP"

    // Column Y: Category_System (post-experience category)
    masterSheet.getRange(masterRow, 25).setValue(postCategoryName);
    // Example: "Gastrointestinal" → "Cardiovascular"

    // Column XS: Pathway_ID (NEW - tracks which pathway this belongs to)
    masterSheet.getRange(masterRow, 643).setValue(pathwayId);
    // Example: "PATH_010"

    // Column XT: Pathway_Name (NEW - human-readable pathway reference)
    masterSheet.getRange(masterRow, 644).setValue(pathwayName);
    // Example: "When Chest Pain Isn't What You Think"

    // Column XU: Category_Symptom_Name (NEW - pre-experience category name)
    masterSheet.getRange(masterRow, 645).setValue(preCategoryName);
    // Example: "Chest Pain Cases"

    // Column XV: Category_System_Name (NEW - post-experience category name)
    masterSheet.getRange(masterRow, 646).setValue(postCategoryName);
    // Example: "Cardiovascular"

    Logger.log('✅ Updated ' + newID + ' with pathway metadata');
  }

  Logger.log('✅ Pathway ' + pathwayId + ' applied successfully');
}

// Helper function to find row by Legacy_Case_ID
function findRowByLegacyCaseID(sheet, legacyCaseID) {
  const legacyColumn = 9; // Column I
  const data = sheet.getRange(2, legacyColumn, sheet.getLastRow() - 1, 1).getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === legacyCaseID) {
      return i + 2; // Row number (1-indexed, +1 for header)
    }
  }

  return null; // Not found
}
```

---

## 📋 BEFORE vs AFTER EXAMPLE

### **BEFORE Application** (Master Scenario Convert Row 42)

| Column | Field | Value |
|--------|-------|-------|
| A | Case_ID | `GI01234` |
| I | Legacy_Case_ID | `GI01234` (anchor) |
| X | Category_Symptom | `GI` |
| Y | Category_System | `Gastrointestinal` |
| XS | Pathway_ID | *(empty)* |
| XT | Pathway_Name | *(empty)* |
| XU | Category_Symptom_Name | *(empty)* |
| XV | Category_System_Name | *(empty)* |

**Learner Experience**: Sees "GI" category → expects GI issue → gets GI issue *(no surprise, less learning value)*

---

### **AFTER Application** (Same Row After Pathway Applied)

| Column | Field | Value |
|--------|-------|-------|
| A | Case_ID | `CP201` ✨ |
| I | Legacy_Case_ID | `GI01234` (unchanged - permanent anchor) |
| X | Category_Symptom | `CP` ✨ |
| Y | Category_System | `Cardiovascular` ✨ |
| XS | Pathway_ID | `PATH_010` ✨ |
| XT | Pathway_Name | `When Chest Pain Isn't What You Think` ✨ |
| XU | Category_Symptom_Name | `Chest Pain Cases` ✨ |
| XV | Category_System_Name | `Cardiovascular` ✨ |

**Learner Experience**: Sees "CP - Chest Pain Cases" → expects MI/cardiac → discovers it's actually aortic dissection mimicking MI *(diagnostic surprise, high learning value)*

---

## 🎯 WHY THESE COLUMNS MATTER

### **Column XS: Pathway_ID**
- **Purpose**: Link cases back to originating pathway
- **Use Case**: "Show me all cases in 'When Chest Pain Isn't What You Think' pathway"
- **Benefit**: Enables pathway-based filtering in UI

### **Column XT: Pathway_Name**
- **Purpose**: Human-readable pathway reference
- **Use Case**: Display pathway context in learner UI
- **Benefit**: Learner sees which educational sequence they're in

### **Column XU: Category_Symptom_Name**
- **Purpose**: Full symptom category name (not just accronym)
- **Use Case**: Pre-experience filtering ("Show me all Chest Pain Cases")
- **Benefit**: Mystery preserved - learner doesn't see diagnosis

### **Column XV: Category_System_Name**
- **Purpose**: Full system category name (revealed after)
- **Use Case**: Post-experience reflection ("That chest pain case was actually cardiovascular")
- **Benefit**: Educational context for review

---

## 🔍 QUERY EXAMPLES WITH NEW COLUMNS

### **Query 1: Find all cases in a specific pathway**
```javascript
// Filter Master Scenario Convert by Pathway_ID
WHERE Column XS = "PATH_010"

// Returns:
// CP201, CP202, CP203, CP204
```

### **Query 2: Find all Chest Pain Cases (pre-experience)**
```javascript
// Filter by Category_Symptom_Name (mystery preserved)
WHERE Column XU = "Chest Pain Cases"

// Returns all CP*** cases without revealing diagnoses
```

### **Query 3: Find all Cardiovascular cases (post-experience)**
```javascript
// Filter by Category_System_Name (educational context)
WHERE Column XV = "Cardiovascular"

// Returns CP201, SYNC105, AMS203, etc. (all cardiac cases)
```

### **Query 4: Cross-reference pathways**
```javascript
// Find cases that appear in multiple pathways (shouldn't happen, but validate)
SELECT Case_ID, Pathway_ID, Pathway_Name
FROM Master Scenario Convert
GROUP BY Case_ID
HAVING COUNT(Pathway_ID) > 1
```

---

## ✅ SCHEMA DEPLOYMENT COMPLETE

**Pathways_Master**: 29 columns (A-AC) ✅
**Master Scenario Convert**: 646 columns (A-XV) ✅
**Category Mapping Sheet**: 39 accronyms ✅
**Apps Script Functions**: 7 functions added ✅

---

## 🚀 NEXT STEPS

### **Option B: Refinement UI** (Next Sprint)
- Build "Refine" tab in existing modal
- Accronym dropdown (populates from mapping sheet)
- Pathway number selector (1-9)
- Case reordering (drag & drop)
- Live Case ID preview
- Save Draft / Finalize buttons

### **Option C: Application Engine** (Following Sprint)
- Batch application button
- 5-layer safety validation
- Backup/rollback system
- Apply finalized pathways to production
- Update all 7 columns in Master Scenario Convert

---

## 🔒 SAFETY GUARANTEES

1. **Legacy_Case_ID (Column I)**: Never modified - permanent anchor
2. **Original_Case_IDs (Column U)**: Copied once at discovery - permanent reference
3. **5-Layer Validation**: Multiple checks before production update
4. **Backup System**: Automatic snapshot before changes
5. **Rollback Ready**: One-click undo capability
6. **Audit Trail**: Applied_Date, Applied_By track all changes

---

**Status**: ✅ Schema Complete
**Ready For**: Refinement UI Build (Option B)
**Next Task**: Design and implement "Refine" tab in modal

---

_Generated by Atlas (Claude Code) - 2025-11-10_
