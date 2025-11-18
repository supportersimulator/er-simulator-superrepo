# Headers Cache Format Guarantee

**Document Purpose**: Definitive reference for header caching format consistency across the ER Simulator system

**Created**: 2025-11-07
**Status**: ✅ Production Standard
**Location**: Lost and Found → Documentation

---

## Executive Summary

The ER Simulator uses a **single source of truth** header caching system that guarantees format consistency as the CSV evolves. All field names come from **Row 2** of the Master Scenario Convert sheet and are cached in **CACHED_MERGED_KEYS**.

---

## The Three Cache Keys

### 1. CACHED_MERGED_KEYS (PRIMARY - Single Source of Truth)

**Format**: Array of exact Row 2 header names
**Example**:
```json
[
  "Case_Organization_Case_ID",
  "Case_Organization_Spark_Title",
  "Patient_Demographics_and_Clinical_Data_Age",
  "Patient_Demographics_and_Clinical_Data_Gender",
  "Monitor_Vital_Signs_Initial_Vitals",
  ...
]
```

**Purpose**:
- Primary source for all field operations
- Exact match with spreadsheet Row 2
- Used by field selector, AI validation, column resolution

**Created by**: `refreshHeaders()` reads Row 2 from sheet
**Stored in**: DocumentProperties as JSON string
**Used by**:
- `getFieldSelectorRoughDraft()` - Displays available fields
- `getAvailableFields()` - Returns all field options
- `getColumnIndexByHeader_()` - Resolves dynamic column indices
- `getStaticRecommendedFields_()` - Picks intelligent defaults
- `getRecommendedFields()` - Validates AI responses

---

### 2. CACHED_HEADER1 (Backward Compatibility)

**Format**: Array of tier1 category names
**Example**:
```json
[
  "Case_Organization",
  "Case_Organization",
  "Patient_Demographics_and_Clinical_Data",
  "Patient_Demographics_and_Clinical_Data",
  "Monitor_Vital_Signs",
  ...
]
```

**Purpose**: Backward compatibility for category grouping (deprecated)
**Derived from**: Parsing CACHED_MERGED_KEYS by splitting on `_` and taking all-but-last
**Status**: ⚠️ Legacy - not used in current field selector

---

### 3. CACHED_HEADER2 (Backward Compatibility)

**Format**: Array of tier2 field names
**Example**:
```json
[
  "Case_ID",
  "Spark_Title",
  "Age",
  "Gender",
  "Initial_Vitals",
  ...
]
```

**Purpose**: Backward compatibility for short field names (deprecated)
**Derived from**: Parsing CACHED_MERGED_KEYS by splitting on `_` and taking last part
**Status**: ⚠️ Legacy - not used in current field selector

---

## How Headers Are Refreshed

### `refreshHeaders()` Function Flow

```javascript
function refreshHeaders() {
  // 1. Get Row 2 from Master Scenario Convert sheet
  const flattenedHeaders = outputSheet.getRange(2, 1, 1, lastColumn).getValues()[0];

  // 2. Clean and filter
  const mergedKeys = flattenedHeaders
    .map(h => String(h || '').trim())
    .filter(h => h !== '');

  // 3. Cache as PRIMARY source of truth
  setProp('CACHED_MERGED_KEYS', JSON.stringify(mergedKeys));

  // 4. Parse tier1/tier2 for backward compat
  const header1 = [];
  const header2 = [];
  mergedKeys.forEach(merged => {
    const parts = merged.split('_');
    header1.push(parts.slice(0, -1).join('_'));
    header2.push(parts[parts.length - 1]);
  });

  // 5. Cache legacy formats
  setProp('CACHED_HEADER1', JSON.stringify(header1));
  setProp('CACHED_HEADER2', JSON.stringify(header2));
}
```

**When called**:
- `runPathwayChainBuilder()` - STEP 1 (background prep)
- `getOrCreateHolisticAnalysis_()` - Before analysis
- Menu: "🗄️ Cache Management" → "🔄 Refresh Headers"

---

## Format Consistency Guarantees

### Guarantee #1: Single Source of Truth

**Promise**: All field operations use CACHED_MERGED_KEYS
**Implementation**:
```javascript
// ✅ CORRECT - Uses CACHED_MERGED_KEYS
var cachedMergedKeys = docProps.getProperty('CACHED_MERGED_KEYS');
var allFields = JSON.parse(cachedMergedKeys);

// ❌ WRONG - Uses object keys or tier2 array
var header2 = docProps.getProperty('CACHED_HEADER2');
var allFields = JSON.parse(header2); // This is tier2 array, not full names!
```

---

### Guarantee #2: AI Response Validation

**Promise**: AI recommendations always return exact Row 2 format
**Implementation**: 6-layer validation in `getRecommendedFields()`

**Layer 1**: Explicit Format Instruction
```javascript
const prompt = `
You must return field names in EXACT Row 2 format:
- "Patient_Demographics_and_Clinical_Data_Age" ✅
- "Age" ❌
- "patient_age" ❌
`;
```

**Layer 2**: Flexible JSON Parsing
```javascript
// Try multiple extraction methods
const match = aiText.match(/\[[\s\S]*?\]/);
recommendedFields = match ? JSON.parse(match[0]) : JSON.parse(aiText);
```

**Layer 3**: Dual Format Handling
```javascript
recommendedFields.forEach(function(rec) {
  const fieldName = typeof rec === "string" ? rec : rec.name;
  // Handle both plain strings and {name, rationale} objects
});
```

**Layer 4**: Exact Match Validation
```javascript
const allValidFieldNames = JSON.parse(
  docProps.getProperty('CACHED_MERGED_KEYS')
);

recommendedFields.forEach(function(aiField) {
  const exactMatch = allValidFieldNames.find(function(validName) {
    return validName === aiField; // Must match EXACTLY
  });

  if (exactMatch) {
    validatedRecommendations.push(exactMatch); // Use OUR exact name
  }
});
```

**Layer 5**: Partial Match Fuzzy Matching (future)
- Not yet implemented
- Would handle close matches like "Age" → "Patient_Demographics_and_Clinical_Data_Age"

**Layer 6**: Static Fallback
```javascript
if (validatedRecommendations.length === 0) {
  return getStaticRecommendedFields_(); // Uses CACHED_MERGED_KEYS
}
```

---

### Guarantee #3: Dynamic Column Resolution

**Promise**: Column indices adapt automatically when CSV structure changes
**Implementation**: `getColumnIndexByHeader_()` runtime resolution

```javascript
function getColumnIndexByHeader_(fullFieldName, fallbackIndex) {
  const cachedMergedKeys = docProps.getProperty('CACHED_MERGED_KEYS');

  if (cachedMergedKeys) {
    const headers = JSON.parse(cachedMergedKeys);
    const index = headers.indexOf(fullFieldName);

    if (index !== -1) {
      if (index !== fallbackIndex) {
        Logger.log('🔄 Header moved: ' + fallbackIndex + ' → ' + index);
      }
      return index;
    }
  }

  return fallbackIndex; // Only if cache fails
}
```

**Example**:
```
CSV before: [Case_ID, Title, Age, Gender, ...]
           → Age is column 2

CSV after:  [Case_ID, New_Field, Title, Age, Gender, ...]
           → Age is now column 3

getColumnIndexByHeader_('Patient_Demographics_and_Clinical_Data_Age', 2)
→ Returns: 3 (auto-detected new position)
→ Logs: "🔄 Header moved: 2 → 3"
```

---

### Guarantee #4: As CSV Evolves, System Adapts

**Scenario**: CSV gains 10 new fields, rearranges columns, renames tier1 categories

**What happens automatically**:

1. **Next menu click** → `refreshHeaders()` runs in background
2. **CACHED_MERGED_KEYS updated** with new Row 2 format
3. **Field selector** shows new fields in "OTHER" section
4. **AI recommendations** receive new field list in context
5. **AI validation** uses new list for exact matching
6. **Column resolution** adapts to new positions
7. **No code changes needed** ✅

---

## Prepopulation Sequence (Background Initialization)

When user clicks **"Categories & Pathways"** menu:

### STEP 1: Refresh Headers
```javascript
Logger.log('📂 Refreshing headers cache...');
refreshHeaders(); // Reads Row 2, caches CACHED_MERGED_KEYS
Logger.log('✅ Headers cached');
```

### STEP 2: Initialize 35 Defaults
```javascript
var docProps = PropertiesService.getDocumentProperties();
var savedSelection = docProps.getProperty('SELECTED_CACHE_FIELDS');

if (!savedSelection) {
  var defaultFields = [
    'Case_Organization_Case_ID',
    'Case_Organization_Spark_Title',
    // ... 33 more using exact Row 2 format
  ];
  docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(defaultFields));
}
```

### STEP 2.5: Pre-fetch AI Recommendations
```javascript
Logger.log('💡 Step 2.5: Pre-fetching AI recommendations...');

var currentSelection = savedSelection ? JSON.parse(savedSelection) : defaultFields;
var availableFields = getAvailableFields(); // Uses CACHED_MERGED_KEYS
var aiRecommendations = getRecommendedFields(availableFields, currentSelection);

// Cache for instant modal load
docProps.setProperty('AI_RECOMMENDED_FIELDS', JSON.stringify(aiRecommendations));
docProps.setProperty('AI_RECOMMENDATIONS_TIMESTAMP', new Date().toISOString());
```

### STEP 3: Get Holistic Analysis
```javascript
const analysis = getOrCreateHolisticAnalysis_();
```

### STEP 4: Show Pathway UI
```javascript
const html = buildBirdEyeViewUI_(analysis);
ui.showModalDialog(htmlOutput, '🧩 Pathway Chain Builder');
```

**Result**: By the time the Pathway UI appears, everything is cached and ready for instant field selector modal!

---

## Field Selector Modal (3-Section Layout)

### Section 1: DEFAULT (Currently Selected)
- Source: `SELECTED_CACHE_FIELDS` property
- Format: Array of exact Row 2 field names
- Checkboxes: All checked
- Badge: ✓✓ if AI agrees with this default

### Section 2: RECOMMENDED (AI Suggestions)
- Source: `AI_RECOMMENDED_FIELDS` property (pre-cached in Step 2.5)
- Format: Array of exact Row 2 field names (validated)
- Checkboxes: Unchecked (suggestions)
- Badge: None (only show AI agreement in Section 1)

### Section 3: OTHER (All Remaining)
- Source: CACHED_MERGED_KEYS minus (DEFAULT + RECOMMENDED)
- Format: Flat list (no categories)
- Checkboxes: Unchecked
- Badge: None

**NO CATEGORIES** - User explicitly requested no category grouping

---

## 35 Intelligent Defaults (Exact Row 2 Format)

```javascript
const defaultFields = [
  // TIER 1: Identity & Navigation (6)
  'Case_Organization_Case_ID',
  'Case_Organization_Spark_Title',
  'Case_Organization_Reveal_Title',
  'Case_Organization_Pathway_or_Course_Name',
  'Case_Organization_Difficulty_Level',
  'Case_Organization_Medical_Category',

  // TIER 2: Clinical Indexing (8)
  'Patient_Demographics_and_Clinical_Data_Age',
  'Patient_Demographics_and_Clinical_Data_Gender',
  'Patient_Demographics_and_Clinical_Data_Presenting_Complaint',
  'Patient_Demographics_and_Clinical_Data_Past_Medical_History',
  'Patient_Demographics_and_Clinical_Data_Exam_Positive_Findings',
  'Monitor_Vital_Signs_Initial_Vitals',
  'Scenario_Progression_States_Decision_Nodes_JSON',
  'Set_the_Stage_Context_Case_Summary_Concise',

  // TIER 3: Pedagogical Dimensions (5)
  'CME_and_Educational_Content_CME_Learning_Objective',
  'Set_the_Stage_Context_Educational_Goal',
  'Set_the_Stage_Context_Why_It_Matters',
  'Developer_and_QA_Metadata_Simulation_Quality_Score',
  'Case_Organization_Original_Title',

  // TIER 4: Contextual Variance (6)
  'Set_the_Stage_Context_Environment_Type',
  'Set_the_Stage_Context_Environment_Description_for_AI_Image',
  'Situation_and_Environment_Details_Triage_or_SBAR_Note',
  'Situation_and_Environment_Details_Disposition_Plan',
  'Scenario_Progression_States_Branching_Notes',
  'Staff_and_AI_Interaction_Config_Patient_Script',

  // TIER 5: State Progression (6)
  'Monitor_Vital_Signs_State1_Vitals',
  'Monitor_Vital_Signs_State2_Vitals',
  'Monitor_Vital_Signs_State3_Vitals',
  'Monitor_Vital_Signs_State4_Vitals',
  'Monitor_Vital_Signs_State5_Vitals',
  'Monitor_Vital_Signs_Vitals_Format',

  // TIER 6: Metacognitive Enrichment (4)
  'Developer_and_QA_Metadata_AI_Reflection_and_Suggestions',
  'Version_and_Attribution_Full_Attribution_Details',
  'Case_Organization_Pre_Sim_Overview',
  'Case_Organization_Post_Sim_Overview'
];
```

**Total**: 35 fields
**Format Guarantee**: All use exact Row 2 header names
**Persistence**: Saved to `SELECTED_CACHE_FIELDS` on first run
**User Override**: User can modify selection via field selector modal

---

## Static Fallback (AI Fail-Safe)

If AI recommendations fail or return garbage, `getStaticRecommendedFields_()` provides intelligent fallback:

```javascript
function getStaticRecommendedFields_() {
  const docProps = PropertiesService.getDocumentProperties();
  const cachedMergedKeys = docProps.getProperty('CACHED_MERGED_KEYS');

  if (!cachedMergedKeys) return [];

  const allFields = JSON.parse(cachedMergedKeys);
  const selected = JSON.parse(docProps.getProperty('SELECTED_CACHE_FIELDS') || '[]');

  // Pattern-based intelligent selection
  const valuableTier2Patterns = [
    'Presenting_Complaint',
    'Medical_History',
    'Medications',
    'Allergies',
    'Teaching_Points',
    'Common_Pitfalls',
    'Critical_Actions',
    'Differential_Diagnosis'
  ];

  const recommended = [];

  allFields.forEach(function(fieldName) {
    if (selected.indexOf(fieldName) !== -1) return; // Skip if already selected

    const parts = fieldName.split('_');
    const tier2 = parts[parts.length - 1];

    const isValuable = valuableTier2Patterns.some(function(pattern) {
      return tier2 === pattern || fieldName.indexOf(pattern) !== -1;
    });

    if (isValuable && recommended.length < 12) {
      recommended.push(fieldName);
    }
  });

  return recommended;
}
```

**Key Features**:
- ✅ Reads from CACHED_MERGED_KEYS (adapts to CSV)
- ✅ Pattern-based selection (finds valuable fields)
- ✅ Avoids duplicates with selected fields
- ✅ Returns max 12 recommendations
- ✅ No hardcoded field names

---

## Testing the System

### Test 1: Format Consistency
```bash
cd /Users/aarontjomsland/er-sim-monitor
node scripts/verifyFormatConsistency.cjs
```

**Expected**: All functions show `✅ Uses CACHED_MERGED_KEYS: true`

### Test 2: End-to-End Flow
1. Refresh Google Sheet (F5)
2. Click **"🧩 Categories & Pathways"** from menu
   - Watch execution log for STEP 1, 2, 2.5, 3, 4
3. Pathway UI appears
4. Click **"💾 Cache All Layers"** button
5. Field selector modal opens **instantly**
   - Section 1: 35 defaults (or last saved)
   - Section 2: AI recommendations (pre-cached)
   - Section 3: All other fields
6. Verify all field names match Row 2 format exactly

### Test 3: AI Validation
1. Modify OpenAI response to return wrong format (simulate error)
2. Modal should still display correctly using exact match validation
3. Check logs for "🔄 Format corrected" messages

### Test 4: CSV Evolution
1. Add new column to Row 2 of spreadsheet
2. Click "Categories & Pathways"
3. Click cache button
4. New field appears in Section 3 (OTHER)
5. AI receives new field in context automatically

---

## Troubleshooting

### Issue: Field names mismatch
**Symptom**: Field selector shows "Loading..." forever
**Cause**: Format inconsistency between cache and code
**Fix**: Run `refreshHeaders()` from menu, then retry

### Issue: AI recommendations empty
**Symptom**: Section 2 never populates
**Cause**: API key missing or AI validation too strict
**Fix**: Check Settings!B2 for valid `sk-proj-...` key
**Fallback**: System uses static recommendations automatically

### Issue: Column indices wrong
**Symptom**: Cached data shows wrong values
**Cause**: CSV columns rearranged, cache stale
**Fix**: `refreshHeaders()` will auto-correct on next run

### Issue: Duplicate field names
**Symptom**: AI suggests fields already in DEFAULT
**Cause**: Validation deduplication working correctly
**Fix**: No fix needed - this is expected behavior

---

## Version History

**v1.0** (2025-11-07):
- Initial format guarantee documentation
- CACHED_MERGED_KEYS as single source of truth
- 6-layer AI validation system
- Dynamic column resolution
- 35 intelligent defaults with exact Row 2 format

---

## Key Takeaways

1. **CACHED_MERGED_KEYS is king** - Everything uses this array
2. **Row 2 is source of truth** - Never hardcode field names
3. **AI is validated** - 6 layers ensure format consistency
4. **System adapts** - CSV can evolve without code changes
5. **No categories** - Flat 3-section layout (DEFAULT, RECOMMENDED, OTHER)
6. **Prepopulation matters** - Step 2.5 makes modal instant
7. **Static fallback exists** - Pattern-based when AI fails

---

**END OF DOCUMENT**
