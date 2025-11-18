# Realistic Apps Script Testing Strategy

**Date:** 2025-11-03
**Status:** OAuth Working, API Limitations Identified

---

## 🎯 Core Issue: UI Functions Cannot Be Tested Via API

### What We Learned

The Apps Script API `script.projects.run()` method **cannot** execute functions that:
- Open UI components (sidebars, dialogs, panels)
- Interact with SpreadsheetApp UI (getUi(), showSidebar(), etc.)
- Require user context or active spreadsheet UI

**Functions that CANNOT be tested via API:**
- `onOpen()` - Creates menu (UI operation)
- `openSimSidebar()` - Opens sidebar (UI operation)
- `openSettingsPanel()` - Opens settings dialog (UI operation)
- `openCategoriesPathwaysPanel()` - Opens panel (UI operation)
- `openImageSyncDefaults()` - Opens image sync UI (UI operation)
- `openMemoryTracker()` - Opens memory tracker UI (UI operation)

---

## ✅ What CAN Be Tested Programmatically

### Core Processing Functions (API-Testable)

These functions perform data processing WITHOUT UI operations:

#### 1. **checkApiStatus()** - Line 663
- Tests OpenAI API connectivity
- No UI required
- Returns status object
- **Can be tested via API**

#### 2. **runQualityAudit_AllOrRows()** - Line 272
- Evaluates simulation quality
- Writes quality scores to sheet
- No UI dialogs (just toast notifications)
- **Can be tested via API**

#### 3. **refreshHeaders()** - Line 2826
- Refreshes header cache
- No UI required
- **Can be tested via API**

#### 4. **cleanUpLowValueRows()** - Line 326
- Removes low-quality rows
- No UI required (just toast)
- **Can be tested via API**

#### 5. **retrainPromptStructure()** - Line 2848
- Retrains prompt structure
- No UI required
- **Can be tested via API**

#### 6. **runATSRTitleGenerator()** - Line 1953
- Generates titles/summaries
- Opens dialog at END (can test without dialog)
- **Partially testable via API**

---

## 📋 Revised Testing Plan

### Phase 1: Automated API Testing (Core Functions)
Test the 6 functions above via Apps Script API:
- `checkApiStatus` - API connectivity
- `runQualityAudit_AllOrRows` - Quality evaluation
- `refreshHeaders` - Header caching
- `cleanUpLowValueRows` - Data cleanup
- `retrainPromptStructure` - Prompt training
- `runATSRTitleGenerator` - Title generation (partial)

**Success Criteria:**
- Functions execute without errors
- Processing completes successfully
- Data modifications verified
- Performance acceptable (<30s)

### Phase 2: Manual UI Testing (Menu Functions)
Test UI functions manually in Google Sheets:
- Open Extensions → 🧠 Sim Builder menu
- Test each sidebar/panel individually
- Verify UI loads correctly
- Test user workflows
- Document any issues

**Success Criteria:**
- All menus load without errors
- Sidebars display correctly
- Settings can be saved
- User experience smooth

---

## 🛠️ Implementation: API-Testable Functions

Here's the corrected test configuration:

```javascript
const API_TESTABLE_FUNCTIONS = [
  {
    name: 'checkApiStatus',
    priority: 'critical',
    description: 'Check OpenAI API Status',
    targetScore: 95,
    testable: true,
    parameters: []
  },
  {
    name: 'runQualityAudit_AllOrRows',
    priority: 'high',
    description: 'Run Quality Audit',
    targetScore: 85,
    testable: true,
    parameters: []
  },
  {
    name: 'refreshHeaders',
    priority: 'high',
    description: 'Refresh Header Cache',
    targetScore: 85,
    testable: true,
    parameters: []
  },
  {
    name: 'cleanUpLowValueRows',
    priority: 'medium',
    description: 'Clean Up Low-Value Rows',
    targetScore: 75,
    testable: true,
    parameters: []
  },
  {
    name: 'retrainPromptStructure',
    priority: 'medium',
    description: 'Retrain Prompt Structure',
    targetScore: 75,
    testable: true,
    parameters: []
  },
  {
    name: 'runATSRTitleGenerator',
    priority: 'critical',
    description: 'Generate ATSR Titles',
    targetScore: 95,
    testable: true,
    parameters: [2, false] // continueRow, keepSelections
  }
];

const UI_ONLY_FUNCTIONS = [
  {
    name: 'onOpen',
    description: 'Menu Load',
    testMethod: 'manual',
    instructions: 'Reload spreadsheet, verify Extensions → 🧠 Sim Builder menu appears'
  },
  {
    name: 'openSimSidebar',
    description: 'Launch Batch/Single Sidebar',
    testMethod: 'manual',
    instructions: 'Click Extensions → 🧠 Sim Builder → 🚀 Launch Batch / Single'
  },
  {
    name: 'openSettingsPanel',
    description: 'Settings Panel',
    testMethod: 'manual',
    instructions: 'Click Extensions → 🧠 Sim Builder → ⚙️ Settings'
  },
  {
    name: 'openCategoriesPathwaysPanel',
    description: 'Categories & Pathways',
    testMethod: 'manual',
    instructions: 'Click Extensions → 🧠 Sim Builder → 📂 Categories & Pathways'
  },
  {
    name: 'openImageSyncDefaults',
    description: 'Image Sync Defaults',
    testMethod: 'manual',
    instructions: 'Click Extensions → 🧠 Sim Builder → 🖼 Image Sync Defaults'
  },
  {
    name: 'openMemoryTracker',
    description: 'Memory Tracker',
    testMethod: 'manual',
    instructions: 'Click Extensions → 🧠 Sim Builder → 🧩 Memory Tracker'
  }
];
```

---

## 📊 Realistic Success Metrics

### For API-Testable Functions:
- **Execution Success:** Function completes without errors
- **Data Validation:** Output matches expected format/quality
- **Performance:** Completes within acceptable time (<30s)
- **Side Effects:** Data modifications verified in sheet

### For UI Functions:
- **Load Success:** UI element appears without errors
- **Functionality:** User can interact with all controls
- **Data Persistence:** Settings/changes save correctly
- **UX Quality:** Interface is intuitive and responsive

---

## 🎯 Next Steps

1. **Update testAppsScriptFunctions.cjs** to only test API-callable functions
2. **Run automated tests** on the 6 core processing functions
3. **Generate manual test checklist** for UI functions
4. **Document results** separately for automated vs manual tests
5. **Provide clear testing guide** for manual UI verification

---

## 💡 Key Insight

**You were absolutely right** - I should have anticipated this limitation. The Apps Script API cannot execute UI-dependent functions. The original TEST_FINDINGS.md already documented this exact issue and recommended manual testing for UI functions.

The solution is a **hybrid testing strategy**:
- Automated API testing for core processing functions
- Manual UI testing for menu/sidebar/panel functions

This approach provides comprehensive coverage while respecting API limitations.
