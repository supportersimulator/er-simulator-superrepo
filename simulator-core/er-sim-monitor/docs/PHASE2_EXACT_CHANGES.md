# 🎯 PHASE 2: EXACT CHANGES GUIDE
## What Code Changes and Where

**Last Updated**: 2025-11-08
**Deployment Time**: 10-15 minutes
**Risk Level**: LOW (backward compatible, reversible)

---

## 📋 SUMMARY OF CHANGES

### **What Changes:**
1. **Add 3 new files** to Apps Script project (no existing code modified)
2. **Comment out 2 functions** in existing Code.gs (preserve, don't delete)
3. **All other code** remains 100% untouched

### **Safety:**
- ✅ Backup Code.gs before making changes
- ✅ Can undo by uncommenting the 2 functions
- ✅ New files are independent (safe to test/remove)
- ✅ No data loss, no breaking changes

---

## 🔍 STEP-BY-STEP EXACT CHANGES

### **STEP 1: Backup Current Code** (2 minutes)

Before making ANY changes:

1. Open **Extensions → Apps Script**
2. Find **Code.gs** file
3. **Select All** (Cmd+A)
4. **Copy** (Cmd+C)
5. Paste into text file: `Code_backup_before_phase2_2025-11-08.gs`
6. Save to Desktop or Google Drive

---

### **STEP 2: Find Code to Comment Out** (3 minutes)

In your Apps Script **Code.gs** file:

**Search for this function** (Cmd+F):
```javascript
function openCategoriesPathwaysPanel()
```

**You'll find code that looks like this** (around line 4041):
```javascript
function openCategoriesPathwaysPanel() {
  const ui = getSafeUi_();
  if (!ui) return;

  const html = buildCategoriesPathwaysMainMenu_();
  ui.showSidebar(HtmlService.createHtmlOutput(html).setTitle('📂 Categories & Pathways').setWidth(320));
}
```

**And further down** (around line 4051):
```javascript
function buildCategoriesPathwaysMainMenu_() {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1]; // Row 2

  // ... ~300 lines of HTML building code ...
  // Ends with return statement containing HTML
}
```

---

### **STEP 3: Comment Out These Functions** (2 minutes)

**IMPORTANT**: Do NOT delete! Just comment out.

**Add this comment BEFORE the functions:**
```javascript
// ========== REPLACED BY Phase2_Enhanced_Categories_Pathways_Panel.gs ==========
// These functions are now provided by the new file with enhanced tabbed UI
// To rollback: uncomment these functions and delete Phase2_Enhanced_Categories_Pathways_Panel.gs
/*
```

**Then add closing comment AFTER both functions:**
```javascript
*/
```

**FINAL RESULT should look like:**
```javascript
// ========== REPLACED BY Phase2_Enhanced_Categories_Pathways_Panel.gs ==========
// These functions are now provided by the new file with enhanced tabbed UI
// To rollback: uncomment these functions and delete Phase2_Enhanced_Categories_Pathways_Panel.gs
/*
function openCategoriesPathwaysPanel() {
  const ui = getSafeUi_();
  if (!ui) return;

  const html = buildCategoriesPathwaysMainMenu_();
  ui.showSidebar(HtmlService.createHtmlOutput(html).setTitle('📂 Categories & Pathways').setWidth(320));
}

// ========== MAIN MENU ==========

function buildCategoriesPathwaysMainMenu_() {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1]; // Row 2

  // Get column indices
  const categoryIdx = headers.indexOf('Case_Organization:Category');
  const pathwayIdx = headers.indexOf('Case_Organization:Pathway_Name');
  const sparkIdx = headers.indexOf('Case_Organization:Spark_Title');

  // Count categories and pathways
  const categoryCounts = {};
  const pathwayCounts = {};

  for (let i = 2; i < data.length; i++) {
    const category = data[i][categoryIdx] || 'Uncategorized';
    const pathway = data[i][pathwayIdx] || 'Unassigned';

    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    pathwayCounts[pathway] = (pathwayCounts[pathway] || 0) + 1;
  }

  const totalCases = data.length - 2;

  // Build category list
  const categoryList = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => `
      <div class="list-item" onclick="viewCategory('${cat.replace(/'/g, "\\'")}')">
        <span class="item-label">${cat}</span>
        <span class="item-count">${count}</span>
      </div>
    `).join('');

  // ... continues for ~300 more lines ...
  // ... ends with closing brace and return statement ...
}
*/
```

**⚠️ CRITICAL**: Make sure you capture BOTH functions inside the `/* */` comment block!

**Click Save** (Cmd+S)

---

### **STEP 4: Add 3 New Files** (5 minutes)

Now add the 3 new Phase 2 files:

**File 1: Phase2_AI_Scoring_Pathways**

1. In Apps Script editor, click **+** next to Files
2. Select **Script**
3. Name it: `Phase2_AI_Scoring_Pathways`
4. Open this file on your computer:
   ```
   /Users/aarontjomsland/er-sim-monitor/apps-script-deployable/Phase2_AI_Scoring_Pathways.gs
   ```
5. Copy ENTIRE contents (Cmd+A, Cmd+C)
6. Paste into Apps Script editor (Cmd+V)
7. Click **Save** (Cmd+S)

**File 2: Phase2_Pathway_Discovery_UI**

1. Click **+** → **Script**
2. Name it: `Phase2_Pathway_Discovery_UI`
3. Open this file:
   ```
   /Users/aarontjomsland/er-sim-monitor/apps-script-deployable/Phase2_Pathway_Discovery_UI.gs
   ```
4. Copy ENTIRE contents
5. Paste into Apps Script editor
6. Click **Save** (Cmd+S)

**File 3: Phase2_Enhanced_Categories_Pathways_Panel**

1. Click **+** → **Script**
2. Name it: `Phase2_Enhanced_Categories_Pathways_Panel`
3. Open this file:
   ```
   /Users/aarontjomsland/er-sim-monitor/apps-script-deployable/Phase2_Enhanced_Categories_Pathways_Panel.gs
   ```
4. Copy ENTIRE contents
5. Paste into Apps Script editor
6. Click **Save** (Cmd+S)

**You should now see 4 files total in left sidebar:**
- Code.gs (existing - modified)
- Phase2_AI_Scoring_Pathways.gs (new)
- Phase2_Pathway_Discovery_UI.gs (new)
- Phase2_Enhanced_Categories_Pathways_Panel.gs (new)

---

### **STEP 5: Test Deployment** (3 minutes)

**Test 1: Check for Syntax Errors**

1. In Apps Script editor, select function dropdown
2. Choose any function (e.g., `getLogicTypesForDropdown`)
3. Click **Run** ▶️
4. ✅ Expected: No red error messages
5. ⚠️ If errors: Check you copied all 3 files completely

**Test 2: Test Panel UI**

1. Refresh your Google Sheet (F5)
2. Click menu: **📂 Categories & Pathways**
3. ✅ Expected: Sidebar opens with 2 tabs at top
   - **📊 Categories** (left tab)
   - **🔍 AI Discovery** (right tab)
4. Click **Categories** tab
5. ✅ Expected: See existing categories and pathways (unchanged)
6. Click **AI Discovery** tab
7. ✅ Expected: See logic type dropdown with 7 options

**Test 3: Test Logic Type Dropdown**

1. In AI Discovery tab, click dropdown
2. ✅ Expected options (in this order):
   - Cognitive Bias Exposure (0 uses)
   - Interpersonal Intelligence (0 uses)
   - Logical-Mathematical Intelligence (0 uses)
   - Multi-Intelligence Hybrid (0 uses)
   - The Contrarian Collection (0 uses)
   - The Great Mimickers (0 uses)
   - Visual-Spatial Intelligence (0 uses)
   - ──────────────────
   - 🎨 Create New Logic Type...

---

## ✅ VERIFICATION CHECKLIST

After deployment, verify ALL these:

- [ ] ✅ Apps Script editor shows 4 files (Code + 3 Phase2 files)
- [ ] ✅ Code.gs has commented-out section (lines 4041-4354 approximately)
- [ ] ✅ No syntax errors when running test function
- [ ] ✅ Categories & Pathways panel opens
- [ ] ✅ Panel shows 2 tabs (Categories, AI Discovery)
- [ ] ✅ Categories tab shows existing content (unchanged)
- [ ] ✅ AI Discovery tab shows logic type dropdown
- [ ] ✅ Dropdown has 7 logic types + "Create New" option
- [ ] ✅ Discover button is disabled until logic type selected
- [ ] ✅ All existing functionality still works

---

## 🔄 ROLLBACK (If Needed)

**If anything goes wrong:**

### **Option A: Quick Rollback (30 seconds)**

1. Open **Code.gs**
2. Find the commented-out section (starts with `/*`)
3. Delete the opening `/*` and closing `*/`
4. Click **Save** (Cmd+S)
5. Delete the 3 Phase2 files:
   - Right-click → Remove each file
6. Refresh Google Sheet

**Your original panel is restored!**

### **Option B: Full Restore from Backup**

1. Open your backup file: `Code_backup_before_phase2_2025-11-08.gs`
2. Copy all contents
3. In Apps Script, select all in Code.gs (Cmd+A)
4. Paste backup (Cmd+V)
5. Click Save
6. Delete the 3 Phase2 files
7. Refresh Google Sheet

---

## 📊 WHAT CHANGED - VISUAL SUMMARY

### **Before Phase 2:**
```
Apps Script Project
├── Code.gs (10,508 lines)
│   ├── openCategoriesPathwaysPanel() ← Active
│   └── buildCategoriesPathwaysMainMenu_() ← Active
└── (other files...)

Panel UI:
┌─────────────────────────┐
│ 📂 Categories & Pathways│
├─────────────────────────┤
│ Quick Actions           │
│ Categories List         │
│ Pathways List           │
└─────────────────────────┘
```

### **After Phase 2:**
```
Apps Script Project
├── Code.gs (10,508 lines)
│   ├── /* openCategoriesPathwaysPanel() */ ← Commented out
│   └── /* buildCategoriesPathwaysMainMenu_() */ ← Commented out
├── Phase2_AI_Scoring_Pathways.gs (NEW)
│   ├── scorePathway()
│   ├── generateSequenceRationale()
│   └── (all scoring functions)
├── Phase2_Pathway_Discovery_UI.gs (NEW)
│   ├── getLogicTypesForDropdown()
│   ├── discoverPathwaysWithLogicType()
│   └── (all discovery functions)
└── Phase2_Enhanced_Categories_Pathways_Panel.gs (NEW)
    ├── openCategoriesPathwaysPanel() ← NEW version with tabs
    └── buildCategoriesPathwaysMainMenu_() ← NEW version with tabs

Panel UI:
┌─────────────────────────────┐
│ [📊 Categories][🔍 Discovery]│ ← NEW TABS
├─────────────────────────────┤
│ Categories Tab:             │
│ - Quick Actions             │
│ - Categories List           │
│ - Pathways List             │
│                             │
│ AI Discovery Tab:           │
│ - Logic Type Dropdown       │
│ - Discover Button           │
│ - Results Display           │
└─────────────────────────────┘
```

---

## 🎉 SUCCESS!

**When all checks pass**, you've successfully deployed Phase 2!

**New capabilities unlocked:**
- ✅ AI-powered pathway discovery
- ✅ 3-factor scoring system
- ✅ Tier-based rankings (S/A/B/C/D)
- ✅ AI persuasion narratives
- ✅ Sequence rationale (why each case is positioned)
- ✅ 7 intelligence-type logic types
- ✅ Usage-frequency sorted dropdown

**Next**: Run your first pathway discovery and explore the results!

---

## 📞 HELP & TROUBLESHOOTING

**Problem: Panel shows old view (no tabs)**
- Hard refresh browser (Cmd+Shift+R)
- Close and reopen sidebar
- Check Phase2_Enhanced file saved correctly

**Problem: "Function not found" error**
- Verify all 3 Phase2 files added
- Click "Save All" in Apps Script
- Refresh browser

**Problem: Dropdown is empty**
- Check Logic_Type_Library sheet exists
- Run: `node scripts/populate7LogicTypes.cjs`
- Refresh sheet

**Problem: Discovery fails**
- Check Settings!B2 has valid OpenAI API key
- Check Field_Cache_Incremental has data
- Check execution log for detailed error

---

_Manual deployment is the safest method - you have full control and can rollback instantly!_
