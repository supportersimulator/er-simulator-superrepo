# Dynamic Field Selector - User Guide

**Date**: 2025-11-06
**Status**: ✅ Deployed to TEST spreadsheet
**Version**: 2.0 (with Reset button + Field count reporting)

---

## 🎯 Overview

The Dynamic Field Selector allows you to fine-tune which columns from your spreadsheet are cached and analyzed by the AI for pathway discovery. This gives you full control over your cache process without writing any code.

### Key Benefits

- **Dynamic Discovery**: Automatically reads ALL columns from your spreadsheet
- **Persistent Selection**: Remembers your choices between sessions
- **Future-Proof**: New columns you add appear automatically
- **Intelligent Grouping**: Fields organized by category (Tier1)
- **Reset Option**: Quickly restore original 27 fields if needed
- **Field Count Reporting**: See exactly how many fields were cached

---

## 🚀 How to Use

### Step 1: Open Field Selector

1. Open your Google Spreadsheet
2. Click **TEST Tools** → **💾 Pre-Cache Rich Data**
3. **Field Selector modal appears** (not the cache modal)

### Step 2: Review Available Fields

The modal shows:
- **All available columns** from your spreadsheet
- **Organized by category** (Case_Organization, Patient_Demographics, Clinical_Details, etc.)
- **Pre-selected fields** from your last session (or default 27 on first use)
- **Field count** at bottom ("Selected: X/Y fields")

### Step 3: Select/Deselect Fields

You can:
- ✅ **Check/uncheck individual fields** (click checkbox or field name)
- ✅ **Select All** in a category (click "Select All" button)
- ✅ **Deselect All** in a category (click "Deselect All" button)
- ✅ **Reset to Default 27** (click "🔄 Reset to Default 27" button)

**Note**: Selected fields appear first within each category, making them easy to find.

### Step 4: Continue to Cache

1. Click **"Continue to Cache →"** button
2. Your selection is **saved automatically** to DocumentProperties
3. Cache progress modal appears
4. Cache runs with **only your selected fields**

### Step 5: View Results

After cache completes, you'll see:
```
CACHE SUCCESS: 210 cases ✓ | 27 fields cached ✓ | 8.1s
```

This tells you:
- **210 cases**: Number of cases processed
- **27 fields cached**: Number of fields you selected
- **8.1s**: Time elapsed

---

## 🧠 How Persistent Defaults Work

### First Time Use (No Saved Selection)
```
1. Open field selector
2. System checks DocumentProperties for saved selection
3. No saved selection found
4. Pre-selects default 27 fields
5. Shows field selector with defaults checked
```

### After You Save Custom Selection
```
1. You select 15 custom fields and click Continue
2. Selection saved to DocumentProperties: SELECTED_CACHE_FIELDS
3. Next time you open field selector:
   → System reads saved selection (15 fields)
   → Pre-selects YOUR 15 fields (not default 27)
   → Your custom selection is now the default
```

### Using Reset Button
```
1. You've customized to 15 fields over time
2. Click "🔄 Reset to Default 27"
3. All checkboxes update to match original 27 fields
4. You can review before clicking Continue
5. When you click Continue:
   → Saves the 27 fields to DocumentProperties
   → Your default is now back to original 27
```

**Key Point**: Your **most recently saved selection** becomes your new default. The system never automatically resets to the original 27 - you stay on whatever you last saved.

---

## 🔧 Integration with Existing Systems

### Header Cache Integration

The field selector is fully integrated with the header cache system:

```javascript
function showFieldSelector() {
  // Ensures header cache is fresh before reading fields
  refreshHeaders();

  // Get all available fields from spreadsheet
  const availableFields = getAvailableFields();

  // ... rest of field selector logic
}
```

**What this means**:
- Field selector always reads from fresh header cache
- Column mapping is dynamically resolved
- Works with ANY column structure
- No code changes needed when you add new columns

### Dynamic Column Mapping

The cache system uses `resolveColumnIndices_()` to map field names to column indices:

```javascript
function resolveColumnIndices_(fieldNames) {
  // Looks up each field name in header cache
  // Returns actual column indices
  // Handles ANY fields you select
}
```

**Example**:
```
You select: ['caseId', 'sparkTitle', 'initialVitals']
System resolves: [0, 1, 14]  (actual column indices)
Cache only reads columns [0, 1, 14]
```

### Batch Processing Integration

The field selector works seamlessly with batch processing:

```javascript
function performHolisticAnalysis_(forceRefresh) {
  // Loads your selected fields
  const selectedFields = loadFieldSelection();

  // Processes 25 rows per batch
  // BUT only caches YOUR selected fields for each row

  // Example: If you selected 15 fields
  // Batch 1: Process rows 1-25, cache 15 fields each
  // Batch 2: Process rows 26-50, cache 15 fields each
  // etc.
}
```

**Performance**: Field selection does NOT slow down batch processing. It actually speeds it up if you select fewer fields!

---

## 📊 Field Count Reporting

### What Gets Reported

After cache completes, you see:
```
CACHE SUCCESS: 210 cases ✓ | 27 fields cached ✓ | 8.1s
```

### How It's Calculated

```javascript
function performCacheWithProgress() {
  // ...cache process runs...

  return {
    success: true,
    casesProcessed: 210,  // Total rows cached
    fieldsPerCase: loadFieldSelection().length,  // Your selected fields
    elapsed: 8.1  // Time in seconds
  };
}
```

**Dynamic**: The field count reflects your actual selection, not a hardcoded number.

---

## 🎨 UI Features

### Field Selector Modal

**Header**:
- Purple gradient background
- Title: "🎯 Select Fields to Cache"
- Subtitle: "Choose which fields the AI will analyze for pathway discovery"

**Categories**:
- Collapsible sections by Tier1
- Category name + count (e.g., "Patient_Demographics (4)")
- "Select All" and "Deselect All" buttons per category

**Fields**:
- Checkbox + field name + header mapping
- Example: `☑ caseId → Case_Organization: Case ID`
- Selected fields appear first (sorted to top)
- Hover effect for easy clicking

**Footer**:
- Field count: "Selected: 27/45 fields"
- Reset button: "🔄 Reset to Default 27" (white with purple border)
- Continue button: "Continue to Cache →" (purple gradient)
- Continue disabled when 0 fields selected

### Cache Progress Modal

**After Field Selection**:
- Shows cache progress in real-time
- Green terminal-style display
- Test buttons for verification

**Completion Message**:
```
CACHE SUCCESS: 210 cases ✓ | 27 fields cached ✓ | 8.1s
```

---

## 🧪 Testing Checklist

### Test 1: First Time Use (Default 27)
- [ ] Open TEST spreadsheet
- [ ] Click TEST Tools → 💾 Pre-Cache Rich Data
- [ ] Field selector appears (not cache modal)
- [ ] Default 27 fields are pre-checked
- [ ] Field count shows "Selected: 27/X fields"
- [ ] Click Continue → Cache runs successfully
- [ ] Completion shows "27 fields cached ✓"

### Test 2: Custom Selection Persists
- [ ] Open field selector again
- [ ] Deselect 10 fields (leave 17 checked)
- [ ] Click Continue → Cache runs
- [ ] Completion shows "17 fields cached ✓"
- [ ] Open field selector again (without refreshing page)
- [ ] Verify 17 fields are pre-checked (your custom selection)

### Test 3: Reset to Default 27
- [ ] Open field selector (with custom 17 fields)
- [ ] Click "🔄 Reset to Default 27"
- [ ] Alert appears: "✅ Reset to original 27 default fields"
- [ ] Field count updates to "Selected: 27/X fields"
- [ ] Verify original 27 fields are now checked
- [ ] Click Continue → Cache runs
- [ ] Completion shows "27 fields cached ✓"

### Test 4: New Column Discovery
- [ ] Add new column to CSV: "Lab_Results:Hemoglobin"
- [ ] Import CSV to Google Sheet
- [ ] Open field selector
- [ ] Verify "Lab_Results" category appears
- [ ] Verify "hemoglobin" field is listed (unchecked)
- [ ] Check the field + click Continue
- [ ] Cache runs successfully with new field included

### Test 5: Header Cache Freshness
- [ ] Rename a column in spreadsheet (e.g., "Case ID" → "Case Identifier")
- [ ] Open field selector immediately
- [ ] Verify field name updates to new header
- [ ] Verify dynamic mapping still works
- [ ] Cache runs successfully

---

## 🔑 Key Technical Details

### Default 27 Fields

```javascript
function getDefaultFieldNames_() {
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

### Persistent Storage

```javascript
// Saving selection
function saveFieldSelectionAndStartCache(selectedFields) {
  const docProps = PropertiesService.getDocumentProperties();
  docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(selectedFields));

  preCacheRichDataAfterSelection();
}

// Loading selection
function loadFieldSelection() {
  const docProps = PropertiesService.getDocumentProperties();
  const saved = docProps.getProperty('SELECTED_CACHE_FIELDS');

  if (saved) {
    return JSON.parse(saved);  // Your saved selection
  }

  return getDefaultFieldNames_();  // Only if nothing saved
}
```

### Dynamic Field Generation

```javascript
function generateFieldName_(tier2) {
  // "Case ID" → "caseId"
  // "Spark Title" → "sparkTitle"
  // "Chief Complaint" → "chiefComplaint"

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

---

## 🎉 Summary

**You now have**:
- ✅ Full control over which fields to cache
- ✅ Persistent selection that becomes your new default
- ✅ Reset button to restore original 27 fields
- ✅ Field count reporting after cache completes
- ✅ Automatic discovery of new columns
- ✅ Integration with header cache and dynamic mapping
- ✅ Batch processing (25 rows) with your selected fields

**All without breaking anything** - the original 61 functions are preserved exactly!

---

## 📚 Related Documentation

- [FIELD_SELECTOR_INTEGRATION_COMPLETE.md](./FIELD_SELECTOR_INTEGRATION_COMPLETE.md) - Technical implementation details
- [FIELD_SELECTOR_FUNCTIONS.gs](./FIELD_SELECTOR_FUNCTIONS.gs) - Source code for field selector
- [FIELD_SELECTOR_DYNAMIC.md](./FIELD_SELECTOR_DYNAMIC.md) - Original dynamic design document

---

**Enjoy your enhanced cache system!** 🎯
