# AI Pathway Discovery - Dual Mode System

## Overview
**Deployed:** 2025-11-04
**Status:** ✅ Production-ready
**File:** [Categories_Pathways_Feature_Phase2.gs](../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs)

AI-powered pathway discovery with TWO creativity levels:
1. **🤖 Standard Mode** - Creative but grounded pathway groupings
2. **🔥 Radical Mode** - Experimental, boundary-pushing pathways

## User Experience

### Button Location
**Pathway Chain Builder → Intelligent Pathway Opportunities** section
- Top right corner, next to "🧩 Intelligent Pathway Opportunities" title
- Two buttons side-by-side:
  - **Blue gradient button:** "🤖 AI: Discover Novel Pathways" (Standard)
  - **Orange gradient button with glow:** "🔥 AI: Radical Mode" (Experimental)

### Click Behavior
1. User clicks either button
2. Button text changes to loading state:
   - Standard: "⏳ Discovering..."
   - Radical: "🔥 Thinking radically..."
3. Button disabled during processing
4. OpenAI API call executes (5-15 seconds)
5. Beautiful modal dialog appears with AI-generated pathway pitch cards

## Creativity Modes Comparison

| Feature | Standard Mode 🤖 | Radical Mode 🔥 |
|---------|-----------------|----------------|
| **Temperature** | 0.7 (balanced) | 1.0 (maximum creativity) |
| **Target Novelty** | 7+ / 10 | 9-10 / 10 |
| **Approach** | Creative but practical | Experimental, boundary-pushing |
| **Persona** | Dr. Maria Rodriguez, award-winning educator | Dr. Zara Blackwood, visionary revolutionary |
| **Philosophy** | Novel groupings within medical education norms | Apply game design, psychology, film narrative to medicine |
| **Examples** | "Imposter Syndrome Destroyer", "Puzzle Master Series", "90-Second Saves" | "The Gambler's Fallacy Cases", "Jazz Improvisation Protocol", "The Method Actor's Toolkit" |
| **Scientific Rationale** | Not shown | Displayed (explains cognitive science backing) |
| **Use Case** | Practical curriculum design | Innovative pilots, experimental workshops |

## Standard Mode Details

### AI Persona
**Dr. Maria Rodriguez** - Award-winning medical educator known for creative but grounded curriculum design

### FORBIDDEN Groupings
- ❌ Body system categorization alone ("All cardiac cases")
- ❌ Simple age grouping ("Pediatric patients")
- ❌ Basic acuity alone ("Critical patients")
- ❌ Anything a traditional textbook would suggest

### ENCOURAGED Patterns
- ✅ **Psychological patterns** - Cases that trigger cognitive biases (anchoring, availability)
- ✅ **Emotional journeys** - Frustration → relief → confidence building
- ✅ **Narrative arcs** - Mystery stories, plot twists, "aha!" moments
- ✅ **Skill scaffolding** - Micro-skills building toward mastery
- ✅ **Common mistakes** - Cases where residents make the same error
- ✅ **Time pressure patterns** - 5-minute decisions vs 2-hour workups
- ✅ **Communication complexity** - Difficult conversations, bad news
- ✅ **Pattern interrupts** - Cases that shatter assumptions

### Example Pathways
```
🎭 "The Imposter Syndrome Destroyer"
   - Cases that LOOK overwhelming but have surprisingly simple solutions
   - Builds confidence, fights imposter syndrome

🧩 "The Puzzle Master Series"
   - Each case has ONE weird finding that's the key to everything
   - Pattern recognition training

🔮 "The Fortune Teller Challenge"
   - Predict the diagnosis from just the chief complaint
   - Bayesian reasoning practice
```

## Radical Mode Details

### AI Persona
**Dr. Zara Blackwood** - Visionary medical educator who pushes boundaries, applies behavioral psychology and game design to medicine

### RADICAL Requirements
1. Each pathway must teach something NO traditional curriculum teaches
2. Novelty score must be 8-10/10 (aim for 10)
3. Justify WHY this unconventional approach creates better learning
4. Show the psychological/cognitive science behind the method
5. Be provocative but defensible

### RADICAL Concepts
```
🎲 "The Gambler's Fallacy Cases"
   - Learn probability and base rates through cases where intuition fails
   - Cognitive debiasing through counterintuitive scenarios

🎭 "The Method Actor's Toolkit"
   - Embody the patient's experience to understand presentations
   - Empathy training through perspective-taking

🧬 "The Butterfly Effect"
   - Tiny early interventions that cascade into massive outcomes
   - Systems thinking and non-linear causality

🎸 "The Jazz Improvisation Protocol"
   - Cases requiring creative problem-solving when protocols fail
   - Adaptive expertise development

🏋️ "The Mental Strength Training"
   - Psychological resilience through high-stress scenarios
   - Stress inoculation training

🕵️ "The Detective's Casebook"
   - Sherlock Holmes-style deductive reasoning
   - Diagnostic reasoning as detective work

⚡ "The Lightning Round"
   - Rapid-fire decision chains (every 30 seconds matters)
   - Speed-accuracy tradeoff training
```

## Output Format

### 11 Fields Per Pathway

**Standard Mode:**
1. `pathway_name` - Exciting, memorable (like Netflix series title)
2. `pathway_icon` - Single emoji
3. `grouping_logic_type` - New category (e.g., "Emotional Arc", "Cognitive Trap Pattern")
4. `why_this_matters` - 30-second elevator pitch (2-3 sentences)
5. `learning_outcomes` - 3-4 specific, measurable outcomes
6. `best_for` - Target audience and use cases
7. `unique_value` - What this teaches that NO other grouping teaches
8. `case_ids` - Array of case IDs (minimum 3)
9. `novelty_score` - 1-10 (aim for 7+)
10. `estimated_learning_time` - How long to complete
11. `difficulty_curve` - "Gentle", "Steep", or "Rollercoaster"

**Radical Mode (adds #12):**
12. `scientific_rationale` - Learning science / psychology backing

### Example JSON Response
```json
[
  {
    "pathway_name": "The Overthinking Trap",
    "pathway_icon": "🧠",
    "grouping_logic_type": "Cognitive Debiasing Pattern",
    "why_this_matters": "These are cases where the obvious diagnosis IS correct, but residents overthink and second-guess themselves. Teaches fighting premature closure's evil twin: premature complexity. Builds diagnostic confidence.",
    "learning_outcomes": [
      "Recognize when Occam's Razor applies in emergency medicine",
      "Identify cognitive patterns that lead to overdiagnosis",
      "Build confidence in straightforward clinical presentations",
      "Understand when NOT to order additional testing"
    ],
    "best_for": "2nd year residents, learners with analysis paralysis, board prep (avoiding overthinking)",
    "unique_value": "While most training fights premature closure, this teaches the opposite: when to trust your initial assessment and avoid complexity bias.",
    "case_ids": ["GI00043", "CV00127", "RESP0089", "NEURO0034", "CV00201"],
    "novelty_score": 8,
    "estimated_learning_time": "90 minutes (5 cases, 15-20 min each)",
    "difficulty_curve": "Gentle"
  }
]
```

## Pitch Card UI

### Visual Design
Beautiful gradient cards with:
- **Animated gradient borders** on hover
- **Large emoji icons** (42px) with drop shadows
- **Star ratings** (⭐⭐⭐⭐⭐) based on novelty score
- **Multi-badge meta sections**:
  - Case count
  - 🎨 Novelty score (gradient background)
  - ⏱️ Estimated time (blue highlight)
  - 📊 Difficulty curve (orange highlight)

### Sections
1. **Header** - Icon + Name + Star Rating + Grouping Logic Type
2. **🎯 Why This Pathway Matters** - Compelling pitch (2-3 sentences)
3. **📚 Learning Outcomes** - Checkmarked bullet list
4. **👥 Best For** - Target audience (blue highlighted box)
5. **💎 Unique Value Proposition** - What no other grouping teaches (gradient background)
6. **🔬 Scientific Rationale** (Radical mode only) - Cognitive science backing (dashed border)
7. **Action Buttons** - "🚀 Build This Pathway Now" + "📋 View Cases"

### Color Theming
**Standard Mode:**
- Primary color: `#2357ff` (blue)
- Gradient: Blue → Cyan
- Hover shadow: Blue glow

**Radical Mode:**
- Primary color: `#ff6b00` (orange/red)
- Gradient: Orange → Red
- Hover shadow: Orange glow
- Extra: Pulsing glow effect on button

## Technical Implementation

### Functions

**Backend:**
```javascript
function discoverNovelPathwaysWithAI_(creativityMode)
  // creativityMode: 'standard' or 'radical'
  // Returns: { success: bool, pathways: array, error?: string }

function showAIDiscoveredPathways(creativityMode)
  // creativityMode: 'standard' or 'radical'
  // Displays modal dialog with pitch cards
```

**Frontend Wrappers:**
```javascript
function showAIPathwaysStandard()
  // Called by blue button

function showAIPathwaysRadical()
  // Called by orange button
```

### OpenAI API Call

**Endpoint:** `https://api.openai.com/v1/chat/completions`
**Model:** `gpt-4`
**Max Tokens:** 2500
**Temperature:** 0.7 (standard) / 1.0 (radical)

**System Prompt:**
- Standard: "You are an expert medical educator specializing in simulation-based learning and innovative curriculum design."
- Radical: "You are an experimental medical educator applying cognitive science, game design, and behavioral psychology to medical education."

### Error Handling
- Missing API key → Alert: "No OpenAI API key found in Settings!B2"
- API error → Alert with error code
- JSON parse failure → Alert: "Failed to parse AI response. Please try again."
- Network timeout → Standard Google Apps Script timeout handling

## Configuration

### Requirements
1. **OpenAI API Key** in `Settings!B2` cell
2. **GPT-4 access** (not GPT-3.5)
3. **Internet connectivity** (Apps Script makes external API call)

### Optional Enhancements
- Adjust temperature values (currently 0.7 / 1.0)
- Modify max_tokens (currently 2500)
- Add additional creativity modes (e.g., "conservative" at 0.4)
- Customize prompt examples per institution

## Use Cases

### Standard Mode Best For:
- ✅ Regular curriculum design
- ✅ Building departmental pathways
- ✅ Board prep materials
- ✅ Resident rotation planning
- ✅ Conference workshop design

### Radical Mode Best For:
- ✅ Innovative pilot programs
- ✅ Research on educational methods
- ✅ Conference keynotes / demos
- ✅ Grant proposals (novel approaches)
- ✅ Experimental electives
- ✅ "Advanced Topics" courses
- ✅ Faculty development workshops

## Future Enhancements

### Planned
- [ ] **"Build This Pathway Now"** button integration → Pre-load chain builder with selected cases
- [ ] **Save AI pathways** to library for later use
- [ ] **Hybrid mode** slider (0.4 to 1.0 temperature control)
- [ ] **Custom prompts** - User can edit AI instructions
- [ ] **Multi-language support** - Generate pathways in different languages

### Potential
- [ ] **Feedback loop** - Track which AI pathways users actually build
- [ ] **Refinement mode** - "Make this more/less creative"
- [ ] **Combination mode** - Merge two pathways into hybrid
- [ ] **Export to PDF** - Share AI pitch cards with team
- [ ] **Integration with LMS** - One-click pathway export

## Analytics

### Track (Future)
- Which creativity mode is more popular
- Average novelty scores users select
- Most common grouping_logic_types
- Correlation between novelty score and pathway completion

## References

- [AI_PATHWAY_DISCOVERY_SPEC.md](./AI_PATHWAY_DISCOVERY_SPEC.md) - Original single-mode spec
- [ENHANCED_PATHWAY_DETECTION.md](./ENHANCED_PATHWAY_DETECTION.md) - Rule-based detection system
- [Categories_Pathways_Feature_Phase2.gs](../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs:Lines 2299-2440) - Implementation

## Changelog

**2025-11-04 (v7.2)** - SMART CACHING + PRE-CACHE UI ✅ DEPLOYED
- 🚀 **SMART 3-TIER CACHING SYSTEM** - Solves timeout issues while preserving all 23 rich fields
  - **Tier 1**: Instant cache retrieval (<1 second if cache < 24 hours old)
  - **Tier 2**: Fresh analysis with 4-minute timeout protection
  - **Tier 3**: Lightweight fallback (6 basic fields) if all else fails
  - **Why This Matters**: `performHolisticAnalysis_()` was timing out on 210+ cases, system would hang after "Discovery started"
  - **User Experience**: 99% of the time instant results, preserves all clinical context AI needs
- 💾 **PRE-CACHE UI WITH LIVE PROGRESS** - Manual cache trigger with beautiful visualization
  - **New Button**: "💾 Pre-Cache Rich Data" (green gradient with glow) added to Intelligent Pathway Opportunities section
  - **Live Progress Modal**: Shows progress bar (0% → 100%), timestamps (MM:SS), case count updates
  - **Color-Coded Logs**: Cyan (info), green (success), yellow (warning)
  - **Auto-Close**: Modal closes automatically 3 seconds after completion
  - **When to Use**: First time setup, after adding many cases, or to refresh stale cache
- 📊 **CACHE STORAGE**: Uses hidden `Pathway_Analysis_Cache` sheet (timestamp + JSON analysis)
  - **Validity**: 24 hours (auto-refreshes when stale)
  - **Size**: ~200 KB compressed JSON for 210+ cases × 23 fields
  - **Performance**: 99%+ cache hit rate expected in normal usage
- 🔧 **FUNCTIONS ADDED**:
  - `analyzeCatalog_()` - Smart wrapper with 3-tier caching logic (lines 2590-2660)
  - `preCacheRichData()` - Live progress UI modal (lines 2475-2541)
  - `performCacheWithProgress()` - Backend cache processing (lines 2546-2572)
- **File Size**: 113.0 KB (was 107.8 KB in v7.1) - still under 150 KB limit
- **Deployment**: ✅ Pushed to production via Apps Script API (2025-11-04)
- **Location**: [Categories_Pathways_Feature_Phase2.gs](../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs)

**2025-11-04 (v7.1)** - CRITICAL BUGFIX: Missing Function
- 🐛 **FIXED: Missing `analyzeCatalog_()` function** that caused "ERROR: undefined" crash
  - **Root Cause**: Function was called at lines 2325 and 2629 but never defined
  - **Solution**: Added wrapper function that calls existing `performHolisticAnalysis_()`
  - **Impact**: System now successfully loads case catalog and proceeds to OpenAI API call
  - **File Size**: 104.9 KB (was 104.4 KB)
  - **Testing**: Verified with automated test suite - all critical functions now present
  - **Location**: [Categories_Pathways_Feature_Phase2.gs](../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs:2584-2586)

**2025-11-04 (v7)** - TWO-TYPE DISEASE MIMICS FRAMEWORK
- ✅ **DUAL-CATEGORY DISEASE MIMICS** - AI now distinguishes between two critical types:
  - **Type A: Cross-Category Mimics** - Similar symptoms, dramatically different pathophysiology
    - Examples: MI vs panic attack vs GERD, meningitis vs migraine, PE vs pneumonia vs pneumothorax
    - Why: Prevents catastrophic misdiagnosis when presentation misleads
  - **Type B: Within-Category Mimics** - Related diseases where subtle distinctions are essential
    - Examples: STEMI vs Wellens vs Takotsubo, bacterial vs viral vs fungal meningitis, DKA vs HHS vs euglycemic DKA
    - Why: Correct subtype identification changes management and outcomes
  - **Updated Priority Framework**:
    - **Standard Mode**: (1) Can't-miss diagnoses, (2) Time-sensitive interventions, **(3) Disease mimics (both types)**, (4) High-risk populations, (5) Undifferentiated patients, (6) Cognitive errors
    - **Radical Mode**: (1) High-stakes scenarios, (2) Diagnostic pitfalls, **(3) Disease mimics (both types)**, (4) Procedural mastery, (5) Complex decision-making, (6) Communication under pressure
  - **Enhanced Pathway Name Examples**:
    - "The Deadly Doppelgangers" - Cross-category mimics
    - "Evil Twins: Life-or-Death Differences" - Within-category mimics
    - "When Similar Kills Different" - Both types combined
    - "The Subtle Distinction Series" - Within-category focus

**2025-11-04 (v6)** - DISEASE MIMICS PRIORITY + CLICK-WORTHY NAMING
- ✅ **DISEASE MIMICS ADDED TO PRIORITY FRAMEWORK** - Confusable presentations now #3 priority (refined to two-type framework in v7)
  - **Standard Mode**: (1) Can't-miss diagnoses, (2) Time-sensitive interventions, **(3) Disease mimics**, (4) High-risk populations, (5) Undifferentiated patients, (6) Cognitive errors
  - **Radical Mode**: (1) High-stakes scenarios, (2) Diagnostic pitfalls, **(3) Disease mimics**, (4) Procedural mastery, (5) Complex decision-making, (6) Communication under pressure
  - **Why This Matters**: Learning to differentiate confusable presentations is CRITICAL EM skill
  - **Examples**: MI vs dissection, PE vs pneumonia, appendicitis vs ectopic, meningitis vs subarachnoid
- ✅ **NETFLIX-STYLE NAMING** - Make ED clinicians think "I NEED this!"
  - **Emotionally resonant language**: Trigger curiosity, urgency, fear-of-missing-out
  - **Action-oriented promises**: Transformation and mastery (not just information)
  - **Specific enough to visualize**: Concrete scenarios, not vague concepts
  - **Avoid boring academic titles**: No "Cardiovascular Pathology Module"
  - **Standard Mode Examples**:
    - ✅ "The Can't-Miss Chest Pain Series"
    - ✅ "The Great Pretenders: Disease Mimics"
    - ✅ "60-Second Life-or-Death Decisions"
    - ✅ "When Vital Signs Lie"
    - ✅ "Shift From Hell Simulator"
  - **Radical Mode Examples**:
    - ✅ "The 3am Nightmare Cases"
    - ✅ "Death By Anchoring"
    - ✅ "The Great Pretenders"
    - ✅ "The Cognitive Trap Collection"
    - ✅ "Cases That Haunt Attendings"
  - Enhanced prompt instructions emphasize clinical value AND irresistible naming

**2025-11-04 (v4)** - CLINICAL PRIORITIZATION: EM Physician Value-First Ranking
- ✅ **EM PHYSICIAN-CENTERED PROMPTS** - Prioritize clinical value over pure novelty:
  - **Target Audience**: Emergency physicians, EM residents, simulation educators
  - **Priority Framework (Standard Mode)** - Original 5-tier (updated to 6-tier in v6):
    1. Can't-miss diagnoses
    2. Time-sensitive interventions
    3. High-risk populations (pediatrics/geriatrics)
    4. Undifferentiated patients
    5. Cognitive errors/biases
  - **Priority Framework (Radical Mode)** - Original 5-tier (updated to 6-tier in v6):
    1. High-stakes/time-critical scenarios
    2. Diagnostic pitfalls/misses
    3. Procedural mastery
    4. Complex decision-making
    5. Communication under pressure
  - **New Output Field**: `clinical_value_score` (1-10) - Rates clinical utility for EM physicians
  - **Results Sorted**: Pathways ordered by clinical impact (highest value first)

**Expected High-Value Pathways for EM Physicians:**
  - 🚨 "The Zebras That Kill" - Can't-miss diagnoses (aortic dissection, ectopic, etc.)
  - ⏱️ "Door-to-Decision <10min" - Time-critical interventions
  - 🧸 "Pediatric Red Flags Masterclass" - Sick vs not-sick in kids
  - 🧓 "When Old Age Hides the Truth" - Atypical geriatric presentations
  - 🎯 "The Chest Pain Gamble" - Risk stratification mastery
  - 🧠 "Death By Anchoring" - Cognitive error training
  - 💊 "High-Stakes Drug Decisions" - Thrombolytics, anticoagulation
  - 🔪 "When Procedures Go Wrong" - Crisis management

**2025-11-04 (v3)** - ENHANCED: Clinical Context for Maximum AI Discovery
- ✅ **CLINICAL CONTEXT ADDITIONS** - 11 new fields for pattern recognition:
  - **Demographics**: age, gender (unlocks age-specific & gender-specific pathways)
  - **Initial Vitals**: HR, BP, RR, SpO2 (pattern recognition: compensated shock, vital-diagnosis mismatch)
  - **Physical Exam**: examFindings (first 200 chars) - "The Subtle Sign Series", "Physical Diagnosis Saves Lives"
  - **Medical Complexity**: medications (150 chars), pastMedicalHistory (200 chars), allergies
  - **Environment**: environmentType, disposition
  - **Helper Function**: `extractVital_()` safely parses vitals JSON

**2025-11-04 (v2)** - Live streaming logs + Full catalog analysis
- ✅ **LIVE STREAMING LOGS** - Terminal-style real-time progress window
  - Client-side polling every 300ms for instant updates
  - Color-coded log levels (cyan=info, green=success, yellow=warning, red=error)
  - Elapsed time timestamps (MM:SS format)
  - Shows all 6 steps: API key → Catalog → Summaries → Prompt → OpenAI → Parse
  - Status bar shows current phase
  - Auto-closes and shows results when complete (2sec delay)
- ✅ **FULL CATALOG ANALYSIS** - Analyzes ALL cases (not just 50 sample)
  - Sends **rich context summaries** for each case (23 fields total):
    - Basic: id, title, diagnosis, category, difficulty, duration, setting, presentation
    - Learning: learningOutcomes (full text), learningObjectives (full text)
    - Context: preSimOverview (first 300 chars), postSimOverview (first 300 chars)
    - Demographics: age, gender
    - Initial Vitals: HR, BP, RR, SpO2
    - Clinical: examFindings, medications, pmh, allergies
    - Environment: environment, disposition
  - No complete vitals objects sent (keeps payload manageable)
  - AI can discover 15-20 additional pathway types beyond v1
  - Increased max_tokens to 2500 for richer output
- ✅ Enhanced prompts with clear instructions
  - "ANALYZE ALL X CASES" messaging
  - "Return ONLY JSON array, NO markdown, NO explanation"
  - More specific field requirements
  - Better system prompts for each mode

**2025-11-04 (v1)** - Initial dual-mode deployment
- ✅ Added Standard Mode (temperature 0.7)
- ✅ Added Radical Mode (temperature 1.0)
- ✅ TWO buttons in Pathways tab UI
- ✅ Beautiful gradient pitch cards
- ✅ Scientific rationale field for Radical mode
- ✅ Distinct color theming per mode
- ✅ Deployed at 88.7 KB file size
