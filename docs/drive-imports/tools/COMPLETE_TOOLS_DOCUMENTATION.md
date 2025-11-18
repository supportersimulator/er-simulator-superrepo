# Complete Tools Documentation - All 167 Scripts

**Generated:** 2025-11-04T17:33:17.189Z
**Purpose:** Comprehensive documentation for all tools in the ER Simulator system

---

## Google Sheets Integration

**Tools in this category:** 5

### GoogleSheetsAppsScript.js

**Description:** ER Simulator - Intelligent Waveform Mapper HOW TO INSTALL: 1. Open your Google Sheet: Convert_Master_Sim_CSV_Template_with_Input 2. Go to Extensions → Apps Script 3. Delete any existing code 4. Paste this entire file 5. Save (Ctrl/Cmd + S) 6. Refresh your sheet - you'll see a new "ER Simulator" menu

**Purpose:** Data analysis

**Key Functions:**
- `onOpen()`
- `viewCasesByCategory()`
- `viewPathwayOrganization()`
- `detectWaveformForState()`
- `suggestWaveformMapping()`
- `autoMapAllWaveforms()`
- `analyzeCurrentMappings()`
- `clearAllWaveforms()`
- `jumpToCaseById()`
- `validateCurrentRow()`
- `getHeaders()`
- `buildCaseObject()`
- `onEdit()`
- `tryParseJSON()`

**File Location:** `scripts/GoogleSheetsAppsScript.js`

---

### GoogleSheetsAppsScript_Enhanced.js

**Description:** ER Simulator - AI-Powered Waveform Management System VERSION: 2.0 (Enhanced with AI + Nested Menu) HOW TO INSTALL: 1. Open your Google Sheet: Convert_Master_Sim_CSV_Template_with_Input 2. Go to Extensions → Apps Script 3. Delete any existing code 4. Paste this entire file 5. Save (Ctrl/Cmd + S) 6. Refresh your sheet - you'll see enhanced "ER Simulator" menu CONFIGURATION: - Set OPENAI_API_KEY in Script Properties (File → Project properties → Script properties) - Key name: OPENAI_API_KEY - Get key from: https://platform.openai.com/api-keys

**Purpose:** Data analysis

**Key Functions:**
- `onOpen()`
- `openWaveformAdjustmentTool()`
- `getAllCasesForAdjustmentTool()`
- `updateWaveformForCaseState()`
- `analyzeCaseWithAI()`
- `buildAIAnalysisPrompt()`
- `parseAISuggestions()`
- `launchECGConverter()`
- `configureOpenAIKey()`
- `detectWaveformForState()`
- `suggestWaveformMapping()`
- `autoMapAllWaveforms()`
- `analyzeCurrentMappings()`
- `clearAllWaveforms()`
- `viewCasesByCategory()`
- `viewPathwayOrganization()`
- `jumpToCaseById()`
- `validateCurrentRow()`
- `getHeaders()`
- `buildCaseObject()`
- `tryParseJSON()`
- `onEdit()`

**File Location:** `scripts/GoogleSheetsAppsScript_Enhanced.js`

---

### fetchCurrentAppsScript.cjs

**Description:** Fetch CURRENT Apps Script Code.gs This gets whatever is currently deployed

**Purpose:** Deployment automation

**Key Functions:**
- `fetchCurrent()`

**Dependencies:**
- fs
- path
- googleapis
- dotenv

**File Location:** `scripts/fetchCurrentAppsScript.cjs`

---

### fetchSampleRows.cjs

**Description:** No description available

**Purpose:** Google Sheets integration

**Key Functions:**
- `fetchSamples()`

**Dependencies:**
- fs
- path
- googleapis
- dotenv

**File Location:** `scripts/fetchSampleRows.cjs`

---

### fetchVitalsFromSheetsSecure.js

**Description:** No description available

**Purpose:** Google Sheets integration

**Key Functions:**
- `fetchVitals()`

**File Location:** `scripts/fetchVitalsFromSheetsSecure.js`

---

## Batch Processing

**Tools in this category:** 2

### checkBatchStatus.cjs

**Description:** No description available

**Purpose:** Testing and validation

**Key Functions:**
- `checkCurrentProgress()`

**Dependencies:**
- googleapis
- fs
- path
- dotenv

**File Location:** `scripts/checkBatchStatus.cjs`

---

### verifyBatchTool.cjs

**Description:** No description available

**Purpose:** Batch processing

**Dependencies:**
- fs
- path

**File Location:** `scripts/verifyBatchTool.cjs`

---

## Quality Control & Analysis

**Tools in this category:** 5

### qualityProgressionAnalysis.cjs

**Description:** No description available

**Purpose:** Data analysis

**Key Functions:**
- `analyzeQuality()`
- `analyzeRow()`

**Dependencies:**
- googleapis
- fs
- path
- dotenv

**File Location:** `scripts/qualityProgressionAnalysis.cjs`

---

### analyzeLastThreeRows.cjs

**Description:** No description available

**Purpose:** Data analysis

**Key Functions:**
- `analyzeRows()`

**Dependencies:**
- googleapis
- fs
- path
- dotenv

**File Location:** `scripts/analyzeLastThreeRows.cjs`

---

### compareMultipleRows.cjs

**Description:** No description available

**Purpose:** Data analysis

**Key Functions:**
- `compareRows()`

**Dependencies:**
- googleapis
- fs
- path
- dotenv

**File Location:** `scripts/compareMultipleRows.cjs`

---

### compareRows189and190.cjs

**Description:** No description available

**Purpose:** Data analysis

**Key Functions:**
- `compareRows()`
- `analyzeRows()`

**Dependencies:**
- googleapis
- fs
- path
- dotenv

**File Location:** `scripts/compareRows189and190.cjs`

---

### compareWithBackup.cjs

**Description:** No description available

**Purpose:** Backup and recovery

**Dependencies:**
- fs
- path

**File Location:** `scripts/compareWithBackup.cjs`

---

## Deployment & Distribution

**Tools in this category:** 5

### deployATSR.cjs

**Description:** No description available

**Purpose:** Deployment automation

**Key Functions:**
- `deploy()`

**Dependencies:**
- fs
- path
- googleapis
- dotenv

**File Location:** `scripts/deployATSR.cjs`

---

### deployATSRNoCaseID.cjs

**Description:** Deploy ATSR (No Case_ID) to Google Apps Script

**Purpose:** Testing and validation

**Key Functions:**
- `deploy()`

**Dependencies:**
- fs
- path
- googleapis
- dotenv

**File Location:** `scripts/deployATSRNoCaseID.cjs`

---

### deployCategoriesPanel.cjs

**Description:** Deploy Categories & Pathways Panel to Google Apps Script

**Purpose:** Testing and validation

**Key Functions:**
- `deployCategories()`

**Dependencies:**
- fs
- path
- googleapis
- dotenv

**File Location:** `scripts/deployCategoriesPanel.cjs`

---

### deployRestoredFinal.cjs

**Description:** Deploy Code_RESTORED_FINAL.gs (Enhanced prompt + light theme + no Case_ID + Categories panel)

**Purpose:** Testing and validation

**Key Functions:**
- `deploy()`

**Dependencies:**
- fs
- path
- googleapis
- dotenv

**File Location:** `scripts/deployRestoredFinal.cjs`

---

### deployUltimateFixed.cjs

**Description:** No description available

**Purpose:** Deployment automation

**Key Functions:**
- `deploy()`

**Dependencies:**
- fs
- path
- googleapis
- dotenv

**File Location:** `scripts/deployUltimateFixed.cjs`

---

## Backup & Recovery

**Tools in this category:** 5

### createComprehensiveBackup.cjs

**Description:** No description available

**Purpose:** Testing and validation

**Key Functions:**
- `createBackup()`

**Dependencies:**
- fs
- path
- googleapis
- dotenv

**File Location:** `scripts/createComprehensiveBackup.cjs`

---

### createLocalBackup.cjs

**Description:** No description available

**Purpose:** Testing and validation

**Key Functions:**
- `createLocalBackup()`

**Dependencies:**
- fs
- path
- googleapis
- dotenv

**File Location:** `scripts/createLocalBackup.cjs`

---

### restoreATSRComplete.cjs

**Description:** Complete ATSR Restoration Takes Code_ENHANCED_ATSR.gs and: 1. Removes Case_ID sections completely 2. Converts to light grey theme 3. Adds Categories panel 4. Deploys to Google Sheets

**Purpose:** Testing and validation

**Key Functions:**
- `onOpen()`
- `deploy()`

**Dependencies:**
- fs
- path
- googleapis
- dotenv

**File Location:** `scripts/restoreATSRComplete.cjs`

---

### restoreOriginalATSR.cjs

**Description:** Restore ORIGINAL ATSR with Editable UI Uses apps-script-backup/Code.gs as the source - Keeps the editable text field UI - Converts to light grey theme - Removes Case_ID section - Adds Categories panel

**Purpose:** Testing and validation

**Key Functions:**
- `onOpen()`
- `deploy()`

**Dependencies:**
- fs
- path
- googleapis
- dotenv

**File Location:** `scripts/restoreOriginalATSR.cjs`

---

### restorePreviousAppsScriptVersion.cjs

**Description:** List and Restore Previous Apps Script Versions

**Purpose:** General utility

**Key Functions:**
- `restore()`

**Dependencies:**
- fs
- path
- googleapis
- dotenv

**File Location:** `scripts/restorePreviousAppsScriptVersion.cjs`

---

## Testing & Validation

**Tools in this category:** 1

### testATSRPrompt.cjs

**Description:** No description available

**Purpose:** Testing and validation

**Key Functions:**
- `testPrompt()`

**Dependencies:**
- dotenv

**File Location:** `scripts/testATSRPrompt.cjs`

---

## Waveform Management

**Tools in this category:** 1

### investigateInvalidWaveforms.cjs

**Description:** No description available

**Purpose:** Google Sheets integration

**Key Functions:**
- `investigate()`

**Dependencies:**
- fs
- path
- googleapis
- dotenv

**File Location:** `scripts/investigateInvalidWaveforms.cjs`

---

## Utility Scripts

**Tools in this category:** 1

### checkRowFields.cjs

**Description:** No description available

**Purpose:** Google Sheets integration

**Key Functions:**
- `checkFields()`

**Dependencies:**
- fs
- path
- googleapis
- dotenv

**File Location:** `scripts/checkRowFields.cjs`

---
