# 🎯 PATHWAYS TO MASTER WORKFLOW - COMPLETE DESIGN

**Date**: 2025-11-09
**Status**: 📋 Design Complete - Ready for Implementation
**Purpose**: Safe pathway refinement → Master Scenario Convert application system

---

## 🎨 THE VISION

**Pathways_Master = Rough Draft Canvas**
**Master Scenario Convert = Production Data (Sacred)**

### The Workflow Philosophy:

```
AI Discovers Pathways (Rough Draft)
    ↓
Aaron Refines in Pathways_Master (Safe sandbox)
    - Adjust case order
    - Rename pathway
    - Assign symptom-based Case IDs (CP101, SOB201, etc.)
    - Categorize (Rosh/OnlineMedEd/EMRAP style)
    ↓
Finalize Button (Once satisfied)
    ↓
Update Master Scenario Convert (Production)
    - Apply new Case IDs
    - Update Pathway columns
    - Update Category columns
    - Preserve all original data (using Legacy_Case_ID as anchor)
```

---

## 📊 CURRENT STATE ANALYSIS

### **Pathways_Master Sheet** (Columns A-R):

| Column | Field | Current Data | Issue |
|--------|-------|--------------|-------|
| A | Pathway_ID | PATH_001, PATH_002 | ✅ Good |
| B | Pathway_Name | "Mastering Team Communication..." | ✅ Good |
| C | Logic_Type_Used | "Interpersonal Intelligence" | ✅ Good |
| D | Category_Accronym | Currently has full text | ❌ **Needs redesign** |
| E | Educational_Score | 9, 8, 9 | ✅ Good |
| F | Novelty_Score | 7, 8, 8 | ✅ Good |
| G | Market_Score | 8, 6, 6 | ✅ Good |
| H | Composite_Score | 8.25, 8, 8 | ✅ Good |
| I | Tier | "A-Tier", "B-Tier" | ✅ Good |
| J | Case_IDs | ["EM001","EM015","EM032","EM046"] | ❌ **Old format** |
| K | Case_Sequence | Same as J | ✅ Good (order) |
| L | Target_Learner | "PGY1-3" | ✅ Good |
| M | AI_Persuasion | Long text | ✅ Good |
| N | Learning_Outcomes | JSON array | ✅ Good |
| O | Discovery_Date | 2025-11-09 | ✅ Good |
| P | User_Rating | (empty) | ✅ Good |
| Q | Status | "pending" | ✅ Good |
| R | Notes | (empty) | ✅ Good |

### **Master Scenario Convert Sheet** (Key Columns):

| Column | Field | Purpose |
|--------|-------|---------|
| A | Case_ID | **PRIMARY KEY** - Will update with CP101, SOB201, etc. |
| D | Case_Series_Name | Will update with pathway name |
| E | Case_Series_Order | Will update with 1, 2, 3, 4... |
| F | Pathway_or_Course_Name | Will update with pathway name |
| I | Legacy_Case_ID | **ANCHOR** - Original Case_ID (never changes) |
| L | Medical_Category | Will update with Rosh/OnlineMedEd categories |
| M | Case_Organization | Will update with category info |

---

## 🔧 PROPOSED SCHEMA CHANGES

### **Pathways_Master - NEW COLUMNS** (Add after column R):

| Column | Field Name | Data Type | Purpose | Example |
|--------|-----------|-----------|---------|---------|
| **S** | Chief_Complaint_Accronym | Text | Symptom-based accronym | `CP`, `SOB`, `ABD`, `HA` |
| **T** | Pathway_Number | Integer | Pathway rank within symptom | `1`, `2`, `3` |
| **U** | Original_Case_IDs | JSON Array | **ANCHOR** - Original IDs from Master | `["GI01234","NEURO00321"]` |
| **V** | Proposed_New_Case_IDs | JSON Array | New symptom-based IDs | `["CP101","CP102","CP103"]` |
| **W** | Rosh_Category | Text | Rosh Review category | "Cardiovascular", "Pulmonary" |
| **X** | OnlineMedEd_Category | Text | OME category | "Cardiology", "Pulmonology" |
| **Y** | EMRAP_Category | Text | EMRAP category | "Cardiac", "Respiratory" |
| **Z** | Primary_Learning_Category | Text | Unified category | "Cardiac Emergencies" |
| **AA** | Finalized | Boolean | Ready to apply? | `FALSE` / `TRUE` |
| **AB** | Applied_Date | Timestamp | When applied to Master | `2025-11-09 14:32:15` |
| **AC** | Applied_By | Text | Who finalized it | "Aaron" |

---

## 🏗️ THE COMPLETE WORKFLOW

### **PHASE 1: AI Discovery → Pathways_Master** (Already Working ✅)

```javascript
// AI discovers pathways and writes to Pathways_Master
function saveDiscoveredPathway(pathwayData) {
  const pathwaysSheet = ss.getSheetByName('Pathways_Master');

  pathwaysSheet.appendRow([
    pathwayData.pathway_id,        // A: PATH_001
    pathwayData.pathway_name,      // B: "Chest Pain Mimickers"
    pathwayData.logic_type,        // C: "Diagnostic Traps"
    '',                            // D: Category_Accronym (empty - Aaron will fill)
    pathwayData.educational_score, // E: 9
    pathwayData.novelty_score,     // F: 8
    pathwayData.market_score,      // G: 7
    pathwayData.composite_score,   // H: 8.5
    pathwayData.tier,              // I: "A-Tier"
    JSON.stringify(pathwayData.case_ids), // J: ["GI01234","NEURO00321"]
    JSON.stringify(pathwayData.case_sequence), // K: Same as J
    pathwayData.target_learner,    // L: "PGY1-3"
    pathwayData.persuasion,        // M: AI persuasion text
    JSON.stringify(pathwayData.learning_outcomes), // N: JSON
    new Date(),                    // O: Discovery_Date
    '',                            // P: User_Rating (empty)
    'pending',                     // Q: Status
    '',                            // R: Notes
    // NEW COLUMNS:
    '',                            // S: Chief_Complaint_Accronym (empty)
    '',                            // T: Pathway_Number (empty)
    JSON.stringify(pathwayData.case_ids), // U: Original_Case_IDs (ANCHOR!)
    '',                            // V: Proposed_New_Case_IDs (empty)
    '',                            // W: Rosh_Category
    '',                            // X: OnlineMedEd_Category
    '',                            // Y: EMRAP_Category
    '',                            // Z: Primary_Learning_Category
    'FALSE',                       // AA: Finalized
    '',                            // AB: Applied_Date
    ''                             // AC: Applied_By
  ]);
}
```

---

### **PHASE 2: Aaron's Refinement UI** (NEW - To Build)

**Location**: Pathways_Master sheet sidebar or modal

**UI Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│ 🎨 PATHWAY REFINEMENT STUDIO                                    │
│                                                                 │
│ Pathway: PATH_001 - "Mastering Team Communication..."          │
│ Status: ⏸️ PENDING (Draft)                                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📝 STEP 1: RENAME PATHWAY (Optional)                           │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Current: Mastering Team Communication Under Pressure    │   │
│ │ New:     [                                             ]│   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ 🔢 STEP 2: REORDER CASES                                       │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ [Drag & Drop] Case Sequence Editor                       │   │
│ │                                                           │   │
│ │ 1. EM001 - Cardiac Arrest in Crowded Clinic [↑] [↓]     │   │
│ │ 2. EM015 - Complex Multi-Trauma          [↑] [↓]        │   │
│ │ 3. EM032 - Pediatric Respiratory Failure [↑] [↓]        │   │
│ │ 4. EM046 - Elderly Stroke with Family    [↑] [↓]        │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ 🏷️ STEP 3: ASSIGN SYMPTOM ACCRONYM                            │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ What is the CHIEF COMPLAINT for this pathway?            │   │
│ │                                                           │   │
│ │ [Dropdown: Select Chief Complaint]                       │   │
│ │   - CP (Chest Pain)                                      │   │
│ │   - SOB (Shortness of Breath)                            │   │
│ │   - ABD (Abdominal Pain)                                 │   │
│ │   - HA (Headache)                                        │   │
│ │   - AMS (Altered Mental Status)                          │   │
│ │   ... (35+ options)                                      │   │
│ │   - [🎨 Create Custom Accronym]                          │   │
│ │                                                           │   │
│ │ Selected: CP (Chest Pain)                                │   │
│ │                                                           │   │
│ │ Pathway Number: [Auto-detected: 1] (First CP pathway)   │   │
│ │                                                           │   │
│ │ 💡 Preview Generated Case IDs:                           │   │
│ │   EM001 → CP101                                          │   │
│ │   EM015 → CP102                                          │   │
│ │   EM032 → CP103                                          │   │
│ │   EM046 → CP104                                          │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ 📚 STEP 4: CATEGORIZE (Multi-Platform)                         │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ 🎯 Rosh Review Category:                                 │   │
│ │ [Dropdown: Select Rosh Category]                         │   │
│ │   - Cardiovascular                                       │   │
│ │   - Pulmonary                                            │   │
│ │   - Gastrointestinal                                     │   │
│ │   - Neurologic                                           │   │
│ │   - Trauma                                               │   │
│ │   ... (20+ categories)                                   │   │
│ │                                                           │   │
│ │ 📖 OnlineMedEd Category:                                 │   │
│ │ [Dropdown: Select OME Category]                          │   │
│ │   - Cardiology                                           │   │
│ │   - Pulmonology                                          │   │
│ │   - Gastroenterology                                     │   │
│ │   ... (15+ categories)                                   │   │
│ │                                                           │   │
│ │ 🚨 EMRAP Category:                                       │   │
│ │ [Dropdown: Select EMRAP Category]                        │   │
│ │   - Cardiac                                              │   │
│ │   - Respiratory                                          │   │
│ │   - Trauma                                               │   │
│ │   ... (12+ categories)                                   │   │
│ │                                                           │   │
│ │ 🎓 Primary Learning Category (Unified):                  │   │
│ │ [Auto-suggested based on selections above]               │   │
│ │ Cardiac Emergencies                                      │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ✅ STEP 5: FINALIZE & APPLY                                    │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ ⚠️ WARNING: This will update 4 cases in Master Scenario  │   │
│ │ Convert with new Case IDs and pathway assignments.       │   │
│ │                                                           │   │
│ │ Changes Summary:                                         │   │
│ │ • Case IDs: EM001→CP101, EM015→CP102, etc.              │   │
│ │ • Pathway Name: "Chest Pain Mimickers"                   │   │
│ │ • Categories: Rosh=Cardiovascular, OME=Cardiology        │   │
│ │                                                           │   │
│ │ [🔙 Save as Draft] [✅ FINALIZE & APPLY TO MASTER]       │   │
│ └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

### **PHASE 3: Safe Application to Master** (NEW - To Build)

**The Critical Safety Mechanism**:

```javascript
/**
 * Apply finalized pathway to Master Scenario Convert
 * Uses Original_Case_IDs (column U) as anchor to find rows
 * Preserves ALL existing data, only updates specific columns
 */
function applyPathwayToMaster(pathwayId) {
  const pathwaysSheet = ss.getSheetByName('Pathways_Master');
  const masterSheet = ss.getSheetByName('Master Scenario Convert');

  // Find pathway row in Pathways_Master
  const pathwayData = getPathwayData(pathwayId);

  // SAFETY CHECK 1: Verify finalized
  if (pathwayData.finalized !== 'TRUE') {
    throw new Error('Pathway not finalized! Please finalize in UI first.');
  }

  // SAFETY CHECK 2: Verify all required fields populated
  if (!pathwayData.chief_complaint_accronym ||
      !pathwayData.proposed_new_case_ids ||
      !pathwayData.primary_learning_category) {
    throw new Error('Missing required fields! Complete all steps in refinement UI.');
  }

  // Parse case mappings
  const originalCaseIDs = JSON.parse(pathwayData.original_case_ids);
  const newCaseIDs = JSON.parse(pathwayData.proposed_new_case_ids);

  // SAFETY CHECK 3: Verify array lengths match
  if (originalCaseIDs.length !== newCaseIDs.length) {
    throw new Error('Case ID mismatch! Original and new arrays must have same length.');
  }

  // Build update map
  const updates = [];
  for (let i = 0; i < originalCaseIDs.length; i++) {
    const originalID = originalCaseIDs[i];
    const newID = newCaseIDs[i];
    const caseSequence = i + 1;

    // Find row in Master Scenario Convert using ANCHOR
    const row = findRowByLegacyCaseID(masterSheet, originalID);

    if (!row) {
      Logger.log(`⚠️ WARNING: Could not find case ${originalID} in Master - skipping`);
      continue;
    }

    updates.push({
      row: row,
      originalID: originalID,
      newID: newID,
      caseSequence: caseSequence
    });
  }

  // SAFETY CHECK 4: Verify we found all cases
  if (updates.length !== originalCaseIDs.length) {
    throw new Error(`Only found ${updates.length}/${originalCaseIDs.length} cases in Master!`);
  }

  // ✅ ALL SAFETY CHECKS PASSED - Apply updates
  Logger.log(`✅ Applying ${updates.length} case updates to Master...`);

  updates.forEach(update => {
    // Column A: Case_ID (PRIMARY KEY UPDATE)
    masterSheet.getRange(update.row, 1).setValue(update.newID);

    // Column D: Case_Series_Name
    masterSheet.getRange(update.row, 4).setValue(pathwayData.pathway_name);

    // Column E: Case_Series_Order
    masterSheet.getRange(update.row, 5).setValue(update.caseSequence);

    // Column F: Pathway_or_Course_Name
    masterSheet.getRange(update.row, 6).setValue(pathwayData.pathway_name);

    // Column I: Legacy_Case_ID (PRESERVE - never overwrite)
    // (Don't touch this - it's our anchor!)

    // Column L: Medical_Category
    masterSheet.getRange(update.row, 12).setValue(pathwayData.primary_learning_category);

    // Column M: Case_Organization
    const orgData = {
      rosh_category: pathwayData.rosh_category,
      onlinemeded_category: pathwayData.onlinemeded_category,
      emrap_category: pathwayData.emrap_category,
      chief_complaint: pathwayData.chief_complaint_accronym
    };
    masterSheet.getRange(update.row, 13).setValue(JSON.stringify(orgData));

    Logger.log(`✅ Updated row ${update.row}: ${update.originalID} → ${update.newID}`);
  });

  // Update Pathways_Master to mark as applied
  const pathwayRow = findPathwayRow(pathwaysSheet, pathwayId);
  pathwaysSheet.getRange(pathwayRow, 27).setValue('TRUE'); // AA: Finalized
  pathwaysSheet.getRange(pathwayRow, 28).setValue(new Date()); // AB: Applied_Date
  pathwaysSheet.getRange(pathwayRow, 29).setValue(Session.getActiveUser().getEmail()); // AC: Applied_By
  pathwaysSheet.getRange(pathwayRow, 17).setValue('applied'); // Q: Status

  Logger.log(`✅ Pathway ${pathwayId} successfully applied to Master!`);

  // Return summary
  return {
    success: true,
    pathway_id: pathwayId,
    pathway_name: pathwayData.pathway_name,
    cases_updated: updates.length,
    updates: updates.map(u => `${u.originalID} → ${u.newID}`)
  };
}

/**
 * Find row in Master Scenario Convert by Legacy_Case_ID (column I)
 * This is our ANCHOR - original Case_ID that never changes
 */
function findRowByLegacyCaseID(sheet, legacyCaseID) {
  const legacyColumn = 9; // Column I: Legacy_Case_ID
  const data = sheet.getRange(1, legacyColumn, sheet.getLastRow(), 1).getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === legacyCaseID) {
      return i + 1; // Row number (1-indexed)
    }
  }

  return null; // Not found
}
```

---

## 📋 CATEGORY SYSTEM DESIGN

### **Research: How Learning Platforms Categorize EM Content**

**Rosh Review Categories** (EM Question Bank):
```javascript
const ROSH_CATEGORIES = [
  'Cardiovascular',
  'Pulmonary',
  'Gastrointestinal',
  'Neurologic',
  'Musculoskeletal/Rheumatology',
  'Renal/Genitourinary',
  'Hematologic/Oncologic',
  'Endocrine/Metabolic',
  'Infectious Disease',
  'Toxicology',
  'Environmental',
  'Trauma',
  'Obstetrics/Gynecology',
  'Pediatrics',
  'Psychiatry/Behavioral',
  'Dermatology',
  'HEENT (Head/Eyes/Ears/Nose/Throat)',
  'Procedures',
  'Systems-Based Practice',
  'Administrative/Legal',
  'Ultrasound'
];
```

**OnlineMedEd Categories** (Medical Education):
```javascript
const ONLINEMEDED_CATEGORIES = [
  'Cardiology',
  'Pulmonology',
  'Gastroenterology',
  'Neurology',
  'Orthopedics',
  'Nephrology',
  'Hematology/Oncology',
  'Endocrinology',
  'Infectious Disease',
  'Toxicology',
  'Trauma/Surgery',
  'Obstetrics',
  'Gynecology',
  'Pediatrics',
  'Psychiatry',
  'Dermatology',
  'Ophthalmology'
];
```

**EMRAP Categories** (EM Podcast):
```javascript
const EMRAP_CATEGORIES = [
  'Cardiac',
  'Respiratory',
  'GI/GU',
  'Neuro',
  'Trauma',
  'Tox',
  'Environmental',
  'Infectious Disease',
  'Pediatrics',
  'OB/GYN',
  'Heme/Onc',
  'Critical Care',
  'Procedures'
];
```

### **Unified Mapping Strategy**:

```javascript
/**
 * Auto-suggest unified category based on multi-platform selection
 */
function suggestUnifiedCategory(roshCat, omeCat, emrapCat) {
  const mapping = {
    'Cardiovascular': {
      ome: 'Cardiology',
      emrap: 'Cardiac',
      unified: 'Cardiac Emergencies'
    },
    'Pulmonary': {
      ome: 'Pulmonology',
      emrap: 'Respiratory',
      unified: 'Respiratory Emergencies'
    },
    'Gastrointestinal': {
      ome: 'Gastroenterology',
      emrap: 'GI/GU',
      unified: 'Gastrointestinal Emergencies'
    },
    'Neurologic': {
      ome: 'Neurology',
      emrap: 'Neuro',
      unified: 'Neurological Emergencies'
    },
    'Trauma': {
      ome: 'Trauma/Surgery',
      emrap: 'Trauma',
      unified: 'Trauma & Injury'
    },
    // ... (complete mapping for all categories)
  };

  // Find best match
  if (mapping[roshCat]) {
    return mapping[roshCat].unified;
  }

  // Fallback to Rosh category
  return roshCat;
}
```

---

## 🔐 SAFETY MECHANISMS

### **5-Layer Safety System**:

1. **Layer 1: Draft Mode** - All pathways start as drafts (`Status: pending`)
2. **Layer 2: Required Fields** - Cannot finalize until all fields complete
3. **Layer 3: Legacy_Case_ID Anchor** - Original IDs preserved in column I (never changed)
4. **Layer 4: Pre-Application Validation** - Verify all cases found before updating
5. **Layer 5: Rollback Capability** - Store before/after snapshots

### **Rollback Mechanism**:

```javascript
/**
 * Create backup before applying pathway
 */
function createBackupBeforeApplication(pathwayId) {
  const masterSheet = ss.getSheetByName('Master Scenario Convert');
  const pathwayData = getPathwayData(pathwayId);
  const originalCaseIDs = JSON.parse(pathwayData.original_case_ids);

  // Extract affected rows
  const backup = [];
  originalCaseIDs.forEach(caseID => {
    const row = findRowByLegacyCaseID(masterSheet, caseID);
    if (row) {
      const rowData = masterSheet.getRange(row, 1, 1, masterSheet.getLastColumn()).getValues()[0];
      backup.push({
        row: row,
        data: rowData
      });
    }
  });

  // Store in hidden sheet
  const backupSheet = ensureBackupSheet();
  backupSheet.appendRow([
    pathwayId,
    new Date(),
    JSON.stringify(backup)
  ]);

  return backup;
}

/**
 * Rollback pathway application
 */
function rollbackPathwayApplication(pathwayId) {
  const backupSheet = ss.getSheetByName('Pathway_Application_Backups');
  const masterSheet = ss.getSheetByName('Master Scenario Convert');

  // Find backup
  const backupData = findBackup(backupSheet, pathwayId);
  if (!backupData) {
    throw new Error('No backup found for pathway ' + pathwayId);
  }

  const backup = JSON.parse(backupData);

  // Restore rows
  backup.forEach(item => {
    masterSheet.getRange(item.row, 1, 1, item.data.length).setValues([item.data]);
  });

  Logger.log(`✅ Rolled back ${backup.length} cases for pathway ${pathwayId}`);
}
```

---

## 🎯 IMPLEMENTATION PLAN

### **Step 1: Schema Updates** (Week 1)

**Tasks**:
- [ ] Add columns S-AC to Pathways_Master sheet
- [ ] Update AI discovery function to populate Original_Case_IDs (column U)
- [ ] Verify Legacy_Case_ID (column I) exists in Master Scenario Convert
- [ ] Create category dropdown lists

**Scripts to Create**:
```bash
/scripts/addPathwayRefinementColumns.cjs
/scripts/verifyLegacyCaseIDs.cjs
/scripts/buildCategoryDropdowns.cjs
```

---

### **Step 2: Refinement UI** (Week 2-3)

**Tasks**:
- [ ] Build pathway refinement modal (Apps Script HTML)
- [ ] Add drag-and-drop case reordering
- [ ] Create symptom accronym dropdown (35+ options)
- [ ] Add category dropdowns (Rosh, OME, EMRAP)
- [ ] Build Case ID preview generator
- [ ] Add "Save Draft" and "Finalize" buttons

**Files to Create**:
```
/apps-script-deployable/Pathway_Refinement_UI.gs
/apps-script-deployable/Pathway_Refinement_Backend.gs
```

**Pattern to Follow**:
```javascript
// ✅ Use string concatenation (NOT template literals)
function buildRefinementModalHTML() {
  return '<div>' +
         '  <select id="symptom-accronym">' +
         symptomOptions +
         '  </select>' +
         '</div>';
}

// ✅ Put JavaScript in <head> with inline handlers
'<head>' +
'  <script>' +
'    function handleSymptomChange() { ... }' +
'  </script>' +
'</head>' +
'<button onclick="handleSymptomChange()">Update</button>';
```

---

### **Step 3: Application Engine** (Week 3-4)

**Tasks**:
- [ ] Build `applyPathwayToMaster()` function
- [ ] Add 5-layer safety validation
- [ ] Create backup/rollback system
- [ ] Add error handling for missing cases
- [ ] Build success summary report
- [ ] Add "Applied" badge to pathway UI

**Files to Create**:
```
/apps-script-deployable/Pathway_Application_Engine.gs
/apps-script-deployable/Pathway_Backup_System.gs
```

---

### **Step 4: Testing & Validation** (Week 4)

**Test Cases**:
1. ✅ Apply pathway with 4 cases
2. ✅ Verify all Case IDs updated correctly
3. ✅ Verify pathway columns updated
4. ✅ Verify categories assigned
5. ✅ Verify Legacy_Case_ID unchanged
6. ✅ Verify all other columns preserved
7. ✅ Test rollback mechanism
8. ✅ Test with missing case (should fail gracefully)

---

## 🚀 FUTURE ENHANCEMENTS

### **Phase 5: Bulk Operations** (Future)

- Apply multiple pathways at once
- Detect Case ID conflicts
- Auto-resolve pathway number collisions
- Batch category assignment

### **Phase 6: Analytics** (Future)

- Pathway usage tracking
- Category distribution reports
- Case ID coverage analysis
- Duplicate pathway detection

---

## 📊 SUCCESS METRICS

**When Complete**:
- ✅ Aaron can refine pathways safely in sandbox
- ✅ Case IDs use symptom-based system (CP101, SOB201)
- ✅ Categories align with Rosh/OME/EMRAP
- ✅ Master Scenario Convert only updates when finalized
- ✅ Zero data loss (Legacy_Case_ID preserves original IDs)
- ✅ Full rollback capability
- ✅ Clear workflow: Draft → Refine → Finalize → Apply

---

**Status**: 📋 Design Complete - Ready to Begin Implementation
**Next Step**: Add schema columns (Step 1)
**Timeline**: 4 weeks to full deployment

_Generated by Atlas (Claude Code) - 2025-11-09_
