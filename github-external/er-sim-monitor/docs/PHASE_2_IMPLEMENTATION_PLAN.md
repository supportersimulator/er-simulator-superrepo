# Phase 2: Pathway Chain Builder - Implementation Plan

## Project Scope

Building an **AI-powered interactive pathway design system** with holistic case library understanding, visual chain building, alternative suggestions, and real-time rationale.

---

## User Requirements (Approved)

1. ✅ **Build Phase 2** - Full implementation
2. ✅ **Pre-computed + real-time** - Cache initial analysis, "Re-analyze" button for fresh insights
3. ✅ **Horizontal flow** - Left-to-right snaking chain
4. ✅ **3 alternatives per position** - Primary + 3 dimmed options
5. ✅ **Single-user editing** - Simpler state management
6. ✅ **Google Sheet storage** - Hidden tab for pathway data
7. ✅ **Priority: Holistic understanding** - Bird's eye view → pathway logic → clean default

---

## Implementation Phases

### Phase 2A: Holistic Analysis Engine (Days 1-3)

**Goal:** AI understands entire case library as interconnected system

**Components:**

1. **Case Library Extractor**
   - Pull all cases with full metadata
   - Extract: Case_ID, Spark_Title, Category, Diagnosis, Pathway, Complexity
   - Build in-memory case graph

2. **Relationship Analyzer**
   - Detect prerequisite chains (Case A → Case B)
   - Identify topic clusters (all chest pain, all respiratory)
   - Calculate complexity tiers
   - Find natural progressions

3. **OpenAI Holistic Analysis**
   - Single comprehensive prompt analyzing entire library
   - Response cached in hidden Sheet tab: `Pathway_Analysis_Cache`
   - Identifies 8-10 high-value pathway opportunities
   - Provides reasoning for each pathway suggestion

4. **Bird's Eye View Dashboard**
   - Total cases, system distribution, unassigned cases
   - Top 3-5 pathway suggestions with confidence scores
   - AI insights bullets (e.g., "Strong ACLS opportunity")
   - "Re-analyze" button to refresh (invalidates cache)

**Data Structure:**

```javascript
// Hidden Sheet: Pathway_Analysis_Cache
{
  timestamp: "2025-01-04T10:30:00Z",
  totalCases: 250,
  analysis: {
    systemDistribution: { CARD: 45, RESP: 38, ... },
    complexityTiers: { foundational: 80, intermediate: 120, advanced: 50 },
    topPathways: [
      {
        id: "acls_001",
        name: "ACLS Protocol Series",
        logicType: "protocol",
        confidence: 0.95,
        caseCount: 18,
        rationale: "Strong concentration of cardiac arrest cases with clear progression",
        suggestedCases: ["GI001234", "GI002345", ...]
      }
    ],
    insights: [
      "18 cardiac cases form natural ACLS progression",
      "Pediatric cases (12) could form PALS series",
      "Consider complexity progression in CARD system"
    ]
  }
}
```

**OpenAI Prompt Template:**

```
You are an expert medical educator analyzing a case library for optimal learning pathways.

CASE LIBRARY SUMMARY:
- Total Cases: 250
- Systems: CARD (45), RESP (38), NEUR (32), GI (28), ENDO (18), RENAL (15), ORTHO (22), PSYCH (16), SKIN (12), OTHER (24)
- Current Pathways: 8 assigned, 45 unassigned

FULL CASE LIST:
[Provide array of cases with: Case_ID, Spark_Title, Category, Diagnosis, Current_Pathway]

TASK:
Analyze this library holistically and:

1. Identify 8-10 high-value educational pathways
2. For each pathway, suggest:
   - Name
   - Logic type (system/protocol/specialty/complexity/reasoning)
   - Confidence score (0-1)
   - Which cases belong (list Case_IDs)
   - Pedagogical rationale (why this pathway matters)
   - Suggested teaching sequence

3. Provide 5-7 insights about the library:
   - Patterns you notice
   - Gaps in coverage
   - Opportunities for new pathways
   - Recommendations for rebalancing

FORMAT: Return valid JSON matching this structure:
{
  "pathways": [ ... ],
  "insights": [ ... ]
}
```

---

### Phase 2B: Horizontal Chain Builder UI (Days 4-6)

**Goal:** Visual pathway editing with horizontal flow

**UI Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back    ACLS Protocol Series             [Re-analyze] [Save]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🎯 START → ┌─────────┐ → ┌─────────┐ → ┌─────────┐ → [+ Add] │
│             │  Case 1 │   │  Case 2 │   │  Case 3 │            │
│             └─────────┘   └─────────┘   └─────────┘            │
│                 ↓             ↓             ↓                   │
│             Alt 1         Alt 1         Alt 1                   │
│             Alt 2         Alt 2         Alt 2                   │
│             Alt 3         Alt 3         Alt 3                   │
│                                                                 │
│  💡 "Case 2 follows Case 1 because..."                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**CSS Implementation:**

```css
.chain-container {
  display: flex;
  flex-direction: row;
  gap: 60px;
  padding: 40px;
  overflow-x: auto;
  align-items: flex-start;
}

.chain-position {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 280px;
}

.case-primary {
  width: 280px;
  height: 180px;
  background: linear-gradient(135deg, #1e2533 0%, #181d28 100%);
  border: 2px solid #2357ff;
  border-radius: 12px;
  padding: 20px;
  cursor: grab;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(35, 87, 255, 0.4);
  opacity: 1.0;
  transform: scale(1.0);
  z-index: 10;
}

.case-primary:active {
  cursor: grabbing;
  transform: scale(1.05);
}

.case-alternatives {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  width: 280px;
}

.case-alternative {
  width: 100%;
  height: 60px;
  background: #0f1115;
  border: 1px solid #2a3040;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0.5;
  transform: scale(0.92);
}

.case-alternative:hover {
  opacity: 0.8;
  transform: scale(0.96);
  border-color: #2357ff;
}

.chain-arrow {
  font-size: 32px;
  color: #2357ff;
  margin: 0 -20px;
  align-self: center;
}

.rationale-bubble {
  position: absolute;
  bottom: -60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(35, 87, 255, 0.1);
  border: 1px solid #2357ff;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: #8b92a0;
  white-space: nowrap;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**HTML Structure:**

```html
<div class="chain-container" id="chainContainer">
  <!-- Position 1 -->
  <div class="chain-position" data-position="1">
    <div class="case-primary" draggable="true" data-case-id="GI001234">
      <div class="case-header">
        <span class="case-id">GI001234</span>
        <span class="case-row">Row 45</span>
      </div>
      <div class="case-title">Chest Pain with Normal ECG (58 M)</div>
      <div class="case-rationale">
        💡 Establishes baseline rhythm recognition
      </div>
    </div>

    <div class="case-alternatives">
      <div class="case-alternative" data-case-id="GI001235" onclick="swapCase(1, 'GI001235')">
        <span class="alt-title">Sinus Bradycardia (45 M)</span>
      </div>
      <div class="case-alternative" data-case-id="GI001236">
        <span class="alt-title">First Degree Block (62 F)</span>
      </div>
      <div class="case-alternative" data-case-id="GI001237">
        <span class="alt-title">Normal Sinus Rhythm (38 M)</span>
      </div>
    </div>
  </div>

  <div class="chain-arrow">→</div>

  <!-- Position 2 -->
  <div class="chain-position" data-position="2">
    <!-- Similar structure -->
  </div>

  <!-- ... more positions ... -->

  <button class="btn-add-case" onclick="addPositionToChain()">
    + Add Case
  </button>
</div>
```

---

### Phase 2C: Alternative Selection System (Days 7-8)

**Goal:** Click to swap, dynamic prominence, smooth animations

**JavaScript Implementation:**

```javascript
let currentPathway = {
  id: "acls_001",
  name: "ACLS Protocol Series",
  chain: [
    {
      position: 1,
      primary: "GI001234",
      alternatives: ["GI001235", "GI001236", "GI001237"]
    },
    {
      position: 2,
      primary: "GI002345",
      alternatives: ["GI002346", "GI002347", "GI002348"]
    }
  ]
};

function swapCase(position, newCaseId) {
  // 1. Get current primary
  const currentPrimary = currentPathway.chain[position - 1].primary;

  // 2. Find which alternative was clicked
  const altIndex = currentPathway.chain[position - 1].alternatives.indexOf(newCaseId);

  // 3. Swap
  currentPathway.chain[position - 1].primary = newCaseId;
  currentPathway.chain[position - 1].alternatives[altIndex] = currentPrimary;

  // 4. Animate swap
  animateSwap(position, currentPrimary, newCaseId);

  // 5. Recalculate downstream alternatives
  recalculateDownstreamAlternatives(position);

  // 6. Re-render chain
  renderPathwayChain(currentPathway);
}

function animateSwap(position, oldCaseId, newCaseId) {
  const primaryCard = document.querySelector(`.case-primary[data-case-id="${oldCaseId}"]`);
  const altCard = document.querySelector(`.case-alternative[data-case-id="${newCaseId}"]`);

  // Fade out
  primaryCard.style.transition = 'all 0.3s ease';
  altCard.style.transition = 'all 0.3s ease';
  primaryCard.style.opacity = '0';
  altCard.style.opacity = '0';

  // Wait, then swap
  setTimeout(() => {
    // Update DOM
    primaryCard.dataset.caseId = newCaseId;
    altCard.dataset.caseId = oldCaseId;

    // Fade in
    primaryCard.style.opacity = '1';
    altCard.style.opacity = '0.5';
  }, 300);
}

function recalculateDownstreamAlternatives(fromPosition) {
  // Call AI to suggest new alternatives for positions after swap
  const precedingCases = currentPathway.chain
    .slice(0, fromPosition)
    .map(p => p.primary);

  google.script.run
    .withSuccessHandler((newAlternatives) => {
      // Update alternatives for positions after the swap
      for (let i = fromPosition; i < currentPathway.chain.length; i++) {
        currentPathway.chain[i].alternatives = newAlternatives[i];
      }
      renderPathwayChain(currentPathway);
    })
    .suggestDownstreamAlternatives(precedingCases, fromPosition);
}
```

---

### Phase 2D: Drag-and-Drop Reordering (Days 9-10)

**Goal:** Horizontal drag-and-drop with smooth animations

**Implementation:**

```javascript
function initDragAndDrop() {
  const chainContainer = document.getElementById('chainContainer');

  // Make all primary cases draggable
  document.querySelectorAll('.case-primary').forEach(card => {
    card.draggable = true;

    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('caseId', card.dataset.caseId);
      e.dataTransfer.setData('position', card.closest('.chain-position').dataset.position);
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', (e) => {
      card.classList.remove('dragging');
    });
  });

  // Make positions droppable
  document.querySelectorAll('.chain-position').forEach(position => {
    position.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      position.classList.add('drop-target');
    });

    position.addEventListener('dragleave', (e) => {
      position.classList.remove('drop-target');
    });

    position.addEventListener('drop', (e) => {
      e.preventDefault();
      position.classList.remove('drop-target');

      const draggedCaseId = e.dataTransfer.getData('caseId');
      const fromPosition = parseInt(e.dataTransfer.getData('position'));
      const toPosition = parseInt(position.dataset.position);

      if (fromPosition !== toPosition) {
        reorderPathway(fromPosition, toPosition);
      }
    });
  });
}

function reorderPathway(fromPos, toPos) {
  // 1. Extract the position being moved
  const movedPosition = currentPathway.chain.splice(fromPos - 1, 1)[0];

  // 2. Insert at new position
  currentPathway.chain.splice(toPos - 1, 0, movedPosition);

  // 3. Update position numbers
  currentPathway.chain.forEach((pos, idx) => {
    pos.position = idx + 1;
  });

  // 4. Animate reorder
  animateReorder(fromPos, toPos);

  // 5. Ask AI if order makes sense
  validateChainCoherence(currentPathway.chain);

  // 6. Re-render
  renderPathwayChain(currentPathway);
}

function animateReorder(fromPos, toPos) {
  const chainContainer = document.getElementById('chainContainer');
  chainContainer.style.transition = 'transform 0.5s ease';

  // Smooth slide animation
  const positions = document.querySelectorAll('.chain-position');
  positions.forEach((pos, idx) => {
    const currentPos = parseInt(pos.dataset.position);
    let transform = 0;

    if (currentPos === fromPos) {
      transform = (toPos - fromPos) * 340; // 280px width + 60px gap
    } else if (fromPos < toPos && currentPos > fromPos && currentPos <= toPos) {
      transform = -340;
    } else if (fromPos > toPos && currentPos >= toPos && currentPos < fromPos) {
      transform = 340;
    }

    pos.style.transition = 'transform 0.5s ease';
    pos.style.transform = `translateX(${transform}px)`;
  });

  setTimeout(() => {
    positions.forEach(pos => {
      pos.style.transform = '';
    });
  }, 500);
}
```

---

### Phase 2E: AI Rationale System (Days 11-12)

**Goal:** Generate and display pedagogical reasoning

**OpenAI Integration:**

```javascript
function generatePositionRationale(position, caseId, precedingCases) {
  const caseData = getCaseMetadata(caseId);

  const prompt = `
You are an expert medical educator designing a learning pathway.

PATHWAY: ACLS Protocol Series
POSITION: ${position} of 8
PRECEDING CASES: ${precedingCases.map(c => c.sparkTitle).join(' → ')}
THIS CASE: ${caseData.sparkTitle} (${caseData.caseId})

Explain in 1-2 sentences:
1. Why this case fits this pathway
2. Why it belongs at position ${position} (what foundation it builds on)
3. What skill/knowledge it advances

Format: Plain text, concise, educational tone.
Example: "Builds on sinus rhythm recognition from Case 1. Introduces irregular rhythms requiring rate control decisions. Prepares learner for more complex arrhythmias."
`;

  return callOpenAI(prompt, { temperature: 0.7, max_tokens: 150 });
}

function generateAlternativeRationale(primaryCaseId, alternativeCaseId) {
  const primaryData = getCaseMetadata(primaryCaseId);
  const altData = getCaseMetadata(alternativeCaseId);

  const prompt = `
Why is "${altData.sparkTitle}" suggested as an alternative to "${primaryData.sparkTitle}" in an ACLS pathway?

Explain in 1 sentence the similarity and pedagogical equivalence.
Example: "Both cases involve shockable rhythms requiring immediate ACLS intervention, but VFib presents more chaotic waveform pattern."
`;

  return callOpenAI(prompt, { temperature: 0.7, max_tokens: 80 });
}

// Cache rationale to avoid repeated API calls
const rationaleCache = {};

function getCachedRationale(cacheKey, generator) {
  if (rationaleCache[cacheKey]) {
    return Promise.resolve(rationaleCache[cacheKey]);
  }

  return generator().then(rationale => {
    rationaleCache[cacheKey] = rationale;
    return rationale;
  });
}
```

**Display System:**

```javascript
function renderCaseWithRationale(position, caseData, rationale, alternatives) {
  return `
    <div class="chain-position" data-position="${position}">
      <div class="case-primary" data-case-id="${caseData.caseId}">
        <div class="case-header">
          <span class="case-id">${caseData.caseId}</span>
          <span class="case-row">Row ${caseData.row}</span>
        </div>
        <div class="case-title">${caseData.sparkTitle}</div>
        <div class="case-rationale" title="${rationale}">
          💡 ${rationale.substring(0, 60)}${rationale.length > 60 ? '...' : ''}
        </div>
      </div>

      <div class="case-alternatives">
        ${alternatives.map(alt => `
          <div class="case-alternative"
               data-case-id="${alt.caseId}"
               onclick="swapCase(${position}, '${alt.caseId}')"
               title="${alt.rationale}">
            <span class="alt-title">${alt.sparkTitle}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
```

---

### Phase 2F: Pathway Persistence (Days 13-14)

**Goal:** Save/load pathways to Google Sheet hidden tab

**Sheet Structure:**

Hidden tab: `Saved_Pathways`

| pathway_id | name | logic_type | chain_json | rationale_cache | created_at | modified_at |
|------------|------|------------|------------|-----------------|------------|-------------|
| acls_001 | ACLS Protocol | protocol | {...} | {...} | 2025-01-04 | 2025-01-04 |

**Save Function:**

```javascript
function savePathway(pathwayData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let savedPathwaysSheet = ss.getSheetByName('Saved_Pathways');

  // Create hidden sheet if doesn't exist
  if (!savedPathwaysSheet) {
    savedPathwaysSheet = ss.insertSheet('Saved_Pathways');
    savedPathwaysSheet.hideSheet();
    savedPathwaysSheet.appendRow([
      'pathway_id', 'name', 'logic_type', 'chain_json',
      'rationale_cache', 'created_at', 'modified_at'
    ]);
  }

  const timestamp = new Date().toISOString();
  const chainJson = JSON.stringify(pathwayData.chain);
  const rationaleJson = JSON.stringify(pathwayData.rationaleCache || {});

  // Check if pathway exists
  const data = savedPathwaysSheet.getDataRange().getValues();
  let existingRow = -1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === pathwayData.id) {
      existingRow = i + 1;
      break;
    }
  }

  if (existingRow > 0) {
    // Update existing
    savedPathwaysSheet.getRange(existingRow, 1, 1, 7).setValues([[
      pathwayData.id,
      pathwayData.name,
      pathwayData.logicType,
      chainJson,
      rationaleJson,
      data[existingRow - 1][5], // Keep original created_at
      timestamp
    ]]);
  } else {
    // Create new
    savedPathwaysSheet.appendRow([
      pathwayData.id,
      pathwayData.name,
      pathwayData.logicType,
      chainJson,
      rationaleJson,
      timestamp,
      timestamp
    ]);
  }

  return { success: true, timestamp: timestamp };
}

function loadPathway(pathwayId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const savedPathwaysSheet = ss.getSheetByName('Saved_Pathways');

  if (!savedPathwaysSheet) {
    return null;
  }

  const data = savedPathwaysSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === pathwayId) {
      return {
        id: data[i][0],
        name: data[i][1],
        logicType: data[i][2],
        chain: JSON.parse(data[i][3]),
        rationaleCache: JSON.parse(data[i][4]),
        createdAt: data[i][5],
        modifiedAt: data[i][6]
      };
    }
  }

  return null;
}
```

---

### Phase 2G: Re-analyze Button (Day 15)

**Goal:** Invalidate cache and re-run holistic analysis

**Implementation:**

```javascript
function reAnalyzeLibrary() {
  // Show loading state
  showLoadingModal("Re-analyzing entire case library...\nThis may take 30-60 seconds.");

  // Clear cache
  clearAnalysisCache();

  // Run fresh analysis
  google.script.run
    .withSuccessHandler((newAnalysis) => {
      // Update bird's eye view
      renderBirdEyeView(newAnalysis);

      // Update pathway suggestions
      renderPathwaySuggestions(newAnalysis.topPathways);

      // Show success message
      showSuccessMessage("Analysis complete! " + newAnalysis.insights.length + " new insights discovered.");
    })
    .withFailureHandler((error) => {
      showErrorMessage("Re-analysis failed: " + error.message);
    })
    .analyzeEntireCaseLibrary(true); // force=true bypasses cache
}

function clearAnalysisCache() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let cacheSheet = ss.getSheetByName('Pathway_Analysis_Cache');

  if (cacheSheet) {
    cacheSheet.clear();
    cacheSheet.appendRow(['timestamp', 'analysis_json']);
  }
}
```

---

## Testing Strategy

### Unit Tests
- [ ] Case library extraction
- [ ] Relationship detection
- [ ] OpenAI prompt formatting
- [ ] Chain reordering logic
- [ ] Alternative suggestion algorithm

### Integration Tests
- [ ] Save/load pathway flow
- [ ] Drag-and-drop with recalculation
- [ ] Swap with downstream update
- [ ] Re-analyze invalidates cache

### User Acceptance Tests
- [ ] Can build 8-case pathway in < 5 minutes
- [ ] Rationale appears instantly (< 200ms)
- [ ] Drag-and-drop feels smooth (60 FPS)
- [ ] Alternative swapping is intuitive
- [ ] Bird's eye view provides clear insights

---

## Deployment Timeline

| Phase | Days | Deliverable |
|-------|------|-------------|
| 2A | 1-3 | Holistic analysis engine + bird's eye view |
| 2B | 4-6 | Horizontal chain UI |
| 2C | 7-8 | Alternative selection system |
| 2D | 9-10 | Drag-and-drop reordering |
| 2E | 11-12 | AI rationale generation |
| 2F | 13-14 | Pathway persistence |
| 2G | 15 | Re-analyze button |
| **Total** | **15 days** | **Full Phase 2 implementation** |

---

## Ready to Begin

All architectural decisions confirmed. Starting with Phase 2A: Holistic Analysis Engine.

**Next Steps:**
1. Build case library extractor
2. Design OpenAI holistic analysis prompt
3. Create bird's eye view dashboard UI
4. Implement caching system

**Let's build this! 🚀**
