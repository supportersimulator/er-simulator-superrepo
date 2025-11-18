# ER Simulator - Development Roadmap

**Project:** Medical Scenario Generation & Quality System
**Last Updated:** 2025-11-03
**Current Status:** Phase I Complete, Phase II.A In Progress

---

## 🎯 ULTIMATE VISION

Create a **premium medical simulation platform** that generates hundreds of high-quality, educationally distinct clinical scenarios with medical accuracy, diverse presentations, progressive curriculum, and AI-powered adaptive facilitation.

---

## 📋 MASTER OUTLINE

### I. DATA ORGANIZATION & CASE MANAGEMENT
   A. Source Data Collection
      1. Google Sheets integration
         a. OAuth authentication ✅
         b. Two-tier header system ✅
         c. Input sheet validation ✅
      2. Data import systems
         a. CSV import functionality ✅
         b. emsim_final integration ✅
         c. Batch data parsing ✅

   B. Scenario Processing System  **← 🎯 CURRENT WORK AREA**
      1. Batch processing infrastructure ✅
         a. OpenAI API integration (gpt-4o) ✅
         b. 16K token premium quality ✅
         c. Queue management (Next 25/All/Specific) ✅
         d. Single case mode ✅
         e. Progress tracking & logging ✅
      2. Quality control mechanisms
         a. Input validation ✅  **← ✨ COMPLETED TODAY**
            i. Empty row detection ✅
            ii. N/A placeholder rejection ✅
            iii. Clear error messaging ✅
         b. Duplicate prevention **← 🔄 ACTIVE DEVELOPMENT**
            i. Hash signature system ✅
            ii. Force reprocess toggle ✅
            iii. Smart duplicate detection 🔄
               - Media URL uniqueness check 📋 PLANNED ⚠️ HIGH PRIORITY
                 * Check content URLs (exclude license URLs)
                 * Unique URLs = unique source material = valid scenarios
                 * Duplicate URLs = true duplicates = flag for review
                 * Validates scenarios with similar text (rows 194-199 case)
               - Title similarity (>70%) 📋 PLANNED
               - Text similarity (>90%) 📋 PLANNED
               - Demographics patterns 📋 PLANNED
               - Diagnosis distribution 📋 PLANNED
               - Learning objective overlap 📋 PLANNED
         c. Clinical defaults system ✅
            i. Vital sign auto-generation ✅
            ii. Physiologically appropriate values ✅
            iii. Six-state progression ✅
      3. Error handling & recovery
         a. JSON validation ✅
         b. Truncation prevention ✅
         c. API error handling ✅
         d. Retry logic ✅

   C. Quality Scoring & Assessment 📋 PLANNED (Phase III)
      1. Automated quality metrics
         a. Completeness scoring (30 points)
         b. Educational value (30 points)
         c. Medical accuracy (20 points)
         d. Uniqueness (20 points)
      2. Reporting systems
         a. Per-scenario scoring
         b. Batch quality reports
         c. Trend analysis
         d. Improvement tracking
      3. Modular Apps Script architecture 📋 HIGH PRIORITY
         a. Separate file per tool (prevent cross-contamination)
         b. Code_QUALITY_ANALYSIS.gs - Quality scoring tool
         c. Code_IMPROVEMENT_SUGGESTIONS.gs - Improvement recommender
         d. Code_ATSR.gs - ATSR title/summary generator (standalone)
         e. Code_BATCH_PROCESSOR.gs - Main batch system
         f. Code_UTILITIES.gs - Shared helper functions
         g. Code_CLINICAL_DEFAULTS.gs - Vital sign defaults

   D. Intelligent Case Improvement 📋 PLANNED (Phase IV)
      1. Similarity analysis
         a. Scenario comparison engine
         b. Cluster identification
         c. Differentiation suggestions
      2. Curriculum balancing
         a. Diagnosis distribution tracking
         b. Demographics diversity analysis
         c. Specialty coverage monitoring
         d. Progressive complexity assessment
      3. Automated refinement
         a. Variation suggestions (demographics, presentation, diagnosis)
         b. One-click improvements
         c. Bulk refinement operations

### II. MEDICAL SCENARIO QUALITY
   A. Clinical Accuracy Standards ✅
      1. Vital sign validation ✅
      2. Diagnosis-presentation alignment ✅
      3. Evidence-based treatments ✅
      4. Medical contradiction checking ✅

   B. Educational Design Principles
      1. Learning objective clarity ✅
      2. Clinical pearls uniqueness 📋 PLANNED
      3. Progressive skill building 📋 PLANNED
      4. Real-world applicability ✅

   C. Diversity & Representation
      1. Demographics variation
         a. Age diversity (20-90 years) 📋 PLANNED
         b. Gender balance 📋 PLANNED
         c. Special populations 📋 PLANNED
      2. Presentation variety
         a. Typical presentations ✅
         b. Atypical presentations 📋 PLANNED
         c. Severity spectrum 📋 PLANNED
      3. Diagnosis breadth
         a. Multi-specialty coverage ✅
         b. Subtype differentiation 📋 PLANNED
         c. Complication variants 📋 PLANNED

### III. USER INTERFACE & EXPERIENCE
   A. Google Sheets Interface ✅
      1. Menu system ✅
      2. Sidebar panels ✅
         a. Batch/Single mode selector ✅
         b. Settings panel ✅
         c. Categories & Pathways ✅
         d. Image sync defaults ✅
         e. Memory tracker ✅
      3. Live logging system ✅
         a. Real-time progress updates ✅
         b. Copy logs functionality ✅
         c. Clear/refresh controls ✅

   B. Processing Controls ✅
      1. Mode selection ✅
      2. Row specification ✅
      3. Force reprocess toggle ✅
      4. Start/stop controls ✅

   C. Quality Tools UI 📋 PLANNED (Phase III-IV)
      1. Quality dashboard
      2. Similarity comparison viewer
      3. Refinement suggestion panel
      4. Curriculum balance charts

### IV. AWS INTEGRATION & PRODUCTION DEPLOYMENT 🔮 FUTURE (Phase V)
   A. Prerequisites (Must Complete Before AWS)
      1. All tools tested individually ⚠️ CRITICAL
         a. Batch processor standalone testing
         b. ATSR generator isolated testing
         c. Quality analysis tool testing
         d. Improvement suggestions testing
         e. Clinical defaults verification
      2. Modular Apps Script architecture complete
         a. All tools in separate files
         b. No cross-contamination between tools
         c. Clean API boundaries
         d. Shared utilities properly isolated
      3. ATSR fully polished and tested
         a. Title generation accuracy
         b. Summary quality validation
         c. Edge case handling
         d. Performance optimization
      4. Quality tools production-ready
         a. Case quality analysis working
         b. Improvement suggestions validated
         c. User interface tested
         d. Reports accurate and useful

   B. AWS Infrastructure Setup
      1. API Gateway configuration
      2. Lambda functions deployment
      3. S3 storage for scenarios
      4. CloudWatch monitoring
      5. IAM roles and permissions

   C. Subscription Platform Integration ⚠️ SEE: SUBSCRIPTION_PLATFORM_REQUIREMENTS.md
      1. Paddle setup (Merchant of Record)
         a. Create merchant account
         b. Configure products/plans
         c. Set up webhooks
         d. Enable customer portal
      2. RevenueCat integration (Subscription orchestration)
         a. Create project
         b. Connect Paddle, Apple, Google Play
         c. Configure entitlements
         d. Set up Customer Center
      3. Authentication provider (Auth0/Clerk)
         a. Set up on custom domain (portal.ersimulator.com)
         b. Configure OAuth flows
         c. Integrate with RevenueCat user IDs
      4. Customer portal development
         a. Build subscription dashboard UI
         b. Integrate entitlement checks
         c. Add payment management
         d. White-label branding complete

   D. AI Facilitation Engine
      1. Scenario interpretation
      2. Vital sign progression tracking
      3. Adaptive response system
      4. Real-time feedback generation
      5. Subscription tier gating (free vs premium scenarios)

   E. Database Migration
      1. Supabase PostgreSQL setup (or AWS RDS)
      2. Data migration from Google Sheets (206+ scenarios)
      3. Real-time sync implementation
      4. Multi-user access control
      5. Subscription entitlement enforcement

   F. Learning Pathways
      1. Skill level assessment
      2. Progressive scenario selection
      3. Knowledge gap targeting
      4. Competency tracking
      5. Premium content progression

   G. Multi-Language Support
      1. Scenario translation
      2. Medical terminology localization
      3. Regional clinical practice adaptation

### V. DEPLOYMENT & INFRASTRUCTURE
   A. Version Control ✅
      1. GitHub repository ✅
      2. Main branch workflow ✅
      3. Claude + GPT-5 collaboration ✅

   B. Testing & Validation
      1. Automated testing 📋 PLANNED
      2. Manual QA procedures ✅
      3. User acceptance testing 📋 PLANNED

   C. Documentation ✅
      1. Code documentation ✅
      2. User guides ✅
      3. API documentation 📋 PLANNED
      4. Session summaries ✅

---

## 📊 CURRENT STATUS SNAPSHOT

### ✅ COMPLETED (Phase I)
- I.A.1.a-c: Google Sheets integration with OAuth
- I.A.2.a-c: Data import systems
- I.B.1.a-e: Complete batch processing infrastructure
- I.B.2.a.i-iii: Input validation system **← COMPLETED TODAY**
- I.B.2.b.i-ii: Hash signature duplicate detection + Force reprocess
- I.B.2.c.i-iii: Clinical defaults system
- I.B.3.a-d: Error handling & recovery
- II.A.1-4: Clinical accuracy standards
- II.B.1,4: Basic educational design
- III.A.1-3: Google Sheets UI complete
- III.B.1-4: Processing controls
- V.A.1-3: Version control & collaboration
- V.C.1-2,4: Core documentation

**Total Scenarios Created:** 206+
**Quality Level:** 100% complete, 6/6 vitals, zero truncation errors

### 🔄 ACTIVE DEVELOPMENT (Phase II.A)
- I.B.2.b.iii: Smart duplicate detection (Next 2 weeks)
  - Title similarity checking
  - Text similarity analysis
  - Demographics pattern detection
  - Diagnosis distribution monitoring
  - Learning objective overlap analysis

### 📋 PLANNED NEXT (Phase II.B-III)
- I.C.1-2: Quality scoring & assessment system
- I.D.1-3: Intelligent case improvement tools
- II.B.2-3: Advanced educational design
- II.C.1-3: Diversity & representation improvements
- III.C.1-4: Quality tools UI

### 🔮 FUTURE (Phase IV-V)
- IV.A-D: AI facilitator integration
- V.B.1,3: Automated testing & UAT

---

## 🎯 IMMEDIATE PRIORITIES (This Week)

### I.B.2.a.iii: Input Validation Deployment
**Status:** Code complete, ready for deployment
**Tasks:**
1. Copy updated Code_ULTIMATE_ATSR.gs to Google Apps Script
2. Test with empty input rows
3. Test with N/A placeholder rows
4. Verify clear error messages appear
5. Confirm skipped rows logged correctly

**Success Criteria:**
- Empty rows skipped with "EMPTY INPUT" message
- N/A rows skipped with "PLACEHOLDER INPUT" message
- Batch processing continues after skips
- All skipped rows logged clearly

### I.B.2.b.iii: Smart Duplicate Detection (Phase II.A Start)
**Status:** Planned, design phase
**First Implementation:**
1. Title similarity checking function (>70% threshold)
2. Text similarity analysis (>90% threshold)
3. Warning system (don't block, just warn)
4. Medical nuance allowances (STEMI variants OK)

**Timeline:** Start Week of 2025-11-04

---

## 📈 SUCCESS METRICS

### Phase I (Complete)
- [x] 200+ scenarios created
- [x] 100% fill rate on completed rows
- [x] 6/6 vital states populated
- [x] Zero JSON truncation errors
- [x] Input validation prevents empty row processing

### Phase II Goals
- [ ] Reduce near-duplicates by 90%
- [ ] Flag potential duplicates before processing
- [ ] Maintain >95% user satisfaction with suggestions
- [ ] Zero false positives on medical nuance cases

### Phase III Goals
- [ ] Every scenario scored 0-100%
- [ ] 80%+ scenarios rated "Premium Quality" (90%+)
- [ ] <5% scenarios rated "Below Standard" (<60%)
- [ ] Quality reports generated automatically

### Phase IV Goals
- [ ] Curriculum balanced across all specialties
- [ ] No diagnosis overrepresented (>10% of total)
- [ ] All similar case clusters refined
- [ ] One-click refinement working

---

## 🔍 KEY INSIGHTS & LESSONS

### Discovery 1: Input Data is Foundation (2025-11-03)
**Issue:** Rows 194-199 were near-duplicates
**Root Cause:** Empty input sheet (all "N/A")
**Solution:** I.B.2.a (Input validation) implemented
**Lesson:** Never process without source material

### Discovery 2: Hash Signatures Aren't Enough (2025-11-03)
**Issue:** Missed 77-89% similar scenarios
**Root Cause:** Hash only catches exact duplicates
**Solution:** I.B.2.b.iii (Smart duplicate detection) planned
**Lesson:** Need multi-level duplicate prevention

### Discovery 3: Medical Nuance vs Duplication (2025-11-03)
**Insight:** Similar scenarios CAN be valid (MI subtypes)
**Requirement:** Must differentiate medical teaching from lazy repetition
**Solution:** Smart allowances in duplicate detection
**Lesson:** Quality system must understand medical education

### Discovery 4: Baseline Quality is Excellent (2025-11-03)
**Finding:** Early rows (4K tokens) = Recent rows (16K tokens) quality
**Value of 16K:** Prevented truncation, not quality improvement
**Lesson:** System was already working well, upgrade added reliability

---

## 🗓️ TIMELINE ESTIMATES

### Week of 2025-11-04 (Phase II.A)
- Deploy input validation
- Test validation thoroughly
- Begin smart duplicate detection implementation
- Design title similarity algorithm

### Week of 2025-11-11 (Phase II.A cont.)
- Complete title similarity checking
- Implement text similarity analysis
- Add demographics pattern detection
- Test on existing scenarios

### Week of 2025-11-18 (Phase II.B)
- Complete Phase II.A features
- Begin quality scoring system (Phase III)
- Design scoring rubric
- Prototype scoring algorithm

### Week of 2025-11-25 (Phase III)
- Complete basic quality scoring
- Generate first quality reports
- Test on all 200+ scenarios
- Refine scoring criteria

### Month of December 2025 (Phase III-IV)
- Complete quality scoring system
- Begin intelligent case improvement (Phase IV)
- Build similarity comparison engine
- Create curriculum balance analyzer

### Q1 2026 (Phase IV completion)
- Complete intelligent improvement tools
- Refine all scenarios using quality system
- Generate comprehensive curriculum reports
- Prepare for AI facilitator integration

---

## 📋 DECISION LOG

### Decision 1: Keep Hash Signatures, Add Smart Checking (2025-11-03)
**Context:** Discovered near-duplicates that hash missed
**Decision:** Don't disable hash - build smart detection on top
**Rationale:** Hash prevents exact duplicates, smart detection catches similar
**Status:** Approved, implementation in Phase II.A

### Decision 2: Quality Tools After Processing (2025-11-03)
**Context:** Where to implement duplicate detection
**Decision:** Build as separate quality tools, not inline during processing
**Rationale:** Cleaner architecture, easier testing, better UX
**Status:** Approved, roadmap updated

### Decision 3: Require Non-Empty Input (2025-11-03)
**Context:** Empty input caused duplicates
**Decision:** Strict validation - skip all empty/N/A rows
**Rationale:** Prevention better than remediation
**Status:** Implemented, ready for deployment

### Decision 4: Medical Nuance Allowances (2025-11-03)
**Context:** MI subtypes are similar but educationally distinct
**Decision:** Allow similar diagnoses IF clearly differentiated
**Rationale:** Medical education requires teaching nuanced variations
**Status:** Design requirement for Phase II.A

---

## 🤝 TEAM ROLES

### Claude (Local Development)
- Implementation and coding
- Feature development
- Testing and debugging
- Documentation creation

### GPT-5 (Systems Architecture)
- Code review
- Architecture design
- Optimization recommendations
- Strategic guidance

### Aaron (Project Leadership)
- Creative direction
- Medical expertise validation
- Feature prioritization
- User acceptance testing
- Final decision authority

---

## 📖 REFERENCE DOCUMENTS

### Planning & Strategy
- [DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md) - This document
- [SIMULATION_CONVERSION_SYSTEM.md](docs/SIMULATION_CONVERSION_SYSTEM.md) - System overview

### Current Work
- [SESSION_SUMMARY_2025-11-03.md](testing/SESSION_SUMMARY_2025-11-03.md) - Today's work
- [INPUT_VALIDATION_IMPLEMENTATION.md](testing/INPUT_VALIDATION_IMPLEMENTATION.md) - I.B.2.a details

### Analysis & Findings
- [QUALITY_ANALYSIS_SUMMARY.md](testing/QUALITY_ANALYSIS_SUMMARY.md) - Quality comparison
- [DUPLICATE_ANALYSIS_ROWS_194-199.md](testing/DUPLICATE_ANALYSIS_ROWS_194-199.md) - Duplicate findings

### Technical Documentation
- [BATCH_PROCESSING_SYSTEM.md](docs/BATCH_PROCESSING_SYSTEM.md) - Phase 1-3 documentation
- [REALISTIC_TEST_STRATEGY.md](testing/REALISTIC_TEST_STRATEGY.md) - Testing approach

---

**Roadmap Version:** 2.0 (Alphanumeric Format)
**Last Updated:** 2025-11-03
**Next Review:** After Phase II.A completion
