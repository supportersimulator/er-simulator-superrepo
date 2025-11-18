# MICROSERVICES ARCHITECTURE REFACTORING PLAN

## 🎯 GOAL
Isolate tools into self-contained panels while maintaining central orchestration for menus and shared utilities.

---

## 📋 CURRENT STATE ANALYSIS

### Project 1: GPT Formatter (Monolith - Reference)
- **Status**: Keep as-is (baseline reference)
- **Size**: 133 KB, 1 file (Code.gs)
- **Purpose**: Original monolithic implementation

### Project 2: TEST Menu Script (Bound) - Integration Test
- **Current State**: 3 files, 134 KB
  - Code.gs (42 KB) - Batch processing
  - Categories_Pathways_Feature_Phase2.gs (49 KB) - Field selector + AI
  - ATSR_Title_Generator_Feature.gs (42 KB) - Pathway builder
- **Status**: Keep for integration testing
- **Purpose**: All features together for full-system testing

### Project 3: TEST Menu Script (Bound) #2 - EMPTY
- **Action**: ❌ DELETE (0 files, empty shell)

### Project 4: Pathways/Categories Panel
- **Current State**: 2 files, 137 KB
  - Categories_Pathways_Feature_Phase2.gs (118 KB)
  - Multi_Step_Cache_Enrichment.gs (19 KB)
- **Action**: ✅ KEEP + REFACTOR
- **Goal**: Isolate pathways/categories + their specific cache logic

### Project 5: ATSR Panel (Currently has menu!)
- **Current State**: 3 files, 68 KB
  - ATSR_Title_Generator_Feature.gs (26 KB) ⚠️ **Contains TEST Tools menu!**
  - Batch_Processing_Sidebar_Feature.gs (19 KB)
  - Core_Processing_Engine.gs (23 KB)
- **Action**: ✅ REFACTOR - Extract menu to central script
- **Goal**: Pure ATSR tool only

### Project 6: Batch Processing Panel (Currently duplicate of #5)
- **Current State**: 3 files, 68 KB (identical structure to #5)
- **Action**: ✅ REFACTOR - Separate batch from ATSR
- **Goal**: Pure batch processing tool only

---

## 🏗️ TARGET ARCHITECTURE

### Central Orchestration Script (NEW or REFACTORED)
**Purpose**: Menu management + shared utilities + coordination
**Contents**:
```
CentralOrchestration.gs
├── function onOpen()              // TEST Tools menu
├── function showAbout()           // About dialog
├── Shared utilities
│   ├── readApiKey_()             // Shared API key reader
│   ├── getAvailableFields()      // Field discovery
│   └── Common helper functions
└── Tool launchers
    ├── launchATSR()              // Opens ATSR panel
    ├── launchBatchProcessing()   // Opens batch panel
    └── launchPathwayBuilder()    // Opens pathway panel
```

### ATSR Panel (Isolated)
**Project ID**: `1KBkujOTXGDmmhWOFm-ifxoMjXM5pRwwM5FpFBtPWK8eoE99fr4lla1OE`
**Purpose**: ATSR title generation ONLY
**Contents**:
```
ATSR_Isolated.gs
├── function generateATSRTitle()
├── function buildPathwayChain()
├── function formatATSROutput()
└── ATSR-specific helpers (minimal)
```
**Remove**:
- ❌ TEST Tools menu (move to central)
- ❌ Batch processing UI (move to batch panel)
- ❌ Core processing engine (move to central or batch)

### Batch Processing Panel (Isolated)
**Project ID**: `1INZy2-kQNEfEWEipSQ_WCvrvEhGgAeW4G4TM61W2ajNp_63G39KLPm4Y`
**Purpose**: Batch row processing ONLY
**Contents**:
```
BatchProcessing_Isolated.gs
├── function processBatchRows_()
├── function processOneInputRow_()
├── function applyClinicalDefaults_()
├── function validateVitalsFields_()
└── Batch-specific UI/sidebar
```
**Remove**:
- ❌ ATSR functionality (move to ATSR panel)

### Pathways/Categories Panel (Isolated)
**Project ID**: `1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i`
**Purpose**: Pathway discovery + categories ONLY
**Current State**: Already well-isolated!
**Contents**:
```
Pathways_Isolated.gs
├── function runPathwayChainBuilder()
├── function showFieldSelector()
├── function getRecommendedFields_()
├── function preCacheRichData()        // Pathway-specific cache
└── Multi_Step_Cache_Enrichment.gs     // Keep as-is
```
**Action**: Minimal cleanup (already isolated well)

---

## 📝 REFACTORING STEPS

### Phase 1: Create Central Orchestration (Where should this live?)

**Option A**: Add to Project #2 (TEST Menu Script) as 4th file
- Pros: Central location, already has all features for testing
- Cons: Makes integration test heavier

**Option B**: Create new standalone project "Central_Menu_Orchestration"
- Pros: True separation of concerns
- Cons: One more project to manage

**Option C**: Add to each isolated panel (duplicate menu code)
- Pros: Each panel is fully self-contained
- Cons: Menu code duplicated 3 times

**RECOMMENDED**: Option A - Add `CentralOrchestration.gs` to Project #2

### Phase 2: Extract Menu from ATSR Panel

**Current**: ATSR_Title_Generator_Feature.gs contains:
```javascript
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('TEST Tools')
    .addItem('💾 Pre-Cache', 'preCacheRichData')
    .addItem('🔍 Field Selector', 'showFieldSelector')
    .addItem('🔗 Pathway Builder', 'runPathwayChainBuilder')
    .addItem('📝 ATSR Generator', 'generateATSRTitle')
    .addToUi();
}
```

**Action**: 
1. Extract `onOpen()` to CentralOrchestration.gs
2. Keep only `generateATSRTitle()` in ATSR panel
3. ATSR panel becomes pure tool (no menu)

### Phase 3: Separate Batch from ATSR (Project #6)

**Current State**: Project #6 is duplicate of Project #5
**Action**:
1. Remove ATSR functions from Project #6
2. Keep only batch processing functions
3. Remove UI/sidebar from ATSR panel
4. Move UI/sidebar to batch panel

### Phase 4: Clean Pathways Panel

**Current State**: Already well-isolated
**Action**: Minimal - verify no ATSR or batch code leaked in

---

## 🔑 CRITICAL SUCCESS FACTORS

### 1. Menu Must Work Everywhere
- Central menu in Project #2 (integration test)
- Each isolated panel can optionally have its own minimal menu
- Menu items call functions that exist in same project

### 2. No Cross-Project Dependencies
- Each isolated panel must be 100% self-contained
- If ATSR needs batch processing, duplicate the minimal code
- Alternative: Keep shared utilities in central, duplicate in panels

### 3. Integration Test Must Pass
- Project #2 must have ALL features working together
- Proves each isolated panel can be re-integrated
- Serves as reference for "how it all fits together"

---

## 🎯 SUCCESS METRICS

✅ Each isolated panel runs independently
✅ Central menu works in integration test
✅ Breaking one panel doesn't break others
✅ Code size reduced (no duplication)
✅ Clear separation of concerns

---

## 🚀 NEXT IMMEDIATE ACTIONS (UPDATED AFTER ANALYSIS)

### ✅ COMPLETED ANALYSIS FINDINGS:

**Menu Location**: Already in Code.gs (Project #2) - CORRECT location!

**Current Menu State** ✅ CORRECT (No changes needed):
```javascript
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('TEST Tools')
    .addItem('🎨 ATSR Titles Optimizer (v2)', 'runATSRTitleGenerator()')
    .addItem('🧩 Pathway Chain Builder', 'runPathwayChainBuilder()')
    .addToUi();
}
```

**Internal Tools** (NOT separate menu items - part of Pathway Chain Builder):
- 💾 Pre-Cache → `preCacheRichData()` - Internal workflow step
- 🔍 Field Selector → `showFieldSelector()` - Internal workflow step

**Key Issues Found**:
1. ⚠️ Functions duplicated across projects (preCacheRichData, readApiKey_)
2. ⚠️ ATSR Panel (Project #5) contains batch processing code
3. ⚠️ No dedicated Batch Panel yet (Project #6 unused)
4. ✅ Menu structure is CORRECT - 2 items is intentional

### 🎯 REVISED ACTION PLAN (Focus on Isolation):

1. **~~Expand TEST Tools Menu~~** ❌ NOT NEEDED
   - Menu is already correct with 2 items
   - Pre-Cache and Field Selector are internal to Pathway Builder

2. **Remove Function Duplication**
   - Keep shared utilities only in Project #2 (readApiKey_, preCacheRichData)
   - Remove duplicates from ATSR Panel (Project #5)

3. **Isolate ATSR Panel** (Project #5)
   - Remove Batch_Processing_Sidebar_Feature.gs → Move to Project #6
   - Remove Core_Processing_Engine.gs → Move to Project #6
   - Keep only ATSR_Title_Generator_Feature.gs

4. **Create Batch Processing Panel** (Project #6)
   - Add Core_Processing_Engine.gs
   - Add Batch_Processing_Sidebar_Feature.gs
   - Remove ATSR-specific code

5. **Test Everything**
   - Verify menu shows all 4 items
   - Test each menu item works
   - Verify isolated panels function independently

---

## ⚠️ RISKS & MITIGATION

**Risk**: Breaking existing functionality during refactor
**Mitigation**: All code backed up, test each change incrementally

**Risk**: Menu doesn't appear after extraction
**Mitigation**: Keep integration test (Project #2) as working reference

**Risk**: Shared code duplicated across panels
**Mitigation**: Accept minimal duplication for true isolation, or keep shared utils in central

---

## 📊 ESTIMATED EFFORT

- Phase 1: Create central orchestration (2 hours)
- Phase 2: Extract menu from ATSR (1 hour)
- Phase 3: Separate batch from ATSR (2 hours)
- Phase 4: Clean pathways panel (30 min)
- Testing & verification (2 hours)

**Total**: ~7-8 hours of focused work

---

## 🎉 END STATE

**6 Projects Total**:
1. ✅ GPT Formatter (monolith reference) - unchanged
2. ✅ TEST Menu Script (integration test + central menu) - enhanced
3. ❌ Empty duplicate - deleted
4. ✅ Pathways/Categories Panel - clean, isolated
5. ✅ ATSR Panel - pure ATSR tool only
6. ✅ Batch Processing Panel - pure batch tool only

**Result**: Unbreakable, isolated tools with central coordination!

