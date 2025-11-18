# Field Selector Feature Design

**Date**: 2025-11-06
**Status**: Design ready for implementation
**Purpose**: Allow users to choose which fields to cache before running analysis

---

## 🎯 Feature Overview

### What It Does
Before the cache runs, show a beautiful modal with:
- All 27 available fields organized by category
- Checkboxes to select/deselect each field
- Select All / Deselect All buttons per category
- Field count: "Selected: 18/27 fields"
- Saves selection to DocumentProperties (persists)
- "Continue to Cache" button (requires at least 1 field)

### User Flow
1. User clicks **TEST Tools** → **💾 Pre-Cache Rich Data**
2. **FIRST**: Field selector modal appears
3. User selects desired fields (default: all 27 selected)
4. User clicks "Continue to Cache"
5. **THEN**: Simple cache modal appears and runs with selected fields only

---

## 📋 Implementation Plan

### New Functions to Add

#### 1. `showFieldSelector()`
Beautiful modal showing all 27 fields grouped by category.

**Categories:**
- Basic Info (3 fields)
- Learning Content (4 fields)
- Metadata (4 fields)
- Demographics (3 fields)
- Vitals (1 field → 6 subfields)
- Clinical Context (4 fields)
- Environment (3 fields)

#### 2. `saveFieldSelectionAndStartCache(selectedFields)`
- Saves selected fields to DocumentProperties: `SELECTED_CACHE_FIELDS`
- Closes field selector modal
- Calls `preCacheRichDataAfterSelection()`

#### 3. `loadFieldSelection()`
- Reads from DocumentProperties: `SELECTED_CACHE_FIELDS`
- Returns array of selected field names
- Default: all 27 fields if nothing saved

#### 4. Rename `preCacheRichData()` → `preCacheRichDataAfterSelection()`
- This becomes the cache execution function
- Called AFTER field selection is saved

#### 5. New `preCacheRichData()`
- Entry point - just calls `showFieldSelector()`

### Updates to Existing Functions

#### `performHolisticAnalysis_()`
Add at the beginning:
```javascript
// Load selected fields (default to all 27 if none saved)
const selectedFields = loadFieldSelection();
Logger.log('🎯 Caching ' + selectedFields.length + ' selected fields');
```

Then in the loop where we create `caseItem`, **instead of** pushing the full object:
```javascript
// Filter to only selected fields
const filteredCase = { row: caseItem.row }; // Always include row
selectedFields.forEach(function(field) {
  if (field in caseItem) {
    filteredCase[field] = caseItem[field];
  }
});
allCases.push(filteredCase);
```

---

## 🎨 UI Design

### Field Selector Modal

**Header:**
- Purple gradient background
- "🎯 Select Fields to Cache"
- Subtitle: "Choose which fields the AI will analyze for pathway discovery"

**Body:**
For each category:
- White card with shadow
- Category header with count (e.g., "Basic Info (3)")
- "Select All" / "Deselect All" buttons
- List of fields with checkboxes
  - Field name in bold
  - Column header in gray (smaller font)

**Footer:**
- Sticky at bottom
- Field count in purple: "Selected: 18/27 fields"
- "Continue to Cache →" button (disabled if 0 selected)

### Example Field Item
```
☑ caseId → Case_Organization_Case_ID
☑ sparkTitle → Case_Organization_Spark_Title
☐ pathway → Case_Organization_Pathway_or_Course_Name
```

---

## 🔒 Safety Guarantees

### What We're NOT Changing
- ✅ All 61 existing functions preserved
- ✅ Batch processing logic untouched
- ✅ Helper functions (tryParseVitals_, truncateField_) preserved
- ✅ Field definitions (all 27) unchanged
- ✅ Column mapping logic preserved
- ✅ Cache structure unchanged

### What We're Adding
- ✅ 4 new functions (field selector system)
- ✅ Field filtering in performHolisticAnalysis_()
- ✅ DocumentProperties storage for selections

### What We're Modifying
- ✅ preCacheRichData() - renamed to preCacheRichDataAfterSelection()
- ✅ New preCacheRichData() - entry point that shows selector
- ✅ performHolisticAnalysis_() - adds filtering before push to allCases

---

## 📊 Field Mapping Reference

```javascript
const fieldGroups = {
  "Basic Info": [
    {name: "caseId", header: "Case_Organization_Case_ID"},
    {name: "sparkTitle", header: "Case_Organization_Spark_Title"},
    {name: "pathway", header: "Case_Organization_Pathway_or_Course_Name"}
  ],
  "Learning Content": [
    {name: "preSimOverview", header: "Case_Organization_Pre_Sim_Overview"},
    {name: "postSimOverview", header: "Case_Organization_Post_Sim_Overview"},
    {name: "learningOutcomes", header: "CME_and_Educational_Content_CME_Learning_Objective"},
    {name: "learningObjectives", header: "Set_the_Stage_Context_Educational_Goal"}
  ],
  "Metadata": [
    {name: "category", header: "Case_Organization_Medical_Category"},
    {name: "difficulty", header: "Case_Organization_Difficulty_Level"},
    {name: "setting", header: "Set_the_Stage_Context_Environment_Type"},
    {name: "chiefComplaint", header: "Patient_Demographics_and_Clinical_Data_Presenting_Complaint"}
  ],
  "Demographics": [
    {name: "age", header: "Patient_Demographics_and_Clinical_Data_Age"},
    {name: "gender", header: "Patient_Demographics_and_Clinical_Data_Gender"},
    {name: "patientName", header: "Patient_Demographics_and_Clinical_Data_Patient_Name"}
  ],
  "Vitals": [
    {name: "initialVitals", header: "Monitor_Vital_Signs_Initial_Vitals (JSON → hr, bpSys, bpDia, rr, spo2)"}
  ],
  "Clinical Context": [
    {name: "examFindings", header: "Patient_Demographics_and_Clinical_Data_Exam_Positive_Findings"},
    {name: "medications", header: "Patient_Demographics_and_Clinical_Data_Current_Medications"},
    {name: "pastMedicalHistory", header: "Patient_Demographics_and_Clinical_Data_Past_Medical_History"},
    {name: "allergies", header: "Patient_Demographics_and_Clinical_Data_Allergies"}
  ],
  "Environment": [
    {name: "environmentType", header: "Set_the_Stage_Context_Environment_Type"},
    {name: "dispositionPlan", header: "Situation_and_Environment_Details_Disposition_Plan"},
    {name: "context", header: "Set_the_Stage_Context_Clinical_Vignette"}
  ]
};
```

---

## 🧪 Testing Plan

### Manual Testing
1. Click "💾 Pre-Cache Rich Data"
2. Verify field selector modal appears
3. Test "Select All" / "Deselect All" per category
4. Deselect a few fields
5. Click "Continue to Cache"
6. Verify cache runs with reduced field count
7. Check cached data has only selected fields

### Verification Steps
1. Run cache with all 27 fields → verify 27 fields in cache
2. Run cache with 15 fields → verify 15 fields in cache
3. Try to continue with 0 fields → verify button disabled
4. Reload page → verify selection persists (DocumentProperties)

---

## 💡 Future Enhancements

### Phase 2 (Optional)
- Add "Reset to Defaults" button
- Show field descriptions on hover
- Group selection: "Select all vitals", "Select all demographics"
- Import/export field configurations
- Preset field sets: "Minimal", "Standard", "Complete"

### Phase 3 (Optional)
- Show field usage statistics (which fields AI uses most)
- Recommend fields based on pathway type
- A/B testing different field combinations
- Field importance scores

---

## 📝 Implementation Notes

### DocumentProperties Key
```
SELECTED_CACHE_FIELDS → JSON array of field names
Example: ["caseId", "sparkTitle", "category", "difficulty"]
```

### Default Behavior
- First time: All 27 fields selected
- Subsequent times: Loads saved selection
- Selection persists across sessions
- Per-spreadsheet (not user-specific)

### Error Handling
- If saved selection has invalid fields → ignore them
- If saved selection empty → default to all 27
- If field not found in data → skip gracefully

---

## ✅ Ready for Implementation

This design is:
- ✅ Fully specified
- ✅ Safe (preserves all existing functionality)
- ✅ Surgical (minimal changes)
- ✅ User-friendly (beautiful UI)
- ✅ Persistent (saves selections)
- ✅ Flexible (supports future columns)

**Next Step**: Manually implement this feature in the Phase2 file.
