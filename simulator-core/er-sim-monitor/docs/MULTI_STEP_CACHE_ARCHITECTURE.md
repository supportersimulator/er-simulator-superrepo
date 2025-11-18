# Multi-Step Lazy Cache Architecture for AI Pathway Discovery

## Problem Statement

AI Pathway Discovery requires 26 rich fields per case to generate quality recommendations, but collecting all fields for 210 cases causes Google Apps Script execution timeout (>6 minutes).

**Current State:**
- Basic cache: 7 fields (fast, ~3 seconds)
- AI discovery expects: 26 fields
- Gap: 19 missing fields causing poor AI recommendations

## Solution: Multi-Step Lazy Caching

Instead of collecting all 26 fields at once, we cache data in progressive enrichment layers. Each layer can be cached independently, and layers combine during AI discovery.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CACHE ORCHESTRATOR                        │
│  Manages 7 independent cache layers + merger logic          │
└─────────────────────────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
    │ Layer 1 │        │ Layer 2 │   ...  │ Layer 7 │
    │  BASIC  │        │ LEARNING│        │   ENV   │
    │ 3 fields│        │ 4 fields│        │ 3 fields│
    └─────────┘        └─────────┘        └─────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                    ┌────────▼────────┐
                    │  CACHE MERGER   │
                    │ Combines layers │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  AI DISCOVERY   │
                    │  (26 fields)    │
                    └─────────────────┘
```

## Seven Cache Layers

### Layer 1: BASIC (3 fields) - Currently Working ✅
**Sheet:** `Pathway_Analysis_Cache_Basic`
**Fields:**
- `caseId` ← Column 0: Case_Organization_Case_ID
- `sparkTitle` ← Column 1: Case_Organization_Spark_Title
- `pathway` ← Column 5: Case_Organization_Pathway_or_Course_Name

**Performance:** <1 second (already deployed)

### Layer 2: LEARNING (4 fields)
**Sheet:** `Pathway_Analysis_Cache_Learning`
**Fields:**
- `preSimOverview` ← Column 9: Case_Organization_Pre_Sim_Overview
- `postSimOverview` ← Column 10: Case_Organization_Post_Sim_Overview
- `learningOutcomes` ← Column 191: CME_and_Educational_Content_CME_Learning_Objective
- `learningObjectives` ← Column 34: Set_the_Stage_Context_Educational_Goal

**Performance:** ~30 seconds (text-heavy fields, may need truncation)

### Layer 3: METADATA (5 fields)
**Sheet:** `Pathway_Analysis_Cache_Metadata`
**Fields:**
- `category` ← Column 11: Case_Organization_Medical_Category
- `difficulty` ← Column 6: Case_Organization_Difficulty_Level
- `estimatedDuration` ← DERIVED (from state count or manual entry)
- `setting` ← Column 38: Set_the_Stage_Context_Environment_Type
- `chiefComplaint` ← Column 66: Patient_Demographics_and_Clinical_Data_Presenting_Complaint

**Performance:** ~5 seconds

### Layer 4: DEMOGRAPHICS (3 fields)
**Sheet:** `Pathway_Analysis_Cache_Demographics`
**Fields:**
- `age` ← Column 62: Patient_Demographics_and_Clinical_Data_Age
- `gender` ← Column 63: Patient_Demographics_and_Clinical_Data_Gender
- `patientName` ← Column 61: Patient_Demographics_and_Clinical_Data_Patient_Name

**Performance:** ~3 seconds

### Layer 5: VITALS (4 fields from JSON)
**Sheet:** `Pathway_Analysis_Cache_Vitals`
**Fields (extracted from Initial_Vitals JSON):**
- `initialHR` ← Parse Column 55: Monitor_Vital_Signs_Initial_Vitals → hr
- `initialBP` ← Parse Column 55: Monitor_Vital_Signs_Initial_Vitals → bp.sys/bp.dia
- `initialRR` ← Parse Column 55: Monitor_Vital_Signs_Initial_Vitals → rr
- `initialSpO2` ← Parse Column 55: Monitor_Vital_Signs_Initial_Vitals → spo2

**Performance:** ~15 seconds (JSON parsing overhead)

### Layer 6: CLINICAL (4 fields)
**Sheet:** `Pathway_Analysis_Cache_Clinical`
**Fields:**
- `examFindings` ← Column 73: Patient_Demographics_and_Clinical_Data_Exam_Positive_Findings
- `medications` ← Column 68: Patient_Demographics_and_Clinical_Data_Current_Medications
- `pastMedicalHistory` ← Column 67: Patient_Demographics_and_Clinical_Data_Past_Medical_History
- `allergies` ← Column 69: Patient_Demographics_and_Clinical_Data_Allergies

**Performance:** ~10 seconds

### Layer 7: ENVIRONMENT (3 fields)
**Sheet:** `Pathway_Analysis_Cache_Environment`
**Fields:**
- `environmentType` ← Column 38: Set_the_Stage_Context_Environment_Type
- `dispositionPlan` ← Column 48: Situation_and_Environment_Details_Disposition_Plan
- `context` ← Column 36: Set_the_Stage_Context_Clinical_Vignette

**Performance:** ~8 seconds

**Total Performance:** ~75 seconds if all layers run sequentially (within 6-minute limit)

## Cache Merger Logic

When AI discovery runs, the merger combines all available cache layers:

```javascript
function mergeAllCacheLayers_() {
  const layers = [
    'Pathway_Analysis_Cache_Basic',      // Layer 1
    'Pathway_Analysis_Cache_Learning',   // Layer 2
    'Pathway_Analysis_Cache_Metadata',   // Layer 3
    'Pathway_Analysis_Cache_Demographics', // Layer 4
    'Pathway_Analysis_Cache_Vitals',     // Layer 5
    'Pathway_Analysis_Cache_Clinical',   // Layer 6
    'Pathway_Analysis_Cache_Environment' // Layer 7
  ];

  const merged = {};

  layers.forEach(layerSheetName => {
    const layerData = readCacheLayer_(layerSheetName);
    if (layerData) {
      layerData.allCases.forEach(caseData => {
        if (!merged[caseData.caseId]) {
          merged[caseData.caseId] = {};
        }
        // Merge fields (later layers override earlier ones if conflict)
        Object.assign(merged[caseData.caseId], caseData);
      });
    }
  });

  return { allCases: Object.values(merged) };
}
```

## Progressive Enrichment UI

### Pre-Cache Rich Data Modal (Enhanced)

Current modal shows single progress bar. New design shows 7 independent progress indicators:

```
┌─────────────────────────────────────────────────────────────┐
│  🗄️  PROGRESSIVE CACHE ENRICHMENT                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: BASIC         ✅ Cached (210 cases, 0.3h ago)     │
│  Layer 2: LEARNING      ⏳ Caching... 145/210 cases         │
│  Layer 3: METADATA      ⏸️  Pending                          │
│  Layer 4: DEMOGRAPHICS  ⏸️  Pending                          │
│  Layer 5: VITALS        ⏸️  Pending                          │
│  Layer 6: CLINICAL      ⏸️  Pending                          │
│  Layer 7: ENVIRONMENT   ⏸️  Pending                          │
│                                                              │
│  Overall Progress: 31% (2/7 layers complete)                │
│                                                              │
│  [⏸️  Pause] [⏭️  Skip to Next] [❌ Cancel]                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Menu Options

1. **🗄️ Cache All Layers (Sequential)** - Runs all 7 layers in order
2. **🗄️ Cache All Layers (Parallel)** - Runs safe layers in parallel (experimental)
3. **🗄️ Cache Single Layer...** - Submenu for individual layers
   - Cache Basic (Layer 1)
   - Cache Learning (Layer 2)
   - Cache Metadata (Layer 3)
   - Cache Demographics (Layer 4)
   - Cache Vitals (Layer 5)
   - Cache Clinical (Layer 6)
   - Cache Environment (Layer 7)
4. **🗄️ View Cache Status** - Shows which layers are cached and freshness

## Cache Freshness Strategy

Each cache layer has independent 24-hour expiry:

```
Cache Status Check:
┌──────────────────┬───────────┬─────────────┐
│ Layer            │ Age       │ Status      │
├──────────────────┼───────────┼─────────────┤
│ Basic            │ 0.3h ago  │ ✅ Fresh    │
│ Learning         │ 12.1h ago │ ✅ Fresh    │
│ Metadata         │ 25.3h ago │ ⚠️  Stale   │
│ Demographics     │ Never     │ ❌ Missing  │
│ Vitals           │ 1.2h ago  │ ✅ Fresh    │
│ Clinical         │ 48.5h ago │ ⚠️  Stale   │
│ Environment      │ 3.4h ago  │ ✅ Fresh    │
└──────────────────┴───────────┴─────────────┘
```

## Modified `analyzeCatalog_()` Function

```javascript
function analyzeCatalog_() {
  // TIER 1: Try merged multi-layer cache first
  const mergedCache = mergeAllCacheLayers_();

  if (mergedCache && mergedCache.allCases && mergedCache.allCases.length > 0) {
    const fieldCount = Object.keys(mergedCache.allCases[0]).length;
    Logger.log(`✅ Using merged cache (${mergedCache.allCases.length} cases, ${fieldCount} fields per case)`);
    return mergedCache;
  }

  // TIER 2: Try basic cache only (fallback for partial enrichment)
  const basicCache = readCacheLayer_('Pathway_Analysis_Cache_Basic');

  if (basicCache && basicCache.allCases && basicCache.allCases.length > 0) {
    Logger.log(`⚠️  Using basic cache only (${basicCache.allCases.length} cases, 3 fields)`);
    Logger.log('   Consider running progressive enrichment for better AI discovery results');
    return basicCache;
  }

  // TIER 3: Fresh lightweight analysis (original fallback)
  Logger.log('📊 No cache available - running fresh lightweight analysis');
  return performLightweightAnalysis_();
}
```

## Benefits

1. **No Timeouts:** Each layer completes within timeout limits
2. **Progressive Enhancement:** AI discovery quality improves as more layers cache
3. **Independent Scheduling:** Can cache different layers at different times
4. **Graceful Degradation:** Works even if some layers missing/stale
5. **User Control:** Choose which layers to cache based on needs
6. **Bandwidth Efficiency:** Only re-cache stale layers
7. **Debugging:** Can isolate issues to specific field groups

## Implementation Priority

**Phase 1 (MVP):**
- Implement 3 layers: BASIC (done), LEARNING, METADATA
- Simple sequential caching
- Basic merger logic

**Phase 2:**
- Add DEMOGRAPHICS, VITALS layers
- Enhanced UI with per-layer progress

**Phase 3:**
- Add CLINICAL, ENVIRONMENT layers
- Parallel caching for safe layers
- Advanced freshness management

## Header Refresh Integration

The system integrates with the existing `refreshHeaders()` function to handle schema changes dynamically.

### Auto-Detection of Column Changes

Each cache enrichment layer includes header validation:

```javascript
function performEnrichmentLayer_(layerName, fieldMapping) {
  // 1. Refresh headers if needed
  const cachedHeaders = getProp('CACHED_MERGED_KEYS');

  if (!cachedHeaders) {
    Logger.log('⚠️  No cached headers - running refreshHeaders()');
    refreshHeaders();
  }

  // 2. Validate field mapping against current headers
  const currentHeaders = JSON.parse(getProp('CACHED_MERGED_KEYS'));
  const validatedMapping = {};

  Object.keys(fieldMapping).forEach(fieldName => {
    const expectedColumnName = fieldMapping[fieldName];
    const currentIndex = currentHeaders.indexOf(expectedColumnName);

    if (currentIndex === -1) {
      Logger.log(`⚠️  Field ${fieldName} mapping broken: expected column "${expectedColumnName}" not found`);
      Logger.log('   Running refreshHeaders() to update...');
      refreshHeaders();

      // Re-check after refresh
      const refreshedHeaders = JSON.parse(getProp('CACHED_MERGED_KEYS'));
      const newIndex = refreshedHeaders.indexOf(expectedColumnName);

      if (newIndex === -1) {
        Logger.log(`❌ Field ${fieldName} still not found after refresh - column may have been removed`);
        return; // Skip this field
      } else {
        Logger.log(`✅ Field ${fieldName} found at new index ${newIndex} after refresh`);
        validatedMapping[fieldName] = newIndex;
      }
    } else {
      validatedMapping[fieldName] = currentIndex;
    }
  });

  return validatedMapping;
}
```

### UI Integration: "🔄 Refresh Headers" Button

Add to cache enrichment modal:

```
┌─────────────────────────────────────────────────────────────┐
│  🗄️  PROGRESSIVE CACHE ENRICHMENT                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [🔄 Refresh Headers]  [ℹ️ View Column Mapping]             │
│                                                              │
│  Layer 1: BASIC         ✅ Cached (210 cases, 0.3h ago)     │
│  Layer 2: LEARNING      ⚠️  Schema changed - refresh needed │
│  Layer 3: METADATA      ⏸️  Pending                          │
│  ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

### Schema Change Detection

Before each cache layer enrichment:

1. **Compare stored column mapping** with current headers
2. **If mismatch detected** → Auto-trigger `refreshHeaders()`
3. **Re-validate mapping** → Update field-to-column index
4. **Log changes** → Show which columns moved/renamed/removed

### Benefits

- **Automatic adaptation** to spreadsheet schema changes
- **No manual cache invalidation** needed when columns change
- **Transparent logging** shows exactly what changed
- **Graceful degradation** if columns removed (skip those fields)
- **Re-uses existing infrastructure** (`refreshHeaders()` already battle-tested)

## Next Steps

1. Create `performEnrichmentLayer_()` function template with header refresh integration
2. Implement Layer 2 (LEARNING) enrichment with schema validation
3. Test merge logic with 2 layers
4. Add schema change detection to UI
5. Deploy and verify with real AI discovery
6. Iterate through remaining layers
