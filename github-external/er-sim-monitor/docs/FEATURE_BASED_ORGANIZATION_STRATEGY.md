# Feature-Based Code Organization Strategy

**Principle:** Keep UI features and all their supporting code together, even if large.

**Date:** 2025-11-04
**Status:** Recommended organizational approach

---

## 🎯 Core Principle

> "Anything within the same HTML should be in its own script code. A large functioning thing contained within what the user will be accessing should stay together."
>
> — Aaron Tjomsland

**Translation:** Group code by **user workflow feature** (what the user is doing), not by **technical concern** (what the code does internally).

---

## ❌ What We Initially Did (WRONG)

We decomposed by **technical separation**:

```
API_Management.gs       ← All API functions together
Header_Caching.gs       ← All caching functions together
Logging_Utilities.gs    ← All logging functions together
Sidebar_Backend.gs      ← Sidebar functions (but no HTML)
```

**Problem:** To work on the batch sidebar feature, a developer needs to open 4+ files:
- `Sidebar_Backend.gs` (for `openSimSidebar()`)
- `Logging_Utilities.gs` (for `logLong()`, `appendLog()`)
- The HTML template (somewhere else)
- Button handlers (scattered)

This violates **cohesion** - related code is scattered.

---

## ✅ What We Should Do (CORRECT)

Reorganize by **feature boundary**:

```
Batch_Sidebar_Feature.gs    ← EVERYTHING for batch sidebar
  ├── HTML template
  ├── start() button handler
  ├── stop() button handler
  ├── refreshLogs() handler
  ├── openSimSidebar() backend
  ├── appendLog() for this UI
  └── All code THIS FEATURE needs

Settings_Panel_Feature.gs   ← EVERYTHING for settings
  ├── Settings HTML template
  ├── Form handlers
  ├── API key management
  └── Configuration persistence

Core_Batch_Engine.gs        ← Pure logic (NO UI)
  ├── processOneInputRow_()
  ├── validateVitalsFields_()
  └── Business logic only
```

**Benefit:** To work on batch sidebar, developer opens **ONE file** and has everything.

---

## 📋 Proposed Feature-Based Modules

### UI Feature Modules (Large, but Cohesive)

#### 1. Batch_Sidebar_Feature.gs (~20-30 KB)

**What it contains:**
- Complete HTML template for batch processing sidebar
- All UI button handlers:
  - `start()` - Start batch processing
  - `stop()` - Stop batch processing
  - `refreshLogs()` - Refresh log display
  - `clearLogs()` - Clear log textarea
  - `copyLogs()` - Copy logs to clipboard
  - `persistBasics()` - Save form values
  - `loopStep()` - Process next row
- Backend functions:
  - `openSimSidebar()` - Create and display sidebar
  - `saveSidebarBasics()` - Persist settings
- Logging functions **for this UI**:
  - `appendLog(text)` - Add log entry
  - `setStatus(text)` - Update status pill
  - `logLong(label, text)` - Long text logging

**Why keep together:**
- Developer working on sidebar has everything in one place
- HTML and handlers stay synchronized
- Easy to test as complete feature
- Clear scope: "This is the batch sidebar"

**Size:** Yes, it's large (~20-30 KB), but it's **cohesive**.

---

#### 2. Settings_Panel_Feature.gs (~5-10 KB)

**What it contains:**
- Settings panel HTML template
- Form submit handlers
- API key management:
  - `syncApiKeyFromSettingsSheet_()`
  - `readApiKey_()`
  - `checkApiStatus()`
- Configuration UI:
  - `openSettingsPanel()`
  - Save/load settings

**Why keep together:**
- Settings is one user workflow
- All settings-related code in one place
- Easy to add new settings

---

#### 3. Image_Sync_Feature.gs (~2-5 KB)

**What it contains:**
- Image sync defaults HTML
- Media URL synchronization logic
- `openImageSyncDefaults()`
- `imgSync()` handler

**Why keep together:**
- Small focused feature
- HTML + logic together

---

### Business Logic Modules (Small, Pure Functions)

#### 4. Core_Batch_Engine.gs (~10-15 KB)

**What it contains:**
- `processOneInputRow_(row, settings)`
- `validateVitalsFields_(vitals)`
- `applyClinicalDefaults_(row)`
- `tryParseJSON(str)`

**Why separate:**
- **No UI** - pure business logic
- Testable in isolation
- Reusable in different contexts
- Could be called from API, CLI, or different UI

**Key difference:** No HTML, no UI handlers - just logic.

---

#### 5. Title_Generation_Engine.gs (~25-30 KB)

**What it contains:**
- `runATSRTitleGenerator(scenario, settings)`
- OpenAI API integration
- Response parsing
- Title formatting

**Why separate:**
- Pure AI integration logic
- Reusable (could be called from batch, single row, or API)
- Testable with mock responses

---

#### 6. Quality_Scoring_Engine.gs (~2-5 KB)

**What it contains:**
- `evaluateSimulationQuality(scenario)`
- Weighted rubric scoring
- Quality metrics calculation

**Why separate:**
- Pure calculation logic
- Reusable across features
- Easy to test with known inputs

---

#### 7. Sheet_Infrastructure.gs (~5-10 KB)

**What it contains:**
- `readTwoTierHeaders_(sheet)`
- `mergedKeysFromTwoTiers_()`
- `cacheHeaders(sheet)`
- `getCachedHeadersOrRead(sheet)`
- `clearHeaderCache()`
- `ensureBatchReportsSheet_()`
- `extractValueFromParsed_(parsed, key)`

**Why separate:**
- Shared utility functions
- Used by multiple features
- No UI coupling

---

## 📊 Comparison: Technical vs Feature-Based

| Aspect | Technical Separation | Feature-Based |
|--------|---------------------|---------------|
| **Modules** | 15 small files | 7 focused files |
| **Batch UI Work** | Open 4+ files | Open 1 file |
| **Cohesion** | Low (scattered) | High (together) |
| **File Size** | All small (1-5 KB) | Some large (20-30 KB) |
| **Maintainability** | Hunt across files | Everything in one place |
| **Testing** | Mock many dependencies | Test complete feature |
| **Reusability** | High (granular) | Medium (by feature) |

**Trade-off:** Feature modules are larger, but **much more cohesive**.

---

## 💡 Key Insights

### 1. Size Doesn't Matter for UI Features

A 30 KB file for batch sidebar is **GOOD** if it contains everything needed for that feature:
- ✅ HTML template
- ✅ All button handlers
- ✅ Backend support functions
- ✅ Logging for that UI

This is **cohesive** - related code stays together.

### 2. Separate Business Logic from UI

Core engines (batch processing, title generation, quality scoring) should be **separate** because:
- They have **no UI**
- They're **reusable** in different contexts
- They're **testable** in isolation
- They might be called from API, CLI, or different UI

### 3. Feature Boundaries = HTML Boundaries

If code relates to a specific HTML UI, it belongs in that feature module.

If code has no UI, it belongs in an engine/infrastructure module.

---

## 🎯 When to Use Each Approach

### Use Feature-Based Modules When:
- ✅ Code relates to specific UI
- ✅ HTML + handlers + backend form one workflow
- ✅ Developer works on "the batch sidebar" as a unit
- ✅ Testing involves UI interaction

### Use Technical Separation When:
- ✅ Pure business logic (no UI)
- ✅ Reusable across multiple features
- ✅ Testable without UI
- ✅ Could be called from API/CLI

---

## 📂 Proposed Final Structure

```
isolated-tools/
├── features/                           # UI Features (large, cohesive)
│   ├── Batch_Sidebar_Feature.gs        (30 KB, HTML + handlers + backend)
│   ├── Settings_Panel_Feature.gs       (8 KB, HTML + handlers + backend)
│   └── Image_Sync_Feature.gs           (3 KB, HTML + handlers + backend)
│
├── engines/                            # Business Logic (pure functions)
│   ├── Core_Batch_Engine.gs            (12 KB, no UI)
│   ├── Title_Generation_Engine.gs      (28 KB, no UI)
│   └── Quality_Scoring_Engine.gs       (2 KB, no UI)
│
└── infrastructure/                     # Shared Utilities
    └── Sheet_Infrastructure.gs         (8 KB, shared utils)
```

**Total:** 7 modules instead of 15
**Clarity:** Obvious what each file does
**Maintainability:** Feature work stays in one file

---

## ✅ Benefits of Feature-Based Organization

### For Developers
- ✅ Open one file to work on one feature
- ✅ HTML and handlers stay synchronized
- ✅ No hunting across files
- ✅ Clear ownership ("I own the batch sidebar")

### For Testing
- ✅ Test complete feature as user experiences it
- ✅ UI and logic tested together
- ✅ Easier integration testing

### For Maintenance
- ✅ Modify batch sidebar? One file.
- ✅ Add button? Same file as HTML.
- ✅ Fix logging? Same file as UI.

### For Onboarding
- ✅ New developer: "Here's the batch sidebar file"
- ✅ Everything they need is right there
- ✅ Obvious structure

---

## 🚀 Implementation Plan

### Step 1: Create Feature Modules
1. Extract all batch sidebar code (HTML + handlers + backend + logging)
2. Create `Batch_Sidebar_Feature.gs`
3. Verify it's self-contained and functional

### Step 2: Create Engine Modules
1. Extract pure business logic (no UI)
2. Create `Core_Batch_Engine.gs`
3. Ensure no UI dependencies

### Step 3: Test Feature Completeness
1. Can batch sidebar file run independently?
2. Does it import only engine modules (not other UI)?
3. Is everything a developer needs present?

### Step 4: Upload to Current Code
1. Replace technical decomposition in Google Drive
2. Update with feature-based modules
3. Document dependencies

---

## 📝 Example: Batch Sidebar Module Structure

```javascript
/**
 * Batch Sidebar Feature - Complete
 *
 * Everything needed for batch processing sidebar UI:
 * - HTML template
 * - UI button handlers (start, stop, refresh, etc.)
 * - Backend functions (openSimSidebar, save settings)
 * - UI-specific logging (appendLog, setStatus)
 *
 * External Dependencies:
 * - Core_Batch_Engine.gs (for processOneInputRow_)
 * - Sheet_Infrastructure.gs (for headers, caching)
 *
 * This module is self-contained for the batch sidebar feature.
 * A developer working on the sidebar opens THIS FILE ONLY.
 */

// ==================== SIDEBAR HTML TEMPLATE ====================

function openSimSidebar() {
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          /* All styles for this sidebar */
        </style>
      </head>
      <body>
        <button onclick="start()">Start Batch</button>
        <button onclick="stop()">Stop</button>
        <button onclick="refreshLogs()">Refresh Logs</button>
        <textarea id="log"></textarea>
        <script>
          // All client-side JavaScript for this sidebar
          function start() { google.script.run.batchStart(); }
          function stop() { google.script.run.batchStop(); }
          function refreshLogs() { /* ... */ }
          function appendLog(text) { /* ... */ }
        </script>
      </body>
    </html>
  `).setTitle('Batch Processing');

  SpreadsheetApp.getUi().showSidebar(html);
}

// ==================== BACKEND HANDLERS ====================

function batchStart() {
  // Imports Core_Batch_Engine for actual processing
  // But UI logic stays here
}

function batchStop() {
  // Stop logic
}

// ==================== UI-SPECIFIC LOGGING ====================

function appendLog(text) {
  // Logging specific to this sidebar's textarea
}

function setStatus(text) {
  // Update status pill in this sidebar
}

// ... all other batch sidebar code ...
```

**Key Point:** Everything for this UI is in ONE FILE. Business logic is imported from engines.

---

## 🎓 Lessons Learned

### Initial Mistake
We decomposed by **what the code does** (caching, logging, API calls).

### Correct Approach
Decompose by **what the user does** (batch processing, settings, image sync).

### Golden Rule
**"If a developer says 'I want to work on the batch sidebar,' can they open one file and have everything?"**

If yes ✅, organization is correct.
If no ❌, code is scattered.

---

## 📚 References

### Software Design Principles

**High Cohesion:**
Related code should be together. Batch sidebar HTML + handlers + backend = high cohesion.

**Low Coupling:**
Modules should depend on few others. Feature modules import only engines, not each other.

**Single Responsibility:**
Each module has one reason to change:
- Batch sidebar changes when batch UI changes
- Batch engine changes when batch logic changes

---

**Recommendation:** ✅ Reorganize using feature-based approach

**Next Step:** Generate feature-based modules and upload to Current Code folder

**Status:** Awaiting approval to proceed with reorganization

---

Generated: 2025-11-04
Project: ER Simulator Dev - Code Organization Strategy
