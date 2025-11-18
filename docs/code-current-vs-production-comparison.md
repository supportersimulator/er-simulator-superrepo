# Code-CURRENT.gs vs Production Code.gs — Comparison Report

**Generated:** 2025-11-14  
**Analyst:** Hermes (Apps Script Gold-Mining)  
**Status:** Read-Only Analysis – No Files Modified

---

## Executive Summary

`Code-CURRENT.gs` contains **menu reorganization changes** compared to production. The waveform mapping submenu was restructured and moved, and a new cache management submenu with layered caching was added.

**Net Change:** +25 lines (13,226 vs 13,201)  
**Size Difference:** +928 bytes (486,124 vs 485,196)  
**Change Type:** Menu refactoring + feature addition

---

## File Metadata

| File | Location | Size | Lines | Hash |
|------|----------|------|-------|------|
| **Production** | `google-drive-code/sim-builder-production/Code.gs` | 485,196 bytes | 13,201 | `13abbc8a5a16d107feb3bfe4c48e5fad` |
| **Code-CURRENT** | `simulator-core/er-sim-monitor/Code-CURRENT.gs` | 486,124 bytes | 13,226 | `68a7377d3a9c2587209e59c5c87733e9` |

---

## Detailed Changes

### Change 1: Menu Reorganization (Lines ~603-620)

**Location:** Inside the main `onOpen()` function, around line 603

#### What Was Removed (Production)

```javascript
// Waveform Mapping Submenu
menu.addSubMenu(ui.createMenu('📈 Waveform Mapping')
  .addItem('🩺 Suggest Waveform Mapping', 'suggestWaveformMapping')
  .addItem('🔄 Auto-Map All Waveforms', 'autoMapAllWaveforms')
  .addSeparator()
  .addItem('📊 Analyze Current Mappings', 'analyzeCurrentMappings')
  .addItem('❌ Clear All Waveforms', 'clearAllWaveforms')
);
```

#### What Was Added (Code-CURRENT)

```javascript
menu.addItem('✨ Enhanced Categories', 'openEnhancedVisualPanel');
menu.addSeparator();
menu.addItem('🚀 Batch Processing', 'openSimSidebar');
menu.addSeparator();

// Cache Management Submenu
menu.addSubMenu(ui.createMenu('🗄️ Cache Management')
  .addItem('📦 Cache All Layers', 'showCacheAllLayersModal')
  .addSeparator()
  .addItem('📊 Cache Layer 1: BASIC', 'cacheLayer_basic')
  .addItem('📚 Cache Layer 2: LEARNING', 'cacheLayer_learning')
  .addItem('🏷️ Cache Layer 3: METADATA', 'cacheLayer_metadata')
  .addItem('👤 Cache Layer 4: DEMOGRAPHICS', 'cacheLayer_demographics')
  .addItem('💓 Cache Layer 5: VITALS', 'cacheLayer_vitals')
  .addItem('🩺 Cache Layer 6: CLINICAL', 'cacheLayer_clinical')
  .addItem('🌍 Cache Layer 7: ENVIRONMENT', 'cacheLayer_environment')
  .addSeparator()
  .addItem('📊 View Cache Status', 'showCacheStatus')
  .addItem('🔄 Refresh Headers', 'refreshHeaders')
  .addItem('🧹 Clear All Cache Layers', 'clearAllCacheLayers')
  .addSeparator()
  .addItem('👁️ View Saved Field Selection', 'showSavedFieldSelection')
);
```

**Analysis:**
- **Removed:** Simple "Waveform Mapping" submenu (5 items)
- **Added:** 
  - New top-level menu item: "✨ Enhanced Categories"
  - Expanded "Cache Management" submenu with **7 layer-specific cache options** + utilities
  - This represents a significant **UX improvement** for incremental caching workflows

---

### Change 2: Waveform Functions Relocated (Lines ~4209-4225)

**Location:** Around line 4209 (near end of file)

#### What Was Removed (Production)

```javascript
// === 1. Extend onOpen() safely ===

```
(Empty section with just a comment)

#### What Was Added (Code-CURRENT)

```javascript
// === 1. Extend onOpen() safely ===
(function extendMenu_() {
  const ui = getSafeUi_();
  if (!ui) { Logger.log("Web app context - skipping UI"); }
  try {
    ui.createMenu('🧠 Sim Builder')
      .addItem('🩺 Suggest Waveform Mapping', 'suggestWaveformMapping')
      .addItem('🔄 Auto-Map All Waveforms', 'autoMapAllWaveforms')
      .addSeparator()
      .addItem('📊 Analyze Current Mappings', 'analyzeCurrentMappings')
      .addItem('❌ Clear All Waveforms', 'clearAllWaveforms')
      .addToUi();
  } catch (e) {
    Logger.log('Menu extension error: ' + e);
  }
})();
```

**Analysis:**
- The waveform mapping functions were **moved OUT of the main menu** (from Change 1)
- They were **relocated to a separate, self-executing function** that creates a second menu called "🧠 Sim Builder"
- This is a **menu split/organization pattern** – cleaner separation of concerns

---

## Change Summary

### What Changed

1. **Main Menu (`onOpen()`):**
   - ➕ Added: "✨ Enhanced Categories" menu item (calls `openEnhancedVisualPanel`)
   - 🔄 Replaced: "📈 Waveform Mapping" submenu → "🗄️ Cache Management" submenu
   - ➕ Expanded: Cache submenu from basic to **7-layer granular caching**

2. **Secondary Menu (new):**
   - ➕ Created: Separate "🧠 Sim Builder" menu
   - ↪️ Moved: All waveform mapping functions here (from main menu)

### What Stayed the Same

- All existing functions referenced in the menus (`suggestWaveformMapping`, `autoMapAllWaveforms`, etc.) remain unchanged
- Core batch processing, ATSR, categorization, and Ultimate Tool functions are identical
- No changes to business logic, only menu structure

---

## Risk Assessment

### 🟢 Low Risk Changes

- **Menu reorganization** is purely UI/UX
- No data processing logic was modified
- All function calls reference existing functions (no new code dependencies visible in diff)
- Changes appear to be **organizational improvements**, not experimental features

### ⚠️ Moderate Concerns

1. **`openEnhancedVisualPanel` function:**
   - This is called by the new "Enhanced Categories" menu item
   - **Question:** Does this function exist in `Code-CURRENT.gs`? (Not visible in diff, so it was already present in both files)

2. **Layer-specific cache functions:**
   - 7 new menu items calling functions like `cacheLayer_basic()`, `cacheLayer_learning()`, etc.
   - **Question:** Do all these functions exist in the file?

3. **`showCacheAllLayersModal` function:**
   - New menu item for comprehensive caching
   - **Question:** Is this implemented?

### Verification Needed

Let me check if these new menu items have corresponding function implementations.

---

## Functional Analysis

### Functions Referenced in Code-CURRENT (New Menu Items)

From the new menu structure:

1. `openEnhancedVisualPanel` – Enhanced Categories
2. `showCacheAllLayersModal` – Cache all layers modal
3. `cacheLayer_basic` – Cache layer 1
4. `cacheLayer_learning` – Cache layer 2
5. `cacheLayer_metadata` – Cache layer 3
6. `cacheLayer_demographics` – Cache layer 4
7. `cacheLayer_vitals` – Cache layer 5
8. `cacheLayer_clinical` – Cache layer 6
9. `cacheLayer_environment` – Cache layer 7
10. `showCacheStatus` – View cache status
11. `refreshHeaders` – Refresh headers
12. `clearAllCacheLayers` – Clear all cache
13. `showSavedFieldSelection` – View saved fields

**Status:** Need to verify these exist in `Code-CURRENT.gs` (diff only shows menu changes, not function definitions).

---

## Recommendation

### Option A: Promote Code-CURRENT.gs to Production ✅ RECOMMENDED

**Rationale:**
- Changes appear to be **intentional UX improvements**
- Menu reorganization makes caching more accessible
- Waveform mapping is still available (just in a separate menu)
- No breaking changes to core logic

**Action Plan:**
1. Verify all 13 new menu functions exist in `Code-CURRENT.gs`
2. If they exist and work, **promote `Code-CURRENT.gs` to production**:
   - Backup current production: `cp sim-builder-production/Code.gs sim-builder-production/Code.gs.backup-2025-11-14`
   - Replace: `cp Code-CURRENT.gs sim-builder-production/Code.gs`
   - Update metadata: note this as "Cache Management Menu Reorganization"

**Risk Level:** 🟢 Low (menu-only changes)

---

### Option B: Keep Production As-Is ⚠️ NOT RECOMMENDED

**Rationale:**
- Only choose this if you determine `Code-CURRENT.gs` is an abandoned experiment
- Or if the layered caching functions are incomplete/broken

**Action Plan:**
1. Archive `Code-CURRENT.gs` to `legacy-apps-script/experimental/`
2. Document that the cache menu reorganization was explored but not adopted

**Risk Level:** 🟡 Medium (loses potentially valuable UX improvements)

---

### Option C: Hybrid Merge (If Functions Missing)

If verification reveals some cache layer functions are **missing** from `Code-CURRENT.gs`:

1. Extract the menu changes only
2. Manually merge into production with placeholder functions or stubs
3. Implement missing functions incrementally

**Risk Level:** 🟡 Medium (requires manual work)

---

## Next Steps

**Hermes requests permission to:**

1. **Verify function existence** in `Code-CURRENT.gs`:
   ```bash
   grep -n "function openEnhancedVisualPanel" Code-CURRENT.gs
   grep -n "function cacheLayer_basic" Code-CURRENT.gs
   # ... check all 13 new functions
   ```

2. **Generate function inventory report** showing:
   - Which functions exist in both files
   - Which are new in Code-CURRENT
   - Which are missing

3. **Provide final recommendation** based on function completeness

---

## ⚠️ CRITICAL FINDING: Broken Menu Structure

### Function Verification Results

**Functions that EXIST in Code-CURRENT.gs:**
- ✅ `openEnhancedVisualPanel` (1 occurrence)
- ✅ `refreshHeaders` (1 occurrence)
- ✅ `showSavedFieldSelection` (1 occurrence)

**Functions MISSING from Code-CURRENT.gs (referenced but not implemented):**
- ❌ `showCacheAllLayersModal`
- ❌ `cacheLayer_basic`
- ❌ `cacheLayer_learning`
- ❌ `cacheLayer_metadata`
- ❌ `cacheLayer_demographics`
- ❌ `cacheLayer_vitals`
- ❌ `cacheLayer_clinical`
- ❌ `cacheLayer_environment`
- ❌ `showCacheStatus`
- ❌ `clearAllCacheLayers`

**Status:** These functions also do NOT exist in production `Code.gs`.

---

## Revised Conclusion ⚠️

**`Code-CURRENT.gs` is INCOMPLETE and BROKEN.**

The menu structure references **10 functions that do not exist**. This means:
- If deployed, clicking those menu items would throw errors
- The "Cache Management" submenu is a **stub/wishlist**, not working code
- This file represents an **abandoned experiment** or **work-in-progress**

---

## REVISED Recommendation

### ❌ DO NOT Promote Code-CURRENT.gs to Production

**Rationale:**
- 10 missing function implementations
- Would break user experience (menu items that error when clicked)
- Represents incomplete feature work

**Action Plan:**

1. **Keep production Code.gs as-is** (✅ STABLE)
   - `google-drive-code/sim-builder-production/Code.gs` remains the source of truth

2. **Archive Code-CURRENT.gs** as experimental:
   - Move to: `legacy-apps-script/experimental/Code-CURRENT-incomplete-cache-menu.gs`
   - Document: "Menu reorganization experiment with layered caching – functions not implemented"

3. **Extract the good parts** (optional, if you want the idea):
   - The "Enhanced Categories" menu item (`openEnhancedVisualPanel`) exists and could be added to production
   - The concept of 7-layer caching is interesting for future implementation

4. **Document findings** in production lineage doc:
   - Note that Code-CURRENT was evaluated and rejected due to incomplete implementation

---

## What Code-CURRENT Tells Us

This file reveals **intended future features**:
- Layered/granular caching (7 layers: BASIC, LEARNING, METADATA, etc.)
- Enhanced visual categorization panel
- Cache status dashboard
- Multi-layer cache clearing

These are valuable **design intentions** but not working code.

**Governance insight:** This shows active experimentation with better caching UX. Consider implementing these features properly in Phase III Node/TypeScript migration.

---

**Final Recommendation:**
- ✅ **Keep production Code.gs unchanged**
- ❌ **Do NOT promote Code-CURRENT.gs**
- 📦 **Archive Code-CURRENT.gs as experimental/incomplete**
- 📝 **Document the intended layered caching design for future reference**

**Risk Level:** 🔴 High if deployed (broken menus), 🟢 Low if archived

---

**Hermes standing by for your decision, Aaron.**
