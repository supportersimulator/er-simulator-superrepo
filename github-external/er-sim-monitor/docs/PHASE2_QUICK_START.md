# ⚡ PHASE 2 QUICK START
## Deploy AI Pathway Discovery in 15 Minutes

**Last Updated**: 2025-11-08

---

## 🎯 WHAT YOU GET

**New Capability**: AI-powered pathway discovery with 3-factor scoring

**UI**: New tab in existing Categories & Pathways panel

**Files to Deploy**: 3 Apps Script files (copy/paste ready)

---

## ⚡ 5-MINUTE DEPLOYMENT

### **Step 1: Open Apps Script**
```
Google Sheet → Extensions → Apps Script
```

### **Step 2: Add 3 New Files**

**File 1: Phase2_AI_Scoring_Pathways**
- Click **+** → **Script**
- Name: `Phase2_AI_Scoring_Pathways`
- Copy from: `apps-script-deployable/Phase2_AI_Scoring_Pathways.gs`
- **Save** (Ctrl+S)

**File 2: Phase2_Pathway_Discovery_UI**
- Click **+** → **Script**
- Name: `Phase2_Pathway_Discovery_UI`
- Copy from: `apps-script-deployable/Phase2_Pathway_Discovery_UI.gs`
- **Save** (Ctrl+S)

**File 3: Phase2_Enhanced_Categories_Pathways_Panel**
- Click **+** → **Script**
- Name: `Phase2_Enhanced_Categories_Pathways_Panel`
- Copy from: `apps-script-deployable/Phase2_Enhanced_Categories_Pathways_Panel.gs`
- **Save** (Ctrl+S)

### **Step 3: Remove Old Functions from Code.gs**

Find and **comment out** these 2 functions in `Code.gs`:
```javascript
// ========== REPLACED BY Phase2_Enhanced_Categories_Pathways_Panel.gs ==========
/*
function openCategoriesPathwaysPanel() { ... }
function buildCategoriesPathwaysMainMenu_() { ... }
*/
```

### **Step 4: Test**
```
1. Refresh Google Sheet (F5)
2. Click "📂 Categories & Pathways" menu
3. ✅ See 2 tabs: "📊 Categories" + "🔍 AI Discovery"
4. Click "AI Discovery" tab
5. ✅ Logic type dropdown populated
```

---

## 🧪 FIRST DISCOVERY TEST

### **Run Your First Discovery**

1. **Open** Categories & Pathways panel
2. **Switch to** 🔍 AI Discovery tab
3. **Select** "Cognitive Bias Exposure"
4. **Click** 🤖 Discover Pathways
5. **Wait** ~30-60 seconds
6. **✅ Expected**: Results display with tier badges, scores, persuasion

### **Verify Results**

```
1. Open Pathways_Master sheet
2. Check new rows added
3. Verify columns populated:
   - Pathway_Name, Description
   - Composite_Score, Tier
   - Persuasion_Narrative
   - Sequence_Rationale (JSON)
```

---

## 📊 WHAT EACH FILE DOES

### **Phase2_AI_Scoring_Pathways.gs**
- Scores pathways (Educational × Novelty × Market)
- Generates AI persuasion narratives
- Creates sequence rationale (why each case is positioned)
- All OpenAI API integration

### **Phase2_Pathway_Discovery_UI.gs**
- Manages logic type library
- Executes discovery workflow
- Loads Field_Cache_Incremental data
- Saves results to Pathways_Master

### **Phase2_Enhanced_Categories_Pathways_Panel.gs**
- Enhanced sidebar with 2 tabs
- Categories tab (existing view)
- AI Discovery tab (new view)
- Real-time results display

---

## ✅ SUCCESS CHECKLIST

- [ ] 3 files added to Apps Script
- [ ] Old functions commented out
- [ ] Panel opens with 2 tabs
- [ ] Logic type dropdown works
- [ ] Discovery completes without errors
- [ ] Pathways saved to Pathways_Master
- [ ] Sequence rationale JSON populated

---

## 🐛 QUICK FIXES

**"Logic_Type_Library not found"**
```bash
node scripts/createPathwaysSheets.cjs
node scripts/populate7LogicTypes.cjs
```

**"Field_Cache_Incremental not found"**
```
Run Field Selector → Cache all 207 rows
```

**"Invalid OpenAI API key"**
```
Check Settings!B2 - must start with sk-
```

**Panel shows old view (no tabs)**
```
1. Hard refresh (Cmd+Shift+R)
2. Close/reopen sidebar
3. Check Phase2_Enhanced... file saved
```

---

## 📖 FULL DOCS

**Complete guide**: [PHASE2_DEPLOYMENT_GUIDE.md](PHASE2_DEPLOYMENT_GUIDE.md)

**Architecture**: [PATHWAYS_FINAL_SPEC.md](PATHWAYS_FINAL_SPEC.md)

**Case IDs**: [CASE_ID_ACCRONYM_SYSTEM.md](CASE_ID_ACCRONYM_SYSTEM.md)

---

## 🎉 YOU'RE READY!

Phase 2 deployed! You now have AI-powered pathway discovery with:
- ✅ 3-factor scoring system
- ✅ Tier-based rankings (S/A/B/C/D)
- ✅ AI persuasion narratives
- ✅ Sequence rationale explanations
- ✅ 7 intelligence-type logic types
- ✅ Usage-frequency sorted dropdown

**Next**: Discover your first pathway and explore the results!

---

_Deployment time: 15 minutes | Integration: 100% backward compatible_
