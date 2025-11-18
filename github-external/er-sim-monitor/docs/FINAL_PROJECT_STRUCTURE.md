# FINAL APPS SCRIPT PROJECT STRUCTURE

**Date**: November 6, 2025
**Status**: ✅ Simplified to 3 essential projects

---

## ✅ PROJECTS TO KEEP (3 Total)

### 1. **Advanced Cache System**
**Purpose**: Multi-Step Cache Enrichment infrastructure
**Contains**:
- Multi_Step_Cache_Enrichment.gs (19 KB)
- 7-layer progressive caching (basic, learning, metadata, demographics, vitals, clinical, environment)
- Powers Pre-Cache and Field Selector tools
- Essential for Pathway Chain Builder

**Why Keep**: Critical infrastructure for AI pathway discovery without execution timeouts

**Key Functions**:
- `getCacheLayerDefinitions_()` - Defines 7 cache layers
- `enrichCacheLayer_(layer)` - Populates one cache layer
- `mergeAllCacheLayers_()` - Combines all layers
- `analyzeCatalogWithMultiLayerCache_()` - 3-tier fallback strategy

---

### 2. **GPT Formatter**
**Purpose**: Original monolithic reference implementation
**Contains**:
- Code.gs (133 KB) - Original complete implementation
- All features in one file (baseline reference)

**Why Keep**: Historical reference, fallback, comparison baseline

**Note**: This is the original "everything in one place" version before refactoring

---

### 3. **Title Optimizer**
**Purpose**: ATSR title generation tool
**Contains**:
- ATSR_Title_Generator_Feature.gs - Complete ATSR workflow
- All helper functions (SP_KEYS, getSafeUi_, pickMasterSheet_, etc.)
- `runATSRTitleGenerator()` - Main ATSR workflow
- `generateMysteriousSparkTitles()` - Mystery regeneration system
- `saveATSRData()` - Working save function
- Dialog size: 1920x1000 (large format)

**Why Keep**: Production ATSR title generation with all dependencies

**Key Features**:
- Spark Title generation
- Reveal Title generation
- Memory Anchor extraction
- "Make More Mysterious" iterative regeneration (levels 1-4+)
- Shows current values with "No change, keep current version"

---

## ❌ PROJECTS TO DELETE (3 Total)

### 1. **delete this duplicate TEST_Feature_Based_Code**
**Reason**: Old experimental version, superseded by active projects
**Action**: Remove via Apps Script UI (https://script.google.com/home → ⋮ → Remove)

### 2. **delete this empty TEST Menu Script (Bound)**
**Reason**: Empty shell with 0 files
**Action**: Remove via Apps Script UI

### 3. **delete this redundant ATSR Panel (Isolated)**
**Reason**: Incomplete ATSR version missing critical functions
**Issues**:
- Missing ALL helper functions (will crash immediately)
- Missing `saveATSRData()` (save buttons won't work)
- Missing `generateMysteriousSparkTitles()` (mystery feature lost)
- Missing `onOpen()` (no menu creation)
**Action**: Remove via Apps Script UI

---

## 🎯 Final State After Cleanup

You will have **exactly 3 projects**:

```
Apps Script Projects
├── Advanced Cache System (cache infrastructure)
├── GPT Formatter (original reference)
└── Title Optimizer (ATSR title generation)
```

**Total Projects**: 3
**Total Files**: ~5-6 across all projects
**Total Code Size**: ~190 KB

---

## 📊 What Each Project Does

| Project | Primary Function | Key Output |
|---------|------------------|------------|
| **Advanced Cache System** | Progressive cache enrichment for AI | Enriched pathway data |
| **GPT Formatter** | Reference baseline | N/A (archival) |
| **Title Optimizer** | ATSR title generation | Spark/Reveal titles + Memory Anchors |

---

## 🔄 Workflow Integration

### Pathway Discovery Workflow:
1. **Pre-Cache** (uses Advanced Cache System) → enriches scenario data
2. **Field Selector** (uses Advanced Cache System) → AI field recommendations
3. **Pathway Chain Builder** (uses cached data) → discovers pathways

### Title Generation Workflow:
1. **Title Optimizer** → generates Spark/Reveal titles
2. **Mystery Regeneration** (Title Optimizer) → iterative mystery enhancement
3. **Save** (Title Optimizer) → writes to spreadsheet

---

## 🗑️ Manual Deletion Steps

**Since automated deletion is not possible for Apps Script projects:**

1. Go to https://script.google.com/home
2. For each project marked "delete this":
   - Click the **⋮** (three dots menu)
   - Select **Remove**
   - Confirm deletion
3. Refresh the page
4. Verify you have only 3 projects remaining

**Projects will be moved to Google Drive trash and can be restored within 30 days if needed.**

---

## ✅ Verification Checklist

After manual deletion, verify:

- [ ] Only 3 projects remain in Apps Script
- [ ] "Advanced Cache System" present
- [ ] "GPT Formatter" present
- [ ] "Title Optimizer" present
- [ ] All 3 "delete this" projects removed
- [ ] No duplicates or empty projects

---

## 📁 Backups

**All code is backed up**:

**Local Backup**:
- `/Users/aarontjomsland/er-sim-monitor/backups/all-projects-2025-11-06/`

**Google Drive Backup**:
- https://drive.google.com/drive/folders/13WO4iP-iaNFZH8n1pJlCsRPjfjjqSt-I

**Safe to delete** - all code is recoverable from backups if needed.

---

## 🎓 Key Learnings

**Why This Structure Works**:

1. **Advanced Cache System** - Infrastructure layer (used by other tools)
2. **GPT Formatter** - Historical reference (untouched baseline)
3. **Title Optimizer** - Feature layer (self-contained ATSR)

**Clean separation of concerns**:
- Infrastructure (cache) separate from features (ATSR)
- Reference implementation preserved
- Each project has clear, single purpose

---

## 📝 Next Steps After Cleanup

Once manual deletion is complete:

1. ✅ Verify 3 projects remain
2. ✅ Test each project independently:
   - Advanced Cache System: Run `enrichCacheLayer_('basic')`
   - Title Optimizer: Run `runATSRTitleGenerator()`
3. ✅ Document any shared dependencies
4. ✅ Update MICROSERVICES_ARCHITECTURE_PLAN.md with final state

---

**End of Document**
