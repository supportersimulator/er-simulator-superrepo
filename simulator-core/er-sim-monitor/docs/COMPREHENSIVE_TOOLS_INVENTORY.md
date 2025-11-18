# ER Simulator - Comprehensive Tools Inventory

**Project**: Medical Simulation Scenario Development Platform
**Created**: 2025-11-04
**Last Updated**: 2025-11-04
**Total Tools**: 180+ (152 Node.js scripts, 15 Apps Script files, 13 HTML tools)

---

## 📋 Table of Contents

1. [Sequential Workflow Tools](#sequential-workflow-tools)
2. [Google Apps Script Tools (Google Sheets Integration)](#google-apps-script-tools)
3. [Node.js Automation Scripts](#nodejs-automation-scripts)
4. [HTML-Based Tools](#html-based-tools)
5. [Quality Control & Analysis Tools](#quality-control--analysis-tools)
6. [System Maintenance & Utilities](#system-maintenance--utilities)
7. [Tool Usage Statistics](#tool-usage-statistics)

---

## 🎯 Sequential Workflow Tools

These tools are listed in the typical order they would be used to create a complete medical simulation scenario.

### Phase 1: Source Material Preparation

#### 1.1 **ECG-to-SVG Converter** ⭐ CRITICAL TOOL
- **File**: `ecg-to-svg-converter.html`
- **Type**: HTML Standalone Tool
- **Purpose**: Convert ECG strip images to medically accurate vector waveforms
- **Created By**: Aaron (with ChatGPT)
- **Status**: Production-ready (v4.0 with auto-tiling)

**Features**:
- Perfect 1:1 pixel preservation (no QRS distortion)
- Auto-tiling with red stitch marks for seamless looping
- Dual independent drag system (bracket + waveform panning)
- Vertical-only auto-fit (amplitude scales, horizontal unchanged)
- Real-time baseline adjustment (-50 to +50 segments)
- Dual-format export (SVG + PNG simultaneously)

**Usage**:
```bash
# Open in browser
open /Users/aarontjomsland/er-sim-monitor/ecg-to-svg-converter.html

# Workflow:
# 1. Upload ECG strip image (PNG/JPG)
# 2. Extract black line (threshold adjustable)
# 3. Convert to green SVG (optional smoothing)
# 4. Crop region selector with auto-tiling
# 5. Final baseline micro-adjustment
# 6. Click "💾 AUTO-SAVE: SVG + PNG (Both Formats)"
```

**Output**:
- SVG: `/assets/waveforms/svg/{waveform}_ecg.svg`
- PNG: `/assets/waveforms/png/{waveform}_ecg.png`

**Naming Convention**: All waveforms MUST use `{waveform}_ecg` suffix (e.g., `vfib_ecg`, `afib_ecg`, `sinus_ecg`)

---

#### 1.2 **Waveform Registry Migration**
- **File**: `scripts/migrateWaveformNaming.cjs`
- **Command**: `npm run migrate-waveforms`
- **Purpose**: Universal waveform naming system (enforce `_ecg` suffix)
- **Status**: Production-ready

**Features**:
- Auto-updates waveforms registry
- Validates naming conventions across ecosystem
- Prevents suffix stripping bugs

---

#### 1.3 **Source Data Import**
- **File**: `scripts/importEmsimFinal.cjs`
- **Purpose**: Import medical case studies from emsim_final sheet
- **Status**: Production-ready
- **Source**: Google Sheet ID `1Sx_6R3Dr1fbaV3u8y9tgtkc0ir7GV2X-zI9ZJiDwRXA` (172 scenarios)

**Mapping**:
```
emsim_final Column A (site_text)     → Input Column B (HTML)
emsim_final Column B (document_text) → Input Column C (DOC)
```

---

### Phase 2: Scenario Processing & Generation

#### 2.1 **Batch Processing Engine** ⭐ PRIMARY TOOL
- **File**: `scripts/Code_ULTIMATE_ATSR.gs` (Google Apps Script)
- **Location**: Integrated in Google Sheets menu
- **Menu**: **Sim Mastery > 🚀 Launch Batch / Single (Sidebar)**
- **Purpose**: AI-powered scenario generation from source material
- **Created By**: Aaron (with ChatGPT), enhanced by Claude
- **Status**: Production-ready (Phase 1-3 complete)

**Features**:
- **Batch Modes**:
  - Next 25 Rows (smart queue based on output sheet progress)
  - All Remaining Rows
  - Specific Row Range (e.g., 10-50)
  - Single Row Mode
- **Live Logging**: Real-time progress updates in sidebar
- **Progress Tracking**: Timestamp + status for each scenario
- **Error Handling**: Retry logic, JSON validation, truncation prevention
- **Force Reprocess**: Toggle to regenerate existing scenarios
- **Clinical Defaults**: Auto-fills missing vitals with medically realistic values

**AI Model**: OpenAI GPT-4o (16K tokens, prompt caching enabled)

**Processing Time**:
- Single scenario: ~30-45 seconds
- Batch of 25: ~15-20 minutes
- Full 172 scenarios: ~2-3 hours

---

#### 2.2 **Clinical Defaults System**
- **Function**: `applyClinicalDefaults_()` (embedded in Code_ULTIMATE_ATSR.gs)
- **Purpose**: Ensures every scenario has complete 6-state vitals progression
- **Status**: Production-ready

**Fills Missing**:
- Heart Rate (HR): 75 bpm default
- SpO2: 98% default
- Blood Pressure (Systolic/Diastolic): 120/80 mmHg
- Respiratory Rate (RR): 16 breaths/min
- Temperature (Temp): 37.0°C
- EtCO2: 38 mmHg

**Progression**: Initial → Vitals_1 → Vitals_2 → Vitals_3 → Vitals_4 → Vitals_5

---

#### 2.3 **Input Validation System**
- **Function**: Embedded in `processOneInputRow_()` (Code_ULTIMATE_ATSR.gs)
- **Purpose**: Prevents processing of empty or placeholder rows
- **Status**: Production-ready (completed 2025-11-03)

**Checks**:
- ✅ Empty row detection (all columns blank)
- ✅ N/A placeholder rejection (all columns = "N/A")
- ✅ Clear error messaging ("EMPTY INPUT", "PLACEHOLDER INPUT")
- ✅ Automatic skip with logging

---

#### 2.4 **Duplicate Prevention System**
- **Function**: Hash signature system (embedded in Code_ULTIMATE_ATSR.gs)
- **Purpose**: Prevent reprocessing identical inputs
- **Status**: Production-ready

**Features**:
- SHA-256 hash of input content
- Stored in `Source_Metadata:Hash_Signature`
- Force reprocess toggle to override
- Smart duplicate detection (Phase II.A - in development)

---

### Phase 3: Titles, Summaries & Metadata Enhancement

#### 3.1 **ATSR Tool** (Automated Titles, Summary & Review) ⭐ KEY TOOL
- **File**: Embedded in `scripts/Code_ULTIMATE_ATSR.gs`
- **Menu**: **Sim Mastery > 🪄 ATSR — Titles & Summary**
- **Purpose**: Generate compelling titles, summaries, and memory anchors
- **Created By**: Aaron (with ChatGPT)
- **Status**: Production-ready

**Features**:
- **Interactive UI**: Beautiful selection interface with preview
- **Keep & Regenerate**: Preserve selected fields, regenerate others
- **Deselect Mode**: Clear unwanted fields without regenerating
- **Memory Tracker**: Intelligent management of 10 memory anchors
- **Clinical Accuracy**: Medically sound, educationally valuable titles

**Generates**:
1. **Spark Title** (Pre-simulation): Mystery/intrigue, human-first
2. **Reveal Title** (Post-simulation): Full diagnosis, learning objective
3. **Case_ID**: Auto-incremented unique identifier
4. **Defining Diagnosis**: Primary medical condition
5. **Memory Anchors** (10): Sensory/emotional details for recall
6. **Patient Summary** (3 sentences): Clinical handoff style
7. **Core Takeaway**: The clinical pearl they'll remember forever

**UI Features**:
- Green checkmark = selected for saving
- Gray = deselected, won't be saved
- "Keep & Regenerate" button: preserve selections, regenerate others
- "Deselect All" button: clear all without regenerating

---

#### 3.2 **Categories & Pathways Panel** 📂
- **File**: Embedded in `scripts/Code_ULTIMATE_ATSR.gs`
- **Menu**: **Sim Mastery > 📂 Categories & Pathways**
- **Purpose**: Organize scenarios by medical system and learning pathway
- **Created By**: Aaron (with ChatGPT)
- **Status**: Production-ready

**Features**:
- View all categories (Cardiovascular, Respiratory, Neurological, etc.)
- View all learning pathways (Beginner, Advanced, Specialty)
- Assign category and pathway to each scenario
- Filter and search scenarios by category/pathway

**Categories** (examples):
- 🫀 Cardiovascular
- 🫁 Respiratory
- 🧠 Neurological
- 🩸 Hematologic
- 💊 Toxicology
- 🦴 Trauma
- 👶 Pediatrics
- 👵 Geriatrics

---

#### 3.3 **AI-Enhanced Renaming Tool**
- **File**: `scripts/aiEnhancedRenaming.cjs`
- **Command**: `npm run ai-enhanced`
- **Purpose**: Intelligent case renaming using AI analysis
- **Status**: Experimental

**Features**:
- Analyzes clinical content
- Suggests improved case IDs and titles
- Preserves medical accuracy
- Batch or single-row mode

---

#### 3.4 **Overview Generation Tool**
- **File**: `scripts/generateOverviewsStandalone.cjs`
- **Command**: `npm run generate-overviews`
- **Purpose**: Auto-generate case overviews from existing data
- **Status**: Production-ready

**Generates**:
- Patient_Overview: 1-2 sentence summary
- Case_Overview: Clinical scenario summary
- Simulation_Overview: Teaching objectives

---

### Phase 4: Quality Control & Analysis

#### 4.1 **Quality Scoring System** 🧪
- **Function**: `runQualityAudit_AllOrRows()` (Code_ULTIMATE_ATSR.gs)
- **Menu**: **Sim Mastery > 🧪 Run Quality Audit (All / Specific Rows)**
- **Purpose**: Score scenarios 0-100% based on completeness and educational value
- **Status**: Production-ready

**Scoring Criteria** (0-100 points):
- **Completeness** (30 pts): All required fields filled
- **Educational Value** (30 pts): Learning objectives, clinical pearls
- **Medical Accuracy** (20 pts): Diagnosis alignment, vital sign realism
- **Uniqueness** (20 pts): Distinct from other scenarios

**Output**:
- `Developer_and_QA_Metadata:Simulation_Quality_Score` (0-100)
- `Developer_and_QA_Metadata:Improvement_Suggestions` (actionable feedback)

**Quality Thresholds**:
- 90-100%: Premium Quality
- 70-89%: Good Quality
- 60-69%: Acceptable
- <60%: Below Standard (flagged for improvement)

---

#### 4.2 **Duplicate Detection Tools**

##### 4.2.1 **Media URL Uniqueness Check** ⚠️ HIGH PRIORITY
- **File**: `scripts/checkMediaURLs.cjs`, `scripts/analyzeMediaURLsDetailed.cjs`
- **Purpose**: Validate scenario uniqueness via source material URLs
- **Status**: Implemented (2025-11-03), integration into Apps Script pending
- **Documentation**: `/docs/MEDIA_URL_UNIQUENESS_CHECK.md`

**Algorithm**:
1. Extract content URLs from media columns (exclude license URLs)
2. Compare URLs across scenarios
3. Decision matrix:
   - Duplicate URLs → TRUE duplicate (block)
   - Unique URLs + <70% text similarity → PASS (distinct)
   - Unique URLs + 70-90% similarity → WARN (similar but valid)
   - Unique URLs + >90% similarity → INFO (template-based)

**Key Insight**: Similar text ≠ Duplicate when source materials differ (medical nuance vs lazy repetition)

##### 4.2.2 **Smart Duplicate Detection** (Phase II.A - In Development)
- **Status**: Planned (Week of 2025-11-04)
- **Features**:
  - Title similarity checking (>70% threshold)
  - Text similarity analysis (>90% threshold)
  - Demographics pattern detection
  - Diagnosis distribution monitoring
  - Learning objective overlap analysis

##### 4.2.3 **Duplicate Scenario Analysis**
- **File**: `scripts/analyzeDuplicateScenarios.cjs`
- **Purpose**: Find near-duplicate scenarios (text similarity)
- **Status**: Diagnostic tool

---

#### 4.3 **Waveform Mapping Tools** 🩺

##### 4.3.1 **Intelligent Waveform Mapper**
- **Menu**: **Waveforms > 🩺 Suggest Waveform Mapping**
- **Function**: `suggestWaveformMapping()` (Code_ULTIMATE_ATSR.gs)
- **Purpose**: AI-suggested waveform assignment based on case details
- **Status**: Production-ready

**Detects**:
- Normal Sinus Rhythm → `sinus_ecg`
- Atrial Fibrillation → `afib_ecg`
- Ventricular Tachycardia → `vtach_ecg`
- Ventricular Fibrillation → `vfib_ecg`
- Asystole → `asystole_ecg`
- PEA → `pea_ecg`
- STEMI variants → `stemi_anterior_ecg`, `stemi_inferior_ecg`

##### 4.3.2 **Auto-Map All Waveforms**
- **Menu**: **Waveforms > 🔄 Auto-Map All Waveforms**
- **Function**: `autoMapAllWaveforms()` (Code_ULTIMATE_ATSR.gs)
- **Purpose**: Batch assign waveforms to all scenarios intelligently
- **Status**: Production-ready

##### 4.3.3 **Analyze Current Mappings**
- **Menu**: **Waveforms > 📊 Analyze Current Mappings**
- **Function**: `analyzeCurrentMappings()` (Code_ULTIMATE_ATSR.gs)
- **Purpose**: Statistics on waveform usage across all scenarios
- **Status**: Production-ready

##### 4.3.4 **Clear All Waveforms**
- **Menu**: **Waveforms > ❌ Clear All Waveforms**
- **Function**: `clearAllWaveforms()` (Code_ULTIMATE_ATSR.gs)
- **Purpose**: Remove all waveform assignments (for re-mapping)
- **Status**: Production-ready

---

#### 4.4 **Validation Tools**

##### 4.4.1 **Vitals JSON Validator**
- **File**: `scripts/validateVitalsJSON.cjs`
- **Command**: `npm run validate-vitals`
- **Purpose**: Verify all vitals fields are valid JSON
- **Status**: Production-ready

##### 4.4.2 **System Integrity Validator**
- **File**: `scripts/validateSystemIntegrity.cjs`
- **Command**: `npm run validate-system`
- **Purpose**: Comprehensive system health check
- **Status**: Production-ready

**Checks**:
- All required columns present
- Valid JSON in vitals fields
- No broken waveform references
- No empty required fields
- Hash signatures valid

##### 4.4.3 **Enhanced Validation Suite**
- **File**: `scripts/enhancedValidation.cjs`
- **Command**: `npm run enhanced-validation`
- **Purpose**: Deep validation with repair suggestions
- **Status**: Production-ready

---

### Phase 5: Image Sync & Media Management

#### 5.1 **Image Sync Defaults Panel**
- **Menu**: **Sim Mastery > 🖼️ Image Sync Defaults**
- **Function**: `openImageSyncDefaults()` (Code_ULTIMATE_ATSR.gs)
- **Purpose**: Manage default images for each vital state
- **Status**: Production-ready

**Features**:
- Upload default images for Initial, Vitals_1-5
- Assign image URLs to specific scenarios
- Bulk image sync across scenarios

---

### Phase 6: Deployment & Distribution

#### 6.1 **Apps Script Deployment Tools**

##### 6.1.1 **Deploy Apps Script**
- **File**: `scripts/deployAppsScript.cjs`
- **Command**: `npm run deploy-script`
- **Purpose**: Deploy updated Apps Script code to Google Sheets
- **Status**: Production-ready

##### 6.1.2 **Deploy Web App**
- **File**: `scripts/deployWebApp.cjs`
- **Command**: `npm run deploy-web-app`
- **Purpose**: Deploy as web app endpoint
- **Status**: Production-ready

##### 6.1.3 **Read Apps Script**
- **File**: `scripts/readAppsScript.cjs`
- **Command**: `npm run read-script`
- **Purpose**: Fetch current deployed Apps Script code
- **Status**: Production-ready

---

#### 6.2 **Data Export & Sync Tools**

##### 6.2.1 **Live Sync Server**
- **File**: `scripts/liveSyncServer.js`
- **Command**: `npm run live-sync`
- **Purpose**: Real-time Google Sheets → Monitor UI sync
- **Status**: Production-ready

**How it works**:
1. Google Sheets edit triggers Apps Script `onEdit()`
2. Sheet POSTs to local webhook endpoint
3. Server updates `/data/vitals.json`
4. WebSocket broadcasts to connected Monitor UIs
5. Monitor UI refreshes instantly

**Requirements**:
- ngrok tunnel for webhook access: `npx ngrok http 3333`

##### 6.2.2 **Fetch Vitals from Sheets**
- **File**: `scripts/fetchVitalsFromSheetsOAuth.js`
- **Command**: `npm run fetch-vitals`
- **Purpose**: Pull vitals data from Google Sheets to local JSON
- **Status**: Production-ready

##### 6.2.3 **Sync Vitals to Sheets**
- **File**: `scripts/syncVitalsToSheets.js`
- **Command**: `npm run sync-vitals`
- **Purpose**: Bi-directional sync (read + auto-fix + write back)
- **Status**: Production-ready

**Features**:
- Reads from Master Scenario Convert tab
- Auto-fills missing waveform and lastUpdated fields
- Updates both `/data/vitals.json` and Google Sheet
- Logs each update clearly

---

### Phase 7: Monitoring & Analytics

#### 7.1 **Dashboard Tools**

##### 7.1.1 **Interactive Dashboard V2**
- **File**: `scripts/interactiveDashboardV2.cjs`
- **Command**: `npm run dashboard-v2`
- **Purpose**: Real-time project analytics and progress monitoring
- **Status**: Production-ready

**Displays**:
- Total scenarios created
- Quality distribution (Premium/Good/Acceptable/Below Standard)
- Category breakdown
- Pathway distribution
- Completion rates
- Recent activity

##### 7.1.2 **Progress Monitor**
- **File**: `scripts/progressMonitor.cjs`
- **Command**: `npm run monitor`
- **Purpose**: Track batch processing progress in real-time
- **Status**: Production-ready

##### 7.1.3 **Export Dashboard Data**
- **File**: `scripts/exportDashboardData.cjs`
- **Commands**:
  - `npm run export-dashboard` (default format)
  - `npm run export-csv` (CSV format)
  - `npm run export-json` (JSON format)
- **Purpose**: Export analytics data for external analysis
- **Status**: Production-ready

---

#### 7.2 **Batch Monitoring Tools**

##### 7.2.1 **Batch Status Summary**
- **File**: `scripts/batchStatusSummary.cjs`
- **Purpose**: Quick summary of batch processing status
- **Status**: Production-ready

##### 7.2.2 **Check Batch Progress**
- **File**: `scripts/checkBatchProgress.cjs`
- **Purpose**: Real-time batch progress checking
- **Status**: Production-ready

##### 7.2.3 **Monitor Batch**
- **File**: `scripts/monitorBatch.cjs`
- **Command**: `npm run monitor-batch`
- **Purpose**: Continuous batch monitoring (Phase 3 - OpenAI Batch API)
- **Status**: Production-ready (Phase 3 complete)

---

#### 7.3 **Operation History**
- **File**: `scripts/operationHistory.cjs`
- **Commands**:
  - `npm run history` (show history)
  - `npm run undo` (undo last operation)
- **Purpose**: Track and undo system operations
- **Status**: Production-ready

---

### Phase 8: Advanced Features (Ongoing Development)

#### 8.1 **Pathway Management**

##### 8.1.1 **Analyze Pathway Names**
- **File**: `scripts/analyzePathwayNames.cjs`
- **Command**: `npm run analyze-pathways`
- **Purpose**: Analyze learning pathway distribution
- **Status**: Production-ready

##### 8.1.2 **Consolidate Pathways**
- **File**: `scripts/consolidatePathways.cjs`
- **Command**: `npm run consolidate-pathways`
- **Purpose**: Merge similar pathways, remove duplicates
- **Status**: Production-ready

##### 8.1.3 **Auto-Flag Foundational Cases**
- **File**: `scripts/autoFlagFoundationalCases.cjs`
- **Command**: `npm run auto-flag-foundational`
- **Purpose**: Automatically identify foundational/prerequisite cases
- **Status**: Production-ready

##### 8.1.4 **Sync Foundational to Sheet**
- **File**: `scripts/syncFoundationalToSheet.cjs`
- **Command**: `npm run sync-foundational`
- **Purpose**: Write foundational flags back to Google Sheet
- **Status**: Production-ready

---

#### 8.2 **Metadata Management**

##### 8.2.1 **Backup Metadata**
- **File**: `scripts/backupMetadata.cjs`
- **Command**: `npm run backup-metadata`
- **Purpose**: Backup all scenario metadata (categories, pathways, quality scores)
- **Status**: Production-ready

##### 8.2.2 **Restore Metadata**
- **File**: `scripts/restoreMetadata.cjs`
- **Command**: `npm run restore-metadata`
- **Purpose**: Restore metadata from backup
- **Status**: Production-ready

##### 8.2.3 **Compare Backups**
- **File**: `scripts/compareBackups.cjs`
- **Command**: `npm run compare-backups`
- **Purpose**: Diff two metadata backups
- **Status**: Production-ready

---

## 🖥️ Google Apps Script Tools

These tools are integrated directly into Google Sheets via the **Sim Mastery** menu.

### Core Menu Items (onOpen)

```
Sim Mastery
├── 🚀 Launch Batch / Single (Sidebar)
├── 🪄 ATSR — Titles & Summary
├── 📂 Categories & Pathways
├── 🖼️ Image Sync Defaults
├── 🧠 Memory Tracker
├── 🧪 Run Quality Audit (All / Specific Rows)
├── 🧹 Clean Up Low-Value Rows
├── 🔁 Refresh Headers
├── 🧠 Retrain Prompt Structure
├── 🛡️ Check API Status
└── ⚙️ Settings

Waveforms
├── 🩺 Suggest Waveform Mapping
├── 🔄 Auto-Map All Waveforms
├── 📊 Analyze Current Mappings
└── ❌ Clear All Waveforms
```

### Apps Script Files

1. **Code_ULTIMATE_ATSR.gs** (Current Production)
   - Main batch processing engine
   - ATSR title generator
   - Quality scoring system
   - Clinical defaults
   - Waveform mapper
   - Categories & Pathways panel

2. **Code_ENHANCED_ATSR.gs** (Enhanced Version)
   - Extended ATSR features
   - Advanced prompting

3. **Code_SIMPLIFIED_ATSR_LIGHT.gs** (Lightweight)
   - Simplified UI
   - Faster performance

4. **Code_WITH_CATEGORIES_LIGHT.gs** (Categories Focus)
   - Enhanced category management

5. **CategoriesPathwaysPanel.gs** (Standalone)
   - Dedicated Categories & Pathways tool

6. **ATSR_Enhanced_Function.gs** (Standalone)
   - Standalone ATSR tool (for testing)

---

## 🔧 Node.js Automation Scripts

### Authentication & Authorization

1. **quickAuth.cjs** - Fast OAuth authentication
2. **authGoogleDrive.cjs** - Google Drive write permissions
3. **completeAuth.cjs** - Complete OAuth flow

### Google Sheets Integration

4. **listAppsScriptProjects.cjs** - List all Apps Script projects
5. **getSheetScriptId.cjs** - Get script ID for specific sheet
6. **readAppsScript.cjs** - Read deployed Apps Script code
7. **deployAppsScript.cjs** - Deploy Apps Script to Google Sheets
8. **testAppsScriptModification.cjs** - Test Apps Script changes
9. **uploadCompleteAppsScript.cjs** - Upload complete Apps Script file

### Data Import & Export

10. **importEmsimFinal.cjs** - Import from emsim_final sheet
11. **findAndImportSimFinal.cjs** - Locate and import source data
12. **safeImportFromSimFinal.cjs** - Safe import with validation
13. **fetchVitalsFromSheetsOAuth.js** - Fetch vitals via OAuth
14. **syncVitalsToSheets.js** - Bi-directional vitals sync
15. **exportDashboardData.cjs** - Export analytics data

### Batch Processing

16. **processWithStandardAPI.cjs** - Process via Standard OpenAI API
17. **resumeBatch.cjs** - Resume interrupted batch
18. **parallelBatchProcessor.cjs** - Parallel batch processing
19. **monitorBatch.cjs** - Monitor OpenAI Batch API jobs
20. **validateBatchQuality.cjs** - Validate batch output quality

### Quality Control

21. **compareDataQuality.cjs** - Compare quality across batches
22. **validateVitalsJSON.cjs** - Validate vitals JSON structure
23. **validateSystemIntegrity.cjs** - System health check
24. **enhancedValidation.cjs** - Deep validation with repair

### Waveform Management

25. **migrateWaveformNaming.cjs** - Universal naming migration
26. **deployWaveformSystem.cjs** - Deploy waveform system
27. **openDeploymentFiles.cjs** - Open deployment-ready files

### Metadata & Categories

28. **addCategoryColumn.cjs** - Add category column to sheet
29. **categoriesAndPathwaysTool.cjs** - Manage categories/pathways
30. **analyzePathwayNames.cjs** - Analyze pathway distribution
31. **consolidatePathways.cjs** - Merge duplicate pathways
32. **autoFlagFoundationalCases.cjs** - Auto-identify foundational cases
33. **syncFoundationalToSheet.cjs** - Sync foundational flags

### Overview Generation

34. **generateOverviewsStandalone.cjs** - Generate case overviews
35. **syncOverviewsToSheet.cjs** - Sync overviews to Google Sheet
36. **excludeOverviewColumnsFromPrompt.cjs** - Exclude from AI prompt

### Duplicate Detection

37. **analyzeDuplicateScenarios.cjs** - Find near-duplicates
38. **checkMediaURLs.cjs** - Check media URL uniqueness
39. **analyzeMediaURLsDetailed.cjs** - Detailed media URL analysis

### Analytics & Dashboards

40. **generateDashboard.cjs** - Generate analytics dashboard
41. **interactiveDashboard.cjs** - Interactive CLI dashboard
42. **interactiveDashboardV2.cjs** - Enhanced interactive dashboard
43. **progressMonitor.cjs** - Real-time progress monitoring

### Backups & History

44. **backupMetadata.cjs** - Backup scenario metadata
45. **restoreMetadata.cjs** - Restore from metadata backup
46. **compareBackups.cjs** - Compare two backups
47. **operationHistory.cjs** - Track and undo operations

### System Maintenance

48. **clearApiKeyCache.cjs** - Clear cached API keys
49. **forceClearAndUpdateApiKey.cjs** - Force API key update
50. **deleteDocumentProperty.cjs** - Delete document properties
51. **checkDocumentProperties.cjs** - View document properties
52. **updateSyncApiButton.cjs** - Update API sync button
53. **autoCloseSuccessPopup.cjs** - Auto-close success notifications

### Sheet Structure

54. **analyzeSheetStructure.cjs** - Analyze sheet column structure
55. **compareSheetColumns.cjs** - Compare columns across sheets
56. **backupHeadersAndFlatten.cjs** - Backup and flatten headers
57. **addEmptyRows.cjs** - Add empty rows for testing
58. **deleteEmptyRows.cjs** - Remove empty rows
59. **getSheetIdForMaster.cjs** - Get sheet ID for Master tab
60. **listAllSheets.cjs** - List all sheets in workbook

### Clinical Defaults

61. **addClinicalDefaults.cjs** - Add clinical defaults system
62. **addClinicalDefaultsToAppsScript.cjs** - Deploy clinical defaults
63. **addClinicalDefaultsBatched.cjs** - Batch apply clinical defaults

### Logging & Diagnostics

64. **analyzeLiveLogging.cjs** - Analyze live log output
65. **addLogDiagnosticFunction.cjs** - Add diagnostic logging
66. **enableLogsForAllModes.cjs** - Enable logging for all modes
67. **addOpenAIResponseLogging.cjs** - Log OpenAI responses
68. **checkLatestBatchDetails.cjs** - Check latest batch details
69. **debugBatchQueue.cjs** - Debug batch queue state
70. **diagnoseLoggingSystem.cjs** - Diagnose logging issues

### Row Detection & Processing

71. **implementSmartRowDetection.cjs** - Smart row detection
72. **addRowDetectionLogging.cjs** - Add row detection logs
73. **implementRobustRowDetection.cjs** - Robust row detection
74. **verifyRowDetection.cjs** - Verify row detection accuracy
75. **cleanupInputRow2.cjs** - Clean up input row logic

### API & Deployment

76. **addWebAppEndpoint.cjs** - Add web app endpoint
77. **deployWebApp.cjs** - Deploy as web app
78. **updateDeploymentAsWebApp.cjs** - Update web app deployment
79. **createNewVersion.cjs** - Create new script version
80. **updateDeploymentToHEAD.cjs** - Update deployment to HEAD
81. **useExistingDeployment.cjs** - Use existing deployment

### Code Analysis

82. **findCaseIDValidation.cjs** - Find Case_ID validation logic
83. **searchProcessingLogic.cjs** - Search processing functions
84. **viewProcessFunction.cjs** - View specific function code
85. **analyzeCaseIDUsage.cjs** - Analyze Case_ID usage patterns
86. **findSidebarHTML.cjs** - Find sidebar HTML code
87. **readScriptLine.cjs** - Read specific script lines

### Test & Validation

88. **testSidebarMode.cjs** - Test sidebar functionality
89. **testSuite.cjs** - Comprehensive test suite
90. **verifySetup.cjs** - Verify system setup

### Progress Tracking

91. **createProgressTracker.cjs** - Create progress tracking system
92. **batchStatusSummary.cjs** - Batch status summary
93. **checkBatchProgress.cjs** - Check batch progress

### Optimization

94. **deployRetryLogic.cjs** - Deploy retry logic
95. **deployPromptCaching.cjs** - Deploy prompt caching (50% cost savings)

### Smart Renaming

96. **smartRenameToolPhase2.cjs** - Smart case renaming (Phase 2)
97. **aiEnhancedRenaming.cjs** - AI-powered renaming

### Column Management

98. **addOverviewColumnsToSheet.cjs** - Add overview columns
99. **colorCodeCategoryHeaders.cjs** - Color-code category headers
100. **analyzeColumnCategories.cjs** - Analyze column categories

### Batch Flow Debugging

101. **traceBatchFlowVsSingle.cjs** - Trace batch vs single mode
102. **fixBatchMode.cjs** - Fix batch mode issues
103. **fixBatchRowCalculation.cjs** - Fix batch row calculation
104. **fixBatchRowNumbers.cjs** - Fix batch row numbering
105. **fixBatchFlowRecalculate.cjs** - Fix batch flow recalculation
106. **fixBatchErrorHandling.cjs** - Fix batch error handling
107. **simplifyBatchMode.cjs** - Simplify batch mode logic
108. **updateBatchMode.cjs** - Update batch mode
109. **fixSmartBatch.cjs** - Fix smart batch logic

### Error Handling

110. **fixOpenAIResponseExtraction.cjs** - Fix OpenAI response parsing
111. **improveBatchErrorTracking.cjs** - Improve error tracking
112. **enhanceBatchLiveLogging.cjs** - Enhance live logging

### Apps Script Versioning

113. **getAppsScriptVersions.cjs** - Get script version history
114. **fetchOldVersion.cjs** - Fetch old script version
115. **checkExecutionHistory.cjs** - Check execution history

### ATSR Enhancements

116. **fixATSRModel.cjs** - Fix ATSR AI model
117. **updateATSRCode.cjs** - Update ATSR code
118. **mergeEnhancedATSR.cjs** - Merge enhanced ATSR features
119. **deployEnhancedATSR.cjs** - Deploy enhanced ATSR
120. **createSimplifiedATSR.cjs** - Create simplified ATSR

### UI Panels

121. **addCategoriesPathwaysPanel.cjs** - Add Categories & Pathways panel
122. **addCategoriesMenuItem.cjs** - Add Categories menu item
123. **addShowToastFunction.cjs** - Add toast notification function

### Document Properties

124. **switchToDocumentProperties.cjs** - Switch to document properties storage
125. **standardizeApiKeyUsage.cjs** - Standardize API key usage
126. **checkDocumentProperties.cjs** - Check document properties

### Simulation ID Management

127. **analyzeOutputSheetForSimulationId.cjs** - Analyze Simulation_ID usage
128. **findSimulationIdColumn.cjs** - Find Simulation_ID column

### Row Fixes

129. **fixAllRowCalculations.cjs** - Fix all row calculation issues

### Test Functions

130. **addTestBatchFunction.cjs** - Add test batch function
131. **addBatchLiveLogging.cjs** - Add batch live logging

### Batch Reports

132. **ensureBatchReportsSheet.cjs** - Ensure Batch_Reports sheet exists

### Execution Monitoring

133. **checkResults.cjs** - Check execution results

### Google Drive Tools

134. **findDriveFile.cjs** - Find file in Google Drive
135. **findDriveBackupLocation.cjs** - Find backup location
136. **backupToGoogleDrive.cjs** - Backup to Google Drive
137. **upgradeTokenScopes.cjs** - Upgrade OAuth token scopes

---

## 🌐 HTML-Based Tools

### ECG Processing Tools

1. **ecg-to-svg-converter.html** ⭐ PRIMARY TOOL
   - Convert ECG strips to SVG waveforms
   - Auto-tiling with seamless looping
   - Dual-format export (SVG + PNG)
   - Status: Production-ready (v4.0)

2. **auto-trace-black.html**
   - Automatic black line extraction from ECG images
   - Status: Experimental

3. **image-trace-opencv.html**
   - OpenCV-based image tracing
   - Status: Experimental

### Waveform Preview & Testing

4. **nsr-afib-comparison.html**
   - Side-by-side NSR vs AFib comparison
   - Status: Testing tool

5. **afib-preview.html**
   - AFib waveform preview
   - Status: Testing tool

6. **trace-afib-coordinates.html**
   - AFib coordinate extraction
   - Status: Development tool

7. **traced-afib-preview.html**
   - Preview traced AFib waveform
   - Status: Testing tool

8. **traced-afib-spline.html**
   - AFib spline curve smoothing
   - Status: Experimental

9. **waveform-image-demo.html**
   - Waveform image rendering demo
   - Status: Testing tool

### Icon & UI Tools

10. **ekg-icon-preview.html**
    - EKG icon preview tool
    - Status: UI development

11. **ekg-favorites-simple.html**
    - Simple EKG favorites selector
    - Status: UI development

12. **ekg-smooth-final.html**
    - Final smooth EKG rendering
    - Status: UI development

13. **ekg-ultra-smooth.html**
    - Ultra-smooth EKG rendering
    - Status: Experimental

---

## 🔍 Quality Control & Analysis Tools

### Comprehensive Quality Tools

These tools are used throughout the development lifecycle to ensure scenario quality.

#### Quality Scoring (Production)
- **runQualityAudit_AllOrRows()** - Apps Script function
- **evaluateSimulationQuality()** - Apps Script function
- **attachQualityToRow_()** - Apps Script function

#### Duplicate Detection (Production + In Development)
- **checkMediaURLs.cjs** - Media URL uniqueness ✅ IMPLEMENTED
- **analyzeMediaURLsDetailed.cjs** - Detailed media analysis ✅ IMPLEMENTED
- **analyzeDuplicateScenarios.cjs** - Text similarity analysis ✅ IMPLEMENTED
- **Smart Duplicate Detection** - Multi-factor analysis 🔄 IN DEVELOPMENT

#### Validation (Production)
- **validateVitalsJSON.cjs** - JSON structure validation
- **validateSystemIntegrity.cjs** - System health check
- **enhancedValidation.cjs** - Deep validation with repair
- **validateBatchQuality.cjs** - Batch output quality check

#### Data Comparison (Production)
- **compareDataQuality.cjs** - Compare quality across batches
- **compareSheetColumns.cjs** - Compare sheet structures
- **compareBackups.cjs** - Compare metadata backups

---

## 🛠️ System Maintenance & Utilities

### Backup & Recovery

1. **Metadata Backups**
   - `backupMetadata.cjs` - Backup scenario metadata
   - `restoreMetadata.cjs` - Restore from backup
   - `compareBackups.cjs` - Compare backup versions

2. **Code Backups**
   - `/backups/` directory - Local backups
   - Google Drive backup system - Cloud backups
   - Git + GitHub - Version control

3. **Google Drive Integration**
   - `backupToGoogleDrive.cjs` - Upload to Drive
   - `findDriveBackupLocation.cjs` - Locate backup folder
   - `authGoogleDrive.cjs` - Authorize Drive access

### Document Properties Management

- `checkDocumentProperties.cjs` - View properties
- `deleteDocumentProperty.cjs` - Delete property
- `switchToDocumentProperties.cjs` - Migrate to properties storage
- `standardizeApiKeyUsage.cjs` - Standardize API key storage

### Cache Management

- `clearApiKeyCache.cjs` - Clear API key cache
- `forceClearAndUpdateApiKey.cjs` - Force update API key

### Sheet Maintenance

- `addEmptyRows.cjs` - Add test rows
- `deleteEmptyRows.cjs` - Remove empty rows
- `cleanupInputRow2.cjs` - Clean up input logic
- `cleanUpLowValueRows()` - Remove low-quality rows (Apps Script)

### Header Management

- `refreshHeaders()` - Refresh two-tier headers (Apps Script)
- `backupHeadersAndFlatten.cjs` - Backup and flatten headers
- `colorCodeCategoryHeaders.cjs` - Color-code category headers

### API Status

- `checkApiStatus()` - Check OpenAI API status (Apps Script)

---

## 📊 Tool Usage Statistics

### By Phase (Sequential Workflow)

| Phase | Tool Count | Status |
|-------|-----------|--------|
| 1. Source Material Preparation | 3 | ✅ Production |
| 2. Scenario Processing & Generation | 4 | ✅ Production |
| 3. Titles, Summaries & Metadata | 4 | ✅ Production |
| 4. Quality Control & Analysis | 12 | ✅ Production (2 in dev) |
| 5. Image Sync & Media | 1 | ✅ Production |
| 6. Deployment & Distribution | 6 | ✅ Production |
| 7. Monitoring & Analytics | 8 | ✅ Production |
| 8. Advanced Features | 8 | ✅ Production |

**Total Sequential Workflow Tools**: 46 tools

### By Type

| Type | Count | Purpose |
|------|-------|---------|
| Node.js Scripts (`.cjs`) | 152 | Automation, data processing, system maintenance |
| Apps Script Files (`.gs`) | 15 | Google Sheets integration, batch processing |
| HTML Tools (`.html`) | 13 | ECG processing, waveform preview, UI development |
| **Total** | **180** | **Complete medical simulation platform** |

### By Maturity Level

| Status | Count | Description |
|--------|-------|-------------|
| Production-Ready | 160+ | Battle-tested, actively used |
| In Development | 5 | Smart duplicate detection (Phase II.A) |
| Experimental | 10 | Research, proof-of-concept |
| Deprecated | 5 | Superseded by newer tools |

### Most Critical Tools (Top 10)

1. **ECG-to-SVG Converter** (ecg-to-svg-converter.html)
2. **Batch Processing Engine** (Code_ULTIMATE_ATSR.gs)
3. **ATSR Tool** (Code_ULTIMATE_ATSR.gs)
4. **Quality Scoring System** (Code_ULTIMATE_ATSR.gs)
5. **Media URL Uniqueness Check** (checkMediaURLs.cjs, analyzeMediaURLsDetailed.cjs)
6. **Clinical Defaults System** (applyClinicalDefaults_)
7. **Waveform Mapper** (Code_ULTIMATE_ATSR.gs)
8. **Categories & Pathways Panel** (Code_ULTIMATE_ATSR.gs)
9. **Live Sync Server** (liveSyncServer.js)
10. **Interactive Dashboard V2** (interactiveDashboardV2.cjs)

---

## 🚀 Quick Reference: Common Tasks

### Starting a New Batch of Scenarios

```bash
# 1. Import source data (if needed)
node scripts/importEmsimFinal.cjs

# 2. Open Google Sheet, go to: Sim Mastery > Launch Batch / Single
# 3. Select mode: Next 25 Rows / All Remaining / Specific Range
# 4. Click "Launch Batch Engine"
# 5. Monitor progress in sidebar

# 6. After completion, run quality audit
# Google Sheet: Sim Mastery > Run Quality Audit (All / Specific Rows)

# 7. Generate titles and summaries
# Google Sheet: Select row, go to Sim Mastery > ATSR — Titles & Summary
```

### Creating Custom Waveforms

```bash
# 1. Open ECG-to-SVG Converter
open ecg-to-svg-converter.html

# 2. Upload ECG strip image
# 3. Extract black line
# 4. Convert to green SVG
# 5. Crop region with auto-tiling
# 6. Adjust baseline if needed
# 7. Click "AUTO-SAVE: SVG + PNG (Both Formats)"

# 8. Files saved to:
# - /assets/waveforms/svg/{waveform}_ecg.svg
# - /assets/waveforms/png/{waveform}_ecg.png

# 9. Update waveforms registry
npm run migrate-waveforms
```

### Validating System Health

```bash
# 1. Validate vitals JSON
npm run validate-vitals

# 2. System integrity check
npm run validate-system

# 3. Enhanced validation with repair
npm run enhanced-validation

# 4. View analytics dashboard
npm run dashboard-v2
```

### Checking for Duplicates

```bash
# 1. Check media URL uniqueness (primary test)
node scripts/analyzeMediaURLsDetailed.cjs

# 2. Analyze text similarity (secondary test)
node scripts/analyzeDuplicateScenarios.cjs

# 3. View results and recommendations
```

### Backing Up Work

```bash
# 1. Backup scenario metadata
npm run backup-metadata

# 2. Commit to Git
git add .
git commit -m "Your message"
git push origin main

# 3. (Optional) Backup to Google Drive
# Requires re-authorization with Drive write permissions
```

---

## 📚 Documentation References

### Primary Documentation

- **DEVELOPMENT_ROADMAP.md** - Project roadmap and phases
- **BATCH_PROCESSING_SYSTEM.md** - Batch processing documentation
- **SIMULATION_CONVERSION_SYSTEM.md** - System overview
- **MEDIA_URL_UNIQUENESS_CHECK.md** - Duplicate detection methodology
- **SUBSCRIPTION_PLATFORM_REQUIREMENTS.md** - Future subscription platform
- **ADAPTIVE_SALIENCE_ARCHITECTURE.md** - Audio system architecture

### Tool-Specific Docs

- **ECG-to-SVG Converter**: Built-in help in HTML file
- **ATSR Tool**: In-app documentation via Apps Script
- **Quality Scoring**: Documented in Code_ULTIMATE_ATSR.gs
- **Clinical Defaults**: Documented in applyClinicalDefaults_() function

### Git Repository

- **GitHub**: https://github.com/supportersimulator/er-sim-monitor
- **Branch**: main
- **Collaboration**: Claude Code (local) + GPT-5 (architecture) + Aaron (owner)

---

## 🔄 Version History

### Version 1.0 (2025-11-04)
- Initial comprehensive tools inventory
- 180+ tools documented
- Sequential workflow defined
- Tool categories established
- Quick reference guide created

### Future Updates

This document will be updated as:
- New tools are created
- Tools are deprecated or superseded
- Workflow changes
- Phase II.A (Smart Duplicate Detection) is completed
- Phase III (Quality Scoring) is enhanced
- Phase V (Subscription Platform) is implemented

---

## 📞 Support & Collaboration

### Team Roles

- **Aaron Tjomsland** - Project Owner, Creative Director, Medical Expertise
- **Claude Code (Anthropic)** - Lead Implementation Engineer, Local Development
- **GPT-5 (OpenAI)** - Systems Architect, Code Reviewer, Strategic Guidance

### GitHub Sync Protocol

All tools and code are version-controlled through GitHub:
- Claude works locally: `/Users/aarontjomsland/er-sim-monitor`
- Claude handles git operations: `git add . && git commit -m "message" && git push origin main`
- GPT-5 fetches from GitHub for architectural guidance
- All three collaborators stay synchronized via repository

---

**Document Version**: 1.0
**Created**: 2025-11-04
**Status**: Living Document
**Next Review**: After Phase II.A completion
