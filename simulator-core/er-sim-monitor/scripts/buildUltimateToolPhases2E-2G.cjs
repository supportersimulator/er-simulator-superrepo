#!/usr/bin/env node

/**
 * Build Ultimate Categorization Tool - Phases 2E, 2F, 2G
 *
 * Due to the complexity and size of adding tabbed navigation + browse tabs +
 * settings + AI suggestions, this script generates the complete enhanced version.
 *
 * Strategy: Rather than complex multi-edit operations on 1516-line file,
 * we'll build Phase 2E-2G as a separate enhancement that can be integrated.
 */

const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'apps-script-deployable', 'Ultimate_Categorization_Tool_PHASES_2E-2G_PLAN.md');

const implementationPlan = `# Ultimate Categorization Tool - Phases 2E-2G Implementation Plan

**Date**: 2025-11-11
**Status**: 🔨 Planning Complete - Ready for Implementation
**Estimated Addition**: ~1200 lines (bringing total to ~2700 lines)

---

## 📋 Architecture Decision

### Current State
- **File**: Ultimate_Categorization_Tool.gs
- **Size**: 1,516 lines
- **Status**: Phase 2D complete (Categorize, Apply, Export, Clear)
- **Layout**: Single-view UI with controls panel + logs + results

### Enhancement Approach

**Option A: Tabbed Single-File Architecture** ⭐ RECOMMENDED
- Add tab navigation to existing modal
- All phases in one Ultimate_Categorization_Tool.gs file
- Pros: Unified codebase, shared functions, single deployment
- Cons: Large file (~2700 lines), more complex to maintain
- **Status**: Best for user's integrated workflow vision

**Option B: Separate Tool Files**
- Keep existing tool as-is
- Create new "Category Browser" tool
- Create new "Category Manager" tool
- Pros: Modular, easier to maintain
- Cons: User wanted integrated experience, multiple menu items

**DECISION**: Option A - Tabbed integrated architecture

---

## 🎨 UI Architecture: Tabbed Navigation

### Tab Structure

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Ultimate Categorization Tool                             │
├─────────────────────────────────────────────────────────────┤
│ [Categorize] [Browse Symptom] [Browse System] [Settings]    │ ← Tab Bar
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tab Content Area (dynamic based on active tab)             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### Tab 1: Categorize (Existing - Phase 2A-2D)
- Controls panel (left)
- Live logs (top right)
- Results summary (bottom right)
- **No changes needed** - already implemented

### Tab 2: Browse by Symptom (Phase 2E)
\`\`\`
┌────────────────────┬──────────────────────────────────┐
│ Symptom Categories │ Cases in Selected Category        │
│                    │                                   │
│ ✅ CP (45)        │ Case List:                        │
│ ✅ SOB (32)       │ ┌────────────────────────────┐   │
│ ✅ AMS (28)       │ │ CARD0001                   │   │
│ ⚠️ ABD (12)       │ │ Status: match ✅           │   │
│ 🆕 HA (8)         │ │ Symptom: CP → CP           │   │
│                    │ │ [Edit] [View AI Reasoning] │   │
│                    │ └────────────────────────────┘   │
│                    │                                   │
│ Filter: [____]     │ [Previous] [Next] Page 1 of 5     │
└────────────────────┴──────────────────────────────────┘
\`\`\`

### Tab 3: Browse by System (Phase 2E)
- Same layout as Tab 2
- Categories: Cardiovascular, Respiratory, Neurological, etc.

### Tab 4: Settings (Phase 2F + 2G)
\`\`\`
┌─────────────────────────────────────────────────────────────┐
│ [Category Mappings] [AI Suggestions]                         │ ← Sub-tabs
├─────────────────────────────────────────────────────────────┤
│ Symptom Categories:                                          │
│ ┌──────────┬───────────────────┬──────────┐                │
│ │ Accronym │ Full Name         │ Actions  │                │
│ ├──────────┼───────────────────┼──────────┤                │
│ │ CP       │ Chest Pain        │ [Edit]   │                │
│ │ SOB      │ Shortness of...   │ [Edit]   │                │
│ │ + Add New Category                       │                │
│ └──────────┴───────────────────┴──────────┘                │
│                                                              │
│ System Categories:                                           │
│ ┌──────────────────────┬──────────┐                        │
│ │ System Name          │ Actions  │                        │
│ ├──────────────────────┼──────────┤                        │
│ │ Cardiovascular       │ [Edit]   │                        │
│ │ Respiratory          │ [Edit]   │                        │
│ │ + Add New System                  │                        │
│ └──────────────────────┴──────────┘                        │
└─────────────────────────────────────────────────────────────┘

AI Suggestions Sub-tab:
┌─────────────────────────────────────────────────────────────┐
│ [🤖 Analyze Cases & Generate Suggestions]                   │
├─────────────────────────────────────────────────────────────┤
│ Suggested New Categories:                                    │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ 🆕 "ETOH" (Alcohol-Related)                              ││
│ │    Found in: 12 uncategorized cases                      ││
│ │    Sample cases: TOXI0045, TOXI0067, PSYC0012           ││
│ │    Confidence: High                                       ││
│ │    [✅ Approve] [❌ Reject] [View Cases]                ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## 📦 Phase 2E: Browse by Symptom/System

### Backend Functions to Add

\`\`\`javascript
/**
 * Get all cases grouped by symptom category
 * Returns: { symptomCode: { fullName, cases: [...], counts: {...} } }
 */
function getCasesBySymptom() {
  // Read AI_Categorization_Results
  // Group by Final_Symptom
  // Count match/conflict/new statuses
  // Return structured object
}

/**
 * Get all cases grouped by system category
 */
function getCasesBySystem() {
  // Similar to getCasesBySymptom
}

/**
 * Get cases for specific symptom
 */
function getCasesForSymptom(symptomCode) {
  // Filter AI_Categorization_Results by Final_Symptom
  // Return array of case objects with full details
}

/**
 * Get cases for specific system
 */
function getCasesForSystem(systemCode) {
  // Similar to getCasesForSymptom
}

/**
 * Update case categorization (manual override)
 */
function updateCaseCategorization(caseID, newSymptom, newSystem, reason) {
  // Find case in AI_Categorization_Results
  // Update Final_Symptom and Final_System
  // Log override with reason (audit trail)
  // Return success
}
\`\`\`

### Frontend Components

\`\`\`javascript
// Category list component
function renderCategoryList(categories, type) {
  // Loop through categories
  // Show count, status indicators
  // Click handler to load cases
}

// Case list component
function renderCaseList(cases, selectedCategory) {
  // Display cases with status badges
  // Edit dropdown for quick category change
  // View AI Reasoning button
  // Pagination controls
}

// Edit case modal
function showEditCaseModal(caseData) {
  // Display full case details
  // Current vs AI suggested categories
  // Dropdown to change symptom/system
  // Reason textarea (audit trail)
  // Save button
}
\`\`\`

---

## 📦 Phase 2F: Settings Tab - Category Management

### Backend Functions to Add

\`\`\`javascript
/**
 * Get all symptom mappings from accronym_symptom_system_mapping sheet
 */
function getSymptomMappings() {
  // Read accronym_symptom_system_mapping sheet
  // Return array of {accronym, fullName}
}

/**
 * Get all system categories
 */
function getSystemCategories() {
  // Return array of system names
  // Could be hardcoded or from separate sheet
}

/**
 * Add new symptom mapping
 */
function addSymptomMapping(accronym, fullName) {
  // Validate accronym doesn't exist
  // Add row to accronym_symptom_system_mapping sheet
  // Log addition
  // Return success
}

/**
 * Update symptom mapping
 */
function updateSymptomMapping(oldAccronym, newAccronym, newFullName) {
  // Find row in sheet
  // Update values
  // Log change
  // Return success
}

/**
 * Delete symptom mapping
 */
function deleteSymptomMapping(accronym) {
  // Find and delete row
  // Check if any cases use this symptom (warn)
  // Log deletion
  // Return success
}

// Similar functions for system categories
\`\`\`

### Frontend Components

\`\`\`javascript
// Symptom mappings editor
function renderSymptomMappingsEditor() {
  // Table of existing mappings
  // Edit inline or modal
  // Add new row
  // Delete with confirmation
  // Save changes button
}

// System categories editor
function renderSystemCategoriesEditor() {
  // Similar to symptom editor
}
\`\`\`

---

## 📦 Phase 2G: AI-Powered Category Suggestions

### Backend Functions to Add

\`\`\`javascript
/**
 * Analyze uncategorized or low-confidence cases
 * Use OpenAI to suggest new categories
 */
function generateCategorySuggestions() {
  // Get cases with status='new' or low confidence
  // Group similar presentations
  // Build prompt for OpenAI:
  //   "Analyze these cases and suggest new symptom categories"
  // Parse AI response
  // Return suggested categories with supporting cases
  // RIDICULOUS logging pattern
}

/**
 * Apply approved category suggestion
 */
function applyCategorySuggestion(suggestion) {
  // Add new symptom to accronym_symptom_system_mapping
  // Optionally re-run categorization for affected cases
  // Log approval
  // Return success
}
\`\`\`

### Frontend Components

\`\`\`javascript
// AI Suggestions panel
function renderAISuggestions() {
  // "Generate Suggestions" button
  // Loading state with progress
  // List of suggested categories
  // Each suggestion shows:
  //   - Proposed accronym + full name
  //   - Case count
  //   - Sample cases
  //   - Confidence level
  //   - Approve/Reject buttons
}
\`\`\`

---

## 🔧 Implementation Steps

### Step 1: Add Tab Navigation CSS
- Tab bar styles
- Active/inactive states
- Tab content containers
- Show/hide logic

### Step 2: Modify HTML Structure
- Add tab buttons
- Add \`.tab-content\` divs for each tab
- Move existing Phase 2D content into Tab 1
- Create placeholder divs for Tabs 2-4

### Step 3: Add JavaScript Tab Switching
\`\`\`javascript
function switchTab(tabName) {
  // Hide all tab-content divs
  // Show selected tab-content
  // Update active tab button styles
  // Load tab data if not already loaded
}
\`\`\`

### Step 4: Build Phase 2E - Browse Tabs
- Implement backend functions
- Build category list UI
- Build case list UI with pagination
- Build edit case modal
- Wire up all event handlers

### Step 5: Build Phase 2F - Settings Tab
- Implement backend CRUD functions
- Build symptom mappings table
- Build system categories table
- Wire up edit/add/delete handlers
- Add save confirmation

### Step 6: Build Phase 2G - AI Suggestions
- Implement generateCategorySuggestions()
- Build AI suggestions UI
- Add approve/reject handlers
- Add re-categorization flow

### Step 7: Testing
- Test each tab independently
- Test tab switching
- Test data flow between tabs
- Test CRUD operations
- Test AI suggestions

---

## 📊 Estimated Code Additions

| Component | Lines | Description |
|-----------|-------|-------------|
| **Tab Navigation CSS** | ~100 | Tab bar, content areas, transitions |
| **Tab Navigation JS** | ~50 | switchTab(), state management |
| **Phase 2E Backend** | ~300 | getCasesBySymptom, getCasesBySystem, updateCase |
| **Phase 2E Frontend** | ~400 | Browse UI, case list, edit modal |
| **Phase 2F Backend** | ~200 | CRUD for symptom/system mappings |
| **Phase 2F Frontend** | ~250 | Settings UI, editors, validation |
| **Phase 2G Backend** | ~150 | AI suggestion generation |
| **Phase 2G Frontend** | ~150 | AI suggestions UI, approve flow |
| **Total Estimated** | ~1,600 | **Will bring file to ~3,100 lines** |

---

## ⚠️ Considerations

### File Size
- Current: 1,516 lines
- After Phases 2E-2G: ~3,100 lines
- Google Apps Script limit: No hard limit, but >5000 lines can be slow
- **Recommendation**: Proceed with single file, monitor performance

### Alternative: Modular Architecture
If file becomes too large:
- Split into multiple .gs files:
  - \`Ultimate_Categorization_Tool.gs\` (main UI)
  - \`Ultimate_Categorization_Backend.gs\` (backend functions)
  - \`Ultimate_Categorization_Browse.gs\` (browse tab logic)
  - \`Ultimate_Categorization_Settings.gs\` (settings logic)
- All files deploy together
- Functions callable across files

### Performance
- Lazy load tab content (don't load all data on open)
- Use pagination for case lists (25 per page)
- Cache category counts (don't recalculate on every tab switch)

---

## 🎯 Next Steps

**Immediate**:
1. User review and approval of architecture
2. Confirm tabbed approach vs separate tools
3. Decide on file organization (single file vs multiple files)

**Then**:
1. Implement Tab Navigation foundation
2. Build Phase 2E (Browse tabs)
3. Build Phase 2F (Settings)
4. Build Phase 2G (AI Suggestions)
5. Deploy and test each phase
6. Create comprehensive documentation

---

## 📝 Questions for User

1. **Confirm tabbed architecture?** (vs separate tools)
2. **Single file vs multiple .gs files?** (single file easier to understand, multiple files easier to maintain)
3. **Phase priority?** (Build all at once vs deploy incrementally?)
4. **Case list pagination size?** (25 per page recommended)
5. **AI suggestions frequency?** (On-demand button vs automatic background analysis?)

---

**Created By**: Atlas (Claude Code)
**Date**: 2025-11-11
**Status**: Ready for implementation pending user approval
`;

fs.writeFileSync(outputPath, implementationPlan);

console.log('═══════════════════════════════════════════════════════════════');
console.log('📋 PHASE 2E-2G IMPLEMENTATION PLAN CREATED');
console.log('═══════════════════════════════════════════════════════════════\n');
console.log('📄 File created:');
console.log('   ' + outputPath + '\n');
console.log('📊 Estimated Scope:');
console.log('   ~1,600 lines of new code');
console.log('   Final file size: ~3,100 lines\n');
console.log('🎯 Ready for implementation!');
console.log('   User can review plan and approve architecture decisions.\n');
console.log('═══════════════════════════════════════════════════════════════\n');
