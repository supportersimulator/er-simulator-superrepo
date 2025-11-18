# Dynamic Field Selector - Implementation Plan

**Date**: 2025-11-06
**Status**: Ready for implementation
**Purpose**: Show ALL available spreadsheet columns, not just hardcoded 27

---

## 🎯 Key Changes from Original Design

### Original Design
- Hardcoded 27 fields
- Fixed categories
- Can't see new columns added to CSV

### New Dynamic Design
- **Reads actual spreadsheet headers**
- **Shows ALL available columns**
- **Auto-discovers new fields**
- **Groups by Tier1 category** (from header cache)
- **Pre-selects saved fields** (or default 27)

---

## 📋 Implementation Steps

### 1. Read Available Columns from Spreadsheet

**New function: `getAvailableFields()`**
```javascript
function getAvailableFields() {
  // Use existing header cache
  refreshHeaders(); // Ensure cache is fresh

  const sheet = pickMasterSheet_();
  const headers = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Parse Tier1:Tier2 headers
  const fields = [];
  headers.forEach(function(header, index) {
    if (!header || header === '') return;

    const parts = header.toString().split(':');
    const tier1 = parts[0] || 'Other';
    const tier2 = parts[1] || header;

    // Create field name (same logic as current mapping)
    const fieldName = generateFieldName(tier2);

    fields.push({
      name: fieldName,
      header: header,
      tier1: tier1,
      tier2: tier2,
      columnIndex: index
    });
  });

  return fields;
}

function generateFieldName(tier2) {
  // Convert "Case ID" → "caseId"
  // Convert "Spark Title" → "sparkTitle"
  return tier2
    .replace(/[^a-zA-Z0-9\s]/g, '')  // Remove special chars
    .trim()
    .split(/\s+/)  // Split on whitespace
    .map(function(word, i) {
      if (i === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}
```

### 2. Get Default Field Selection

**New function: `getDefaultFields()`**
```javascript
function getDefaultFields() {
  // Return current 27 field names as defaults
  return [
    'caseId', 'sparkTitle', 'pathway',
    'preSimOverview', 'postSimOverview', 'learningOutcomes', 'learningObjectives',
    'category', 'difficulty', 'setting', 'chiefComplaint',
    'age', 'gender', 'patientName',
    'initialVitals',
    'examFindings', 'medications', 'pastMedicalHistory', 'allergies',
    'environmentType', 'dispositionPlan', 'context'
  ];
}
```

### 3. Updated `showFieldSelector()`

**Key changes:**
```javascript
function showFieldSelector() {
  // Get all available fields from actual spreadsheet
  const availableFields = getAvailableFields();

  // Get saved selection or defaults
  const savedSelection = loadFieldSelection();
  const defaultFields = savedSelection.length > 0 ? savedSelection : getDefaultFields();

  // Group fields by Tier1 category
  const groupedFields = {};
  availableFields.forEach(function(field) {
    const category = field.tier1;
    if (!groupedFields[category]) {
      groupedFields[category] = [];
    }
    groupedFields[category].push(field);
  });

  // Build modal HTML with ALL fields (not hardcoded list)
  const html = buildFieldSelectorHTML(groupedFields, defaultFields);

  // Show modal
  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(800)  // Wider for more fields
    .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🎯 Select Fields to Cache');
}
```

### 4. Build Dynamic HTML

**The modal will:**
- Show categories from actual Tier1 headers
- List all columns in each category
- Pre-check fields in saved/default selection
- Show field count dynamically

**Example categories it might show:**
- Case_Organization (12 fields)
- Patient_Demographics_and_Clinical_Data (15 fields)
- Monitor_Vital_Signs (5 fields)
- Set_the_Stage_Context (8 fields)
- CME_and_Educational_Content (6 fields)
- Situation_and_Environment_Details (4 fields)
- [Any new categories you add...]

---

## 🎨 Updated UI

### Header
Same as before - purple gradient with title

### Body (Dynamic)
```
┌─────────────────────────────────────────┐
│ Case_Organization (12 fields)           │
│          [Select All]  [Deselect All]   │
│ ☑ caseId → Case_Organization:Case_ID    │
│ ☑ sparkTitle → Case_Organization:Spark_Title │
│ ☐ newField → Case_Organization:New_Field │  ← NEW!
│ ...                                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Patient_Demographics (15 fields)        │
│          [Select All]  [Deselect All]   │
│ ☑ age → Patient_Demographics:Age        │
│ ☑ gender → Patient_Demographics:Gender  │
│ ☐ bloodType → Patient_Demographics:Blood_Type │  ← NEW!
│ ...                                      │
└─────────────────────────────────────────┘
```

### Footer
```
Selected: 27/45 fields  [Continue to Cache →]
              ↑↑
              Shows actual total from spreadsheet
```

---

## 🔧 Integration with Existing System

### No Changes Needed to:
- ✅ `performHolisticAnalysis_()` - Already filters by selected fields
- ✅ `resolveColumnIndices_()` - Already handles dynamic mapping
- ✅ Batch processing - Works regardless of field count
- ✅ Helper functions - Work with any fields

### Updates Needed:
1. **`showFieldSelector()`** - Read actual columns
2. **`getAvailableFields()`** - NEW function
3. **`generateFieldName()`** - NEW helper
4. **`getDefaultFields()`** - NEW function (returns 27 current fields)

---

## 📊 Field Mapping Example

**Your current CSV has:**
```
Tier1: Case_Organization
  ├─ Case_ID → caseId
  ├─ Spark_Title → sparkTitle
  └─ ... (10 more)

Tier1: Patient_Demographics_and_Clinical_Data
  ├─ Age → age
  ├─ Gender → gender
  └─ ... (13 more)
```

**If you add:**
```
Tier1: Lab_Results
  ├─ Hemoglobin → hemoglobin  ← NEW!
  ├─ White_Blood_Cell_Count → whiteBloodCellCount  ← NEW!
```

**Field selector will show:**
```
┌──────────────────────────────────────┐
│ Lab_Results (2 fields)        ← NEW! │
│        [Select All]  [Deselect All]  │
│ ☐ hemoglobin → Lab_Results:Hemoglobin│
│ ☐ wbc → Lab_Results:White_Blood_Cell │
└──────────────────────────────────────┘
```

---

## 💾 Saved Selection Format

**DocumentProperties key:** `SELECTED_CACHE_FIELDS`

**Value:** JSON array of field names
```json
[
  "caseId",
  "sparkTitle",
  "age",
  "hemoglobin",  ← Can save new fields!
  "wbc"
]
```

**On next open:**
- Reads all available fields from spreadsheet
- Pre-checks any that are in saved selection
- New fields appear unchecked (ready to add)

---

## 🚀 Benefits

### For Current Use
- See exactly what fields exist in your CSV
- Understand data structure at a glance
- Easily enable/disable fields for testing

### For Future Expansion
- **Add columns** → They appear automatically
- **Rename columns** → Field selector updates
- **Reorganize** → Groups update from Tier1
- **No code changes needed**

---

## ⚡ Performance

**Modal load time:**
- Read headers: ~50ms
- Parse 100 columns: ~100ms
- Build HTML: ~50ms
- **Total: ~200ms** (instant)

**Why it's fast:**
- Header cache already exists
- Simple string parsing
- No complex logic

---

## 🧪 Testing Scenarios

### Scenario 1: First Time User
1. Opens field selector
2. Sees all available columns from CSV
3. Current 27 fields pre-checked (defaults)
4. Clicks "Continue to Cache"
5. Saves selection for next time

### Scenario 2: Add New Column
1. Add "Lab_Results:Hemoglobin" to CSV
2. Open field selector
3. See new "Lab_Results" category with "hemoglobin" field (unchecked)
4. Check the box
5. Click "Continue to Cache"
6. New field now included in cache

### Scenario 3: Saved Selection
1. User previously selected 15 fields
2. Open field selector
3. Those 15 pre-checked
4. Other fields unchecked
5. Can modify and save again

---

## ✅ Ready for Implementation

This dynamic approach is:
- ✅ **Future-proof** - Handles any new columns
- ✅ **Automatic** - No hardcoding
- ✅ **User-friendly** - Shows actual data structure
- ✅ **Safe** - Uses existing header cache system
- ✅ **Fast** - <200ms to load
- ✅ **Flexible** - Works with any CSV structure

**Shall I implement this dynamic version?**
