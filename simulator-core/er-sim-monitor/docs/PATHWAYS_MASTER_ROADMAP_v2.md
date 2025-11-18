# 🧭 PATHWAYS MASTER ROADMAP v2.0
## AI-Powered Learning Pathway Discovery & Organization System

**Date**: 2025-11-08 (Updated after Aaron's feedback)
**Version**: 2.0 - COMPREHENSIVE REFINEMENT
**Status**: Planning Complete - Ready for Implementation
**Lead Architect**: Atlas (Claude Code)
**Project Owner**: Aaron Tjomsland

---

## 📋 CHANGE LOG FROM v1.0

### Aaron's Key Refinements:

1. ✅ **Dynamic Logic Type System** - Growing dropdown with "Create New Logic Type" button
2. ✅ **Pathway Naming Tool** - AI suggests 10 variations (like Spark/Reveal titles)
3. ✅ **Case ID Preservation** - Keep 7-char adults/8-char peds, only adjust sequence numbers
4. ✅ **Category Accronym System** - Case ID prefix reflects category membership
5. ✅ **Enhanced Ranking Algorithm** - Educational × Novelty × Market Validation (real pathways learnings)
6. ✅ **Library-First Workflow** - Build suggestion library, refine/delete easily, apply when ready
7. ✅ **Apps Script vs Manual** - Clarified: Build Apps Script functions, work interactively with Aaron

---

## 🎯 VISION (REFINED)

**Transform 207 emergency medicine simulation cases into intelligently organized, AI-discovered learning pathways that:**

1. **Go beyond predictable** medical education groupings
2. **Discover emergent patterns** humans might miss
3. **Maximize educational value** through surprising, high-impact sequences
4. **Encourage multiple intelligence types** via dynamic logic type library
5. **Continuously grow** a ranked library of pathway suggestions (Educational × Novelty × Market Validation)
6. **Make renaming/reordering effortless** when ready to finalize
7. **Allow custom logic type creation** with AI-assisted persona generation
8. **Provide pathway naming tool** that suggests 10 compelling variations
9. **Preserve Case ID integrity** while enabling sequence-based reordering

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
- **Generate compelling pathway names** that sell the value
- **Create custom logic types** based on Aaron's creative direction

**Example Novel Pathways AI Might Discover**:
- "The Diagnostic Traps Collection" - Cases that fool even experts
- "When Classic Isn't Classic" - Atypical presentations
- "The Great Mimickers" - Non-cardiac cases presenting as cardiac emergencies
- "Cognitive Debiasing Series" - Fighting anchoring, availability, confirmation bias
- "The 3 AM Disasters" - Low-frequency, high-stakes cases

---

## 🏗️ COMPLETE TECHNOLOGY ARCHITECTURE (REFINED)

### **NEW: Dynamic Logic Type System**

**Purpose**: Ever-growing dropdown of logic types (discovery lenses) for pathway generation

**UI Component**:
```
┌────────────────────────────────────────────────────────────┐
│ 🧠 Select Logic Type (Discovery Lens)                     │
├────────────────────────────────────────────────────────────┤
│ [Dropdown: Select Logic Type              ▼]              │
│   - Visual-Spatial Intelligence (Waveform Patterns)        │
│   - Logical-Mathematical (Diagnostic Algorithms)           │
│   - Interpersonal Intelligence (Team Dynamics)             │
│   - Cognitive Bias Exposure (Diagnostic Traps)             │
│   - The Great Mimickers (Cross-System Mimicry)             │
│   - The Contrarian's Collection (Challenge Wisdom)         │
│   - Multi-Intelligence Hybrid (Dual-Mode Learning)         │
│   - [Custom Logic Type 1 - User Created]                   │
│   - [Custom Logic Type 2 - User Created]                   │
│   ─────────────────────────────────────────────────────    │
│   🎨 Create New Logic Type...                              │
│                                                            │
│ [🤖 Discover Pathways with Selected Logic]                │
└────────────────────────────────────────────────────────────┘
```

**Workflow: "Create New Logic Type"**:

```
User clicks "🎨 Create New Logic Type..."
        ↓
Modal appears:
┌────────────────────────────────────────────────────────────┐
│ 🎨 Create Custom Logic Type                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Logic Type Name:                                           │
│ [_____________________________________________]            │
│                                                            │
│ Describe your vision for this logic type:                 │
│ (What pattern should AI look for?)                        │
│ ┌────────────────────────────────────────────────────┐   │
│ │                                                      │   │
│ │ Example: "Cases where the patient's chief          │   │
│ │ complaint is completely different from the actual   │   │
│ │ diagnosis. Focus on cases where listening to the   │   │
│ │ patient leads you astray."                          │   │
│ │                                                      │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ Target Intelligence Type (optional):                      │
│ [Dropdown: Multiple Intelligences               ▼]       │
│                                                            │
│ [🤖 Generate Logic Type Prompt] [Cancel]                  │
└────────────────────────────────────────────────────────────┘
        ↓
AI generates persona + prompt structure
        ↓
User reviews generated logic type
        ↓
User approves → Added to dropdown ✅
```

**Backend Storage**: `Logic_Type_Library` sheet

**Schema**:
```
Column A: Logic_Type_ID (auto-generated)
Column B: Logic_Type_Name
Column C: Description (user's vision)
Column D: AI_Generated_Persona (e.g., "Dr. Sarah Chen, expert in...")
Column E: Full_Prompt_Template
Column F: Intelligence_Type (if specified)
Column G: Date_Created
Column H: Times_Used (usage counter)
Column I: Avg_Pathway_Quality (auto-calculated from pathway ratings)
Column J: Status (active/archived)
```

**AI Logic Type Generation**:
```javascript
function generateCustomLogicType(userVision, logicTypeName, intelligenceType) {
  const prompt = `
You are an expert in curriculum design and AI prompt engineering.

The user wants to create a custom "logic type" (discovery lens) for finding learning pathways in emergency medicine cases.

USER'S VISION:
"${userVision}"

LOGIC TYPE NAME:
"${logicTypeName}"

TARGET INTELLIGENCE TYPE (if any):
"${intelligenceType || 'Not specified'}"

YOUR TASK:
Generate a complete prompt template following this structure:

1. PERSONA: Create a fictional expert persona (name, credentials, specialty)
   Example: "You are Dr. Marcus Chen, a Harvard-trained emergency physician..."

2. SPECIALTY: What this persona is known for
   Example: "Your specialty: Teaching residents to recognize..."

3. FOCUS AREAS: 5-7 specific pattern types to look for

4. PATHWAY REQUIREMENTS: Same structure as other logic types
   - Catchy name
   - Why it matters
   - Learning outcomes
   - Novelty score
   - Target learner
   - Unique value proposition
   - Case sequence

5. CREATIVE CONSTRAINTS: What to avoid, what to emphasize

Return JSON:
{
  "persona_name": "Dr. [Name]",
  "persona_credentials": "[Title and background]",
  "specialty_description": "[What they're known for]",
  "focus_areas": ["Area 1", "Area 2", ...],
  "full_prompt_template": "[Complete prompt text ready to use]",
  "expected_pathway_count": 3-5
}
`;

  const response = callOpenAI(prompt);
  return JSON.parse(response);
}
```

**Example Custom Logic Type**:

**User Input**: "Cases where the patient's chief complaint is completely different from the actual diagnosis"

**AI Generates**:
```
Persona: Dr. Lisa Mislead, a diagnostic expert specializing in "presentation paradoxes"

Specialty: Teaching residents that chief complaint can be the biggest red herring

Full Prompt:
"You are Dr. Lisa Mislead, an expert in diagnostic misdirection cases.
Your specialty: Finding cases where the patient leads you down the wrong path.

Analyze these 207 cases and discover 3-5 PRESENTATION PARADOX pathways.

Focus on:
- Chief complaint → Actual diagnosis mismatch
- Cases where patient history misleads
- Scenarios where listening TOO carefully causes anchoring
- Diagnosis requires ignoring chief complaint

For each pathway:
1. CATCHY NAME (paradox-focused)
2. WHY IT MATTERS (the misdirection hook)
3. LEARNING OUTCOMES...
[etc.]"
```

**User Reviews** → Approves → Added to dropdown ✅

---

### **NEW: Pathway Naming Tool (AI-Powered)**

**Purpose**: Generate 10 compelling pathway name variations (like Spark/Reveal titles)

**Trigger**: When pathway is created or user clicks "✏️ Rename Pathway"

**UI Component**:
```
┌────────────────────────────────────────────────────────────┐
│ ✏️ Pathway Naming Tool                                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Current Name:                                              │
│ "The Diagnostic Traps Collection"                         │
│                                                            │
│ AI-Suggested Names (10 variations):                       │
│                                                            │
│ ACADEMIC STYLE:                                            │
│ ○ 1. "Cognitive Debiasing Through Diagnostic Traps"       │
│ ○ 2. "Anchoring Bias Recognition Series"                  │
│                                                            │
│ COMPELLING/DRAMATIC:                                       │
│ ○ 3. "When Experts Get It Wrong: The Trap Collection"     │
│ ● 4. "The Diagnostic Minefield" (SELECTED)                │
│ ○ 5. "Fooled Again: Classic Diagnostic Traps"             │
│                                                            │
│ LEARNER-CENTRIC:                                           │
│ ○ 6. "Your Diagnosis Was Wrong: Here's Why"               │
│ ○ 7. "The Humility Series: Cases That Fool Everyone"      │
│                                                            │
│ ACTION-ORIENTED:                                           │
│ ○ 8. "Avoid These Traps: Diagnostic Safety Series"        │
│ ○ 9. "Break Free from Anchoring Bias"                     │
│                                                            │
│ CREATIVE/METAPHORICAL:                                     │
│ ○ 10. "The Red Herring Collection"                        │
│                                                            │
│ [Use Selected Name] [Generate 10 More] [Custom Name...]   │
└────────────────────────────────────────────────────────────┘
```

**Backend Implementation**:
```javascript
function generatePathwayNames(currentName, caseDescriptions, targetAudience) {
  const prompt = `
You are a marketing expert specializing in medical education product naming.

CURRENT PATHWAY NAME:
"${currentName}"

PATHWAY DETAILS:
- Cases: ${caseDescriptions.join(', ')}
- Target Audience: ${targetAudience}

YOUR TASK:
Generate 10 alternative pathway names that maximize appeal to ED clinicians.

NAMING CATEGORIES (2 names each):
1. ACADEMIC STYLE - Formal, research-oriented
2. COMPELLING/DRAMATIC - Attention-grabbing, memorable
3. LEARNER-CENTRIC - Speaks to learner's experience
4. ACTION-ORIENTED - Emphasizes skill/outcome
5. CREATIVE/METAPHORICAL - Uses metaphors, imagery

REQUIREMENTS:
- Each name should "sell" the value immediately
- Avoid boring medical jargon
- Make learners WANT to take this pathway
- Keep names under 60 characters

Return JSON:
{
  "academic": ["Name 1", "Name 2"],
  "compelling": ["Name 3", "Name 4", "Name 5"],
  "learner_centric": ["Name 6", "Name 7"],
  "action_oriented": ["Name 8", "Name 9"],
  "creative": ["Name 10"]
}
`;

  const response = callOpenAI(prompt);
  return JSON.parse(response);
}
```

**Integration Points**:
- Pathway creation flow (auto-suggest names)
- Pathway editing (rename button)
- Bulk naming (apply naming logic to multiple pathways)

**Editable Field**: Like Spark/Reveal titles, pathway names are always editable

---

### **REFINED: Case ID System (Preserve + Sequence)**

**Core Principle**: Keep existing Case ID structure, only adjust sequence numbers

**Current Case ID Format**:
- **Adults**: 7 characters (e.g., `CARD001`)
  - Positions 1-4: Category accronym (`CARD`, `RESP`, `NEUR`, etc.)
  - Positions 5-7: Sequence number (`001`, `002`, etc.)

- **Pediatrics**: 8 characters (e.g., `PCARD001`)
  - Position 1: `P` prefix
  - Positions 2-5: Category accronym (`CARD`, `RESP`, etc.)
  - Positions 6-8: Sequence number (`001`, `002`, etc.)

**What Changes**: ONLY the sequence numbers (last 3 digits)

**When It Changes**: After Aaron finalizes pathway chain order

**Example Transformation**:

**Before Pathway Assignment**:
```
Row 15: CARD042 - Chest Pain (random order)
Row 89: CARD018 - STEMI (random order)
Row 123: CARD005 - Cardiogenic Shock (random order)
```

**After Pathway Chain Ordering**:
```
Pathway: "Cardiac Emergencies: Foundation to Mastery"
Case 1 (Row 15): CARD001 - Chest Pain (now first in sequence)
Case 2 (Row 89): CARD002 - STEMI (now second)
Case 3 (Row 123): CARD003 - Cardiogenic Shock (now third)
```

**Category Accronym Reflects Category Assignment**:

When Aaron assigns cases to categories:
- `Case_Organization:Category = "Cardiovascular"` → Case ID = `CARD###`
- `Case_Organization:Category = "Respiratory"` → Case ID = `RESP###`
- `Case_Organization:Category = "Neurological"` → Case ID = `NEUR###`

**If Category Changes** (rare):
- Old: `CARD042` (was Cardiovascular)
- New category assigned: "Toxicological"
- New Case ID: `TOXI001` (accronym updated + sequence reset)

**Implementation**:
```javascript
function adjustCaseIDSequencing(pathwayChain, categoryAcronym) {
  // pathwayChain = ordered array of case objects
  // categoryAcronym = "CARD", "RESP", etc.

  const updatedCaseIDs = [];

  pathwayChain.forEach((caseObj, index) => {
    const sequenceNumber = String(index + 1).padStart(3, '0'); // 001, 002, 003...

    // Check if pediatric (starts with 'P')
    const isPediatric = caseObj.originalCaseID.startsWith('P');

    const newCaseID = isPediatric
      ? `P${categoryAcronym}${sequenceNumber}`  // PCARD001
      : `${categoryAcronym}${sequenceNumber}`;   // CARD001

    updatedCaseIDs.push({
      originalCaseID: caseObj.originalCaseID,
      newCaseID: newCaseID,
      row: caseObj.row,
      reason: 'Pathway sequence adjustment'
    });
  });

  return updatedCaseIDs;
}
```

**Safety Checks**:
- Detect Case ID conflicts (two cases want same ID)
- Preview all changes before applying
- Audit log of all Case ID changes
- Undo functionality

**Category Accronym Library** (Standard + Custom):

**Standard Categories**:
- `CARD` - Cardiovascular
- `RESP` - Respiratory
- `NEUR` - Neurological
- `GAST` - Gastrointestinal
- `ENDO` - Endocrine
- `RENA` - Renal
- `HEME` - Hematologic
- `TOXI` - Toxicological
- `TRAU` - Trauma
- `INFX` - Infectious
- `GYNE` - Gynecological
- `PSYC` - Psychiatric
- `DERM` - Dermatologic
- `OPHT` - Ophthalmologic
- `ORTHO` - Orthopedic

**Pediatric Prefix**: Add `P` (e.g., `PCARD`, `PRESP`)

**Custom Categories**: User can create new accronyms (4 characters max)

---

### **ENHANCED: Ranking Algorithm (3-Factor Scoring)**

**Purpose**: Rank pathway suggestions by Educational Value × Novelty × Market Validation

**Three Scoring Factors**:

#### 1. **Educational Value Score** (1-10)
**What It Measures**: Pedagogical impact, learning outcomes clarity, skill development

**AI Evaluates**:
- Are learning outcomes specific and measurable?
- Does progression build logically?
- Does pathway fill a skill gap?
- Is target audience appropriate?
- Does sequence maximize retention?

**Example High Score (9/10)**:
```
Pathway: "The Diagnostic Traps Collection"
- Specific outcome: "Recognize anchoring bias in real-time"
- Clear progression: Subtle trap → Obvious trap → Cascading traps
- Fills gap: Most residents struggle with bias awareness
- Measurable: Can test bias recognition before/after
```

**Example Low Score (4/10)**:
```
Pathway: "Cardiac Cases Collection"
- Vague outcome: "Learn about cardiac emergencies"
- No clear progression: Random cardiac cases
- Generic: Every curriculum has cardiac cases
- Not measurable: No specific skill targeted
```

#### 2. **Novelty Score** (1-10)
**What It Measures**: Creativity, unexpectedness, differentiation from traditional pathways

**AI Evaluates**:
- How surprising is this grouping?
- Does it challenge conventional curriculum design?
- Is this pattern non-obvious?
- Would expert educators say "I never thought of that"?

**Example High Score (10/10)**:
```
Pathway: "The Contrarian's Collection: When Less Is More"
- Highly unexpected: Cases where doing nothing was best
- Challenges wisdom: Aggressive treatment = good
- Non-obvious pattern: Restraint as skill
- Expert reaction: "Brilliant - we overtrain action"
```

**Example Low Score (3/10)**:
```
Pathway: "All Cardiac Cases"
- Predictable: Organ system grouping
- Standard curriculum design
- Obvious pattern: Heart-related cases
- Expert reaction: "Yeah, that's how we always do it"
```

#### 3. **Market Validation Score** (1-10) - NEW!
**What It Measures**: Alignment with PROVEN successful pathways already selling in EM education

**Data Sources**:
- OnlineMedEd pathway structures (organ system → clinical presentation)
- Rosh Review question groupings (board exam topics)
- EM:RAP curriculum (C3 → Main Episodes → Crunch Time progression)
- Best-selling EM courses (real market data)

**AI Evaluates**:
- Does this pathway structure match proven successful patterns?
- Is the naming style similar to best-sellers?
- Does target audience align with market demand?
- Is progression complexity matched to learner needs?

**Example High Score (9/10)**:
```
Pathway: "ACLS Protocol Mastery: Beginner to Expert"
- Matches OnlineMedEd structure: System → Skill progression
- Naming style: Clear value proposition (like Rosh Review)
- Target audience: PGY1-2 (high demand segment)
- Progression: Foundational → Advanced (EM:RAP C3 model)
- Market proof: ACLS courses sell extremely well
```

**Example Low Score (4/10)**:
```
Pathway: "Random Interesting Cases I Found"
- No proven structure
- Vague naming (doesn't sell value)
- Unclear target audience
- No progression logic
- No market precedent
```

**Market Validation Prompt**:
```javascript
function calculateMarketValidationScore(pathway) {
  const prompt = `
You are an expert in emergency medicine education market trends.

PATHWAY TO EVALUATE:
Name: ${pathway.name}
Description: ${pathway.description}
Target Audience: ${pathway.targetLearner}
Case Count: ${pathway.caseIds.length}
Progression: ${pathway.caseSequence}

PROVEN SUCCESSFUL PATTERNS (Reference):
1. OnlineMedEd: Organ system → Clinical presentation → Board prep
2. Rosh Review: Subject-based, difficulty-tiered, exam-focused
3. EM:RAP: C3 (foundational) → Main (mixed) → Crunch Time (advanced)
4. Best-selling EM courses: ACLS, ATLS, Ultrasound, Procedures

YOUR TASK:
Rate this pathway's alignment with PROVEN market winners (1-10).

EVALUATION CRITERIA:
- Structure similarity to successful pathways (40%)
- Naming/marketing appeal (20%)
- Target audience market demand (20%)
- Progression logic clarity (20%)

Return JSON:
{
  "market_validation_score": 8,
  "reasoning": "Aligns with EM:RAP tiered progression model...",
  "similar_successful_products": ["EM:RAP C3", "OnlineMedEd ACLS"],
  "market_demand_level": "High - PGY1-2 is largest learner segment"
}
`;

  const response = callOpenAI(prompt);
  return JSON.parse(response);
}
```

**Composite Score Formula**:

```javascript
function calculateCompositePathwayScore(pathway) {
  const educationalValue = pathway.educational_value_score; // 1-10
  const novelty = pathway.novelty_score; // 1-10
  const marketValidation = pathway.market_validation_score; // 1-10

  // Weighted average (weights sum to 1.0)
  const weights = {
    educational: 0.50,  // 50% - Most important
    novelty: 0.25,      // 25% - Important for differentiation
    market: 0.25        // 25% - Important for adoption
  };

  const compositeScore =
    (educationalValue * weights.educational) +
    (novelty * weights.novelty) +
    (marketValidation * weights.market);

  return {
    composite_score: compositeScore, // Max 10.0
    breakdown: {
      educational_value: educationalValue,
      novelty: novelty,
      market_validation: marketValidation
    },
    ranking_tier: getRankingTier(compositeScore)
  };
}

function getRankingTier(score) {
  if (score >= 9.0) return 'S-Tier (Must Build)';
  if (score >= 8.0) return 'A-Tier (Highly Recommended)';
  if (score >= 7.0) return 'B-Tier (Good)';
  if (score >= 6.0) return 'C-Tier (Consider)';
  return 'D-Tier (Low Priority)';
}
```

**Example Scored Pathway**:
```
Pathway: "The Diagnostic Traps Collection"

Educational Value: 9/10
- Clear learning outcomes
- Logical progression
- Fills critical bias awareness gap

Novelty: 9/10
- Highly creative grouping
- Cognitive psychology focus rare in EM curriculum

Market Validation: 7/10
- No direct market precedent
- But aligns with growing "bias awareness" trend
- Similar to Harvard "Thinking Fast and Slow" medical course

COMPOSITE SCORE: 8.5/10
RANKING TIER: A-Tier (Highly Recommended)
```

---

### **REFINED: Pathway Suggestion Library (Storage + UI)**

**Purpose**: Persistent storage of ALL AI-suggested pathways with 3-factor ranking

**Storage**: Google Sheet tab `Pathway_Suggestion_Library`

**Schema** (Updated):
```
Column A: Pathway_ID (auto-generated, e.g., PATH_001)
Column B: Pathway_Name
Column C: Description
Column D: Logic_Type_Used (which discovery lens)
Column E: Intelligence_Type
Column F: Educational_Value_Score (1-10)
Column G: Novelty_Score (1-10)
Column H: Market_Validation_Score (1-10)
Column I: Composite_Score (calculated)
Column J: Ranking_Tier (S/A/B/C/D)
Column K: Case_Count
Column L: Case_IDs (JSON array)
Column M: Case_Sequence (ordered JSON)
Column N: Target_Learner
Column O: Unique_Value_Proposition
Column P: Discovery_Date
Column Q: Discovery_Prompt_Used
Column R: User_Rating (null initially, 1-10 after Aaron rates)
Column S: Times_Viewed (usage counter)
Column T: Times_Built (applied to pathways)
Column U: Status (suggested/approved/archived/deleted)
Column V: Notes (Aaron's freeform notes)
```

**UI: Browse Suggestion Library**

```
┌────────────────────────────────────────────────────────────┐
│ 📚 Pathway Suggestion Library (127 discovered)            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Sort by: [Composite Score ▼] Filter: [All Status ▼]      │
│                                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 🏆 S-TIER PATHWAYS (Must Build)                    │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ 1. "The Diagnostic Traps Collection"                      │
│    ⭐ 8.5/10 | 🧠 Cognitive | 💡 Novelty: 9/10            │
│    📊 Educational: 9/10 | 📈 Market: 7/10                 │
│    🎯 8 cases | 👥 PGY2-3                                 │
│    "Cases that fool even expert clinicians..."            │
│    [✏️ Rename] [👁️ View Cases] [✅ Approve] [🗑️ Archive]│
│                                                            │
│ 2. "When Classic Isn't Classic"                           │
│    ⭐ 8.2/10 | 🩺 Clinical | 💡 Novelty: 8/10             │
│    📊 Educational: 8/10 | 📈 Market: 8/10                 │
│    🎯 12 cases | 👥 PGY1-3                                │
│    "Atypical presentations of common EM conditions..."    │
│    [✏️ Rename] [👁️ View Cases] [✅ Approve] [🗑️ Archive]│
│                                                            │
│ ┌────────────────────────────────────────────────────┐   │
│ │ 🥇 A-TIER PATHWAYS (Highly Recommended)            │   │
│ └────────────────────────────────────────────────────┘   │
│                                                            │
│ 3. "Waveform Pattern Mastery"                             │
│    ⭐ 8.0/10 | 👁️ Visual-Spatial | 💡 Novelty: 7/10      │
│    [Details...]                                            │
│                                                            │
│ [Show B-Tier (15)] [Show C-Tier (8)] [Show Archived (3)] │
│                                                            │
│ [🔍 Discover More Pathways] [📊 Export Library]           │
└────────────────────────────────────────────────────────────┘
```

**Interactive Actions**:

1. **✏️ Rename** → Opens pathway naming tool (10 AI suggestions)
2. **👁️ View Cases** → Shows case list + sequencing + rationale
3. **✅ Approve** → Moves to "Approved Pathways" (ready to build)
4. **🗑️ Archive** → Soft delete (can restore later)
5. **⭐ Rate** → User adds 1-10 rating (influences future rankings)

**Refinement Workflow**:
```
Browse Library
    ↓
Find interesting pathway
    ↓
View cases (are these the right cases?)
    ↓
Rename if needed (10 AI suggestions)
    ↓
Adjust case list (add/remove cases)
    ↓
Re-rank based on edits
    ↓
Approve → Moves to "Ready to Build" queue
```

**Deletion Policy**:
- Soft delete (Status = 'archived')
- Can restore from archive
- Hard delete only after 90 days in archive
- Audit log of all deletions

---

### **Stage-by-Stage Flow (REFINED)**

```
┌─────────────────────────────────────────────────────────┐
│ STAGE 1: Dynamic Logic Type Selection (NEW)            │
│ User selects from growing dropdown OR creates new      │
│ - Pre-built logic types (7 initial)                    │
│ - Custom logic types (user-created)                    │
│ - "Create New Logic Type" → AI assists                 │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 2: Batch Cache (✅ COMPLETE)                     │
│ Field_Cache_Incremental                                 │
│ - 207 rows × 35 fields                                  │
│ - AI-optimized field selection                          │
│ - Token-efficient data format                           │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 3: AI Discovery Engine (ENHANCED)                │
│ Load selected logic type prompt                         │
│ - Inject cache data                                     │
│ - Call OpenAI API                                       │
│ - Parse pathway suggestions                             │
│ - Calculate 3-factor scores (Educational × Novelty ×   │
│   Market Validation)                                    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 4: Suggestion Library Storage (NEW)              │
│ Pathway_Suggestion_Library sheet                        │
│ - Append new pathways (never replace)                   │
│ - Detect duplicates (>80% name similarity)             │
│ - Calculate composite scores                            │
│ - Rank by S/A/B/C/D tiers                               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 5: User Review & Refinement (ENHANCED)           │
│ Interactive Library Browser                             │
│ - Browse by tier (S/A/B/C/D)                            │
│ - Rename pathways (10 AI suggestions)                   │
│ - View/edit case lists                                  │
│ - Rate pathways (1-10)                                  │
│ - Archive/delete low-value pathways                     │
│ - Approve pathways → "Ready to Build" queue             │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 6: Pathway Chain Building (FUTURE)               │
│ Drag-and-drop case ordering                             │
│ - Visualize pathway sequence                            │
│ - Swap alternative cases                                │
│ - AI rationale for ordering                             │
│ - Finalize sequence                                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ STAGE 7: Pathway Application (REFINED)                 │
│ Apply finalized pathways to Master sheet                │
│ - Update Pathway_Name column                            │
│ - Adjust Case ID sequence numbers (preserve accronym)   │
│ - Generate pathway-based ordering                       │
│ - Create Master_Pathway_Ordered sheet                   │
│ - Audit log all changes                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 IMPLEMENTATION PHASES (REFINED)

### **Phase 1: Dynamic Logic Type System** (Week 1)

**Objective**: Build ever-growing logic type library with custom creation

**Tasks**:
- [ ] Create `Logic_Type_Library` sheet (schema above)
- [ ] Populate with 7 initial logic types (from prompt library)
- [ ] Build dropdown UI (dynamic, loads from sheet)
- [ ] Implement "Create New Logic Type" modal
- [ ] Build AI logic type generator (persona + prompt creation)
- [ ] Add logic type preview/approval flow
- [ ] Test custom logic type creation (Aaron creates 2-3)

**Deliverables**:
- Dynamic logic type dropdown ✅
- 7 initial logic types ✅
- Custom logic type creator ✅
- 2-3 Aaron-created logic types ✅

**Success Criteria**:
- Dropdown loads all logic types from sheet
- "Create New Logic Type" generates usable prompts
- Aaron successfully creates custom logic type
- Custom logic type generates quality pathways

---

### **Phase 2: Pathway Naming Tool** (Week 2)

**Objective**: AI-powered pathway naming (10 variations, like Spark/Reveal)

**Tasks**:
- [ ] Build pathway naming prompt template
- [ ] Implement `generatePathwayNames()` function
- [ ] Create naming tool UI modal
- [ ] Add 5 naming categories (Academic, Compelling, Learner, Action, Creative)
- [ ] Integrate into pathway creation flow
- [ ] Add "Rename Pathway" button to library browser
- [ ] Test with 10 pathways (verify name quality)

**Deliverables**:
- Pathway naming tool UI ✅
- 10-variation name generator ✅
- Integration with library browser ✅

**Success Criteria**:
- Generates 10 diverse, compelling names
- Names are editable (like Spark/Reveal)
- Aaron approves name quality
- Naming increases pathway appeal

---

### **Phase 3: 3-Factor Ranking System** (Week 3)

**Objective**: Implement Educational × Novelty × Market Validation scoring

**Tasks**:
- [ ] Build Educational Value scoring prompt
- [ ] Build Novelty scoring prompt (already exists in v7.2)
- [ ] Build Market Validation scoring prompt (NEW)
- [ ] Implement composite score calculation
- [ ] Add S/A/B/C/D tier classification
- [ ] Update library schema with new score columns
- [ ] Re-rank existing pathways with 3-factor system
- [ ] Add score breakdown display in UI

**Deliverables**:
- 3-factor scoring system ✅
- Tier-based ranking ✅
- Score breakdown UI ✅

**Success Criteria**:
- Market validation scores align with proven pathways
- Composite scores create intuitive rankings
- S-tier pathways are genuinely high-value
- Aaron agrees with tier classifications

---

### **Phase 4: Suggestion Library + Browser UI** (Week 4)

**Objective**: Persistent storage + interactive refinement UI

**Tasks**:
- [ ] Create `Pathway_Suggestion_Library` sheet (full schema)
- [ ] Implement append/deduplicate logic
- [ ] Build library browser UI (tier-based browsing)
- [ ] Add interactive actions (Rename, View, Approve, Archive)
- [ ] Implement soft delete (archive functionality)
- [ ] Add user rating system (1-10 stars)
- [ ] Build export functionality (JSON, CSV)
- [ ] Add search/filter capabilities

**Deliverables**:
- Persistent pathway library ✅
- Interactive browser UI ✅
- Refinement actions ✅
- Export functionality ✅

**Success Criteria**:
- Library persists 100+ pathways without issues
- Browsing is fast (<2 seconds load time)
- Refinement actions are intuitive
- Aaron can easily find high-value pathways

---

### **Phase 5: Discovery Execution Engine** (Week 5)

**Objective**: Execute logic type prompts → Generate pathways → Store in library

**Tasks**:
- [ ] Implement prompt rotation system
- [ ] Build cache data injection (Field_Cache_Incremental → Prompt)
- [ ] Add OpenAI API call wrapper (with retries, error handling)
- [ ] Implement pathway parsing (JSON → Library schema)
- [ ] Add 3-factor scoring automation
- [ ] Build duplicate detection (>80% name similarity)
- [ ] Create discovery progress UI (live updates)
- [ ] Test with all 7 initial logic types

**Deliverables**:
- Discovery execution engine ✅
- Progress tracking UI ✅
- 30-50 initial pathway suggestions ✅

**Success Criteria**:
- All 7 logic types execute successfully
- Generates 30-50 pathways total
- No duplicate pathways stored
- Scores are calculated automatically
- Aaron approves pathway quality

---

### **Phase 6: Case ID Sequencing System** (Week 6)

**Objective**: Preserve Case ID structure, adjust sequence numbers only

**Tasks**:
- [ ] Document category accronym library (CARD, RESP, etc.)
- [ ] Implement `adjustCaseIDSequencing()` function
- [ ] Add pediatric prefix logic (`P` + accronym)
- [ ] Build Case ID conflict detection
- [ ] Create preview UI (show before/after)
- [ ] Add audit logging (all Case ID changes)
- [ ] Implement undo functionality
- [ ] Test with sample pathway chain

**Deliverables**:
- Case ID sequencing system ✅
- Preview + undo functionality ✅
- Audit logging ✅

**Success Criteria**:
- Preserves 7-char (adult) / 8-char (pediatric)
- Category accronyms stay correct
- Sequence numbers reflect pathway order
- No Case ID conflicts
- Undo restores previous state

---

### **Phase 7: Pathway Application Workflow** (Week 7)

**Objective**: Apply approved pathways to Master sheet

**Tasks**:
- [ ] Build "Approved Pathways" queue
- [ ] Implement bulk Pathway_Name update
- [ ] Integrate Case ID sequencing (from Phase 6)
- [ ] Create Master_Pathway_Ordered sheet generator
- [ ] Add pathway-based sorting algorithm
- [ ] Build application preview (before applying)
- [ ] Implement rollback system (restore Master sheet)
- [ ] Add success/failure reporting

**Deliverables**:
- Pathway application engine ✅
- Master_Pathway_Ordered sheet ✅
- Preview + rollback ✅

**Success Criteria**:
- Can apply 5 pathways (60+ cases) in <30 seconds
- Preview shows exact changes
- Rollback works 100%
- Master sheet never corrupted
- Aaron approves final organization

---

## 📊 APPS SCRIPT SIZE PROJECTION (UPDATED)

**Current State**:
- Total lines: 3,290
- Total functions: 92
- File size: ~112 KB
- Google Apps Script limit: 150 KB (38 KB headroom)

**New Features (Estimated Additions)**:

| Feature | Lines | KB |
|---------|-------|-----|
| Dynamic Logic Type System | ~300 | ~4 KB |
| Logic Type Creator (AI-assisted) | ~200 | ~3 KB |
| Pathway Naming Tool (10 variations) | ~250 | ~3 KB |
| 3-Factor Ranking System | ~300 | ~4 KB |
| Market Validation Scoring | ~200 | ~3 KB |
| Suggestion Library Storage | ~250 | ~3 KB |
| Library Browser UI | ~400 | ~5 KB |
| Discovery Execution Engine | ~250 | ~3 KB |
| Case ID Sequencing | ~200 | ~3 KB |
| Pathway Application | ~300 | ~4 KB |
| **TOTAL NEW CODE** | **~2,650** | **~35 KB** |

**Projected Final Size**: ~147 KB ✅ **WITHIN LIMITS** (3 KB buffer)

**Recommendation**: ✅ **CONTINUE AS MONOLITHIC FILE**

**Rationale**:
- All features tightly integrated
- Shared helper functions reduce duplication
- Single deployment unit (easier to manage)
- Performance excellent (no observed lag)
- Modular organization via comment headers

**Contingency Plan** (if approaching 150 KB):
- Extract utility functions to Apps Script library
- Compress repetitive HTML templates
- Move large prompts to sheet storage (load dynamically)

---

## 🎯 SUCCESS METRICS (UPDATED)

### **Discovery Quality**

**Target Metrics**:
- Educational Value average: ≥8/10
- Novelty score average: ≥7.5/10
- Market Validation average: ≥7/10
- Composite score average: ≥7.5/10
- User approval rate: ≥60% of S/A-tier pathways

### **Logic Type System**

**Target Metrics**:
- Initial logic types: 7
- Custom logic types created (by Aaron): ≥3
- Logic type diversity: All 7 intelligence types represented
- Custom logic type quality: ≥70% generate usable pathways

### **Pathway Naming**

**Target Metrics**:
- Name variation quality: ≥8/10 (Aaron's rating)
- Name selection rate: Aaron selects AI suggestion ≥70% of time
- Name editing rate: <30% of names require manual editing

### **Library Growth**

**Target Metrics**:
- Pathways discovered (first month): ≥100
- S-tier pathways: ≥10
- A-tier pathways: ≥20
- Approved pathways: ≥15
- Archived/deleted: <20%

### **User Experience**

**Target Metrics**:
- Time to discover 50 pathways: <5 minutes
- Time to review 20 pathways: <10 minutes
- Time to approve/refine pathway: <2 minutes
- Time to apply 5 pathways: <30 seconds
- User satisfaction: ≥4.5/5 stars

### **System Performance**

**Target Metrics**:
- AI discovery latency: <30 seconds per logic type
- Suggestion library load time: <2 seconds
- Pathway application time: <30 seconds for 100 cases
- No timeouts (4-minute buffer maintained)
- Apps Script size: <148 KB (2 KB buffer)

---

## 🤝 WORKING RELATIONSHIP: Apps Script vs Manual

**Aaron's Question**: "Is it more powerful to work back and forth with you, or build Apps Script functions?"

**Atlas's Answer**: **BOTH - Hybrid approach is optimal**

**What We Build in Apps Script**:
✅ **Discovery Engine** - Automate prompt execution, scoring, storage
✅ **Library System** - Persistent storage, browsing, filtering
✅ **UI Components** - Dropdowns, modals, interactive buttons
✅ **Data Operations** - Case ID sequencing, pathway application
✅ **Ranking/Scoring** - Automated 3-factor scoring

**What We Do Interactively (You + Me)**:
✅ **Pathway Review** - You browse, I explain rationale
✅ **Quality Assessment** - You rate, I refine prompts
✅ **Custom Logic Types** - You describe vision, I help generate
✅ **Naming Decisions** - You choose from AI suggestions
✅ **Strategic Decisions** - You approve/reject pathways

**Workflow**:
```
Apps Script Discovers → You Review with Me → Apps Script Applies

Example:
1. Apps Script runs 7 logic types → Generates 50 pathways
2. You: "Show me the S-tier pathways"
3. Me: "Here are the top 5, here's why they're valuable..."
4. You: "I love #1 and #3, not sure about #2"
5. Me: "Let me explain #2's unique value... [context]"
6. You: "Oh I see, approve #1 #2 #3"
7. Apps Script: Moves to Approved queue, ready to build
```

**Why Hybrid is Best**:
- ✅ **Speed**: Apps Script automates repetitive tasks
- ✅ **Insight**: I provide context, explain AI reasoning
- ✅ **Control**: You make final decisions
- ✅ **Learning**: You understand system, can use independently

**Apps Script Independence**: Once built, you can run discovery/application without me. But I'm available for consultation, refinement, new logic types.

---

## 📝 COMPREHENSIVE PLAN SUMMARY

### **What We're Building** (7 Weeks):

**Week 1**: Dynamic logic type system (growing dropdown + custom creator)
**Week 2**: Pathway naming tool (10 AI suggestions, editable)
**Week 3**: 3-factor ranking (Educational × Novelty × Market Validation)
**Week 4**: Suggestion library + interactive browser UI
**Week 5**: Discovery execution engine (prompt → pathways → library)
**Week 6**: Case ID sequencing (preserve structure, adjust numbers)
**Week 7**: Pathway application (update Master sheet, create ordered sheet)

### **How It Works** (User Flow):

```
1. SELECT LOGIC TYPE
   User chooses from dropdown OR creates custom logic type
        ↓
2. DISCOVER PATHWAYS
   AI analyzes 207 cases through selected lens
   Generates 3-10 pathway suggestions
        ↓
3. REVIEW IN LIBRARY
   Browse by tier (S/A/B/C/D)
   View cases, rationale, scores
        ↓
4. REFINE PATHWAYS
   Rename (10 AI suggestions)
   Edit case lists
   Rate pathways (1-10)
        ↓
5. APPROVE PATHWAYS
   Move to "Ready to Build" queue
        ↓
6. BUILD PATHWAY CHAINS (Future)
   Drag-and-drop case ordering
   Finalize sequence
        ↓
7. APPLY TO MASTER SHEET
   Update Pathway_Name column
   Adjust Case ID sequence numbers
   Generate ordered sheet
```

### **Key Features**:

✅ **Ever-Growing Logic Types** - 7 initial + unlimited custom
✅ **AI Pathway Naming** - 10 variations per pathway
✅ **3-Factor Ranking** - Educational × Novelty × Market Validation
✅ **Persistent Library** - Never lose pathway suggestions
✅ **Easy Refinement** - Rename, edit, rate, archive
✅ **Case ID Preservation** - Keep accronyms, adjust sequence only
✅ **Safe Application** - Preview, undo, audit log

### **Success Criteria**:

✅ **100+ pathways discovered** (first month)
✅ **≥15 approved pathways** (ready to use)
✅ **≥3 custom logic types** (Aaron-created)
✅ **8/10 average quality** (across all metrics)
✅ **Intuitive UX** (no tutorial needed)
✅ **Fast performance** (<30 sec discovery, <2 sec browsing)
✅ **Safe data operations** (undo works 100%)

---

## 🏔️ NEXT STEPS (IMMEDIATE)

### **Today - Planning Approval**:
- [x] Aaron reviews PATHWAYS_MASTER_ROADMAP_v2.md ← **YOU ARE HERE**
- [ ] Aaron confirms: This plan is comprehensive and correct
- [ ] Aaron approves: Ready to start Phase 1

### **Tomorrow - Phase 1 Kickoff**:
- [ ] Create `Logic_Type_Library` sheet
- [ ] Populate 7 initial logic types
- [ ] Build dropdown UI (dynamic loading)
- [ ] Implement "Create New Logic Type" modal
- [ ] Test custom logic type creation

### **This Week - Phase 1 Complete**:
- [ ] Aaron creates 2-3 custom logic types
- [ ] Test discovery with custom logic types
- [ ] Validate pathway quality
- [ ] Refine prompts based on results

### **Week 2 - Phase 2 (Pathway Naming)**:
- [ ] Build naming tool
- [ ] Test with 10 pathways
- [ ] Validate name quality

---

## 🤝 FINAL CONFIRMATION NEEDED

**Atlas needs Aaron's approval on**:

1. ✅ **Plan Completeness**: Does this roadmap cover everything you envisioned?
2. ✅ **Technical Approach**: Apps Script + Interactive work = good balance?
3. ✅ **Timeline**: 7 weeks realistic? Or adjust?
4. ✅ **Priorities**: Phase order correct? (Logic Types → Naming → Ranking → Library → Discovery → Sequencing → Application)
5. ✅ **Case ID System**: Preserve accronym + adjust sequence = correct understanding?
6. ✅ **Ranking Formula**: Educational (50%) + Novelty (25%) + Market (25%) = good weights?

**Once you confirm**, Atlas will:
✅ Begin Phase 1 implementation immediately
✅ Create `Logic_Type_Library` sheet
✅ Build dynamic dropdown UI
✅ Test first custom logic type

---

**This is our greatest mountain, Aaron. The planning is complete. Let's climb.** 🏔️

---

_Generated by Atlas (Claude Code) - 2025-11-08_
_Status: Comprehensive Planning Complete - Awaiting Final Approval_
_Estimated Timeline: 7 weeks to full implementation_
_Next Action: Aaron confirms plan → Atlas begins Phase 1_
