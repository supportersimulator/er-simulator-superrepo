# Pathway Chain Builder - Advanced Feature Proposal

## Vision

Transform the Categories & Pathways panel from static grouping into an **intelligent, interactive pathway design system** where AI analyzes the entire case library holistically, suggests optimal learning sequences, provides rationale for each recommendation, and allows intuitive visual chain building with dynamic alternatives.

---

## Current State (Phase 1 - Completed)

✅ **What We Have Now:**
- 6 pathway grouping logic types
- Static accordion groups showing cases that match each logic type
- Basic keyword-based grouping
- Modal dialog UI (1920x1000)
- AI-powered logic type suggestions

**Limitations:**
- No sequential ordering within groups
- No rationale for why cases belong together
- No visualization of pathway flow
- No alternative suggestions
- No drag-and-drop reordering
- No dynamic chain building

---

## Proposed Phase 2: Interactive Pathway Chain Builder

### 1. Holistic Case Analysis (Bird's Eye View)

**AI Pre-Analysis Step:**
When panel opens, AI analyzes entire case library to understand:
- Medical system distribution
- Complexity patterns
- Prerequisite relationships (Case A should come before Case B)
- Topic clusters (related diagnoses)
- Skill progression opportunities
- Rare vs common presentations
- Time-critical vs diagnostic puzzles

**Implementation:**
```javascript
function analyzeEntireCaseLibrary() {
  // 1. Extract all case metadata
  const allCases = getAllCasesWithMetadata();

  // 2. Build relationship graph
  const relationships = buildCaseRelationships(allCases);

  // 3. Identify natural clusters
  const clusters = identifyNaturalClusters(allCases);

  // 4. Detect prerequisite chains (foundational → advanced)
  const prerequisites = detectPrerequisiteChains(allCases);

  // 5. AI-powered insight generation
  const insights = generatePathwayInsights(allCases, relationships, clusters);

  return {
    totalCases: allCases.length,
    systemDistribution: {...},
    suggestedPathways: [...],
    insights: insights
  };
}
```

**OpenAI Prompt Example:**
```
Analyze this collection of 250 emergency medicine cases and identify:
1. Natural learning progressions (which cases should come before others)
2. Skill-building sequences (ACLS pathway, Trauma pathway, etc.)
3. Topic clusters (all chest pain cases, all respiratory, etc.)
4. Complexity tiers within each system
5. Suggest 5-7 high-value educational pathways with rationale

Cases: [JSON array of all case metadata]
```

---

### 2. Visual Pathway Chain Interface

**UI Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ 🧩 Pathway Builder: ACLS Protocol Series                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Start                                                      │
│    ↓                                                        │
│  ┌─────────────────┐                                       │
│  │  Case 1: NSR    │ ← PRIMARY (highlighted)               │
│  │  "Basic rhythm" │                                       │
│  └─────────────────┘                                       │
│    ├─ GI023: Sinus Brady (dimmed alternative)             │
│    └─ GI045: First Degree Block (dimmed alternative)       │
│                                                             │
│    ↓  (AI: "Establish baseline normal rhythm recognition") │
│                                                             │
│  ┌─────────────────┐                                       │
│  │  Case 2: AFib   │ ← PRIMARY                             │
│  │  "Irregular"    │                                       │
│  └─────────────────┘                                       │
│    ├─ GI067: A-Flutter (dimmed)                            │
│    └─ GI089: SVT (dimmed)                                  │
│                                                             │
│    ↓  (AI: "Progress to irregular rhythms, stable patient")│
│                                                             │
│  ┌─────────────────┐                                       │
│  │  Case 3: VTach  │ ← PRIMARY                             │
│  └─────────────────┘                                       │
│    ├─ GI123: VFib (dimmed)                                 │
│    └─ GI156: Asystole (dimmed)                             │
│                                                             │
│    ↓  (AI: "Escalate to life-threatening arrhythmias")    │
│                                                             │
│  [+ Add Case]  [Save Pathway]  [Export Sequence]           │
└─────────────────────────────────────────────────────────────┘
```

**Key Visual Elements:**

1. **Primary Cases** (Fully Highlighted)
   - Large card, bright border, full color
   - Spark Title + Case ID visible
   - "Why this case?" tooltip on hover

2. **Alternative Cases** (Dimmed)
   - Smaller cards, muted colors, 50% opacity
   - Indented beneath primary
   - Click to swap with primary

3. **AI Rationale Bubbles**
   - Between each case in chain
   - Explains pedagogical reasoning
   - "Why this order?" justification

4. **Interactive Actions**
   - Drag primary cases to reorder
   - Click alternatives to swap
   - Hover for detailed rationale
   - "X" to remove from chain
   - "+ Add Case" to insert at any point

---

### 3. Dynamic Chain Logic

**How the Chain Updates:**

When user clicks an alternative case, the entire downstream chain recalculates:

```javascript
function updateChainOnSwap(pathwayChain, positionIndex, newCaseId) {
  // 1. Replace case at position
  pathwayChain[positionIndex] = newCaseId;

  // 2. Re-analyze downstream cases
  const remainingChain = pathwayChain.slice(positionIndex + 1);

  // 3. Ask AI: "Given this new case order, should the next cases change?"
  const aiRecommendation = analyzeChainCoherence(pathwayChain);

  // 4. Update alternatives for next position
  const newAlternatives = suggestNextCases(newCaseId, pathwayChain);

  // 5. Optionally suggest reordering downstream
  if (aiRecommendation.shouldReorder) {
    showReorderSuggestion(aiRecommendation.newOrder);
  }

  return updatedChain;
}
```

**Example Scenario:**

```
Original Chain:
1. NSR → 2. AFib → 3. VTach → 4. VFib

User swaps AFib for SVT:
1. NSR → 2. SVT → 3. ??? → 4. ???

AI recalculates:
"Since you chose SVT (narrow complex tachycardia),
the next case should focus on rate control vs rhythm control.
Suggest: AFib with RVR (rate control practice)
Then: VTach (progress to wide complex)"

New Chain:
1. NSR → 2. SVT → 3. AFib with RVR → 4. VTach
```

---

### 4. AI Rationale System

**Three Types of Rationale:**

1. **Case Inclusion Rationale**
   - *"Why does this case belong in the ACLS pathway?"*
   - Display: Tooltip on case card
   - Example: "Requires ACLS algorithm knowledge, unstable rhythm, team coordination"

2. **Sequencing Rationale**
   - *"Why does this case come at position 3 in the series?"*
   - Display: Between cases in chain
   - Example: "Builds on sinus rhythm recognition (Case 1) and irregular rhythm experience (Case 2). Introduces life-threatening arrhythmia requiring immediate action."

3. **Alternative Rationale**
   - *"Why are these alternatives suggested?"*
   - Display: Hover over alternative cards
   - Example: "VFib is suggested as alternative because it's also a shockable rhythm, similar urgency, but more chaotic waveform pattern"

**OpenAI API Integration:**

```javascript
function generateCaseRationale(caseId, pathwayLogic, position, previousCases) {
  const prompt = `
You are an expert medical educator designing learning pathways.

Pathway: ${pathwayLogic} (e.g., "ACLS Protocol Series")
Current Position: ${position} of ${totalCases}
Previous Cases: ${previousCases.join(', ')}
This Case: ${caseId} - ${sparkTitle}

Explain in 1-2 sentences:
1. Why this case fits this pathway
2. Why it belongs at this position (what foundation it builds on)
3. What skill/knowledge it advances

Format: Plain text, concise, educational tone.
`;

  return callOpenAI(prompt);
}
```

---

### 5. Drag-and-Drop Reordering

**Implementation:**

```javascript
// HTML5 Drag and Drop API
function makeCaseDraggable(caseCard) {
  caseCard.draggable = true;

  caseCard.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('caseId', caseCard.dataset.caseId);
    e.dataTransfer.setData('currentPosition', caseCard.dataset.position);
  });
}

function makeDropZone(positionSlot) {
  positionSlot.addEventListener('dragover', (e) => {
    e.preventDefault(); // Allow drop
    positionSlot.classList.add('drop-highlight');
  });

  positionSlot.addEventListener('drop', (e) => {
    const draggedCaseId = e.dataTransfer.getData('caseId');
    const currentPos = e.dataTransfer.getData('currentPosition');
    const newPos = positionSlot.dataset.position;

    // Reorder pathway chain
    reorderPathway(currentPos, newPos);

    // Re-render with updated chain
    renderPathwayChain(updatedChain);
  });
}
```

**Visual Feedback:**
- Dragging: Semi-transparent ghost of card
- Drop zones: Highlight with blue dashed border
- Invalid drop: Red border + "Cannot drop here"
- Valid drop: Green pulse animation

---

### 6. Alternative Selection (Prominence System)

**CSS Implementation:**

```css
/* Primary case - fully prominent */
.case-primary {
  opacity: 1.0;
  transform: scale(1.0);
  border: 2px solid #2357ff;
  box-shadow: 0 4px 12px rgba(35, 87, 255, 0.3);
  z-index: 10;
}

/* Alternative cases - less prominent */
.case-alternative {
  opacity: 0.5;
  transform: scale(0.85);
  border: 1px solid #2a3040;
  margin-left: 40px; /* Indented */
  cursor: pointer;
  transition: all 0.3s ease;
}

/* Hover alternative - preview prominence */
.case-alternative:hover {
  opacity: 0.8;
  transform: scale(0.95);
  border-color: #2357ff;
}

/* Swapping animation */
@keyframes swap {
  0% { transform: translateY(0); opacity: 1; }
  50% { transform: translateY(-20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
```

**JavaScript Toggle:**

```javascript
function swapPrimaryAndAlternative(primaryCard, alternativeCard) {
  // 1. Animate swap
  primaryCard.classList.add('swapping');
  alternativeCard.classList.add('swapping');

  // 2. Update data
  const temp = primaryCard.dataset.caseId;
  primaryCard.dataset.caseId = alternativeCard.dataset.caseId;
  alternativeCard.dataset.caseId = temp;

  // 3. Update classes
  primaryCard.classList.remove('case-primary');
  primaryCard.classList.add('case-alternative');
  alternativeCard.classList.remove('case-alternative');
  alternativeCard.classList.add('case-primary');

  // 4. Re-render rationale and downstream chain
  updateChainFromPosition(position);
}
```

---

### 7. Logic Type Dropdown Impact

**Dynamic View Switching:**

When user changes logic type dropdown, the ENTIRE panel recalculates:

```javascript
function onLogicTypeChange(newLogicType) {
  // Show loading state
  showLoading("Re-analyzing pathways for " + newLogicType + "...");

  // Call AI to re-analyze entire library through new lens
  google.script.run
    .withSuccessHandler((newPathways) => {
      // Completely new set of pathway suggestions
      renderPathwayOptions(newPathways);

      // Different pathways highlighted based on logic
      // e.g., System-Based shows "All CARD Cases" pathway
      //       Protocol-Based shows "ACLS Sequence" pathway
    })
    .analyzePathwaysByLogic(newLogicType);
}
```

**Example Logic Type Impact:**

| Logic Type | Pathway Examples | Chain Focus |
|------------|------------------|-------------|
| **System-Based** | "All CARD Cases", "All RESP Cases" | Organ system mastery |
| **Protocol** | "ACLS Sequence", "PALS Sequence" | Skill protocol progression |
| **Complexity** | "Foundational → Advanced" | Difficulty progression |
| **Reasoning** | "Diagnostic Dilemmas", "Time-Critical" | Cognitive skill development |

Each logic type reveals TOTALLY different pathway opportunities from the same case library.

---

## Technical Architecture

### Data Structure

```javascript
// Pathway object
{
  id: "pathway_acls_001",
  name: "ACLS Protocol Series",
  logicType: "protocol",
  description: "Progressive ACLS skill building",
  chain: [
    {
      position: 1,
      primaryCase: {
        caseId: "GI001234",
        sparkTitle: "Chest Pain with Normal ECG",
        rationale: "Establishes baseline rhythm recognition"
      },
      alternatives: [
        {
          caseId: "GI001235",
          sparkTitle: "Sinus Bradycardia",
          rationale: "Alternative starting point focusing on rate"
        }
      ]
    },
    {
      position: 2,
      primaryCase: {...},
      alternatives: [...]
    }
  ],
  metadata: {
    totalCases: 8,
    estimatedDuration: "4 hours",
    targetLearner: "PGY1-2",
    prerequisites: [],
    outcomes: ["ACLS certification readiness"]
  }
}
```

### API Calls

**1. Initial Analysis**
```javascript
analyzeEntireCaseLibrary() → returns holistic insights
```

**2. Pathway Suggestions by Logic**
```javascript
suggestPathwaysByLogic(logicType) → returns pathway options
```

**3. Chain Building**
```javascript
buildPathwayChain(pathwayId, startingCase) → returns suggested sequence
```

**4. Rationale Generation**
```javascript
generateRationale(caseId, position, context) → returns explanation
```

**5. Chain Validation**
```javascript
validateChainCoherence(pathwayChain) → returns validation + suggestions
```

---

## UI/UX Mockup

### Main View

```
┌────────────────────────────────────────────────────────────────┐
│ 🧩 Pathway Builder                          [Logic: Protocol ▼]│
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ 📊 Library Overview (Bird's Eye View)                         │
│ ┌──────────┬──────────┬──────────┬──────────┐                │
│ │ 250 Cases│ 12 Systems│ 8 Pathways│ 45 Unassigned│           │
│ └──────────┴──────────┴──────────┴──────────┘                │
│                                                                │
│ 💡 AI Insights:                                                │
│ • "Strong ACLS pathway opportunity (18 cases)"                 │
│ • "Pediatric cases could form PED series (12 cases)"           │
│ • "Consider complexity progression in CARD cases"              │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ 🎯 Suggested Pathways (for Protocol Logic)                    │
│                                                                │
│ ┌─────────────────────────────────────┐                       │
│ │ ACLS Protocol Series          [Edit]│ ← Click to build      │
│ │ 18 cases • Cardiac focus             │                       │
│ │ ⭐⭐⭐⭐⭐ High confidence            │                       │
│ └─────────────────────────────────────┘                       │
│                                                                │
│ ┌─────────────────────────────────────┐                       │
│ │ PALS Sequence                  [Edit]│                       │
│ │ 12 cases • Pediatric focus           │                       │
│ │ ⭐⭐⭐⭐ Good confidence             │                       │
│ └─────────────────────────────────────┘                       │
│                                                                │
│ [+ Create Custom Pathway]                                      │
└────────────────────────────────────────────────────────────────┘
```

### Chain Builder View (When "Edit" clicked)

```
┌────────────────────────────────────────────────────────────────┐
│ ← Back to Pathways    ACLS Protocol Series            [Save]   │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Position 1: Foundation                                        │
│  ┌────────────────────────────────────┐                       │
│  │ 🩺 GI001234                        │ ← PRIMARY             │
│  │ Chest Pain with Normal ECG (58 M)  │                       │
│  │                                    │                       │
│  │ 💡 Why: "Establishes baseline      │                       │
│  │    rhythm recognition"             │                       │
│  └────────────────────────────────────┘                       │
│       ├─ 📄 GI001235: Sinus Brady (Click to swap)             │
│       └─ 📄 GI001236: First Degree Block                      │
│                                                                │
│  ↓ (AI: "Next: Progress to irregular rhythms")                │
│                                                                │
│  Position 2: Intermediate                                     │
│  ┌────────────────────────────────────┐                       │
│  │ 🩺 GI002345                        │                       │
│  │ Palpitations - AFib (72 F)         │                       │
│  └────────────────────────────────────┘                       │
│       ├─ 📄 GI002346: A-Flutter                               │
│       └─ 📄 GI002347: SVT                                     │
│                                                                │
│  ↓ (AI: "Next: Escalate to life-threatening")                 │
│                                                                │
│  [+ Insert Case Here]                                          │
│                                                                │
│  Position 3: Advanced                                         │
│  ┌────────────────────────────────────┐                       │
│  │ 🩺 GI003456                        │                       │
│  │ Cardiac Arrest - VTach (65 M)      │                       │
│  └────────────────────────────────────┘                       │
│       ├─ 📄 GI003457: VFib                                    │
│       └─ 📄 GI003458: Asystole                                │
│                                                                │
│  [+ Add Another Case]                                          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 2A: Core Chain Builder (2-3 weeks)
- [ ] Holistic case library analysis
- [ ] Pathway chain data structure
- [ ] Visual chain UI with prominence system
- [ ] Click-to-swap functionality
- [ ] Save/load pathways

### Phase 2B: AI Rationale System (1-2 weeks)
- [ ] OpenAI API integration for rationale generation
- [ ] Three types of rationale (inclusion, sequencing, alternatives)
- [ ] Tooltip/bubble display system
- [ ] Caching for performance

### Phase 2C: Drag-and-Drop & Dynamic Updates (1-2 weeks)
- [ ] HTML5 drag-and-drop implementation
- [ ] Chain recalculation on reorder
- [ ] Downstream alternative updates
- [ ] Smooth animations

### Phase 2D: Logic Type Integration (1 week)
- [ ] Connect logic dropdown to chain builder
- [ ] Different pathway suggestions per logic type
- [ ] View switching animations
- [ ] Save pathways per logic type

### Phase 2E: Advanced Features (2-3 weeks)
- [ ] "Insert case here" functionality
- [ ] Pathway templates/presets
- [ ] Export pathway to PDF/JSON
- [ ] Collaborative pathway editing (future)

---

## Technical Challenges & Solutions

### Challenge 1: Performance with Large Case Libraries

**Problem:** Analyzing 250+ cases with AI for each logic type switch could be slow.

**Solution:**
- Pre-compute pathway suggestions on panel open (show loading once)
- Cache AI rationale responses (case + position = cached explanation)
- Lazy-load alternatives (only fetch when position is focused)
- Debounce drag-and-drop re-analysis (wait 500ms after drag stops)

### Challenge 2: AI Cost Management

**Problem:** Generating rationale for every case/position could be expensive.

**Solution:**
- Batch API calls (analyze 10 cases in one prompt)
- Cache responses in Google Sheet hidden tab
- Only regenerate rationale when cases change
- Use GPT-4o-mini for rationale (cheaper, still high quality)

### Challenge 3: Complex State Management

**Problem:** Keeping track of primary/alternatives, positions, rationale, etc.

**Solution:**
- Single source of truth: `pathwayState` object
- Immutable updates (functional approach)
- Clear state transitions with logging
- Undo/redo stack for user error recovery

### Challenge 4: Mobile/Tablet Support

**Problem:** Drag-and-drop doesn't work well on touch devices.

**Solution:**
- Touch event fallback (tap-and-hold to drag)
- Swipe gestures for reordering
- Responsive UI (stacked on mobile, side-by-side on desktop)
- Test on iPad (primary target)

---

## Success Metrics

### User Experience
- [ ] Can build 8-case pathway in under 5 minutes
- [ ] Rationale tooltips appear instantly (<100ms)
- [ ] Drag-and-drop feels smooth (60 FPS)
- [ ] Alternative swapping is intuitive (no tutorial needed)

### Educational Value
- [ ] Pathways match expert educator recommendations (validated)
- [ ] Rationale makes pedagogical sense (reviewed by faculty)
- [ ] Complexity progression feels natural (user feedback)
- [ ] Learners report improved retention (future metric)

### Technical Performance
- [ ] Initial analysis completes in <10 seconds
- [ ] Logic type switch completes in <5 seconds
- [ ] AI rationale generation cached 80%+ of the time
- [ ] No UI lag during drag-and-drop

---

## Next Steps

### Immediate (This Conversation)
1. **Get your feedback** on this proposal
2. Clarify any aspects of the vision
3. Prioritize which features are MVP vs nice-to-have
4. Decide: Build Phase 2A now, or iterate on Phase 1?

### Short-term (This Week)
1. Design detailed UI mockups (Figma or hand-drawn)
2. Prototype drag-and-drop in isolation
3. Test OpenAI prompts for rationale generation
4. Build data structure for pathway chains

### Medium-term (This Month)
1. Implement Phase 2A (core chain builder)
2. Deploy to test environment
3. User testing with Aaron
4. Iterate based on feedback

---

## Questions for You

1. **Scope**: Should we build this as Phase 2, or refine Phase 1 first?

2. **AI Integration**: Do you want real-time OpenAI calls, or pre-computed analysis?

3. **Visual Style**: Should chain view be vertical (snaking down) or horizontal (left-to-right flow)?

4. **Alternatives**: How many alternatives per position? (Currently suggesting 2-3)

5. **Editing**: Should pathways be editable by multiple users, or single-user only?

6. **Save Location**: Save pathways to Google Sheet hidden tab, or separate JSON file?

7. **Priority Features**: Which is most critical?
   - Drag-and-drop reordering
   - AI rationale display
   - Alternative swapping
   - Logic type switching

---

**Ready to proceed when you give the green light! This is an ambitious but totally achievable feature that will make pathway building genuinely intelligent and enjoyable.** 🚀
