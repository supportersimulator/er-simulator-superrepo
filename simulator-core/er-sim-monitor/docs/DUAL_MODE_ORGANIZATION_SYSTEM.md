# Dual-Mode Organization System: Categories + Pathways

## Vision Overview

A two-tab browser-style interface that allows organizing simulation content through **two distinct lenses**:

1. **Categories Tab**: Traditional, static organization (Systems, Trauma, Psych, Peds)
2. **Pathways Tab**: Dynamic, AI-powered intelligent organization with evolving logic types

---

## Categories Tab (Traditional Organization)

### Purpose
Group content by medical categories that remain relatively static.

### Organization Types
- **System-Based**: CARD, RESP, NEUR, GI, ENDO, etc.
- **Patient Population**: Peds, Geriatric, Adult
- **Specialty**: Trauma, Psych, OB/GYN
- **Setting**: Pre-hospital, ED, ICU

### UI Design
```
┌─────────────────────────────────────────────────────────────┐
│ [Categories] [Pathways]                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📁 CARD (76 cases)    📁 RESP (45 cases)   📁 NEUR (47)   │
│  📁 TRAUMA (28)        📁 PSYCH (12)        📁 PEDS (34)    │
│                                                             │
│  Click category to view cases...                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Pathways Tab (Intelligent Organization)

### Purpose
Create learning sequences with **unique logic types** that adapt to content and learner needs.

### Core Innovation: Evolving Logic Types

Each pathway has a **logic type** that defines HOW cases are grouped and sequenced:

#### **Starting Logic Types** (Built-in)
1. **ACLS Protocol Sequence** - Cardiac arrest → ROSC → post-arrest care
2. **PALS Protocol Sequence** - Pediatric emergencies by protocol
3. **Complexity Progression** - Simple → Moderate → Complex
4. **System Mastery** - Deep dive into one organ system
5. **Communication Skills** - Cases requiring difficult conversations
6. **Procedural Training** - Specific skills (intubation, central line, etc.)
7. **New Graduate Orientation** - Common presentations, safe learning
8. **Time Pressure Training** - Critical decisions under time constraints

#### **AI-Suggested Logic Types** (Discovered from Content)
The system analyzes your case library and suggests NEW logic types:

**Example AI Suggestions:**
```
🤖 Analysis Complete - New Logic Type Suggestions:

1. "Geriatric Care Pathway" (Confidence: 0.85)
   Rationale: Found 18 cases with patients >65y. Unique teaching points:
   - Atypical presentations
   - Polypharmacy considerations
   - Fall risk assessment
   Cases: GI04567, CARD02345, NEUR01234...

2. "Diagnostic Dilemma Pathway" (Confidence: 0.78)
   Rationale: Found 22 cases with unclear initial presentations.
   - Multiple differential diagnoses
   - Requires stepwise workup
   - Decision tree practice
   Cases: GI01234, NEUR04567, RESP02345...

3. "Multi-System Trauma Pathway" (Confidence: 0.72)
   Rationale: Found 12 cases with 3+ injured systems.
   - Prioritization skills
   - ATLS principles
   - Resource coordination
   Cases: TRAUMA01234, TRAUMA04567...

[Accept] [Customize] [Reject]
```

#### **User-Defined Logic Types** (Manual Creation)
User can create custom logic types via text input:

**Example User Creations:**
- "Night Shift Survival" - Common 2am presentations
- "Telemedicine Encounters" - Remote assessment skills
- "Family-Centered Care" - Cases requiring family involvement
- "Resource-Limited Settings" - Working without full diagnostics
- "Ethical Dilemmas" - Consent, capacity, end-of-life

---

## Pathways UI Design

### Tab Layout
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Categories] [Pathways]                              [+ New Pathway]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ 🎯 Active Pathways (8)                    💡 AI Suggestions (3)        │
│                                                                         │
│ ┌────────────────────────┐   ┌────────────────────────┐               │
│ │ 🫀 ACLS Mastery        │   │ 🤖 Geriatric Care      │               │
│ │ Logic: Protocol Seq    │   │ Confidence: 85%        │               │
│ │ Cases: 12              │   │ 18 matching cases      │               │
│ │ For: Residents         │   │ [Accept] [Customize]   │               │
│ │ [Build Chain]          │   └────────────────────────┘               │
│ └────────────────────────┘                                             │
│                                                                         │
│ ┌────────────────────────┐                                             │
│ │ 🗣️ Communication Skills │                                             │
│ │ Logic: Difficult Conv  │                                             │
│ │ Cases: 8               │                                             │
│ │ For: All Levels        │                                             │
│ │ [Build Chain]          │                                             │
│ └────────────────────────┘                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### New Pathway Creation Modal
```
┌─────────────────────────────────────────────────────────────┐
│  Create New Pathway                                    [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Pathway Name:                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Enter pathway name]                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Logic Type:                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ▼ Select logic type                                 │   │
│  │   • ACLS Protocol Sequence                          │   │
│  │   • PALS Protocol Sequence                          │   │
│  │   • Complexity Progression                          │   │
│  │   • System Mastery                                  │   │
│  │   • Communication Skills                            │   │
│  │   • Geriatric Care (AI Suggested)                   │   │
│  │   • Custom (type below)                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Custom Logic Type: (optional)                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Describe your custom grouping logic]              │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Target Audience:                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ▼ Who is this for?                                  │   │
│  │   • Medical Students                                │   │
│  │   • Residents                                       │   │
│  │   • Attendings                                      │   │
│  │   • Nurses                                          │   │
│  │   • Paramedics                                      │   │
│  │   • Custom (type below)                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Custom Audience: (optional)                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Describe target learner]                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                       [Cancel] [🤖 AI Analyze] [Create]    │
└─────────────────────────────────────────────────────────────┘
```

---

## AI Logic Type Discovery System

### Analysis Engine

**Function**: `discoverNewLogicTypes_()`

**How It Works**:
1. Analyzes entire case library
2. Looks for patterns:
   - Age demographics (pediatric clusters, geriatric clusters)
   - Skill requirements (procedural cases, diagnostic cases)
   - Communication needs (family presence, difficult conversations)
   - Complexity patterns (straightforward vs ambiguous)
   - Time sensitivity (emergent vs urgent vs stable)
   - Resource needs (imaging-heavy, lab-dependent, clinical diagnosis)
3. Calculates confidence scores (0-1) for each suggested logic type
4. Identifies matching cases for each suggestion
5. Generates rationale explaining WHY this logic type would be valuable

### Suggestion Card Design
```
┌────────────────────────────────────────────────────────────┐
│ 🤖 AI-Suggested Logic Type                                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ "Diagnostic Uncertainty Pathway"                           │
│                                                            │
│ Confidence: ████████░░ 78%                                 │
│                                                            │
│ 📊 Analysis:                                               │
│ • Found 22 cases with unclear initial presentations       │
│ • Average 3.4 differential diagnoses per case             │
│ • Requires systematic workup approach                     │
│                                                            │
│ 💡 Teaching Value:                                         │
│ • Decision-making under uncertainty                        │
│ • Stepwise diagnostic reasoning                           │
│ • Resource utilization optimization                       │
│                                                            │
│ 🎯 Matching Cases (22):                                    │
│ GI01234, NEUR04567, RESP02345, CARD06789...               │
│                                                            │
│ 🎓 Suggested Audience: Residents, Attendings               │
│                                                            │
│         [View Cases] [Customize] [Accept] [Reject]        │
└────────────────────────────────────────────────────────────┘
```

---

## Logic Type Storage and Management

### Data Structure

**Logic Types Registry** (stored in hidden sheet: `Pathway_Logic_Types`)

```javascript
{
  id: "logic_001",
  name: "ACLS Protocol Sequence",
  source: "built-in", // "built-in" | "ai-suggested" | "user-created"
  description: "Cardiac arrest → ROSC → post-arrest care",
  sortingRules: {
    primarySort: "protocol_stage",
    secondarySort: "complexity"
  },
  targetAudience: ["Residents", "Nurses", "Paramedics"],
  usageCount: 12, // How many pathways use this logic type
  successRating: 4.5, // User feedback (1-5)
  createdDate: "2025-01-15",
  lastUsed: "2025-11-04"
}
```

### CRUD Operations

1. **Create Logic Type**: `createLogicType_(name, description, source, audience)`
2. **List All Logic Types**: `getAllLogicTypes_()` → Returns array for dropdown
3. **Delete Logic Type**: `deleteLogicType_(id)` → Only if usage count = 0
4. **Update Logic Type**: `updateLogicType_(id, updates)`
5. **Track Usage**: `incrementLogicTypeUsage_(id)` → Called when pathway created

---

## Implementation Phases

### **Phase 3A: Dual-Tab UI Framework**
- Add Categories/Pathways tab switcher to bird's eye view
- Categories tab shows traditional system/specialty grouping
- Pathways tab shows current pathway cards (existing Phase 2A work)

### **Phase 3B: Logic Type Management System**
- Create `Pathway_Logic_Types` hidden sheet
- Implement logic type CRUD functions
- Add logic type dropdown to pathway creation
- Add custom text input for user-defined logic types
- Add target audience dropdown + custom input

### **Phase 3C: AI Logic Type Discovery**
- Implement `discoverNewLogicTypes_()` analysis engine
- Pattern detection algorithms:
  - Age clustering (pediatric, geriatric, adult)
  - Skill requirements (procedural, diagnostic, communication)
  - Complexity analysis (straightforward, ambiguous, critical)
  - Resource patterns (imaging-dependent, lab-heavy, clinical)
- Generate AI suggestion cards with confidence scores
- Accept/Customize/Reject workflow

### **Phase 3D: Logic Type Library Growth**
- Display AI suggestions in Pathways tab
- "Accept" button adds logic type to registry and dropdown
- "Customize" allows editing before accepting
- Track logic type usage and success metrics
- Show "Popular Logic Types" and "Recently Added"

---

## Technical Specifications

### UI Components

**1. Tab Switcher**
```javascript
function buildTabSwitcher_(activeTab) {
  return '<div class="tab-switcher">' +
         '  <button class="tab ' + (activeTab === 'categories' ? 'active' : '') +
         '    " onclick="switchTab(\'categories\')">📁 Categories</button>' +
         '  <button class="tab ' + (activeTab === 'pathways' ? 'active' : '') +
         '    " onclick="switchTab(\'pathways\')">🧩 Pathways</button>' +
         '</div>';
}
```

**2. Categories View**
```javascript
function buildCategoriesView_(analysis) {
  const categoryCards = Object.keys(analysis.systemDistribution).map(function(system) {
    return '<div class="category-card" onclick="viewCategory(\'' + system + '\')">' +
           '  <div class="category-icon">📁</div>' +
           '  <div class="category-name">' + system + '</div>' +
           '  <div class="category-count">' + analysis.systemDistribution[system] + ' cases</div>' +
           '</div>';
  }).join('');

  return '<div class="category-grid">' + categoryCards + '</div>';
}
```

**3. AI Suggestions Panel**
```javascript
function buildAISuggestionsPanel_(suggestions) {
  const suggestionCards = suggestions.map(function(sugg) {
    return '<div class="ai-suggestion-card">' +
           '  <div class="suggestion-header">' +
           '    <span class="suggestion-icon">🤖</span>' +
           '    <span class="suggestion-name">' + sugg.name + '</span>' +
           '  </div>' +
           '  <div class="confidence-bar">' +
           '    <div class="confidence-fill" style="width: ' + (sugg.confidence * 100) + '%"></div>' +
           '    <span class="confidence-text">' + (sugg.confidence * 100).toFixed(0) + '%</span>' +
           '  </div>' +
           '  <div class="suggestion-rationale">' + sugg.rationale + '</div>' +
           '  <div class="suggestion-meta">' + sugg.matchingCases.length + ' matching cases</div>' +
           '  <div class="suggestion-actions">' +
           '    <button class="btn-view" onclick="viewSuggestionCases(\'' + sugg.id + '\')">View Cases</button>' +
           '    <button class="btn-customize" onclick="customizeSuggestion(\'' + sugg.id + '\')">Customize</button>' +
           '    <button class="btn-accept" onclick="acceptSuggestion(\'' + sugg.id + '\')">Accept</button>' +
           '    <button class="btn-reject" onclick="rejectSuggestion(\'' + sugg.id + '\')">Reject</button>' +
           '  </div>' +
           '</div>';
  }).join('');

  return '<div class="ai-suggestions-panel">' +
         '  <h3>💡 AI-Discovered Logic Types</h3>' +
         suggestionCards +
         '</div>';
}
```

### Server-Side Functions

**1. Discover Logic Types**
```javascript
function discoverNewLogicTypes_() {
  const analysis = getOrCreateHolisticAnalysis_();
  const suggestions = [];

  // Pattern 1: Age-based clustering
  const geriatricCases = analysis.allCases.filter(function(c) {
    return c.diagnosis.match(/\b(7[0-9]|8[0-9]|9[0-9])\s*y/i) ||
           c.sparkTitle.match(/geriatric|elderly|grandpa|grandma/i);
  });

  if (geriatricCases.length >= 10) {
    suggestions.push({
      id: 'logic_geriatric',
      name: 'Geriatric Care Pathway',
      confidence: Math.min(0.95, geriatricCases.length / 20),
      rationale: 'Found ' + geriatricCases.length + ' cases with patients >65y. Focuses on atypical presentations, polypharmacy, fall risk.',
      matchingCases: geriatricCases.map(function(c) { return c.caseId; }),
      targetAudience: ['Residents', 'Attendings'],
      source: 'ai-suggested'
    });
  }

  // Pattern 2: Communication-intensive cases
  const communicationCases = analysis.allCases.filter(function(c) {
    return c.sparkTitle.match(/family|worried|concerned|angry|upset|anxious/i) ||
           c.diagnosis.match(/bad news|death|code status|DNR/i);
  });

  if (communicationCases.length >= 8) {
    suggestions.push({
      id: 'logic_communication',
      name: 'Communication Skills Pathway',
      confidence: Math.min(0.90, communicationCases.length / 15),
      rationale: 'Found ' + communicationCases.length + ' cases requiring difficult conversations. Teaches empathy, breaking bad news, family dynamics.',
      matchingCases: communicationCases.map(function(c) { return c.caseId; }),
      targetAudience: ['All Levels'],
      source: 'ai-suggested'
    });
  }

  // Pattern 3: Diagnostic uncertainty
  const diagnosticDilemmaCases = analysis.allCases.filter(function(c) {
    return c.diagnosis.length > 100 || // Long diagnosis = complex
           c.sparkTitle.match(/not sure|unclear|vague|weird|strange/i);
  });

  if (diagnosticDilemmaCases.length >= 12) {
    suggestions.push({
      id: 'logic_diagnostic_dilemma',
      name: 'Diagnostic Uncertainty Pathway',
      confidence: Math.min(0.85, diagnosticDilemmaCases.length / 20),
      rationale: 'Found ' + diagnosticDilemmaCases.length + ' cases with unclear presentations. Teaches stepwise workup, decision-making under uncertainty.',
      matchingCases: diagnosticDilemmaCases.map(function(c) { return c.caseId; }),
      targetAudience: ['Residents', 'Attendings'],
      source: 'ai-suggested'
    });
  }

  return suggestions;
}
```

**2. Accept AI Suggestion**
```javascript
function acceptLogicTypeSuggestion_(suggestionId) {
  const suggestions = discoverNewLogicTypes_();
  const suggestion = suggestions.find(function(s) { return s.id === suggestionId; });

  if (!suggestion) {
    throw new Error('Suggestion not found: ' + suggestionId);
  }

  // Add to logic types registry
  createLogicType_(
    suggestion.name,
    suggestion.rationale,
    'ai-suggested',
    suggestion.targetAudience
  );

  Logger.log('✅ Accepted AI suggestion: ' + suggestion.name);
}
```

---

## User Workflow Examples

### **Scenario 1: User Accepts AI Suggestion**

1. User opens Pathways tab
2. Sees "💡 AI-Discovered Logic Types (3)"
3. Clicks on "Geriatric Care Pathway" card
4. Reviews 18 matching cases
5. Clicks "Accept"
6. Logic type added to dropdown
7. Can now create pathways using "Geriatric Care" logic

### **Scenario 2: User Creates Custom Logic Type**

1. Clicks "+ New Pathway"
2. Enters name: "Night Shift Survival"
3. Selects "Custom (type below)" from logic dropdown
4. Types: "Common presentations seen between midnight and 6am"
5. Selects audience: "Residents"
6. Clicks "🤖 AI Analyze"
7. System finds 14 matching cases
8. User reviews and creates pathway

### **Scenario 3: AI Suggests New Logic Every Month**

1. User adds 50 new cases over 3 months
2. System auto-runs `discoverNewLogicTypes_()` weekly
3. Detects new pattern: 12 cases involving procedure complications
4. Suggests "Procedural Complication Pathway"
5. User accepts
6. Library grows organically with content

---

## Success Metrics

### **Logic Type Effectiveness**

Track for each logic type:
- **Usage Count**: How many pathways use this logic
- **Learner Satisfaction**: User ratings when completing pathways
- **Case Coverage**: % of library that fits this logic type
- **Growth Rate**: How often new cases match this pattern

### **AI Discovery Performance**

- **Suggestion Acceptance Rate**: % of AI suggestions user accepts
- **False Positives**: Suggestions that don't match well
- **Discovery Speed**: Time from adding cases → AI suggests new logic type

---

## Next Steps

**Immediate Actions**:
1. ✅ Create this documentation
2. Start Phase 3A: Build dual-tab UI framework
3. Prototype logic type dropdown with built-in types
4. Design AI suggestion card UI

**Questions for User**:
1. Should we start with Phase 3A (dual tabs) or jump straight to Phase 3C (AI discovery)?
2. How many built-in logic types should we start with?
3. Should AI suggestions auto-appear, or require user to click "Discover New Logic Types"?
