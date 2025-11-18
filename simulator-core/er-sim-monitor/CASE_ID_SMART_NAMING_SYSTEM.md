# Case_ID Smart Naming System - Complete Design

**Date**: 2025-11-01
**Status**: 📋 Design Complete, Ready for Implementation
**Vision**: Progressive intelligence with pathway detection and continuous improvement

---

## Executive Summary

### The Vision

Create a **3-phase Case_ID system** that:
1. **Phase 1 (Convert-Time)**: Generates intelligent rough-draft IDs during OpenAI conversion
2. **Phase 2 (Post-Process)**: Smart renaming tool that suggests optimal IDs and detects patterns
3. **Phase 3 (Pathway Intelligence)**: Analyzes entire database to suggest optimal learning sequences

### The Goal

**Consistent, meaningful Case_IDs** that:
- Encode medical specialty/system
- Encode scenario complexity/sequence
- Support "pathway" grouping (related cases in optimal sequence)
- Enable future AI-driven pathway recommendations
- Scale beautifully as database grows (hundreds → thousands of cases)

---

## Naming Convention Standards

### Adult Cases: **7 characters exactly**
```
SYSNNNN  (System + 4-digit number)
CATNNNN  (Category + 4-digit number if not system-based)

Examples:
CARD0001  - First cardiac case
RESP0023  - 23rd respiratory case
TRAU0045  - 45th trauma case (category, not system)
PSYC0012  - 12th psychiatry case (category)
```

### Pediatric Cases: **8 characters exactly**
```
PEDSYSNN  (PED + System + 2-digit number)
PEDCATNN  (PED + Category + 2-digit number)

Examples:
PEDGI01   - First pediatric GI case
PEDCV12   - 12th pediatric cardiovascular case
PEDTR03   - 3rd pediatric trauma case
PEDPS07   - 7th pediatric psych case
```

### System Codes (Adult & Pediatric)

| System | Adult Code | Ped Code | Full Name |
|--------|------------|----------|-----------|
| Cardiovascular | CARD | CV | Cardiovascular/Cardiac |
| Respiratory | RESP | RE | Respiratory |
| Gastrointestinal | GAST | GI | Gastrointestinal |
| Neurological | NEUR | NE | Neurological |
| Renal | RENA | RN | Renal/Genitourinary |
| Endocrine | ENDO | EN | Endocrine |
| Hematology | HEME | HE | Hematology |
| Musculoskeletal | MUSC | MS | Musculoskeletal |
| Dermatology | DERM | DM | Dermatology |
| Ophthalmology | OPHT | OP | Ophthalmology |
| ENT | ENTT | ET | Ear/Nose/Throat |
| Infectious Disease | INFD | ID | Infectious Disease |
| Immunology | IMMU | IM | Immunology/Allergies |
| Obstetrics | OBST | OB | Obstetrics |
| Gynecology | GYNE | GY | Gynecology |

### Category Codes (Non-System)

| Category | Adult Code | Ped Code | Full Name |
|----------|------------|----------|-----------|
| Trauma | TRAU | TR | Trauma/Injury |
| Toxicology | TOXI | TX | Toxicology/Poisoning |
| Psychiatry | PSYC | PS | Psychiatry/Behavioral |
| Critical Care | CRIT | CC | Critical Care |
| Environmental | ENVI | EV | Environmental |
| Multisystem | MULT | MU | Multisystem/Complex |

---

## Sequential Numbering Philosophy

### The "Pathway-Ready" Sequence

Numbers should represent **recommended learning order**, not chronological creation:

```
CARD0001  - Basic chest pain (stable angina)
CARD0002  - Intermediate chest pain (unstable angina)
CARD0003  - Advanced chest pain (STEMI)
CARD0004  - Complex (STEMI with complications)
```

**Why?**
- Users progress from simple → complex within each pathway
- Numbers encode difficulty/sequence naturally
- Future AI can suggest: "Complete CARD0001-0010 before CARD0020-0030"

### Numbering Ranges (Suggested)

Within each system/category, organize by:

- **0001-0099**: Foundational cases (common presentations, basic management)
- **0100-0199**: Intermediate cases (complications, variations)
- **0200-0299**: Advanced cases (rare, complex, multisystem)
- **0300-0399**: Special populations (pregnancy, elderly, comorbidities)
- **0400+**: Reserved for future expansion

---

## Phase 1: Convert-Time Intelligence (OpenAI)

### Current State Problems
- OpenAI generates: `GI01234`, `NEURO00321`, `CARDIAC001`
- **Issues**: Inconsistent length, random numbers, MANY duplicates (20× CARDIAC001!)
- **Root cause**: OpenAI not given enough context about existing IDs

### Phase 1 Goals
1. Prevent exact duplicate IDs
2. Generate consistent format (7 chars adult, 8 chars pediatric)
3. Provide rough-draft system/category classification
4. Use sequential numbering within system

### Implementation Strategy

#### Step 1: Pre-Conversion ID Pool
**Before processing batch**, read Output sheet and extract:
```javascript
// Existing IDs by system
const existingIds = {
  'CARD': ['CARD0001', 'CARD0005', 'CARD0012'],
  'RESP': ['RESP0001', 'RESP0003'],
  'PEDCV': ['PEDCV01', 'PEDCV03'],
  // ...
};
```

#### Step 2: Enhanced OpenAI Prompt
```javascript
const systemPrompt = `
You are generating medical scenarios with standardized Case_IDs.

CASE_ID REQUIREMENTS:
- Adult cases: EXACTLY 7 characters
- Pediatric cases: EXACTLY 8 characters (start with PED)

ADULT FORMAT: SYSNNNN (System code + 4-digit number)
PEDIATRIC FORMAT: PEDSYSNN (PED + System code + 2-digit number)

SYSTEM CODES:
- CARD (Cardiovascular), RESP (Respiratory), GAST (GI), NEUR (Neuro)
- RENA (Renal), ENDO (Endocrine), HEME (Heme), MUSC (Musculoskeletal)
- TRAU (Trauma), TOXI (Toxicology), PSYC (Psychiatry)

EXISTING IDS (DO NOT REUSE):
${JSON.stringify(existingIds)}

NUMBERING:
- Find the highest existing number for your system
- Add 1 to create new unique ID
- Example: If CARD0012 exists, use CARD0013

YOUR CASE DETAILS:
- Age: ${age}
- Chief Complaint: ${chiefComplaint}
- Primary System: ${suggestedSystem}

Generate Case_ID following these rules exactly.
`;
```

#### Step 3: Post-Generation Validation
```javascript
function validateAndFixCaseId(generatedId, existingIds, systemHint) {
  // Check format
  const isPediatric = generatedId.startsWith('PED');
  const expectedLength = isPediatric ? 8 : 7;

  if (generatedId.length !== expectedLength) {
    // Auto-fix: regenerate with correct format
    return regenerateCaseId(systemHint, existingIds);
  }

  // Check for duplicates
  if (existingIds.includes(generatedId)) {
    // Auto-fix: increment number
    return incrementCaseId(generatedId, existingIds);
  }

  return generatedId;
}
```

### Expected Improvement
- ✅ Zero exact duplicates (validation catches them)
- ✅ Consistent format (7/8 characters enforced)
- ✅ Sequential numbers (OpenAI + validation ensures)
- ⚠️ Still rough classification (OpenAI might misclassify system)

---

## Phase 2: Post-Process Smart Renaming Tool

### Purpose
After conversion batch completes, intelligently analyze and suggest optimal Case_IDs based on:
- Actual diagnosis (more accurate than OpenAI's guess)
- Complexity/severity
- Optimal learning sequence
- Pathway grouping opportunities

### User Experience (Interactive CLI)

```bash
$ node scripts/smartRenameToolPhase2.cjs

═══════════════════════════════════════════════════
  CASE_ID SMART RENAMING TOOL (Phase 2)
  Analyzing 209 scenarios...
═══════════════════════════════════════════════════

🔍 Analysis Complete!

Found 20 Cardiac cases with suboptimal IDs:
  Current: CARDIAC001 (duplicate 20×)
  Suggested pathway: CARD0001-CARD0020

📊 Grouping Suggestions:

[1] AMI Progression Pathway (12 cases)
    CARD0001: Stable angina → Basic chest pain
    CARD0002: Unstable angina → Intermediate
    CARD0003: NSTEMI → Advanced
    CARD0004-CARD0012: STEMI variants

[2] Arrhythmia Pathway (5 cases)
    CARD0100: Atrial fibrillation → Foundation
    CARD0101: SVT → Intermediate
    CARD0102-CARD0104: Complex arrhythmias

[3] Heart Failure Pathway (3 cases)
    CARD0200: Acute decompensated HF → Basic
    CARD0201: Cardiogenic shock → Advanced
    CARD0202: Acute on chronic HF → Complex

Would you like to:
[A] Accept all suggestions
[R] Review case-by-case
[C] Customize pathway groupings
[S] Skip and save for later

Choice:
```

### Algorithm: Intelligent Grouping

```javascript
async function analyzeAndGroupCases(scenarios) {
  const groups = {};

  for (const scenario of scenarios) {
    // Extract key features
    const diagnosis = extractDiagnosis(scenario.reveal_title);
    const age = extractAge(scenario.spark_title);
    const severity = analyzeSeverity(scenario); // AI analysis
    const isPediatric = age < 18;

    // Classify by system
    const system = classifySystem(diagnosis);

    // Detect sub-pathways within system
    const subPathway = detectSubPathway(diagnosis, severity);

    // Assign to group
    const groupKey = `${system}_${subPathway}`;
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }

    groups[groupKey].push({
      scenario,
      diagnosis,
      severity,
      suggestedSequence: calculateSequence(severity)
    });
  }

  // Sort within groups by severity/complexity
  for (const group of Object.values(groups)) {
    group.sort((a, b) => a.suggestedSequence - b.suggestedSequence);
  }

  return groups;
}
```

### Renaming Strategy

**Option 1: Batch Rename (Safe)**
```javascript
// Generate new ID mapping
const idMapping = {
  'CARDIAC001_row5': 'CARD0001',
  'CARDIAC001_row47': 'CARD0002',
  'CARDIAC001_row60': 'CARD0003',
  // ...
};

// Apply all renames atomically
await applyIdMapping(idMapping);
```

**Option 2: Interactive Review**
```bash
Case #1: Row 5
  Current ID: CARDIAC001
  Diagnosis: Anaphylaxis in Pregnancy
  Suggested: OBST0015 (OB + Allergy/Emergency)
  Rationale: Primary system is OB, secondary is Immunology

  [A] Accept OBST0015
  [E] Edit manually
  [S] Skip
  [Q] Quit

Choice:
```

### Output
- Updated Case_IDs in Output sheet
- Backup of old IDs (`Legacy_Case_ID` column)
- Pathway grouping metadata saved
- Report: `CASE_ID_RENAMING_REPORT.md`

---

## Phase 3: Pathway Intelligence System

### Vision
**Continuous AI analysis** that:
- Monitors entire database as it grows
- Detects new pathway opportunities
- Suggests optimal learning sequences
- Recommends case series for users
- Adapts as education research evolves

### Core Features

#### 3.1 Pathway Detection Algorithm

```javascript
async function detectPathways(allScenarios) {
  const pathways = [];

  // Group by system first
  const bySystem = groupBySystem(allScenarios);

  for (const [system, cases] of Object.entries(bySystem)) {
    // Sub-group by diagnosis category
    const byDiagnosis = groupByDiagnosis(cases);

    for (const [diagnosis, diagnosisCases] of Object.entries(byDiagnosis)) {
      // Analyze for sequence potential
      const pathway = {
        id: generatePathwayId(system, diagnosis),
        name: generatePathwayName(diagnosis),
        cases: [],
        metadata: {}
      };

      // Sort by complexity (simple → complex)
      const sorted = sortByComplexity(diagnosisCases);

      // Assign sequence numbers
      sorted.forEach((c, idx) => {
        pathway.cases.push({
          caseId: c.caseId,
          sequenceNumber: idx + 1,
          estimatedDifficulty: c.complexity,
          prerequisites: idx > 0 ? [sorted[idx - 1].caseId] : []
        });
      });

      // Calculate pathway metadata
      pathway.metadata = {
        totalCases: pathway.cases.length,
        estimatedDuration: calculateDuration(pathway.cases),
        difficulty: calculateOverallDifficulty(pathway.cases),
        learningObjectives: extractLearningObjectives(pathway.cases)
      };

      pathways.push(pathway);
    }
  }

  return pathways;
}
```

#### 3.2 Complexity Scoring

```javascript
function calculateComplexity(scenario) {
  let score = 0;

  // Patient factors
  score += scenario.age > 65 ? 1 : 0;
  score += scenario.age < 18 ? 1 : 0;
  score += scenario.pregnancy ? 2 : 0;

  // Diagnosis factors
  score += scenario.multiSystem ? 2 : 0;
  score += scenario.rareCondition ? 2 : 0;

  // Acuity factors
  const acuityScore = {
    'stable': 0,
    'urgent': 1,
    'emergent': 2,
    'critical': 3
  }[scenario.acuity] || 0;
  score += acuityScore;

  // Number of vital state changes (more = complex)
  score += Math.min(scenario.vitalStates.length - 2, 3);

  return score; // 0-15 scale
}
```

#### 3.3 Pathway Recommendation Engine

**User-Facing Feature** (Future App Integration):

```javascript
// User profile
const userProfile = {
  userId: 'user123',
  completedCases: ['CARD0001', 'CARD0002'],
  skillLevel: 'intermediate',
  interests: ['cardiology', 'critical-care']
};

// Get recommendations
const recommendations = getPathwayRecommendations(userProfile);

// Returns:
{
  nextRecommended: {
    caseId: 'CARD0003',
    pathwayName: 'AMI Progression',
    rationale: 'You completed the first 2 cases in this pathway',
    estimatedTime: '25 minutes'
  },
  availablePathways: [
    {
      id: 'PATHWAY_CARD_AMI',
      name: 'AMI Progression',
      progress: '2/12 complete',
      nextCase: 'CARD0003'
    },
    {
      id: 'PATHWAY_RESP_ASTHMA',
      name: 'Asthma Management',
      progress: '0/8',
      recommended: true,
      rationale: 'Related to your interest in critical care'
    }
  ]
}
```

#### 3.4 Continuous Improvement Loop

**Every time new cases added**:
```bash
$ node scripts/pathwayIntelligencePhase3.cjs --mode=analyze

🔍 Analyzing 250 scenarios (41 new since last run)...

📊 Detected Changes:
  - New pathway opportunity: "Sepsis Progression" (8 cases)
  - Existing pathway "AMI Progression" can be resequenced
  - 3 cases reclassified from MULT → CARD

🤖 Suggestions:
  [1] Create new pathway: "PATHWAY_INFD_SEPSIS"
      Cases: INFD0010-INFD0017
      Suggested sequence: Simple sepsis → Septic shock → Multi-organ failure

  [2] Resequence "AMI Progression" pathway
      Current: CARD0001-CARD0012
      Suggested: Swap CARD0005 ↔ CARD0008 (better complexity flow)

  [3] Rename 3 cases:
      MULT0005 → CARD0115 (Primary system is cardiac)
      MULT0012 → CARD0116
      MULT0023 → CARD0117

Apply suggestions? [Y/n/review]
```

---

## Implementation Roadmap

### Phase 1: Convert-Time Intelligence (Week 1)

**Priority: HIGH**
**Effort**: Medium (3-4 hours)
**Impact**: Prevents future duplicates

**Tasks**:
1. ✅ Read existing Case_IDs before batch
2. ✅ Enhance OpenAI prompt with existing ID list
3. ✅ Add post-generation validation
4. ✅ Auto-fix format errors
5. ✅ Auto-increment duplicates
6. ✅ Test with 5-10 test scenarios

**Files to Modify**:
- `Code.gs` (Apps Script) - OpenAI prompt + validation
- Test with specific rows mode

---

### Phase 2: Post-Process Smart Renaming (Week 2)

**Priority: HIGH**
**Effort**: High (8-10 hours)
**Impact**: Fixes existing 120 duplicate rows

**Tasks**:
1. ✅ Build diagnosis extraction (parse Reveal_Title)
2. ✅ Build system classifier (diagnosis → system code)
3. ✅ Build complexity scorer (analyze scenario)
4. ✅ Build grouping algorithm (detect sub-pathways)
5. ✅ Build interactive CLI tool
6. ✅ Generate suggested ID mappings
7. ✅ Apply renames to Output sheet
8. ✅ Backup old IDs to Legacy_Case_ID column

**Files to Create**:
- `scripts/smartRenameToolPhase2.cjs` - Main tool
- `scripts/diagnosisClassifier.cjs` - ML/rules for diagnosis → system
- `scripts/complexityScorer.cjs` - Complexity calculation
- `scripts/applyIdMapping.cjs` - Safe rename application

**Deliverables**:
- All 209 scenarios have unique Case_IDs
- IDs follow 7/8 character standard
- Pathways roughly grouped
- Report of all changes

---

### Phase 3: Pathway Intelligence (Week 3-4)

**Priority: MEDIUM**
**Effort**: High (12-16 hours)
**Impact**: Future-proofing for app integration

**Tasks**:
1. ✅ Build pathway detection algorithm
2. ✅ Build complexity/difficulty scoring
3. ✅ Build sequence optimizer
4. ✅ Generate pathway metadata (JSON/DB)
5. ✅ Build recommendation engine
6. ✅ Create continuous analysis script
7. ✅ Export pathway data for app integration

**Files to Create**:
- `scripts/pathwayIntelligencePhase3.cjs` - Main engine
- `scripts/detectPathways.cjs` - Pathway detection
- `scripts/recommendPathways.cjs` - Recommendation engine
- `data/pathways.json` - Pathway metadata export

**Deliverables**:
- Pathway metadata for all 209+ scenarios
- JSON export ready for Django/Supabase
- Recommendation engine prototype
- Continuous improvement framework

---

## Example: Complete Journey for One Case

### Original Import (emsim_final)
```
Row 42: "Patient presents with chest pain..."
```

### Phase 1: Convert-Time (OpenAI)
```
Generated Case_ID: CARDIAC001
Post-validation: Changed to CARD0013 (existing IDs: CARD0001-CARD0012)
Format check: ✅ 7 characters
Duplicate check: ✅ Unique
```

### Phase 2: Post-Process Smart Rename
```
Analyzed diagnosis: "Acute Myocardial Infarction (STEMI)"
Complexity score: 8/15 (Advanced)
Sub-pathway detected: "AMI Progression"
Existing pathway members: CARD0001-CARD0012 (various AMI cases)

Suggested rename: CARD0013 → CARD0005
Rationale: This is intermediate STEMI, should come after CARD0004 (NSTEMI)
         Current CARD0005 is complex STEMI, should be CARD0010

Applied changes:
  CARD0013 → CARD0005 (this case)
  CARD0005 → CARD0010 (moved existing case)
  Updated pathway metadata
```

### Phase 3: Pathway Intelligence
```
Pathway: "PATHWAY_CARD_AMI"
Name: "AMI Progression Pathway"
Cases: CARD0001-CARD0015 (15 total)
Sequence:
  1. CARD0001 - Stable angina (Complexity: 2)
  2. CARD0002 - Unstable angina (Complexity: 4)
  3. CARD0003 - NSTEMI (Complexity: 6)
  4. CARD0004 - STEMI uncomplicated (Complexity: 7)
  5. CARD0005 - STEMI with complications (Complexity: 8) ← Our case!
  ...

Learning objectives:
  - Recognize chest pain patterns
  - Differentiate ACS subtypes
  - Manage STEMI emergencies
  - Handle complications

Estimated completion: 6 hours
Difficulty: Intermediate → Advanced
Prerequisites: Basic ECG interpretation, ACLS certification
```

---

## Technical Architecture

### Database Schema (Future Django)

```python
# models.py

class Scenario(models.Model):
    case_id = models.CharField(max_length=8, unique=True, primary_key=True)
    legacy_case_id = models.CharField(max_length=50, blank=True)  # Backup old IDs
    spark_title = models.CharField(max_length=200)
    reveal_title = models.CharField(max_length=200)
    system = models.CharField(max_length=4, choices=SYSTEM_CHOICES)
    category = models.CharField(max_length=4, choices=CATEGORY_CHOICES, blank=True)
    is_pediatric = models.BooleanField(default=False)
    complexity_score = models.IntegerField()  # 0-15
    sequence_number = models.IntegerField(blank=True, null=True)

    # Pathway associations
    pathways = models.ManyToManyField('Pathway', through='PathwayMembership')

class Pathway(models.Model):
    pathway_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    system = models.CharField(max_length=4)
    description = models.TextField()
    estimated_duration = models.IntegerField()  # minutes
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    learning_objectives = models.JSONField()

class PathwayMembership(models.Model):
    scenario = models.ForeignKey(Scenario, on_delete=models.CASCADE)
    pathway = models.ForeignKey(Pathway, on_delete=models.CASCADE)
    sequence_number = models.IntegerField()
    prerequisites = models.ManyToManyField('self', symmetrical=False, blank=True)

    class Meta:
        ordering = ['sequence_number']
```

### API Endpoints (Future)

```python
# api/views.py

@api_view(['GET'])
def get_pathway_recommendations(request, user_id):
    """
    Get personalized pathway recommendations
    """
    user = User.objects.get(id=user_id)
    completed = user.completed_scenarios.all()

    recommendations = PathwayRecommendationEngine.get_recommendations(
        user_profile=user,
        completed_scenarios=completed
    )

    return Response(recommendations)

@api_view(['GET'])
def get_pathway_details(request, pathway_id):
    """
    Get complete pathway information
    """
    pathway = Pathway.objects.get(pathway_id=pathway_id)
    scenarios = pathway.scenarios.all().order_by('pathwaymembership__sequence_number')

    return Response({
        'pathway': PathwaySerializer(pathway).data,
        'scenarios': ScenarioSerializer(scenarios, many=True).data,
        'progress': calculate_user_progress(request.user, pathway)
    })
```

---

## Success Metrics

### Phase 1 Success Criteria
- [ ] Zero duplicate Case_IDs generated
- [ ] 100% format compliance (7/8 characters)
- [ ] Sequential numbering within systems
- [ ] Test batch of 10 scenarios succeeds

### Phase 2 Success Criteria
- [ ] All 209 scenarios have unique IDs
- [ ] All IDs follow 7/8 character standard
- [ ] Sub-pathways detected and grouped
- [ ] User can review/accept suggestions interactively
- [ ] Backup of old IDs preserved

### Phase 3 Success Criteria
- [ ] Pathway metadata generated for all scenarios
- [ ] JSON export compatible with Django models
- [ ] Recommendation engine produces sensible suggestions
- [ ] Continuous analysis detects new opportunities
- [ ] System scales to 1000+ scenarios

---

## Next Immediate Steps

### Today (Priority: Phase 1)

1. **Update Apps Script OpenAI prompt** to include existing Case_IDs
2. **Add validation function** to catch/fix duplicates
3. **Test with 5 test scenarios** (use "Specific rows" mode)
4. **Verify**: No duplicates, correct format, sequential numbers

### This Week (Priority: Phase 2)

1. **Build diagnosis classifier** (Reveal_Title → System code)
2. **Build complexity scorer** (analyze scenario features)
3. **Build grouping algorithm** (detect sub-pathways)
4. **Create interactive CLI tool** for renaming
5. **Test with current 209 scenarios**
6. **Apply renames** to fix 120 duplicates

### Next Week (Priority: Phase 3)

1. **Design pathway detection algorithm**
2. **Build recommendation engine**
3. **Create continuous analysis framework**
4. **Export pathway metadata**
5. **Prepare for Django integration**

---

**Design Completed By**: Claude Code (Anthropic)
**Design Date**: 2025-11-01
**Status**: Ready for Implementation
**Next Action**: Implement Phase 1 (Convert-Time Intelligence)
