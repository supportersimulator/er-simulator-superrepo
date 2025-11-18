# 📦 PHASE 2 DEPLOYMENT GUIDE
## Integrating AI Pathway Discovery into Production

**Date**: 2025-11-08
**Version**: 1.0
**Deployment Time**: ~15 minutes

---

## 🎯 WHAT YOU'RE DEPLOYING

**3 New Apps Script Files** to add AI-powered pathway discovery:

1. **Phase2_AI_Scoring_Pathways.gs** - Scoring engine (3-factor + sequence rationale)
2. **Phase2_Pathway_Discovery_UI.gs** - Logic type management + discovery execution
3. **Phase2_Enhanced_Categories_Pathways_Panel.gs** - Enhanced panel with AI Discovery tab

**Features Added**:
- ✅ AI pathway discovery using 7 intelligence-type logic types
- ✅ 3-factor scoring (Educational 50% + Novelty 25% + Market 25%)
- ✅ Tier classification (S/A/B/C/D)
- ✅ AI persuasion narratives
- ✅ Sequence rationale explaining WHY each case is positioned where it is
- ✅ Usage-frequency sorted logic type dropdown
- ✅ Clean tabbed interface in existing Categories & Pathways panel

---

## 📋 PRE-DEPLOYMENT CHECKLIST

**Before deploying, verify**:
- [ ] ✅ Logic_Type_Library sheet exists (created in Phase 1)
- [ ] ✅ Pathways_Master sheet exists (created in Phase 1)
- [ ] ✅ Field_Cache_Incremental sheet has data (207 cached rows)
- [ ] ✅ OpenAI API key is in Settings!B2 cell (starts with `sk-proj-` or `sk-`)
- [ ] ✅ Current production file backed up

**Backup Command**:
```bash
cp /path/to/production/Code.gs /path/to/backups/production-before-phase2-$(date +%Y-%m-%d).gs
```

---

## 🚀 DEPLOYMENT STEPS

### **Step 1: Open Apps Script Editor**

1. Open your Google Sheet
2. Click **Extensions → Apps Script**
3. You'll see your existing monolithic `Code.gs` file

---

### **Step 2: Add New Files**

**Add File 1: Phase2_AI_Scoring_Pathways.gs**

1. Click the **+** next to Files
2. Choose **Script**
3. Name it: `Phase2_AI_Scoring_Pathways`
4. Copy contents from:
   `/Users/aarontjomsland/er-sim-monitor/apps-script-deployable/Phase2_AI_Scoring_Pathways.gs`
5. Paste into editor
6. Click **Save** (Ctrl+S)

**Add File 2: Phase2_Pathway_Discovery_UI.gs**

1. Click the **+** next to Files
2. Choose **Script**
3. Name it: `Phase2_Pathway_Discovery_UI`
4. Copy contents from:
   `/Users/aarontjomsland/er-sim-monitor/apps-script-deployable/Phase2_Pathway_Discovery_UI.gs`
5. Paste into editor
6. Click **Save** (Ctrl+S)

**Add File 3: Phase2_Enhanced_Categories_Pathways_Panel.gs**

1. Click the **+** next to Files
2. Choose **Script**
3. Name it: `Phase2_Enhanced_Categories_Pathways_Panel`
4. Copy contents from:
   `/Users/aarontjomsland/er-sim-monitor/apps-script-deployable/Phase2_Enhanced_Categories_Pathways_Panel.gs`
5. Paste into editor
6. Click **Save** (Ctrl+S)

---

### **Step 3: Update Existing Code.gs**

**IMPORTANT**: The new `Phase2_Enhanced_Categories_Pathways_Panel.gs` file REPLACES two functions in your existing Code.gs:

1. `openCategoriesPathwaysPanel()`
2. `buildCategoriesPathwaysMainMenu_()`

**Action Required**:

**Option A: Comment Out Old Functions** (Recommended)
```javascript
// ========== REPLACED BY Phase2_Enhanced_Categories_Pathways_Panel.gs ==========
/*
function openCategoriesPathwaysPanel() {
  const ui = getSafeUi_();
  if (!ui) return;
  const html = buildCategoriesPathwaysMainMenu_();
  ui.showSidebar(HtmlService.createHtmlOutput(html).setTitle('📂 Categories & Pathways').setWidth(320));
}

function buildCategoriesPathwaysMainMenu_() {
  // ... old code ...
}
*/
```

**Option B: Delete Old Functions**
- Find both functions in Code.gs (around line 4041-4354)
- Delete them entirely
- The new file will provide these functions

**Why This Works**:
- Apps Script merges all `.gs` files into one namespace
- New functions automatically replace old ones
- No other code changes needed

---

### **Step 4: Test Phase 2 Functions**

**Test 1: Logic Type Dropdown**

1. Open Apps Script **Execution log**
2. Select function: `getLogicTypesForDropdown`
3. Click **Run**
4. ✅ Expected: Returns 7 logic types sorted by usage (all 0 initially)

**Test 2: Scoring Engine**

1. Select function: `testScoringEngine`
2. Click **Run**
3. ✅ Expected: Logs scoring result for "Diagnostic Traps Collection" pathway
4. Check execution log for:
   - Educational Value: X/10
   - Novelty: X/10
   - Market Validation: X/10
   - Composite Score: X/10 (Tier)

**Test 3: Sequence Rationale**

1. Select function: `testSequenceRationale`
2. Click **Run**
3. ✅ Expected: Logs complete case-by-case rationale with position explanations

**Test 4: Enhanced Panel UI**

1. Refresh your Google Sheet (F5)
2. Click **📂 Categories & Pathways** menu item
3. ✅ Expected: Sidebar opens with 2 tabs:
   - **📊 Catalog** (existing view)
   - **🔍 AI Discovery** (new view)
4. Click **AI Discovery** tab
5. ✅ Expected: Logic type dropdown populated, Discover button disabled until selection

---

## ✅ VERIFICATION CHECKLIST

**After deployment, verify ALL**:

- [ ] ✅ Categories & Pathways panel opens without errors
- [ ] ✅ Both tabs (Catalog, AI Discovery) visible
- [ ] ✅ Catalog tab shows existing categories/pathways (unchanged)
- [ ] ✅ AI Discovery tab shows logic type dropdown
- [ ] ✅ Logic types sorted by usage frequency (most used first)
- [ ] ✅ Discover button enables when logic type selected
- [ ] ✅ Test functions run without errors
- [ ] ✅ OpenAI API calls work (check execution log for responses)

---

## 🧪 END-TO-END DISCOVERY TEST

**Test Complete Workflow**:

1. Open **Categories & Pathways** panel
2. Switch to **🔍 AI Discovery** tab
3. Select logic type: **"Cognitive Bias Exposure"**
4. Click **🤖 Discover Pathways**
5. Wait ~30-60 seconds (AI processing)
6. ✅ Expected Results:
   - Toast notification: "✅ Discovery complete! X pathways saved"
   - Results display in panel with:
     - Pathway names
     - Tier badges (S/A/B/C/D)
     - Descriptions
     - Persuasion narratives
     - Scores and case counts
7. Open **Pathways_Master** sheet
8. ✅ Expected: New rows added with discovered pathways
9. Check columns populated:
   - Pathway_ID, Pathway_Name, Description
   - Logic_Type, Case_IDs, Case_Sequence
   - Composite_Score, Tier
   - Educational_Score, Novelty_Score, Market_Score
   - Persuasion_Narrative, Sequence_Rationale
   - Date_Discovered, Status (pending)

---

## 🐛 TROUBLESHOOTING

### **Error: "Logic_Type_Library sheet not found"**

**Solution**:
```bash
node scripts/createPathwaysSheets.cjs
node scripts/populate7LogicTypes.cjs
```

### **Error: "Field_Cache_Incremental sheet not found"**

**Solution**: Run batch cache first (Phase 1 step)
```
Open Field Selector → Cache 207 rows (all batches)
```

### **Error: "Invalid OpenAI API key"**

**Solution**:
1. Check Settings!B2 cell
2. Ensure key starts with `sk-proj-` or `sk-`
3. Test key at https://platform.openai.com/api-keys

### **Error: "Function not found: discoverPathwaysWithLogicType"**

**Solution**: Files not deployed correctly
1. Verify all 3 `.gs` files added to project
2. Click **Save All** (Ctrl+S)
3. Refresh browser
4. Try again

### **Discovery Takes Too Long / Times Out**

**Cause**: OpenAI API calls + large case catalog

**Solutions**:
- Reduce case count in Field_Cache_Incremental (test with 50 cases first)
- Increase Apps Script timeout (max 6 minutes for custom functions)
- Run discovery outside Apps Script (use Node.js scripts instead)

---

## 📊 MONITORING & USAGE

### **Track Discovery Activity**

**Check Logic Type Usage**:
- Open **Logic_Type_Library** sheet
- Column H: `Times_Used` (increments each discovery)
- Most used logic types appear first in dropdown

**Check Discovered Pathways**:
- Open **Pathways_Master** sheet
- Sort by `Composite_Score` (descending) to see best pathways
- Filter by `Logic_Type` to see pathways from specific discovery lens
- Check `Status` column:
  - `pending` - Discovered, not yet applied
  - `active` - Applied to cases
  - `archived` - Saved for reference

### **View Sequence Rationale**

**Column P: Sequence_Rationale** (JSON format)

Example:
```json
{
  "overall_sequence_philosophy": "Progressive complexity from typical to atypical presentations",
  "case_rationales": [
    {
      "position": 1,
      "case_id": "CP101",
      "position_rationale": "Establishes baseline typical chest pain pattern",
      "prerequisites": "None - this is the foundation",
      "progression_logic": "Introduces concept of differential diagnosis",
      "prepares_for": "Sets up expectation that classic presentations can be misleading"
    }
  ]
}
```

**To view formatted**:
1. Copy JSON from cell
2. Paste into https://jsonformatter.org/
3. Read case-by-case rationale

---

## 🎓 NEXT STEPS (PHASE 3+)

**After successful deployment**:

1. **Phase 3: Manual Sequence Adjustment** - Build UI for reordering cases in pathways
2. **Phase 4: Pathway Naming** - AI suggests 10 compelling names (Spark/Reveal style)
3. **Phase 5: Case ID Application** - Apply pathway sequences and rename Case IDs
4. **Phase 6: Pathway Activation** - Mark pathways as active and assign to cases
5. **Phase 7: Custom Logic Types** - UI for creating new discovery lenses

---

## 📚 REFERENCE FILES

**Core Documentation**:
- `PATHWAYS_FINAL_SPEC.md` - Complete system specification
- `CASE_ID_ACCRONYM_SYSTEM.md` - Case ID naming conventions
- `LOGIC_TYPE_DROPDOWN_SPEC.md` - Dropdown sorting logic
- `PATHWAY_PROMPT_LIBRARY.md` - 7 intelligence-type prompts

**Apps Script Files**:
- `Phase2_AI_Scoring_Pathways.gs` - Scoring + rationale engine
- `Phase2_Pathway_Discovery_UI.gs` - Discovery execution + logic type management
- `Phase2_Enhanced_Categories_Pathways_Panel.gs` - Enhanced panel with tabs

**Test Scripts** (Node.js):
- `scripts/phase2_scoring_engine.cjs` - Standalone scoring test
- `scripts/phase2_sequence_rationale.cjs` - Standalone rationale test
- `scripts/phase2_scoring_prompts.cjs` - All AI prompts

**Test Data**:
- `data/test_pathway_scoring.json` - Example scoring output
- `data/test_sequence_rationale.json` - Example rationale output

---

## ✅ DEPLOYMENT COMPLETE

**When all checks pass**:
- [ ] ✅ All 3 files deployed to Apps Script
- [ ] ✅ Old functions commented out or deleted
- [ ] ✅ Panel opens with 2 tabs
- [ ] ✅ Discovery test completes successfully
- [ ] ✅ Pathways saved to Pathways_Master sheet
- [ ] ✅ Logic type usage incremented
- [ ] ✅ Ready for Phase 3

**Phase 2 Status**: 🎉 **PRODUCTION READY**

---

_Generated by Atlas (Claude Code) - 2025-11-08_
_Integration Time: 15 minutes | Testing Time: 10 minutes | Total: 25 minutes_
