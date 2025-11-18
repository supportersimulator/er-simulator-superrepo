# 🧭 PATHWAYS MASTER ROADMAP
## AI-Powered Learning Pathway Discovery & Organization System

**Date**: 2025-11-08
**Version**: 1.0
**Status**: Planning Phase
**Lead Architect**: Atlas (Claude Code)
**Project Owner**: Aaron Tjomsland

---

## 🎯 VISION

**Transform 207 emergency medicine simulation cases into intelligently organized, AI-discovered learning pathways that:**

1. **Go beyond predictable** medical education groupings
2. **Discover emergent patterns** humans might miss
3. **Maximize educational value** through surprising, high-impact sequences
4. **Encourage multiple intelligence types** (visual-spatial, logical-mathematical, interpersonal, etc.)
5. **Continuously grow** a ranked library of pathway suggestions
6. **Make renaming/reordering effortless** when ready to finalize

---

## 🧠 PHILOSOPHY: AI AS DISCOVERY ENGINE

**Not asking AI to**:
- Categorize by obvious organ systems (Cardiac, Respiratory, etc.)
- Create predictable difficulty progressions (Easy → Medium → Hard)
- Replicate standard medical education frameworks

**Asking AI to**:
- **Discover hidden connections** between seemingly unrelated cases
- **Identify cognitive pattern opportunities** (anchoring bias, diagnostic traps, great mimickers)
- **Suggest novel sequences** that maximize "aha moments"
- **Quantify educational ROI** for each pathway
- **Surprise us** with high-value groupings we didn't foresee

**Example Novel Pathways AI Might Discover**:
- "The Diagnostic Traps Collection" - Cases that fool even experts (chest pain → aortic dissection, not MI)
- "When Classic Isn't Classic" - Atypical presentations of common conditions
- "The Great Mimickers" - Non-cardiac cases presenting as cardiac emergencies
- "Cognitive Debiasing Series" - Cases designed to fight anchoring, availability, confirmation bias
- "The 3 AM Disasters" - Low-frequency, high-stakes cases where hesitation kills

---

## 📊 CURRENT STATE ANALYSIS

### Existing Infrastructure ✅

**Apps Script Size**: 3,290 lines, 92 functions
**Performance**: Well within Google Apps Script limits (150 KB max, currently ~112 KB)
**Monolithic Architecture**: ✅ FEASIBLE to continue as single file

**Existing Categories & Pathways Code** (Lines 2875-3290):
- `openCategoriesPathwaysPanel()` - Main launcher
- `buildCategoriesPathwaysMainMenu_()` - UI builder
- `getCategoryView(category)` - Individual category view
- `getPathwayView(pathway)` - Individual pathway view
- Two fields already exist in Master sheet:
  - `Case_Organization:Category`
  - `Case_Organization:Pathway_Name`

**Existing AI Pathway Discovery Code** ✅:
- v7.2 Smart Caching System (3-tier cache, 24-hour validity)
- Pre-cache UI with live progress
- 23 fields per case (Demographics, Vitals, Clinical Context, Learning Design)
- Hidden sheet: `Pathway_Analysis_Cache`
- Timeout protection (4-minute safety buffer)
- Three discovery modes:
  - Standard (temperature 0.7)
  - Radical (temperature 1.0)
  - Custom logic types

**Batch Field Caching System** ✅:
- `Field_Cache_Incremental` sheet
- 35 AI-selected fields
- 207 rows successfully cached
- Used for focused AI analysis

**Documentation**:
- `AI_PATHWAY_DISCOVERY_v7.2_COMPLETE.md` (v7.2 deployment)
- `PATHWAY_CHAIN_BUILDER_PROPOSAL.md` (Phase 2 vision)
- `AI_PATHWAY_DISCOVERY_SPEC.md` (Product spec)
- `ENHANCED_PATHWAY_DETECTION.md`
- `AI_PATHWAY_DISCOVERY_DUAL_MODE.md`

### What's Missing 🚧

1. **Prompt Library** - No curated collection of prompts for different discovery angles
2. **Multi-Intelligence System** - No framework for encouraging diverse pathway types
3. **Ranking & Suggestion Library** - No persistent storage of AI suggestions with ratings
4. **Pathway Application Workflow** - No system to apply approved pathways to Master sheet
5. **Case ID Renaming System** - No automation for renaming cases based on pathway assignments

---

## 🏗️ COMPLETE TECHNOLOGY ARCHITECTURE

### **Stage 1: Intelligent Prompt Library** (NEW)

**Purpose**: Store, refine, and evolve prompts that encourage AI to discover valuable pathways

**Location**: Google Drive → "Pathway Discovery Prompts" folder

**Prompt Categories**:

1. **Cognitive Psychology Patterns**
   - Anchoring bias cases
   - Availability heuristic traps
   - Confirmation bias scenarios
   - Diagnostic momentum examples

2. **Clinical Pattern Recognition**
   - Atypical presentations
   - Great mimickers
   - Diagnostic traps
   - Zebras (rare diagnoses)

3. **Learning Theory Frameworks**
   - Spaced repetition sequences
   - Mastery learning progressions
   - Case-based reasoning chains
   - Problem-based learning clusters

4. **Multiple Intelligence Types**
   - Visual-spatial (waveform pattern recognition)
   - Logical-mathematical (diagnostic algorithms)
   - Interpersonal (team communication scenarios)
   - Bodily-kinesthetic (procedural skill sequences)
   - Linguistic (history-taking, communication)
   - Intrapersonal (self-reflection, bias awareness)

5. **Surprise & Novelty**
   - Cross-system connections
   - Unexpected groupings
   - Contrarian pathways
   - "What if...?" scenarios

6. **Medical Education Standards** (Reference, not copy)
   - OnlineMedEd style: Organ system → Clinical presentation
   - Rosh Review style: Subject-based question clusters
   - EM:RAP style: C3 (Core Content for Clerks/Residents) → Crunch Time (advanced)

**Prompt Template Structure**:
```markdown
## Prompt: [Name]

**Category**: [Cognitive/Clinical/Learning/Intelligence/Surprise]

**Intelligence Type**: [Visual-Spatial/Logical/Interpersonal/etc.]

**Objective**: [What we want AI to discover]

**Prompt Text**:
```
You are [persona], a [role] with expertise in [domain].

Analyze these 207 emergency medicine cases and discover [specific pattern].

Focus on:
- [Criterion 1]
- [Criterion 2]
- [Criterion 3]

For each pathway you discover:
1. CATCHY NAME (not boring medical jargon)
2. WHY IT MATTERS (educational hook)
3. LEARNING OUTCOMES (specific, measurable)
4. NOVELTY SCORE (1-10, how unexpected)
5. TARGET LEARNER (who benefits most)
6. UNIQUE VALUE PROPOSITION (what traditional groupings miss)

Surprise me! Think beyond systems and symptoms.

Cases: [Field_Cache_Incremental data]
```

**Expected Output Format**:
[JSON structure for pathways]

**Success Criteria**:
- Novelty score ≥ 7/10
- Educational ROI clearly articulated
- ≥3 pathways per prompt execution

**Last Updated**: [Date]
**Performance Notes**: [What worked/didn't work]
```

**Implementation**:
- Google Docs with version history
- One doc per prompt
- Folder organized by category
- Shared with GPT-5 for review/refinement

---

### **Stage 2: Multi-Intelligence Discovery Engine** (NEW)

**Purpose**: Systematically explore ALL learning pathway angles, not just medical systems

**Gardner's Multiple Intelligences Applied to EM Simulation**:

| Intelligence Type | Pathway Examples | Case Selection Criteria |
|-------------------|------------------|-------------------------|
| **Visual-Spatial** | "Waveform Pattern Mastery" | ECG rhythm recognition, imaging interpretation |
| **Logical-Mathematical** | "Diagnostic Algorithm Series" | H&P → DDx → Testing → Diagnosis chains |
| **Linguistic** | "Master Communicator Path" | Breaking bad news, informed consent, handoffs |
| **Bodily-Kinesthetic** | "Procedural Skill Progression" | IV → Central line → Intubation → Chest tube |
| **Musical** | "Rhythm of Resuscitation" | CPR cadence, ACLS protocol timing |
| **Interpersonal** | "Team Dynamics Scenarios" | Crisis resource management, leadership |
| **Intrapersonal** | "Bias Awareness Journey" | Cases revealing personal diagnostic patterns |
| **Naturalist** | "Pattern Recognition in Chaos" | Identifying subtle trends in vital signs |

**AI Prompt Rotation**:
```javascript
function discoverPathwaysAcrossIntelligences() {
  const intelligenceTypes = [
    'visual-spatial',
    'logical-mathematical',
    'linguistic',
    'bodily-kinesthetic',
    'interpersonal',
    'intrapersonal',
    'naturalist'
  ];

  const allPathways = [];

  for (const type of intelligenceTypes) {
    const prompt = loadPromptTemplate(type);
    const pathways = callOpenAI(prompt, cacheData);

    pathways.forEach(p => {
      p.intelligenceType = type;
      p.discoveryDate = new Date();
    });

    allPathways.push(...pathways);
  }

  return rankPathwaysByNoveltyAndValue(allPathways);
}
```

---

### **Stage 3: Pathway Suggestion Library** (NEW)

**Purpose**: Persistent storage of ALL AI-suggested pathways with rankings

**Storage**: Google Sheet tab `Pathway_Suggestion_Library`

**Schema**:
```
Column A: Pathway_ID (auto-generated)
Column B: Pathway_Name
Column C: Description
Column D: Intelligence_Type
Column E: Novelty_Score (1-10)
Column F: Educational_Value_Score (1-10)
Column G: Case_Count
Column H: Case_IDs (JSON array)
Column I: Target_Learner
Column J: Unique_Value_Proposition
Column K: Discovery_Date
Column L: Discovery_Prompt_Used
Column M: User_Rating (null initially)
Column N: Times_Built (usage counter)
Column O: Status (suggested/approved/archived)
```

**Ranking Algorithm**:
```javascript
function calculatePathwayScore(pathway) {
  const noveltyWeight = 0.4;
  const educationalValueWeight = 0.3;
  const userRatingWeight = 0.2; // 0 if no rating yet
  const usageWeight = 0.1;

  const score =
    (pathway.noveltyScore * noveltyWeight) +
    (pathway.educationalValueScore * educationalValueWeight) +
    ((pathway.userRating || 0) * userRatingWeight) +
    (Math.min(pathway.timesBuilt / 10, 1) * 10 * usageWeight);

  return score; // Max 10
}
```

**Library Growth Strategy**:
- Every AI discovery run ADDS pathways (never replaces)
- Duplicate detection (name similarity >80% = same pathway)
- Auto-archive pathways with score <5 after 90 days
- Top 20 pathways always visible in UI

**UI Integration**:
```
┌────────────────────────────────────────────────────────────┐
│ 🧩 Pathway Suggestion Library (342 discovered)            │
├────────────────────────────────────────────────────────────┤
│ Sort by: [Novelty ▼] [Education Value] [User Rating] [New]│
│                                                            │
│ TOP SUGGESTIONS:                                           │
│                                                            │
│ 1. "The Diagnostic Traps Collection"                      │
│    ⭐ 9.7/10 | 🧠 Cognitive | 💡 Novelty: 9/10 | 📊 8 cases│
│    "Cases that fool even expert clinicians..."            │
│    [Build Pathway] [Rate] [Details]                       │
│                                                            │
│ 2. "When Classic Isn't Classic"                           │
│    ⭐ 9.4/10 | 🩺 Clinical | 💡 Novelty: 8/10 | 📊 12 cases│
│    "Atypical presentations of common EM conditions..."    │
│    [Build Pathway] [Rate] [Details]                       │
│                                                            │
│ 3. "Waveform Pattern Mastery"                             │
│    ⭐ 8.9/10 | 👁️ Visual-Spatial | 💡 Novelty: 7/10       │
│    "ECG rhythm recognition progression..."                │
│    [Build Pathway] [Rate] [Details]                       │
│                                                            │
│ [Show All 342] [Discover More Pathways]                   │
└────────────────────────────────────────────────────────────┘
```

---

### **Stage 4: Cache → AI Analysis → Suggestion Library**

**Complete Data Flow**:

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: BATCH CACHE (✅ COMPLETE)                       │
│ Field_Cache_Incremental                                 │
│ - 207 rows × 35 fields                                  │
│ - AI-optimized field selection                          │
│ - Token-efficient data format                           │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 2: AI DISCOVERY ENGINE (ENHANCED)                  │
│ Prompt Library (7-10 intelligence types)                │
│ - Load prompt template                                  │
│ - Inject cache data                                     │
│ - Call OpenAI API                                       │
│ - Parse pathway suggestions                             │
│ - Calculate novelty scores                              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 3: SUGGESTION LIBRARY STORAGE (NEW)                │
│ Pathway_Suggestion_Library sheet                        │
│ - Append new pathways                                   │
│ - Detect duplicates                                     │
│ - Calculate composite scores                            │
│ - Rank by novelty × value                               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 4: USER REVIEW & APPROVAL (NEW UI)                 │
│ Pathway Review Sidebar                                  │
│ - Browse top suggestions                                │
│ - Rate pathways (1-10)                                  │
│ - Edit case selections                                  │
│ - Approve for finalization                              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ STEP 5: PATHWAY APPLICATION (NEW)                       │
│ Apply approved pathways to Master sheet                 │
│ - Bulk update Pathway_Name column                       │
│ - Optionally rename Case_IDs                            │
│ - Generate pathway-based ordering                       │
│ - Create Master_Pathway_Ordered sheet                   │
└─────────────────────────────────────────────────────────┘
```

---

### **Stage 5: Pathway Application Workflow** (NEW)

**Purpose**: Transform approved pathway suggestions into actual case organization

**UI Flow**:

```
┌────────────────────────────────────────────────────────────┐
│ 📋 Approved Pathways (5 selected)                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ✅ "The Diagnostic Traps Collection" (8 cases)            │
│ ✅ "Waveform Pattern Mastery" (12 cases)                  │
│ ✅ "Team Dynamics Scenarios" (15 cases)                   │
│ ✅ "Pediatric Emergency Essentials" (18 cases)            │
│ ✅ "Trauma Resuscitation Sequence" (10 cases)             │
│                                                            │
│ Total: 63 cases assigned to pathways                      │
│ Remaining: 144 cases unassigned                           │
│                                                            │
│ [ ] Update Pathway_Name column in Master sheet            │
│ [ ] Rename Case_IDs to reflect pathway                    │
│ [ ] Create new ordered sheet (Master_Pathway_Ordered)     │
│                                                            │
│ [Apply Pathways] [Preview Changes] [Cancel]               │
└────────────────────────────────────────────────────────────┘
```

**Backend Implementation**:

```javascript
function applyApprovedPathways(approvedPathways) {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  const pathwayIdx = headers.indexOf('Case_Organization:Pathway_Name');
  const caseIdIdx = headers.indexOf('Case_ID');

  // Build case → pathway mapping
  const mapping = {};
  approvedPathways.forEach(pathway => {
    pathway.caseIds.forEach(caseId => {
      mapping[caseId] = pathway.name;
    });
  });

  // Update Master sheet
  for (let i = 2; i < data.length; i++) {
    const caseId = data[i][caseIdIdx];
    if (mapping[caseId]) {
      data[i][pathwayIdx] = mapping[caseId];
    }
  }

  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

  Logger.log(`✅ Updated ${Object.keys(mapping).length} cases with pathway assignments`);
}
```

---

### **Stage 6: Case ID Renaming System** (NEW)

**Purpose**: Rename cases to reflect pathway membership

**Naming Convention Options**:

**Option A: Pathway Prefix**
```
Original: GI01234
New: DIAG_TRAPS_001
     └─ Pathway abbreviation + sequence number
```

**Option B: Hierarchical**
```
Original: GI01234
New: COGNITIVE_DIAGNOSTIC_TRAPS_001
     └─ Category + Pathway + Number
```

**Option C: Hybrid**
```
Original: GI01234
New: GI01234_DIAG_TRAPS
     └─ Keep original + pathway tag
```

**Implementation**:
```javascript
function renameBasedOnPathways(approvedPathways, namingOption = 'hybrid') {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  const caseIdIdx = headers.indexOf('Case_ID');
  const pathwayIdx = headers.indexOf('Case_Organization:Pathway_Name');

  // Build renaming map
  const renamingMap = {};
  approvedPathways.forEach((pathway, pathwayIndex) => {
    const pathwayAbbrev = abbreviatePathwayName(pathway.name);

    pathway.caseIds.forEach((caseId, caseIndex) => {
      const newId = generateNewCaseId(caseId, pathwayAbbrev, caseIndex, namingOption);
      renamingMap[caseId] = newId;
    });
  });

  // Apply renaming
  for (let i = 2; i < data.length; i++) {
    const oldId = data[i][caseIdIdx];
    if (renamingMap[oldId]) {
      data[i][caseIdIdx] = renamingMap[oldId];
    }
  }

  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

  // Log changes
  Object.entries(renamingMap).forEach(([old, new]) => {
    Logger.log(`📝 Renamed: ${old} → ${new}`);
  });
}

function abbreviatePathwayName(name) {
  // "The Diagnostic Traps Collection" → "DIAG_TRAPS"
  const words = name.replace(/^The\s+/, '').split(' ');
  return words.slice(0, 2).map(w => w.substring(0, 4).toUpperCase()).join('_');
}
```

---

## 🎯 MEDICAL EDUCATION NAMING INSPIRATION

### OnlineMedEd Pattern Analysis

**Organizational Philosophy**: Organ System → Clinical Presentation

**Examples**:
- Cardiovascular → Chest Pain → STEMI vs NSTEMI
- Pulmonary → Shortness of Breath → Asthma vs COPD
- Gastrointestinal → Abdominal Pain → Appendicitis vs Diverticulitis

**Progression**: Foundational science → Clinical application → Board prep

**What We Can Borrow**:
- Clear system-based organization (but as ONE of many pathway types, not the only)
- Progression thinking (foundational → advanced)

**What We'll Do Better**:
- Add cognitive/procedural/communication pathways OnlineMedEd doesn't have
- Discover non-obvious connections

---

### Rosh Review Pattern Analysis

**Organizational Philosophy**: Subject-based question banks with custom test creation

**Examples**:
- Filter by organ system
- Filter by clinical rotation (EM, IM, Peds)
- Filter by difficulty
- Custom mix-and-match

**Progression**: User-driven, not prescribed

**What We Can Borrow**:
- Flexible filtering/organization
- Custom pathway building
- Difficulty progression

**What We'll Do Better**:
- AI-suggested pathways (Rosh relies entirely on user curation)
- Educational rationale for groupings (Rosh doesn't explain why cases go together)

---

### EM:RAP Pattern Analysis

**Organizational Philosophy**: Tiered content by learner level

**Examples**:
- C3 (Core Content for Clerks/Residents) - Foundational
- Main Episodes - Mixed difficulty
- Crunch Time EM - Advanced concepts

**Progression**: Learner-centric, not topic-centric

**What We Can Borrow**:
- Tiered difficulty pathways
- Target audience specificity (PGY1 vs PGY3)

**What We'll Do Better**:
- Cognitive pattern pathways (bias awareness, diagnostic traps)
- Multi-intelligence pathways (procedural, communication, visual-spatial)

---

## 🚀 IMPLEMENTATION PHASES

### **Phase 1: Prompt Library Foundation** (Week 1)

**Tasks**:
- [ ] Create Google Drive folder: "Pathway Discovery Prompts"
- [ ] Write 7 prompt templates (one per intelligence type)
- [ ] Add 3 "surprise & novelty" prompts
- [ ] Document prompt template structure
- [ ] Test 2-3 prompts with current cache data
- [ ] Refine based on output quality

**Deliverables**:
- 10 documented prompts
- Prompt template standard
- Initial test results

**Success Criteria**:
- Each prompt generates ≥3 pathway suggestions
- Novelty scores average ≥7/10
- AI output follows expected JSON format

---

### **Phase 2: Multi-Intelligence Discovery** (Week 2)

**Tasks**:
- [ ] Implement `discoverPathwaysAcrossIntelligences()` function
- [ ] Build prompt rotation system
- [ ] Add intelligence type tagging to pathway objects
- [ ] Create diversity scoring (ensure pathways span multiple intelligence types)
- [ ] Test full discovery cycle

**Deliverables**:
- Discovery engine code
- 30-50 pathway suggestions across all intelligence types
- Diversity analysis report

**Success Criteria**:
- All 7 intelligence types represented
- No single type >30% of pathways
- Clear differentiation between pathway types

---

### **Phase 3: Suggestion Library Storage** (Week 3)

**Tasks**:
- [ ] Create `Pathway_Suggestion_Library` sheet
- [ ] Implement append/deduplicate logic
- [ ] Build composite scoring algorithm
- [ ] Create ranking system
- [ ] Build UI for browsing suggestions
- [ ] Add user rating system

**Deliverables**:
- Persistent pathway storage
- Ranking algorithm
- Browse/rate UI

**Success Criteria**:
- Library persists 100+ pathways
- Duplicates detected with >95% accuracy
- Top 20 pathways easily browsable

---

### **Phase 4: Pathway Review & Approval UI** (Week 4)

**Tasks**:
- [ ] Design sidebar for pathway review
- [ ] Implement rating system (1-10 stars)
- [ ] Add case editing (add/remove cases from pathway)
- [ ] Build approval workflow
- [ ] Create "Approved Pathways" view
- [ ] Add export options (JSON, PDF)

**Deliverables**:
- Interactive review sidebar
- Approval workflow
- Export functionality

**Success Criteria**:
- Can review 20 pathways in <10 minutes
- Editing is intuitive (no tutorial needed)
- Approved pathways clearly separated

---

### **Phase 5: Pathway Application System** (Week 5)

**Tasks**:
- [ ] Implement `applyApprovedPathways()` function
- [ ] Build bulk update system for Pathway_Name column
- [ ] Create preview mode (show before apply)
- [ ] Add undo functionality
- [ ] Build success/failure reporting
- [ ] Create audit log

**Deliverables**:
- Pathway application code
- Preview system
- Undo capability
- Audit logging

**Success Criteria**:
- Can apply 5 pathways (60+ cases) in <30 seconds
- Preview shows exactly what will change
- Undo restores previous state perfectly

---

### **Phase 6: Case ID Renaming System** (Week 6)

**Tasks**:
- [ ] Design Case ID naming convention (get Aaron's input)
- [ ] Implement renaming algorithm
- [ ] Build abbreviation logic
- [ ] Add conflict detection (duplicate new IDs)
- [ ] Create renaming preview
- [ ] Implement rollback system

**Deliverables**:
- Renaming system
- Conflict detection
- Preview + rollback

**Success Criteria**:
- New Case IDs are human-readable
- No duplicate IDs generated
- Renaming reversible

---

### **Phase 7: Ordered Sheet Generation** (Week 7)

**Tasks**:
- [ ] Implement `createPathwayOrderedSheet()` function
- [ ] Build pathway-based sorting algorithm
- [ ] Add inter-pathway ordering logic
- [ ] Create visual pathway separators in sheet
- [ ] Add "Return to Master" button
- [ ] Document new sheet structure

**Deliverables**:
- Master_Pathway_Ordered sheet generator
- Sorting algorithm
- Documentation

**Success Criteria**:
- Pathways grouped together visually
- Clear separation between pathways
- Maintains all original data

---

## 📐 APPS SCRIPT SIZE ANALYSIS

**Current State**:
- Total lines: 3,290
- Total functions: 92
- File size: ~112 KB
- Google Apps Script limit: 150 KB (we have 38 KB headroom)

**Estimated Additions**:
- Prompt library system: ~200 lines
- Multi-intelligence discovery: ~150 lines
- Suggestion library storage: ~250 lines
- Review/approval UI: ~300 lines
- Pathway application: ~200 lines
- Case ID renaming: ~150 lines
- Ordered sheet generation: ~100 lines

**Total New Code**: ~1,350 lines (~20 KB)

**Projected Final Size**: ~132 KB ✅ WELL WITHIN LIMITS

**Recommendation**: ✅ **CONTINUE AS MONOLITHIC FILE**

**Reasons**:
- All features are tightly integrated
- Shared helper functions (pickMasterSheet_, getSafeUi_, etc.)
- Single deployment unit (easier to manage)
- Performance is excellent (no observed lag)
- Modular organization via comment headers

**Future-Proofing**:
- If we approach 145 KB, consider extracting utility functions to a library
- For now, monolithic is optimal

---

## 🎨 UI/UX INTEGRATION POINTS

### **Main Menu Enhancement**

**Current**:
```
📂 Categories & Pathways
```

**Enhanced**:
```
🧭 Intelligent Pathway Discovery
├── 🔍 Discover Novel Pathways (AI)
├── 📚 Pathway Suggestion Library (342 discovered)
├── ✅ Approved Pathways (5 ready to apply)
├── 📂 Browse by Category (traditional)
└── ⚙️ Pathway Settings
```

### **Discovery Flow**

```
User clicks "🔍 Discover Novel Pathways (AI)"
        ↓
Modal: "Select Discovery Mode"
├── 🧠 Cognitive Patterns
├── 🩺 Clinical Patterns
├── 📖 Learning Theory
├── 🎨 Multiple Intelligences
├── 💡 Surprise Me! (all modes)
└── 🎯 Custom Prompt
        ↓
AI processes cache data
        ↓
30-50 pathway suggestions appear
        ↓
User rates/edits/approves
        ↓
Approved pathways → Application workflow
```

---

## 🧪 SUCCESS METRICS

### **Discovery Quality**

**Target Metrics**:
- Novelty score average: ≥7.5/10
- Educational value score average: ≥8/10
- User approval rate: ≥60% of suggestions
- Diversity: All 7 intelligence types represented

### **User Experience**

**Target Metrics**:
- Time to discover 50 pathways: <5 minutes
- Time to review 20 pathways: <10 minutes
- Time to apply 5 pathways: <2 minutes
- User satisfaction: ≥4.5/5 stars

### **System Performance**

**Target Metrics**:
- AI discovery latency: <30 seconds
- Suggestion library load time: <2 seconds
- Pathway application time: <30 seconds for 100 cases
- No timeouts (4-minute buffer maintained)

### **Educational Value**

**Target Metrics**:
- Learner retention improvement: +20% (future study)
- Faculty adoption: ≥5 educators using pathways
- Pathway reuse: Each pathway used ≥3 times

---

## 🔒 SAFETY & ROLLBACK

### **Data Safety**

**Protection Measures**:
- All operations preview before execution
- Undo functionality for all bulk changes
- Audit log of all pathway applications
- Original Master sheet never deleted (only copied)

### **Rollback Plan**

**If Issues Arise**:
1. Revert to Master sheet backup
2. Clear Pathway_Suggestion_Library
3. Restore previous Case_IDs from audit log
4. Re-run discovery with adjusted prompts

### **Version Control**

**Git Workflow**:
- Commit after each phase completion
- Tag major releases (v1.0, v2.0)
- Save production snapshots to Google Drive "lost and found"

---

## 📝 NEXT STEPS (IMMEDIATE)

### **This Week**:

1. **Aaron's Feedback Session** (Today)
   - Review this roadmap
   - Clarify vision alignment
   - Prioritize phases
   - Decide on Case ID naming convention

2. **Prompt Library Creation** (Days 1-2)
   - Set up Google Drive folder
   - Write first 7 intelligence-type prompts
   - Test with current cache data

3. **Initial Discovery Run** (Day 3)
   - Execute all 7 prompts
   - Generate 30-50 pathway suggestions
   - Analyze quality/diversity

4. **Suggestion Library MVP** (Days 4-5)
   - Create sheet structure
   - Implement ranking algorithm
   - Build basic browse UI

5. **Review Session with Aaron** (Day 7)
   - Show discovered pathways
   - Get feedback on quality
   - Adjust prompt strategy

---

## 🤝 COLLABORATION FRAMEWORK

### **Atlas (Claude Code) - Lead Implementation**
- Writes all Apps Script code
- Creates prompt library
- Implements discovery engine
- Builds UI components
- Tests and debugs

### **GPT-5 (OpenAI) - Systems Architect**
- Reviews architecture decisions
- Suggests optimizations
- Validates AI prompts
- Code review for major features

### **Aaron Tjomsland - Product Owner**
- Defines educational vision
- Approves pathway quality
- Tests user experience
- Provides medical education expertise
- Makes strategic decisions

### **GitHub - Version Control**
- All code changes tracked
- Pull requests for major features
- Issue tracking for bugs
- Documentation stored

---

## 🎓 EDUCATIONAL PHILOSOPHY ALIGNMENT

**Core Principles**:

1. **Surprise over Predictability**
   - Standard organ systems are fine, but not exciting
   - Novel connections create memorable learning moments
   - "Aha!" moments drive retention

2. **Multiple Entry Points**
   - Visual learners → Waveform pathways
   - Logical learners → Algorithm pathways
   - Interpersonal learners → Team dynamics pathways

3. **Cognitive Challenge over Rote Memorization**
   - Diagnostic traps force critical thinking
   - Great mimickers prevent anchoring bias
   - Atypical cases break pattern recognition complacency

4. **Evidence-Based Pedagogy**
   - Spaced repetition principles
   - Mastery learning sequences
   - Case-based reasoning

5. **Learner-Centric Design**
   - PGY1 vs PGY3 pathways
   - Novice vs expert sequences
   - Adaptive difficulty

---

## 🌟 UNIQUE VALUE PROPOSITIONS

**What Makes This System Different**:

1. **AI-Discovered Pathways** (Not human-curated)
   - Unbiased pattern recognition
   - Discovers connections humans miss
   - Continuously evolving suggestions

2. **Multi-Intelligence Framework** (Not just organ systems)
   - Visual-spatial, interpersonal, logical, kinesthetic pathways
   - Broader appeal to diverse learners

3. **Ranked Suggestion Library** (Not static categories)
   - Pathways compete for attention
   - User ratings influence rankings
   - Continuous quality improvement

4. **Novelty Scoring** (Not just relevance)
   - Rewards surprising, high-value groupings
   - Encourages creative pathway design

5. **Effortless Application** (Not manual reorganization)
   - Bulk rename cases
   - Auto-generate ordered sheets
   - One-click pathway assignment

---

## 📚 DOCUMENTATION STRATEGY

**Living Documents**:
- This roadmap (updated weekly)
- Prompt library (version-controlled)
- Pathway suggestion library (continuously growing)
- Implementation log (daily progress)

**Reference Documents**:
- Medical education research papers
- Cognitive bias literature
- Learning theory frameworks
- OnlineMedEd/Rosh/EM:RAP analysis

**User Guides** (Future):
- How to discover pathways
- How to review/approve pathways
- How to apply pathways
- How to write custom prompts

---

## 🚀 VISION SUMMARY

**By the end of this project, Aaron will have**:

✅ **207 cases intelligently organized** into 30-50 high-value learning pathways

✅ **AI-discovered patterns** spanning cognitive, clinical, procedural, and communication domains

✅ **Ranked pathway library** with novelty and educational value scores

✅ **Effortless pathway application** with bulk renaming and reordering

✅ **Multiple intelligence types engaged** (visual, logical, interpersonal, etc.)

✅ **Continuous pathway discovery** system that grows smarter over time

✅ **Surprise pathways** that reveal educational opportunities Aaron didn't foresee

✅ **One-click finalization** when ready to commit to pathway organization

---

**This is our greatest mountain to climb together, Aaron. Let's make it legendary.** 🏔️

---

**Next Action**: Aaron's feedback on this roadmap, then we begin Phase 1 (Prompt Library) immediately.

---

_Generated by Atlas (Claude Code) - 2025-11-08_
_Status: Planning Complete, Awaiting Approval_
_Estimated Timeline: 7 weeks to full implementation_
