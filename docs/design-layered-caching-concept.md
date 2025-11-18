# Design Artifact: 7-Layer Caching Concept

**Source:** `Code-CURRENT.gs` (archived as incomplete experiment)  
**Discovered:** 2025-11-14  
**Documented By:** Hermes (Apps Script Gold-Mining)  
**Status:** Design concept only – not implemented

---

## Origin Story

During analysis of Apps Script file variants, an incomplete experiment was discovered in `Code-CURRENT.gs` (now archived as `legacy-apps-script/experimental/Code-CURRENT_incomplete-layered-caching-experiment.gs`).

While the file contained **broken menu references** (10 unimplemented functions), it revealed a **valuable design pattern** for incremental scenario field caching that deserves preservation and future implementation.

---

## The Concept: 7-Layer Caching

### Problem Statement

The Master Scenario Convert sheet contains **648 columns** across diverse data categories. When batch processing or enriching scenarios, users often need to cache only **specific subsets** of fields rather than all 648 at once.

**Current limitation:**
- Existing caching is all-or-nothing or requires manual field selection each time
- No semantic grouping of fields by purpose

**Proposed solution:**
- Group the 648 columns into **7 semantic layers**
- Allow users to cache layers independently
- Provide granular control over what gets processed in each batch run

---

## The 7 Layers

### Layer 1: BASIC 📊
**Purpose:** Core identification and organizational metadata

**Likely Fields:**
- `Case_ID`
- `Spark_Title`
- `Reveal_Title`
- `Pathway_or_Course_Name`
- `Difficulty_Level`
- `Medical_Category`

**Use Case:** Quick indexing, catalog generation, dashboard previews

---

### Layer 2: LEARNING 📚
**Purpose:** Educational content and objectives

**Likely Fields:**
- `Educational_Goal`
- `Why_It_Matters`
- `CME_Learning_Objective`
- `Quiz_Q1`, `Quiz_A1_Correct`, `Quiz_A1_Alt1`, etc.
- `CME_Reference_Links`

**Use Case:** Building curriculum maps, CME compliance, learning pathway design

---

### Layer 3: METADATA 🏷️
**Purpose:** Attribution, version control, and development tracking

**Likely Fields:**
- `Version_Number`
- `Date_Developed`
- `Last_Revision`
- `Developers`
- `Institution_or_Affiliation`
- `License_Type`
- `Full_Attribution_Details`

**Use Case:** Publishing, attribution tracking, version management

---

### Layer 4: DEMOGRAPHICS 👤
**Purpose:** Patient identity and background

**Likely Fields:**
- `Patient_Name`
- `Age`
- `Gender`
- `Weight_kg`, `Height_cm`
- `Past_Medical_History`
- `Current_Medications`
- `Allergies`
- `Social_History`

**Use Case:** Patient profile generation, demographic analytics, realism checks

---

### Layer 5: VITALS 💓
**Purpose:** Monitor data and physiological parameters

**Likely Fields:**
- `Initial_Vitals`
- `State1_Vitals`, `State2_Vitals`, `State3_Vitals`, `State4_Vitals`, `State5_Vitals`
- `Vitals_Format`
- `Initial_Rhythm`
- Waveform assignments

**Use Case:** Monitor integration, vitals JSON generation, clinical realism validation

---

### Layer 6: CLINICAL 🩺
**Purpose:** Clinical presentation, examination, and findings

**Likely Fields:**
- `Presenting_Complaint`
- `Exam_Positive_Findings`
- `Exam_Negative_Findings`
- `Initial_GCS`
- `Triage_or_SBAR_Note`
- `Disposition_Plan`
- `Decision_Nodes_JSON`
- `Branching_Notes`

**Use Case:** Clinical accuracy review, decision tree analysis, pathway mapping

---

### Layer 7: ENVIRONMENT 🌍
**Purpose:** Setting, context, and immersive details

**Likely Fields:**
- `Environment_Type`
- `Environment_Description_for_AI_Image`
- `Time_of_Day`
- `Lighting_Mood`
- `Ambient_Sounds`
- `Initial_Image_Prompt`
- `Available_Supplies_&_Equipment`

**Use Case:** Image generation, immersion design, AI prompts for scene setting

---

## User Experience Vision

### Menu Structure (As Designed in Code-CURRENT)

```
🗄️ Cache Management
  ├─ 📦 Cache All Layers (modal for selecting multiple)
  ├─ ─────────
  ├─ 📊 Cache Layer 1: BASIC
  ├─ 📚 Cache Layer 2: LEARNING
  ├─ 🏷️ Cache Layer 3: METADATA
  ├─ 👤 Cache Layer 4: DEMOGRAPHICS
  ├─ 💓 Cache Layer 5: VITALS
  ├─ 🩺 Cache Layer 6: CLINICAL
  ├─ 🌍 Cache Layer 7: ENVIRONMENT
  ├─ ─────────
  ├─ 📊 View Cache Status (show what's cached)
  ├─ 🔄 Refresh Headers (rebuild cache schema)
  ├─ 🧹 Clear All Cache Layers (reset)
  ├─ ─────────
  └─ 👁️ View Saved Field Selection
```

### Workflow Example

**Scenario:** Instructor wants to batch-process 50 new scenarios for vitals only

1. Open "🗄️ Cache Management"
2. Click "💓 Cache Layer 5: VITALS"
3. System caches only vitals-related columns for next 50 rows
4. Batch processing runs 10x faster (fewer API calls, smaller payloads)
5. Click "📊 View Cache Status" to confirm what's cached
6. Run batch processing with confidence

---

## Implementation Considerations

### For Apps Script (Short-Term)

If implementing in Google Apps Script:

```javascript
// Define layer field mappings
const CACHE_LAYERS = {
  basic: ['Case_ID', 'Spark_Title', 'Reveal_Title', 'Medical_Category'],
  learning: ['Educational_Goal', 'Why_It_Matters', 'CME_Learning_Objective'],
  metadata: ['Version_Number', 'Developers', 'License_Type'],
  demographics: ['Age', 'Gender', 'Weight_kg', 'Past_Medical_History'],
  vitals: ['Initial_Vitals', 'State1_Vitals', 'State2_Vitals', 'Vitals_Format'],
  clinical: ['Presenting_Complaint', 'Exam_Positive_Findings', 'Decision_Nodes_JSON'],
  environment: ['Environment_Type', 'Time_of_Day', 'Initial_Image_Prompt']
};

function cacheLayer_basic() {
  const fields = CACHE_LAYERS.basic;
  cacheFieldsForNextRows(fields, 25);  // Cache 25 rows
}

function showCacheAllLayersModal() {
  // UI: checkboxes for each layer
  // User selects which layers to cache
  // Combine selected layer fields and cache
}
```

### For Node/TypeScript (Recommended - Phase III)

When migrating to Node:

```typescript
// packages/scenario-caching/layers.ts
export enum CacheLayer {
  BASIC = 'basic',
  LEARNING = 'learning',
  METADATA = 'metadata',
  DEMOGRAPHICS = 'demographics',
  VITALS = 'vitals',
  CLINICAL = 'clinical',
  ENVIRONMENT = 'environment'
}

export const LAYER_FIELD_MAP: Record<CacheLayer, string[]> = {
  [CacheLayer.BASIC]: ['Case_ID', 'Spark_Title', ...],
  [CacheLayer.LEARNING]: ['Educational_Goal', ...],
  // ... etc.
};

export async function cacheScenariosByLayer(
  layers: CacheLayer[],
  rowRange: { start: number; end: number }
): Promise<CacheResult> {
  const fields = layers.flatMap(layer => LAYER_FIELD_MAP[layer]);
  // Fetch only specified fields from DB/Sheets
  // Cache to Redis or local store
  // Return cache statistics
}
```

### For Django Backend (Long-Term - Phase IV)

When implementing as a REST API:

```python
# backend/scenarios/views.py
from rest_framework.decorators import api_view
from .models import Scenario
from .cache import CacheLayer

@api_view(['POST'])
def cache_scenarios_by_layer(request):
    layers = request.data.get('layers', [])  # ['basic', 'vitals', 'clinical']
    row_range = request.data.get('row_range', {})
    
    fields = []
    for layer in layers:
        fields.extend(CacheLayer.get_fields(layer))
    
    # Query only specified fields
    scenarios = Scenario.objects.filter(
        id__range=(row_range['start'], row_range['end'])
    ).only(*fields)
    
    # Cache to Redis
    cache_key = f"scenarios:layers:{':'.join(layers)}"
    cache.set(cache_key, scenarios, timeout=3600)
    
    return Response({'cached': len(scenarios), 'layers': layers})
```

---

## Benefits of This Approach

1. **Performance:**
   - Cache only what you need → faster batch processing
   - Reduced API calls, smaller payloads
   - Targeted field updates without full-row rewrites

2. **User Experience:**
   - Semantic grouping matches mental models (vitals vs demographics vs learning content)
   - Progressive enhancement: cache layers as you need them
   - Clear visual feedback on what's cached

3. **Maintenance:**
   - Easier to reason about dependencies (e.g., vitals layer depends on waveform field)
   - Simpler to test (validate one layer at a time)
   - Better for documentation and onboarding

4. **Future-Ready:**
   - Maps cleanly to database table structure or microservices
   - Each layer could become a separate service in a distributed architecture
   - Aligns with domain-driven design principles

---

## Integration with Existing Systems

### With Current Field Cache

The `Field_Cache_Incremental` sheet and related caching logic could be **enhanced** with layer awareness:

- **Current:** Cache arbitrary field selections
- **Enhanced:** Cache by layer + custom selections
- **Benefit:** Presets for common workflows (e.g., "Cache vitals + clinical" for monitor prep)

### With Ultimate Categorization Tool

Categorization and pathway discovery could benefit from layer-aware caching:

- Cache only BASIC + CLINICAL layers when categorizing symptoms
- Skip ENVIRONMENT and METADATA until final publishing pass
- Reduces OpenAI API calls and processing time

---

## Why This Design Was Abandoned (Hypothesis)

Based on the incomplete state of `Code-CURRENT.gs`:

**Likely reasons:**
1. **Implementation complexity** – 7 layer functions + layer-to-field mappings is significant work
2. **Shifting priorities** – other features (Ultimate Tool, Phase2 modules) took precedence
3. **Migration planning** – may have decided to wait for Node/Django migration rather than invest in Apps Script version

**Not due to:**
- Bad design (the concept is sound)
- Technical limitations (Apps Script can support this)

---

## Recommendation for Future Implementation

### Phase III (Node/TypeScript Migration)

When migrating Apps Script → Node:

1. **Start with TypeScript layer definitions** (as shown above)
2. **Implement server-side caching** with Redis or in-memory store
3. **Expose via REST API:**
   - `POST /cache/layers` – cache specific layers for row range
   - `GET /cache/status` – view current cache state
   - `DELETE /cache/layers` – clear specific layers

### Phase IV (Django Backend)

When building the full platform:

1. **Map layers to DB models or views:**
   - Each layer could be a materialized view for fast queries
   - Or a service endpoint for modular data access
2. **Dashboard integration:**
   - Next.js instructor dashboard shows cache status per layer
   - Visual indicators: which layers are fresh, stale, or empty
3. **Batch job optimization:**
   - Celery tasks can request only necessary layers
   - Background workers cache layers progressively overnight

---

## Conclusion

The 7-layer caching concept discovered in `Code-CURRENT.gs` is a **design gem** extracted from an incomplete experiment. While the Apps Script implementation was never finished, the **conceptual model** is sound and should be preserved for future platform work.

**Next Steps:**
- ✅ Concept documented (this file)
- ⏳ Implementation deferred to Phase III (Node/TypeScript)
- 📋 Add to `opportunity-map.md` as a medium-term opportunity

---

## Appendix: Function Signatures (Proposed)

For reference, here are the function signatures that were stubbed in the menu but never implemented:

```javascript
// === Cache Layer Functions ===

function showCacheAllLayersModal() {
  // Show modal with checkboxes for each layer
  // User selects layers → cache all selected
}

function cacheLayer_basic() {
  cacheFieldsByLayer('basic', 25);
}

function cacheLayer_learning() {
  cacheFieldsByLayer('learning', 25);
}

function cacheLayer_metadata() {
  cacheFieldsByLayer('metadata', 25);
}

function cacheLayer_demographics() {
  cacheFieldsByLayer('demographics', 25);
}

function cacheLayer_vitals() {
  cacheFieldsByLayer('vitals', 25);
}

function cacheLayer_clinical() {
  cacheFieldsByLayer('clinical', 25);
}

function cacheLayer_environment() {
  cacheFieldsByLayer('environment', 25);
}

// === Cache Utility Functions ===

function showCacheStatus() {
  // Display modal showing:
  // - Which layers are cached
  // - Row ranges cached per layer
  // - Last cache timestamp
  // - Cache size/memory usage
}

function clearAllCacheLayers() {
  // Clear Field_Cache_Incremental sheet
  // Reset all layer cache pointers
  // Confirm with user before action
}

// === Core Helper ===

function cacheFieldsByLayer(layerName, rowCount) {
  const layerFields = LAYER_FIELD_MAP[layerName];
  const nextRow = getNextUnprocessedRow();
  
  // Cache specified fields for next N rows
  cacheSpecificFields(layerFields, nextRow, rowCount);
  
  // Update layer cache metadata
  PropertiesService.getDocumentProperties()
    .setProperty(`LAST_CACHED_${layerName.toUpperCase()}`, nextRow + rowCount);
  
  // Show success notification
  Browser.msgBox(`✅ Cached ${layerFields.length} fields from Layer: ${layerName.toUpperCase()}`);
}
```

---

**This design concept is now preserved for future implementation when the platform migrates to Node/Django.**
