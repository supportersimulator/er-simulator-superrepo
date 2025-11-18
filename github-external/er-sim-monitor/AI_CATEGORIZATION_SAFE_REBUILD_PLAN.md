# AI Categorization Tool - Safe Rebuild Plan

**Date**: November 12, 2025
**Priority**: 🔒 **PROTECT ALL OTHER TOOLS** (Primary Directive)
**Status**: Planning Phase - No Code Written Yet

---

## 🎯 Primary Directive

**RULE #1: DO NO HARM**

Before ANY code is written, we must guarantee:
- ✅ Pathways tools remain functional
- ✅ Batch processing continues working
- ✅ ATSR tools unaffected
- ✅ All existing integrations preserved
- ✅ No function collisions
- ✅ No Code.gs modifications (too risky)

---

## 📊 Current Tool Inventory

### Tools That MUST Stay Working

| Tool | File | Status | Dependencies |
|------|------|--------|--------------|
| **Batch Processing** | Code.gs | ✅ Working | Standalone |
| **Pathways Discovery** | Phase2_Pathway_Discovery_UI.gs | ✅ Working | Independent |
| **Pathways Scoring** | Phase2_AI_Scoring_Pathways.gs | ✅ Working | Independent |
| **Visual Panel** | Enhanced_Visual_Panel_With_Toggle.gs | ✅ Working | Independent |
| **ATSR Tools** | Code.gs | ✅ Working | Standalone |

### Tool That's Broken (Safe to Replace)

| Tool | File | Status | Action |
|------|------|--------|--------|
| **AI Categorization** | Phase2_Enhanced_Categories_With_AI.gs | ❌ Broken | **REPLACE** |

### Archived (Safe to Ignore)

| Tool | File | Status | Action |
|------|------|--------|--------|
| **Old Pathways Panel** | Phase2_Enhanced_Categories_Pathways_Panel_ARCHIVE_2025-11-11.gs | 📦 Archived | Leave alone |

---

## 🔍 Dependency Analysis

### What Phase2_Enhanced_Categories_With_AI.gs Uses from Code.gs

**Result**: ✅ **ZERO DEPENDENCIES**

The AI Categorization tool does NOT call any functions from Code.gs. It's self-contained except for:
- Opening the panel (menu item in Code.gs)
- Accessing sheets (standard Apps Script API)

**This means we can safely rebuild it as a standalone file!**

### What Code.gs Uses from Phase2 File

**Result**: ⚠️ **Code.gs has `openCategoriesPathwaysPanel()` that calls the Phase2 panel**

**Current flow**:
```
User clicks menu → Code.gs:openCategoriesPathwaysPanel()
                 → Calls buildCategoriesPathwaysMainMenu_()
                 → Defined in Phase2_Enhanced_Categories_With_AI.gs
```

**Problem**: If we delete/rename Phase2 file, this breaks.

**Solution**: We'll create a NEW menu item and NEW function, leave old one intact until we're ready to switch.

---

## 🛡️ Safety Strategy: Parallel Development

### Phase 1: Build New Tool (No Risk)

**Action**: Create **NEW** file alongside existing broken one

```
Phase2_AI_Categorization_V2.gs  (NEW - clean build)
Phase2_Enhanced_Categories_With_AI.gs  (OLD - leave as-is)
```

**Safety**:
- ✅ Old file still exists (nothing breaks)
- ✅ New file is independent (no collisions)
- ✅ Can test new file without affecting production

### Phase 2: Create New Menu Item (No Risk)

**Action**: Add NEW menu item (don't modify existing one)

```javascript
// In Code.gs - ADD this (don't modify openCategoriesPathwaysPanel)

function openAICategorizationV2() {
  const ui = SpreadsheetApp.getUi();
  const html = buildAICategorizationPanel_V2(); // From new file
  ui.showSidebar(HtmlService.createHtmlOutput(html)
    .setTitle('🤖 AI Categorization (New)')
    .setWidth(400));
}
```

**Menu structure**:
```
Extensions
├── Categories & Pathways (OLD - still works)
└── AI Categorization Tool (NEW - testing)
```

**Safety**:
- ✅ Both tools available
- ✅ Old tool still works
- ✅ Can test new tool side-by-side
- ✅ Easy rollback (just delete new menu item)

### Phase 3: Test Thoroughly (No Risk)

**Action**: Test new tool extensively

- ✅ Open panel - no errors
- ✅ Run categorization - works
- ✅ Review results - accurate
- ✅ Apply to Master - successful
- ✅ Other tools still work (verify)

**Safety**: Old tool remains available as backup

### Phase 4: Cutover (Controlled Risk)

**Action**: Once new tool is proven, switch menu item

```javascript
// Rename old function (preserve it)
function openCategoriesPathwaysPanel_OLD() { ... }

// Point main menu to new tool
function openCategoriesPathwaysPanel() {
  return openAICategorizationV2(); // Call new version
}
```

**Safety**:
- ✅ Old code still exists (can rollback instantly)
- ✅ Gradual transition
- ✅ Can switch back if issues found

### Phase 5: Cleanup (Post-Verification)

**Action**: After 1 week of successful use, remove old files

```
DELETE: Phase2_Enhanced_Categories_With_AI.gs
DELETE: openCategoriesPathwaysPanel_OLD()
```

**Safety**: Only delete after proven stability

---

## 📋 Safe Rebuild Checklist

### Pre-Build (MUST complete before writing code)

- [ ] ✅ Backup entire project to Google Drive
- [ ] ✅ Document all working tools
- [ ] ✅ Verify no dependencies on Code.gs
- [ ] ✅ Create rollback plan
- [ ] ✅ Get user approval on design decisions

### Build Phase (New file only)

- [ ] Create Phase2_AI_Categorization_V2.gs
- [ ] Build server-side functions (no UI yet)
- [ ] Test functions independently
- [ ] Build simple UI (minimal HTML)
- [ ] Test UI independently
- [ ] Add features incrementally

### Integration Phase (Parallel testing)

- [ ] Add new menu item (don't touch old one)
- [ ] Test new tool end-to-end
- [ ] Verify old tools still work
- [ ] Test with real data (small batch)
- [ ] Compare results with morning's working version

### Verification Phase (Safety checks)

- [ ] ✅ Pathways tools still work
- [ ] ✅ Batch processing still works
- [ ] ✅ ATSR tools still work
- [ ] ✅ No console errors
- [ ] ✅ No function collisions
- [ ] ✅ New tool performs as expected

### Cutover Phase (Controlled switch)

- [ ] Get user approval
- [ ] Switch menu item to new tool
- [ ] Keep old code accessible
- [ ] Monitor for issues (1 day)
- [ ] Verify stability (1 week)

### Cleanup Phase (Final removal)

- [ ] User confirms new tool is stable
- [ ] Delete old Phase2 file
- [ ] Remove old menu function
- [ ] Update documentation
- [ ] Create final backup

---

## 🚫 What We Will NOT Do

**These actions are FORBIDDEN** (too risky):

❌ Modify Code.gs (except adding ONE new menu function)
❌ Delete anything before testing
❌ Modify pathways files
❌ Modify batch processing code
❌ Touch ATSR tools
❌ Modify shared functions in Code.gs
❌ Make breaking changes
❌ Rush the process

---

## 🎯 Design Decisions (Still Needed)

Before building, we need your input on:

### 1. **Scope & Use Case**
- **Question**: Is this a one-time mass categorization or ongoing tool?
- **Why it matters**: Affects UI complexity and features needed

### 2. **Modes**
- **Question**: Build "All Cases" mode only first, add "Specific Rows" later?
- **Why it matters**: Simplifies initial build, reduces risk

### 3. **Review Flow**
- **Question**: Keep current flow (separate results sheet) or change?
- **Why it matters**: Affects UI design and data flow

### 4. **Special Rules (ACLS, etc.)**
- **Question**: Are there other protocols like ACLS that need protection?
- **Why it matters**: Affects categorization logic

### 5. **Function Naming**
- **Option A**: `aiCategorizationV2_runAll()`
- **Option B**: `runAICategorizationStandalone()`
- **Option C**: `AICAT.run()`
- **Why it matters**: Prevents collisions with old code

---

## 💡 Recommended Minimal Viable Product (MVP)

**Goal**: Get working tool as fast as possible with zero risk

### MVP Features (Phase 1)

1. **Panel Opens** - Extensions → AI Categorization Tool (New)
2. **One Button** - "Run AI Categorization (All 207 Cases)"
3. **Processing** - Shows simple progress "Processing 23/207..."
4. **Results** - Writes to AI_Categorization_Results sheet
5. **Review** - Manual review in sheet (like this morning)
6. **Apply** - "Apply to Master" button
7. **Done** - That's it!

**What's NOT in MVP**:
- ❌ No Specific Rows mode (add later)
- ❌ No live logs (add later)
- ❌ No fancy filtering (add later)
- ❌ No inline editing (add later)

**Why MVP approach**:
- ✅ Simple = less to break
- ✅ Fast to build
- ✅ Easy to test
- ✅ Proven pattern (worked this morning)
- ✅ Can add features incrementally

### Add Later (Phase 2+)

Once MVP is stable:
- Specific Rows mode
- Live logs
- Advanced filtering
- Retry logic enhancements
- Mapping editor

---

## 🎨 Proposed Clean Architecture

### File Structure

```
Phase2_AI_Categorization_V2.gs
├── Server-side functions
│   ├── runAICategorization_V2(mode, specificInput)
│   ├── getCategorizationResults_V2()
│   ├── applyCategorization_V2()
│   └── clearResults_V2()
└── Panel HTML
    └── buildAICategorizationPanel_V2()
```

**Single file, all self-contained, zero dependencies**

### Code.gs Changes (Minimal)

```javascript
// ADD this function (only change to Code.gs)
function openAICategorizationV2() {
  const ui = SpreadsheetApp.getUi();
  const html = buildAICategorizationPanel_V2();
  ui.showSidebar(HtmlService.createHtmlOutput(html)
    .setTitle('🤖 AI Categorization')
    .setWidth(400));
}

// Register in menu (existing onOpen function)
function onOpen() {
  // ... existing menu items ...
  submenu.addItem('AI Categorization Tool', 'openAICategorizationV2'); // ADD
}
```

**That's the ONLY modification to Code.gs** - adding one menu item

---

## ✅ Safety Guarantees

If we follow this plan:

✅ **Pathways tools unaffected** (separate files, no modifications)
✅ **Batch processing unaffected** (Code.gs minimally modified)
✅ **ATSR tools unaffected** (no shared functions touched)
✅ **Easy rollback** (just delete new menu item + new file)
✅ **Parallel testing** (both old and new available)
✅ **Incremental validation** (test each step)
✅ **Zero breaking changes** (old code remains intact)

---

## 🚀 Next Steps

**Before proceeding**, we need your confirmation on:

1. ✅ **Approve this safety strategy?**
   - Build new file alongside old one?
   - Test in parallel?
   - Gradual cutover?

2. ✅ **Approve MVP feature set?**
   - Just "All Cases" mode initially?
   - Simple progress indicator?
   - Manual review in sheet?

3. ✅ **Answer design questions?**
   - One-time or ongoing tool?
   - Keep current review flow?
   - Other special protocols besides ACLS?

**Once you confirm, I'll:**
1. Create comprehensive backup
2. Build Phase2_AI_Categorization_V2.gs (clean, standalone)
3. Test thoroughly
4. Deploy safely with zero risk to other tools

**What do you think? Should we proceed with this safety-first approach?**

---

**Document Created**: November 12, 2025
**Purpose**: Safety planning before any code changes
**Status**: Awaiting user approval to proceed

