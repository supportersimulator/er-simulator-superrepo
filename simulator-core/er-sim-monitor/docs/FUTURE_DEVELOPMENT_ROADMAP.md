# Future Development Roadmap

**Project:** ER Simulator - Medical Scenario Generation & Quality System
**Last Updated:** 2025-11-03
**Status:** Phase 1 Complete, Planning Phase 2-4

---

## 🎯 Big Picture Vision

### Ultimate Goal
Create a **premium medical simulation platform** that generates hundreds of high-quality, educationally distinct clinical scenarios with:
- Medical accuracy and clinical realism
- Diverse patient populations and presentations
- Progressive skill-building curriculum
- AI-powered facilitation for adaptive learning
- Intelligent quality control and refinement

### Current State (Phase 1 Complete)
✅ 206+ scenarios generated from source material
✅ Batch processing system with OpenAI integration
✅ 16K token premium quality output
✅ Clinical defaults for vital signs
✅ Duplicate detection (hash signatures)
✅ Force reprocess mode for testing
✅ Input validation to prevent empty rows

---

## 📋 Development Phases

### Phase 1: Foundation ✅ COMPLETE

**Core Batch Processing System**
- [x] Google Sheets ↔ Apps Script integration
- [x] OpenAI API integration (gpt-4o, 16K tokens)
- [x] Two-tier header system
- [x] Clinical defaults for missing vitals
- [x] JSON validation and error handling
- [x] Batch queue management (Next 25, All rows, Specific rows)
- [x] Single case mode for testing
- [x] Live logging with copy functionality
- [x] Force Reprocess toggle
- [x] Hash signature duplicate detection
- [x] Input validation (empty/N/A checking)

**Status:** ✅ Production-ready, 206+ scenarios created

---

### Phase 2: Smart Duplicate Detection 🔄 PLANNED

**Goal:** Catch near-duplicates that hash signatures miss

#### Features to Implement:

1. **Title Similarity Checking** ⚠️ HIGH PRIORITY
   - Algorithm: Word-based similarity scoring
   - Threshold: >70% similar = flag as potential duplicate
   - Action: Alert user, suggest differentiation
   - Example: "Chest Pain (52 M): Racing Against Time" vs "Sudden Chest Pain (52 M): Racing Against Time"

2. **Text Similarity Analysis** ⚠️ HIGH PRIORITY
   - Algorithm: Compare formal descriptions word-by-word
   - Threshold: >90% similar = flag as near-duplicate
   - Action: Warn user, provide diff report
   - Example: Detect 77-89% similarity like we found in rows 194-199

3. **Demographics Pattern Detection** ⚠️ MEDIUM PRIORITY
   - Track: Age + Gender combinations
   - Threshold: Same demo >3 consecutive times = warn
   - Action: Suggest varying demographics
   - Example: Five "52-year-old males" in rows 194-198

4. **Diagnosis Distribution Monitoring** ⚠️ MEDIUM PRIORITY
   - Track: Primary diagnosis field
   - Threshold: Same diagnosis >5 times consecutively = warn
   - Action: Recommend curriculum diversification
   - Example: Six "acute MI" cases in a row
   - **Important:** Allow similar diagnoses IF clearly differentiated (STEMI vs NSTEMI vs posterior MI)

5. **Learning Objective Overlap Analysis** ⚠️ LOW PRIORITY
   - Algorithm: Compare learning objectives across rows
   - Threshold: >80% overlapping themes = warn
   - Action: Suggest unique learning angles
   - Example: All six teaching "rapid identification + early intervention"

#### Implementation Strategy:

**Where to Build:**
- New function: `checkSmartDuplicates_(outputSheet, newRow, recentRows)`
- Called: Before OpenAI API call in `processOneInputRow_()`
- Returns: `{ isDuplicate: boolean, warnings: [], suggestions: [] }`

**User Experience:**
```
⚠️ Row 195: POTENTIAL DUPLICATE DETECTED

Title Similarity: 95% match with Row 194
  Row 194: "Chest Pain (52 M): Racing Against Time"
  Row 195: "Sudden Chest Pain (52 M): Racing Against Time"

Suggestions:
  - Differentiate with specific diagnosis (e.g., "Anterior STEMI" vs "NSTEMI")
  - Vary demographics (current: 52M, suggest: 65F or 28M)
  - Add unique learning angle (current: generic MI, suggest: posterior MI or cocaine-induced)

[Skip This Row] [Proceed Anyway] [Auto-Fix with Suggestions]
```

**Smart Allowances:**
- ✅ Allow same diagnosis IF subtype specified (Anterior STEMI vs Inferior STEMI)
- ✅ Allow similar presentation IF different EKG findings documented
- ✅ Allow same demographics IF different comorbidities/risk factors
- ✅ Allow overlapping objectives IF unique clinical pearls present

---

### Phase 3: Quality Scoring System 🔄 PLANNED

**Goal:** Quantitative quality assessment for every scenario

#### Quality Metrics (0-100% Score):

**1. Completeness (30 points)**
- All required fields filled (not N/A)
- All 6 vital sign states present
- Pre-Sim and Post-Sim overviews complete
- Media fields populated

**2. Educational Value (30 points)**
- Clear learning objectives (3+)
- Unique clinical pearls
- Real-world impact statement
- "What You'll Learn" section complete
- "What You Mastered" section complete
- "Avoid These Traps" section complete

**3. Medical Accuracy (20 points)**
- Vital signs clinically appropriate
- Diagnosis matches presentation
- Treatment recommendations evidence-based
- No medical contradictions

**4. Uniqueness (20 points)**
- Title distinct from other scenarios
- Demographics vary appropriately
- Learning objectives not duplicated
- Clinical presentation unique

**Scoring Tiers:**
- 90-100%: ✅ **Premium Quality** (production-ready)
- 75-89%: ⚠️ **Good Quality** (minor refinements needed)
- 60-74%: 📋 **Acceptable** (requires improvement)
- <60%: ❌ **Below Standard** (significant revision needed)

#### Implementation:

**Function:** `calculateQualityScore_(row, allRows)`

**Returns:**
```javascript
{
  totalScore: 87,
  breakdown: {
    completeness: 28/30,
    educationalValue: 26/30,
    medicalAccuracy: 18/20,
    uniqueness: 15/20
  },
  tier: "Good Quality",
  recommendations: [
    "Add unique clinical pearl to differentiate from similar cases",
    "Consider varying patient demographics for curriculum balance"
  ]
}
```

**Integration:**
- Run during batch processing (after scenario created)
- Store scores in new "Quality_Score" column
- Generate quality report at end of batch
- Flag low-quality rows for review

---

### Phase 4: Intelligent Case Improvement 🔄 PLANNED

**Goal:** Automated suggestions for refining similar cases

#### Features:

**1. Similarity Comparison Engine**
- Compare each scenario against all others
- Identify most similar cases (>60% similarity)
- Generate comparison reports
- Suggest differentiation strategies

**2. Variation Suggestion System**
- **Demographics Variations:**
  - Age diversity (young, middle-aged, elderly)
  - Gender balance (male/female)
  - Special populations (pregnant, diabetic, immunocompromised)

- **Presentation Variations:**
  - Typical vs atypical presentations
  - Different chief complaints for same diagnosis
  - Varying severity levels

- **Diagnosis Variations:**
  - Subtypes (STEMI → Anterior/Inferior/Posterior)
  - Complications (MI → MI with cardiogenic shock)
  - Differential diagnoses (Chest pain → MI vs PE vs dissection)

**3. Curriculum Balance Analyzer**
- Track diagnosis distribution across all scenarios
- Identify overrepresented conditions
- Suggest underrepresented clinical areas
- Ensure progressive complexity

**4. Automated Refinement Reports**

**Example Report:**
```
📊 CURRICULUM BALANCE REPORT

Diagnosis Distribution:
  Acute MI: 12 cases (6% of total) ⚠️ OVERREPRESENTED
  Pulmonary Embolism: 2 cases (1%) ✅ Appropriate
  Aortic Dissection: 1 case (0.5%) ⚠️ UNDERREPRESENTED

Recommendations:
  1. Convert 4 MI cases to PE variants (saddle embolus, submassive, Wells criteria)
  2. Add 2 aortic dissection cases (type A, type B)
  3. Diversify MI cases:
     - Row 194: Keep as Anterior STEMI
     - Row 195: Convert to NSTEMI
     - Row 196: Convert to Posterior MI
     - Row 197: Convert to Cocaine-induced MI
     - Rows 198-199: Convert to PE and Dissection

Similar Case Clusters:
  Cluster 1 (Rows 194-197): Four 52M MI cases
    Suggestion: Vary age (28M, 52M, 65F, 80M)
    Suggestion: Specify MI subtypes (Anterior, Inferior, Posterior, NSTEMI)
    Suggestion: Add unique risk factors (cocaine, diabetes, family history, no risk factors)

  Cluster 2 (Rows 200-205): "Racing Against Time" theme
    Suggestion: Vary subtitle phrases
    Suggestion: Ensure each has unique clinical focus
```

#### Implementation:

**Tools to Build:**

1. `analyzeCurriculumBalance()` - Apps Script function
   - Runs on-demand from menu
   - Generates comprehensive report
   - Exports to new "Quality_Reports" sheet

2. `compareAllScenarios()` - Apps Script function
   - Identifies similar case clusters
   - Calculates similarity matrices
   - Suggests specific refinements

3. `generateRefinementPlan()` - Apps Script function
   - Takes cluster of similar cases
   - Proposes specific variations for each
   - Creates actionable refinement checklist

4. **"Intelligent Improvement" Sidebar Panel**
   - Select rows to compare
   - View similarity scores
   - Accept/reject suggestions
   - Apply automated refinements

---

### Phase 5: AI Facilitator Integration 🔮 FUTURE

**Goal:** Connect scenarios to real-time AI-powered simulation facilitation

#### Features (Long-term):

**1. Supabase PostgreSQL Migration**
- Migrate from Google Sheets to Supabase database
- Real-time sync for multi-user access
- Better performance for hundreds of scenarios
- Preserve all current functionality

**2. AI Facilitator Engine**
- Reads scenario data from database
- Interprets vital sign progressions
- Adapts to learner responses
- Provides real-time feedback
- Tracks learning progress

**3. Adaptive Learning Pathways**
- Selects scenarios based on learner level
- Ensures progressive difficulty
- Avoids repetitive content
- Targets knowledge gaps

**4. Multi-Language Support**
- Translate scenarios to multiple languages
- Localize medical terminology
- Adapt to regional clinical practices

---

## 🎯 Current Focus & Priorities

### Immediate (This Week)
1. ✅ Input validation implementation (COMPLETED 2025-11-03)
2. ⏳ Deploy updated code to Apps Script
3. ⏳ Test input validation with empty rows
4. ⏳ Resume batch processing with safeguards

### Short-term (Next 2 Weeks)
1. ⏳ Begin Phase 2: Smart Duplicate Detection
   - Start with title similarity checking
   - Add text similarity analysis
   - Implement demographics pattern detection

2. ⏳ Quality scoring prototype
   - Build basic scoring algorithm
   - Test on existing scenarios
   - Refine scoring criteria

### Medium-term (Next Month)
1. ⏳ Complete Phase 2: Smart Duplicate Detection
2. ⏳ Complete Phase 3: Quality Scoring System
3. ⏳ Begin Phase 4: Intelligent Case Improvement
4. ⏳ Generate first curriculum balance report

### Long-term (3-6 Months)
1. ⏳ Complete Phase 4: Intelligent Case Improvement
2. ⏳ Refine all 200+ scenarios using quality tools
3. ⏳ Plan Phase 5: AI Facilitator Integration
4. ⏳ Research Supabase migration strategy

---

## 🔍 Key Insights from Analysis

### What We Learned (2025-11-03)

**Discovery 1: Input Data is Critical**
- Rows 194-199 were near-duplicates
- Root cause: Empty input sheet (all "N/A")
- AI generated similar scenarios without unique source material
- **Solution:** Strict input validation (now implemented)

**Discovery 2: Hash Signatures Aren't Enough**
- Current system only catches exact duplicates
- Misses near-duplicates with 77-89% similarity
- Need smart duplicate detection (Phase 2)

**Discovery 3: Medical Nuance vs Duplication**
- Similar scenarios CAN be valid (STEMI variants)
- Must differentiate medical nuance from lazy duplication
- Quality system should allow similar diagnoses IF clearly differentiated

**Discovery 4: Early Quality is Excellent**
- Rows 10-12 vs 191-193: Both 100% complete
- 16K token upgrade prevented truncation (main value)
- Baseline quality was already high at 4K tokens
- System is producing consistently good scenarios

---

## 📊 Success Metrics

### Current Status
- ✅ 206+ scenarios created
- ✅ 100% fill rate on completed rows
- ✅ 6/6 vital states populated
- ✅ Zero JSON truncation errors (16K tokens)
- ⚠️ Some near-duplicate issues identified (rows 194-199)

### Phase 2 Goals
- Reduce near-duplicates by 90%
- Flag potential duplicates before processing
- Provide actionable refinement suggestions
- Maintain >95% user satisfaction with suggestions

### Phase 3 Goals
- Every scenario scored 0-100%
- 80%+ scenarios rated "Premium Quality" (90%+)
- <5% scenarios rated "Below Standard" (<60%)
- Quality reports generated automatically

### Phase 4 Goals
- Curriculum balance across all medical specialties
- No diagnosis overrepresented (>10% of total)
- All similar case clusters refined with clear differentiation
- User can refine scenarios in 1-click

---

## 🤝 Collaboration Notes

### Claude + GPT-5 + Aaron Workflow

**Claude's Role:**
- Implementation and coding
- Local development and testing
- Feature development
- Documentation

**GPT-5's Role:**
- Systems architecture
- Code review
- Optimization recommendations
- Strategic guidance

**Aaron's Role:**
- Creative direction
- Medical expertise validation
- Feature prioritization
- User acceptance testing

**Sync Protocol:**
- All changes pushed to GitHub (main branch)
- GPT-5 fetches latest code for review
- Claude reloads context after pushes
- Aaron provides feedback and direction

---

## 📝 Notes & Reminders

### Important Principles

1. **Medical Accuracy is Sacred**
   - Scenarios must be clinically accurate
   - Vital signs must be physiologically appropriate
   - Treatment recommendations evidence-based
   - No dangerous medical misinformation

2. **Educational Value First**
   - Every scenario must teach something unique
   - Progressive skill-building curriculum
   - Clear learning objectives
   - Actionable clinical pearls

3. **Quality Over Quantity**
   - Better to have 200 excellent scenarios than 500 mediocre ones
   - Refinement and improvement is ongoing
   - Delete/replace low-quality scenarios
   - Maintain high standards

4. **User Experience Matters**
   - Clear error messages
   - Helpful suggestions
   - Automated where possible
   - Manual control when needed

---

## 🚀 How to Use This Document

### For Aaron:
- Reference this when planning next features
- Check current phase status
- Understand big picture context
- Track progress over time

### For Claude:
- Include phase context in summary reports
- Reference roadmap when suggesting features
- Update this document as phases complete
- Keep big picture in mind during implementation

### For GPT-5:
- Review architecture alignment
- Suggest optimizations for planned phases
- Provide strategic guidance
- Validate technical approaches

---

**Document Maintenance:**
- Update after completing each phase
- Add new insights from testing/analysis
- Refine timelines as priorities shift
- Archive completed phases

**Last Updated:** 2025-11-03
**Next Review:** After Phase 2 completion
