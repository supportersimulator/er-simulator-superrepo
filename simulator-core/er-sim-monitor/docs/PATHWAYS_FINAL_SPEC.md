# 🧭 PATHWAYS FINAL SPECIFICATION
## AI-Powered Learning Pathway Discovery & Organization System

**Date**: 2025-11-08 (FINAL - Ready to Rock!)
**Version**: 3.0 - APPROVED BY AARON
**Status**: ✅ APPROVED - Begin Implementation NOW
**Lead Architect**: Atlas (Claude Code)
**Project Owner**: Aaron Tjomsland

---

## 🎯 CRITICAL CORRECTIONS FROM v2.0

### **1. Phase Order (CORRECTED)**

**OLD (v2.0)**:
Logic Types → Naming → Ranking → Library → Discovery → Sequencing → Application

**NEW (FINAL)**:
**Logic Types → AI Persuasion (Ranking) → Library → Discovery → Sequencing → Naming → Application**

**Why Naming is Near the End**:
- Pathways need to be fully formed before naming
- Case sequences finalized first, THEN name the pathway
- Naming is last creative step before application
- AI can craft better names when pathway structure is complete

---

### **2. Case ID Numbering System (CORRECTED)**

**OLD (v2.0)**:
- Adults: `CARD001`, `CARD002`, `CARD003`
- Sequence: 001, 002, 003...

**NEW (FINAL)**:
- **2-3 letter category accronym** (CA for Cardiac, RE for Respiratory, NE for Neuro)
- **Pathway number (hundreds digit)** + **Case sequence (tens/ones)**
- **Format**: `CA101`, `CA102`, `CA103`, `CA104`, `CA105`, `CA106`
  - `CA` = Cardiac category (2 letters)
  - `1` = First pathway in Cardiac category
  - `01` = First case in pathway
  - `06` = Sixth case in pathway

**Example Pathway Progression**:
```
PATHWAY 1 - "Cardiac Emergencies: Foundation"
CA101 - Chest Pain (Case 1)
CA102 - STEMI (Case 2)
CA103 - NSTEMI (Case 3)
CA104 - Unstable Angina (Case 4)
CA105 - Cardiogenic Shock (Case 5)
CA106 - Cardiac Arrest (Case 6)

PATHWAY 2 - "Advanced Cardiac: Critical Care"
CA201 - Atrial Fibrillation (Case 1 of Pathway 2)
CA202 - Ventricular Tachycardia (Case 2 of Pathway 2)
CA203 - Heart Block (Case 3 of Pathway 2)

PATHWAY 3 - "Cardiac: Pediatric Emergencies"
CA301 - Pediatric SVT (Case 1 of Pathway 3)
CA302 - Pediatric Myocarditis (Case 2 of Pathway 3)
```

**Category Accronym Library (2-3 Letters)**:
```
CA - Cardiovascular / Cardiac
RE - Respiratory
NE - Neurological
GI - Gastrointestinal
EN - Endocrine
RN - Renal
HE - Hematologic
TX - Toxicological
TR - Trauma
IF - Infectious
GY - Gynecological
PS - Psychiatric
DE - Dermatologic
OP - Ophthalmologic
OR - Orthopedic
```

**Pediatric Cases**: Use same accronym (CA, RE, etc.) - No `P` prefix needed since numbering is separate

**Pathway Ordering Logic**:
- First pathway in category: 1XX (101, 102, 103...)
- Second pathway in category: 2XX (201, 202, 203...)
- Third pathway in category: 3XX (301, 302, 303...)
- Up to 9 pathways per category: 1XX - 9XX

**Benefits**:
- ✅ **Pathway order preserved** (hundreds digit = pathway rank)
- ✅ **Case sequence visible** (01, 02, 03... = order in pathway)
- ✅ **Category clear** (CA = Cardiac, RE = Respiratory)
- ✅ **Compact** (5 characters: `CA106`)
- ✅ **Sortable** (alphabetically sorts by category, then pathway, then sequence)

---

### **3. Data Storage Strategy (CORRECTED)**

**Question**: "Do we use another google sheet to save all this data like the cache is saved?"

**Answer**: ✅ **YES - New sheet called `Pathways_Master`**

**CRITICAL: Sheet Auto-Switching Prevention**:
- Remember the batch caching bug? When `insertSheet()` creates a new sheet, Google Sheets auto-switches to it
- **Solution**: Use `sheet.activate()` to immediately switch back to Master sheet
- **Workflow**: Create Pathways_Master → Immediately activate Master → All operations stay on Master

**Implementation**:
```javascript
function ensurePathwaysMasterSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let pathwaysSheet = ss.getSheetByName('Pathways_Master');

  if (!pathwaysSheet) {
    Logger.log('📝 Creating Pathways_Master sheet');
    pathwaysSheet = ss.insertSheet('Pathways_Master');

    // Add headers
    pathwaysSheet.appendRow([
      'Pathway_ID', 'Pathway_Name', 'Logic_Type_Used',
      'Educational_Score', 'Novelty_Score', 'Market_Score',
      'Composite_Score', 'Tier', 'Case_IDs', 'Category',
      'Status', 'Date_Created', 'User_Rating', 'Notes'
    ]);

    Logger.log('✅ Pathways_Master sheet created with headers');

    // CRITICAL: Switch back to Master sheet to prevent auto-switching bug
    const masterSheet = pickMasterSheet_();
    masterSheet.activate();
    Logger.log('✅ Switched back to Master sheet');
  }

  return pathwaysSheet;
}
```

**Data Separation**:
- **Master Scenario Convert** - All case data (207 rows × 150 fields)
- **Field_Cache_Incremental** - AI-optimized cache (207 rows × 35 fields)
- **Pathways_Master** - All pathway metadata (logic types, suggestions, rankings, approvals)
- **Logic_Type_Library** - Custom logic type prompts

**Why This Works**:
- ✅ No tab switching during operations
- ✅ All case data accessible on Master sheet
- ✅ Pathway metadata stored separately (clean separation)
- ✅ Field_Cache_Incremental stays active during discovery
- ✅ Uses same `sheet.activate()` pattern that fixed batch caching bug

---

## 🚀 FINAL IMPLEMENTATION PHASES (CORRECTED ORDER)

### **Phase 1: Logic Type System** (Week 1)

**Objective**: Build ever-growing logic type library with custom creation

**Tasks**:
- [ ] Create `Logic_Type_Library` sheet (hidden, auto-activate Master after)
- [ ] Create `Pathways_Master` sheet (hidden, auto-activate Master after)
- [ ] Populate 7 initial logic types
- [ ] Build dynamic dropdown UI (loads from Logic_Type_Library)
- [ ] Implement "Create New Logic Type" modal
- [ ] Build AI logic type generator (persona + prompt)
- [ ] Test sheet.activate() safety (ensure no auto-switching)

**Deliverables**:
- Logic_Type_Library sheet ✅
- Pathways_Master sheet ✅
- Dynamic dropdown ✅
- Custom logic type creator ✅

---

### **Phase 2: AI Persuasion & Ranking** (Week 2)

**Objective**: AI attempts to persuade what pathway and why, with 3-factor scoring

**UI Enhancement**:
```
┌────────────────────────────────────────────────────────────┐
│ 🎯 "The Diagnostic Traps Collection"                      │
│ ⭐ 8.5/10 Composite Score | S-Tier (Must Build)           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 🧠 WHY THIS PATHWAY MATTERS (AI Persuasion):              │
│                                                            │
│ "These aren't just diagnostic errors - they're the cases  │
│  that fool even 20-year attendings. Each case presents    │
│  with textbook symptoms pointing to Diagnosis A, but the   │
│  answer is actually Diagnosis B. This pathway trains your  │
│  residents to recognize when 'too perfect' presentations   │
│  should trigger diagnostic skepticism, not confirmation."  │
│                                                            │
│ 📊 SCORING BREAKDOWN:                                      │
│ • Educational Value: 9/10 (Fills critical bias gap)       │
│ • Novelty: 9/10 (Cognitive focus rare in EM)              │
│ • Market Validation: 7/10 (Aligns with Harvard course)    │
│                                                            │
│ 🎓 LEARNING OUTCOMES:                                      │
│ • Recognize anchoring bias in real-time                   │
│ • Apply systematic "break the pattern" thinking           │
│ • Identify diagnostic red flags                           │
│                                                            │
│ 👥 BEST FOR: PGY2-3, Faculty, Cognitive trainers          │
│                                                            │
│ 📚 8 cases sequenced for maximum impact                   │
│                                                            │
│ [✅ Approve This Pathway] [👁️ View Cases] [🗑️ Decline]   │
└────────────────────────────────────────────────────────────┘
```

**Tasks**:
- [ ] Implement Educational Value scoring prompt
- [ ] Implement Novelty scoring prompt
- [ ] Implement Market Validation scoring prompt
- [ ] Build composite score calculation (50% + 25% + 25%)
- [ ] Add S/A/B/C/D tier classification
- [ ] Build "AI Persuasion" narrative generator
- [ ] Create persuasion display UI

**Deliverables**:
- 3-factor scoring system ✅
- AI persuasion narratives ✅
- Tier-based ranking ✅

---

### **Phase 3: Pathway Suggestion Library** (Week 3)

**Objective**: Persistent storage with interactive browsing

**Pathways_Master Schema**:
```
Column A: Pathway_ID (PATH_001, PATH_002...)
Column B: Pathway_Name (temporary, will be renamed in Phase 6)
Column C: Logic_Type_Used
Column D: Category (CA, RE, NE, etc.)
Column E: Educational_Score (1-10)
Column F: Novelty_Score (1-10)
Column G: Market_Score (1-10)
Column H: Composite_Score (calculated)
Column I: Tier (S/A/B/C/D)
Column J: Case_IDs (JSON array)
Column K: Case_Sequence (ordered JSON)
Column L: Target_Learner
Column M: AI_Persuasion_Text
Column N: Learning_Outcomes (JSON array)
Column O: Discovery_Date
Column P: User_Rating (1-10, null initially)
Column Q: Status (suggested/approved/archived)
Column R: Notes (Aaron's freeform)
```

**Tasks**:
- [ ] Implement append logic (always add, never replace)
- [ ] Build duplicate detection (>80% name similarity)
- [ ] Create library browser UI (browse by tier)
- [ ] Add interactive actions (Approve, View, Archive, Rate)
- [ ] Implement soft delete (archive functionality)

**Deliverables**:
- Persistent library storage ✅
- Interactive browser UI ✅
- Refinement actions ✅

---

### **Phase 4: Discovery Execution Engine** (Week 4)

**Objective**: Execute logic type prompts → Generate pathways → Store in library

**Tasks**:
- [ ] Implement prompt rotation system
- [ ] Build cache data injection (Field_Cache_Incremental → Prompt)
- [ ] Add OpenAI API call wrapper
- [ ] Implement pathway parsing (JSON → Pathways_Master)
- [ ] Add 3-factor scoring automation
- [ ] Build discovery progress UI
- [ ] Test with all 7 initial logic types

**Deliverables**:
- Discovery execution engine ✅
- 30-50 initial pathway suggestions ✅
- Progress tracking UI ✅

---

### **Phase 5: Pathway Sequencing** (Week 5)

**Objective**: Finalize case order within each pathway

**Tasks**:
- [ ] Build pathway chain editor UI
- [ ] Implement drag-and-drop case reordering
- [ ] Add case swap functionality
- [ ] Create sequence preview
- [ ] Lock sequence when finalized
- [ ] Generate Case ID assignments (CA101, CA102, etc.)

**Deliverables**:
- Case sequencing UI ✅
- Drag-and-drop reordering ✅
- Case ID preview ✅

---

### **Phase 6: Pathway Naming Tool** (Week 6)

**Objective**: AI generates 10 compelling pathway name variations

**Why This is Near the End**:
- Pathway is fully formed (cases selected, sequence finalized)
- AI can craft better names when it knows complete pathway structure
- Naming is final creative step before application

**Tasks**:
- [ ] Build pathway naming prompt template
- [ ] Implement `generatePathwayNames()` function
- [ ] Create naming tool UI (10 variations across 5 categories)
- [ ] Add editable naming field (like Spark/Reveal)
- [ ] Test with 10 finalized pathways

**Deliverables**:
- Pathway naming tool ✅
- 10-variation name generator ✅
- Editable names ✅

---

### **Phase 7: Pathway Application** (Week 7)

**Objective**: Apply approved pathways to Master sheet

**Case ID Application**:
```javascript
function applyCaseIDNumbering(approvedPathway, categoryAcronym) {
  // approvedPathway.caseSequence = ordered array of case objects
  // categoryAcronym = "CA", "RE", "NE", etc.

  const pathwayNumber = getNextPathwayNumber(categoryAcronym);
  // If first pathway in Cardiac category: pathwayNumber = 1
  // Second pathway: pathwayNumber = 2, etc.

  const updatedCaseIDs = [];

  approvedPathway.caseSequence.forEach((caseObj, index) => {
    const caseNumber = String(index + 1).padStart(2, '0'); // 01, 02, 03...
    const newCaseID = `${categoryAcronym}${pathwayNumber}${caseNumber}`;
    // Example: CA101, CA102, CA103...

    updatedCaseIDs.push({
      originalCaseID: caseObj.originalCaseID,
      newCaseID: newCaseID,
      row: caseObj.row,
      pathwayName: approvedPathway.finalName,
      pathwayNumber: pathwayNumber,
      caseSequence: index + 1
    });
  });

  return updatedCaseIDs;
}

function getNextPathwayNumber(categoryAcronym) {
  // Check Pathways_Master sheet for existing pathways in this category
  const pathwaysSheet = ss.getSheetByName('Pathways_Master');
  const data = pathwaysSheet.getDataRange().getValues();

  let maxPathwayNum = 0;
  for (let i = 1; i < data.length; i++) {
    const category = data[i][3]; // Column D: Category
    const status = data[i][16]; // Column Q: Status

    if (category === categoryAcronym && status === 'approved') {
      // Extract pathway number from existing Case IDs
      const caseIDs = JSON.parse(data[i][9]); // Column J: Case_IDs
      if (caseIDs.length > 0) {
        const firstCaseID = caseIDs[0];
        const pathwayNum = parseInt(firstCaseID.charAt(2)); // Extract hundreds digit
        maxPathwayNum = Math.max(maxPathwayNum, pathwayNum);
      }
    }
  }

  return maxPathwayNum + 1; // Next pathway number
}
```

**Tasks**:
- [ ] Build "Approved Pathways" queue
- [ ] Implement Case ID numbering (CA101, CA102, CA103...)
- [ ] Update Pathway_Name column in Master sheet
- [ ] Create Master_Pathway_Ordered sheet
- [ ] Build application preview (show before/after)
- [ ] Implement rollback system

**Deliverables**:
- Pathway application engine ✅
- Case ID numbering system ✅
- Preview + rollback ✅

---

## 📊 FINAL SPECIFICATION SUMMARY

### **Phase Order (APPROVED)**:
1. **Logic Types** - Build discovery lens library
2. **AI Persuasion & Ranking** - Score + persuade why pathway matters
3. **Suggestion Library** - Store all pathway suggestions
4. **Discovery Engine** - Execute prompts → generate pathways
5. **Sequencing** - Finalize case order in pathway
6. **Naming** - AI suggests 10 compelling names
7. **Application** - Apply to Master sheet with new Case IDs

### **Case ID System (APPROVED)**:
- Format: `CA101` (2-3 letter category + pathway number + case sequence)
- Pathway ordering: First pathway = 1XX, Second = 2XX, etc.
- Example: `CA101` → `CA106` (6 cases in first Cardiac pathway)

### **Data Storage (APPROVED)**:
- **Master Scenario Convert** - All case data
- **Field_Cache_Incremental** - AI-optimized cache (stays active during operations)
- **Pathways_Master** - Pathway metadata (hidden, never auto-switches)
- **Logic_Type_Library** - Custom logic types (hidden, never auto-switches)
- **Safety**: Use `sheet.activate()` after creating any new sheet

### **Ranking Formula (APPROVED)**:
- Educational Value (50%) + Novelty (25%) + Market Validation (25%)
- Composite score → S/A/B/C/D tier

---

## ✅ FINAL APPROVAL CONFIRMED

**Aaron's Confirmations**:
✅ Phase order: Logic → Ranking → Library → Discovery → Sequencing → Naming → Application
✅ Case ID: 2-3 letter accronym + pathway number + case sequence (CA101, CA102...)
✅ Ranking weights: 50% Educational, 25% Novelty, 25% Market
✅ Data storage: Separate Pathways_Master sheet with auto-activate safety
✅ Ready to rock and roll!

---

## 🚀 PHASE 1 BEGINS NOW

**What Atlas is doing RIGHT NOW**:

1. ✅ Create `Logic_Type_Library` sheet (hidden)
2. ✅ Create `Pathways_Master` sheet (hidden)
3. ✅ Populate 7 initial logic types
4. ✅ Build dynamic dropdown UI
5. ✅ Implement sheet.activate() safety (no auto-switching)
6. ✅ Test "Create New Logic Type" flow

**Expected completion**: End of today (Phase 1 complete)

---

**LET'S ROCK AND ROLL, AARON! 🏔️🎸**

---

_Generated by Atlas (Claude Code) - 2025-11-08_
_Status: ✅ APPROVED - Implementation Starting NOW_
_Timeline: 7 weeks to full deployment_
_Current Phase: 1 (Logic Type System)_
