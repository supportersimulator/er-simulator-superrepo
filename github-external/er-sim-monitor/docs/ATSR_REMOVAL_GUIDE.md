# ATSR REMOVAL GUIDE
## How to Clean "ER Sim - ATSR Tool (Standalone)" into "Batch Processing & Quality Engine"

**Date**: November 6, 2025
**Goal**: Remove ATSR-specific code while keeping batch processing, quality scoring, and settings

---

## 🎯 Strategy

The mega-file contains BOTH:
- ✅ **KEEP**: Batch processing + Quality engine + Settings
- ❌ **REMOVE**: ATSR title generation (we have better version in "Title Optimizer")

---

## 📋 Functions to DELETE

Search for and delete these functions in "ER Sim - ATSR Tool (Standalone)":

### 1. ATSR Title Generation Functions (DELETE THESE):
```
function runATSRTitleGenerator()
function parseATSRResponse_()
function buildATSRUltimateUI_()
function generateMysteriousSparkTitles()
function saveATSRData()
function applyATSRSelectionsWithDefiningAndMemory()
```

### 2. Pathways/Categories Functions (DELETE THESE TOO):
```
function runPathwayChainBuilder()
function showFieldSelector()
function getRecommendedFields_()
function preCacheRichData()
function analyzeCatalogWithMultiLayerCache_()
```

**Reason**: You have "Advanced Cache System" project with the updated Pathways code. The version in this mega-file is likely outdated.

### How to Find and Delete:
1. Open "ER Sim - ATSR Tool (Standalone)" in Apps Script editor
2. Use Ctrl+F (or Cmd+F) to search for each function name above
3. Select the ENTIRE function (from `function` keyword to closing `}`)
4. Delete it
5. Repeat for all ~11 functions above (6 ATSR + 5 Pathways)

---

## ✅ Functions to KEEP (Don't Delete!)

### Batch Processing Functions:
- `startBatchFromSidebar()` ✅
- `runSingleStepBatch()` ✅
- `finishBatchAndReport()` ✅
- `getNext25InputRows_()` ✅
- `getAllInputRows_()` ✅
- `getSpecificInputRows_()` ✅
- `parseRowSpec()` ✅

### Quality Engine Functions:
- `runQualityAudit_AllOrRows()` ✅
- `evaluateSimulationQuality()` ✅
- `attachQualityToRow_()` ✅
- `ensureQualityColumns_()` ✅
- `cleanUpLowValueRows()` ✅

### Core Utilities (KEEP):
- `callOpenAI()` ✅
- `readApiKey_()` ✅
- `tryParseJSON()` ✅
- `validateVitalsFields_()` ✅
- `estimateTokens()` ✅
- `estimateCostUSD()` ✅
- `hashText()` ✅
- `cleanDuplicateLines()` ✅

### Settings & UI (KEEP):
- `openSimSidebar()` ✅
- `saveSidebarBasics()` ✅
- `setOutputSheet()` ✅
- `openImageSyncDefaults()` ✅
- `openSettingsPanel()` ✅
- `checkApiStatus()` ✅

---

## 🔍 How to Verify You Deleted the Right Code

After deletion, search the file for "ATSR":
- ✅ **GOOD**: Only found in comments or variable names (minimal mentions)
- ❌ **BAD**: Still found in function names → you missed some functions

---

## 🏷️ After Cleanup: Rename the Project

1. Click the project name at the top of Apps Script editor
2. Change from: "ER Sim - ATSR Tool (Standalone)"
3. Change to: **"Batch Processing & Quality Engine"**
4. Save

---

## ✅ Final Structure

After cleanup, you should have **3 active projects**:

### 1. **Batch Processing & Quality Engine** (cleaned mega-file)
**Contains**:
- ✅ Batch Engine (Run All / 25 / Specific rows)
- ✅ Quality Scoring & Audit
- ✅ Settings Management
- ✅ Image Sync Defaults
- ✅ Dark UI Sidebar
- ❌ NO ATSR code (removed)
- ❌ NO Pathways code (removed - use "Advanced Cache System" instead)

### 2. **Title Optimizer** (keep as-is)
**Contains**:
- ✅ Complete ATSR Title Generator
- ✅ Spark/Reveal title generation
- ✅ Mystery regeneration
- ✅ Memory Anchor tracking

### 3. **Advanced Cache System** (keep as-is)
**Contains**:
- ✅ Pathways & Categories Panel
- ✅ Multi-Step Cache Enrichment
- ✅ Pre-Cache functionality
- ✅ Field Selector with AI recommendations

### 4. **GPT Formatter** (keep as historical reference)
**Contains**:
- ✅ Original monolithic baseline

---

## 🗑️ Projects to Delete Manually

After cleanup, delete these via Apps Script UI:
1. ❌ "Advanced Cache System" (if still present)
2. ❌ All 3 extra "GPT Formatter" copies (Nov 3, Nov 2, Oct 17)

**How**:
1. Go to https://script.google.com/home
2. Click **⋮** menu next to project name
3. Select **Remove**
4. Confirm

---

## ⚠️ Safety Notes

- ✅ All code is backed up in `/Users/aarontjomsland/er-sim-monitor/backups/`
- ✅ Deleted projects stay in Google Drive trash for 30 days
- ✅ You can restore anything if you make a mistake

---

## 🎓 Why This Approach?

**Problem**: The mega-file has BOTH batch processing AND ATSR code mixed together

**Solution**:
- **Remove** ATSR code (we have better version in "Title Optimizer")
- **Keep** batch/quality/settings code (unique to this file)

**Result**:
- Clean separation of concerns
- "Title Optimizer" = pure ATSR
- "Batch & Quality" = pure infrastructure
- No duplicate/conflicting code

---

**End of Guide**
