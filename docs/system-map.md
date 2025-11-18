## ER Simulator System Map

**Last Updated:** 2025-11-14

---

## **1. Ecosystem Overview**

The ER Simulator project is a **two-sided system**:

- **Authoring & Enrichment (Factory):**
  - Google Sheets + Google Apps Script batch engine.
  - Responsibility: turn messy clinical/narrative inputs into structured, scored, categorized simulation scenarios.

- **Delivery & Experience (Monitor):**
  - React Native + Expo vitals monitor app.
  - Responsibility: render vitals, waveforms, audio salience, and narrative hooks to the learner in real time.

Planned future state adds a **Platform Layer** between them (Django + DB + dashboards).

```text
Raw Scenario Ideas
    ↓
Google Sheets + Apps Script (Sim Builder)
    ↓
Structured Scenarios (CSV / JSON)
    ↓
React Native Vitals Monitor (Expo)
    ↓
Learner Experience (audio, visuals, narrative)
    ↓
[Future] Django/DB/Next.js/AWS Platform
```

---

## **2. Directory-Level System Map**

### **2.1 `docs/` – Governance & Mental Models**

- **Purpose:** Single place for architecture, inventories, roadmaps and operational notes.
- **Key files:**
  - `architecture_overview.md` – overall architecture + data flows.
  - `superrepo_inventory.md` – directory tree + asset classification.
  - `migration_next_steps.md` – Phase II–V migration plan.
  - `env-setup.md` – environment + secrets guidance.
  - `sheets-notes.md` – Sheets tab structure and sync flows.
  - `sim-builder-production-notes.md` – Apps Script production project map.
  - `drive-imports/` – imported deployment, testing, tools, and cache-system notes.

**System Role:** Source of truth for how everything fits together and where to work next.

---

### **2.2 `simulator-core/er-sim-monitor/` – Runtime + Integration Hub**

- **Purpose:** Main working codebase for the vitals monitor and its integration tooling.
- **Sub-areas:**
  - `app/` – Expo Router screens (tabs, modals, navigation shell).
  - `components/` – Monitor UI, waveform components, themed layout.
  - `engines/` – core logic engines:
    - `AdaptiveSalienceEngine.js`
    - `SoundManager.js`
  - `hooks/` – React hooks (e.g., `useAdaptiveSalience`).
  - `data/` – `vitals.json` and supporting JSON fixtures.
  - `assets/` – sounds, waveforms, images (monitor-facing).
  - `scripts/` – Node-based tooling for:
    - Google Sheets sync (fetch, push, live sync).
    - Apps Script deployment, backup and refactoring.
    - Batch processing orchestration and diagnostics.
  - `docs/` – project-specific docs (adaptive salience, tool rollouts, etc.).

**System Role:**
- Vitals monitor runtime.
- Integration hub between Sheets/Apps Script and local JSON.
- Lab environment for Apps Script code evolution and testing.

---

### **2.3 `google-drive-code/` – Apps Script Code Mine**

- **Purpose:** Consolidated source for Apps Script projects imported from Google Drive.
- **Sub-areas:**
  - `sim-builder-production/`
    - `Code.gs` – production Sim Builder entry point.
    - `Ultimate_Categorization_Tool_Complete.gs` – full categorization UI and logic.
    - `appsscript.json`, `_project_metadata.json` – manifest and metadata.
  - `apps-script/` – modularized and experimental `.gs` files:
    - Multiple `Code_*.gs` variants.
    - Feature modules: `Phase2_Enhanced_Categories_With_AI.gs`, `Phase2_Pathway_Discovery_UI.gs`, `Header_Caching.gs`, `Logging_Utilities.gs`, etc.
  - `atsr-tools/` – specialized title-generation / ATSR tools.
  - `utilities/` – Node/JS helpers and tooling (sync, backups, manifests, tests).
  - `manifests/` – DECOMPOSITION and REFINED manifests for earlier extraction work.

**System Role:**
- Authoring-side logic for batch conversion, AI enrichment, categorization, pathways and scoring.
- Raw material for future Node/Django migrations.

---

### **2.4 `legacy-apps-script/` – Archive & Time Machine**

- **Purpose:** Safely store older generations of Apps Script and manifests.
- **Sub-areas:**
  - `general/` – earlier main Apps Script files.
  - `atsr-tools/` – legacy ATSR variants.
  - `manifests/`, `misc/` – old backup metadata and snapshots.

**System Role:** Historical reference and recovery source; should not be used as active code.

---

### **2.5 `scenario-csv-raw/` and `scenario-csv-clean/` – Scenario Data Layers**

- **`scenario-csv-raw/sheets-exports/`:**
  - 13 CSV exports corresponding to the Google Sheet tabs.
  - **Core tabs:** `Input.csv`, `Master_Scenario_Convert.csv`, `Settings.csv`.
  - **Cache/report tabs:** `Field_Cache_Incremental.csv`, `Pathway_Analysis_Cache.csv`, `Batch_Progress.csv`, `Batch_Reports.csv`.
  - **Reference tabs:** `Pathways_Master.csv`, `Logic_Type_Library.csv`, `accronym_symptom_system_mapping.csv`, `BACKUP_2Tier_Headers.csv`.

- **`scenario-csv-clean/`:**
  - Empty, reserved for future processed/normalized data (e.g., DB-ready exports).

**System Role:**
- `scenario-csv-raw/` is a filesystem snapshot of the live Sheets-based data hub.
- `scenario-csv-clean/` will become the staging ground for DB migrations and analytics.

---

### **2.6 `github-external/er-sim-monitor/` – Read-Only Reference Clone**

- **Purpose:** Local mirror of the GitHub `er-sim-monitor` repository.
- Mirrors structure of `simulator-core/er-sim-monitor/` but is explicitly documented as read-only.

**System Role:**
- Reference point for diffs and historical context.
- Safety net if `simulator-core/` experiments go wrong.

---

### **2.7 `scripts/` and `tmp/` – Super-Repo Tooling & Telemetry**

- **`scripts/`:**
  - `discoverDriveFiles.cjs` – scans Google Drive, classifies and inventories code/docs.

- **`tmp/`:**
  - `drive-inventory.json`, `code-import-report.json`, `docs-import-report.json` – machine-generated reports.
  - `superrepo-backup-before-drive-import.zip` – pre-import safety backup.

**System Role:**
- Support for the initial consolidation and future large-scale refactors.

---

## **3. Data Flow Map (Current State)**

### **3.1 Scenario Creation & Enrichment Flow**

```text
1. Authoring (Human + AI)
   - User writes scenarios in the Google Sheet (Input tab).
   - Apps Script Sim Builder project runs batch processing.

2. Batch Engine (Apps Script + OpenAI)
   - Validates inputs.
   - Calls OpenAI (via HTTP) for parsing/enrichment.
   - Generates ATSR titles and summaries.
   - Applies categories and pathways.
   - Scores quality and writes results to Master Scenario Convert tab.

3. Sheet Snapshots (Local CSV)
   - `exportGoogleSheets.cjs` exports all 13 tabs → `scenario-csv-raw/sheets-exports/*.csv`.

4. Monitor Data Generation (Node in er-sim-monitor)
   - `fetchVitalsFromSheetsOAuth.js` reads Master Scenario Convert directly from Sheets.
   - Extracts vitals JSON and scenario metadata.
   - Writes aggregated `data/vitals.json` for the React Native app.

5. Monitor Runtime (React Native + Expo)
   - Monitor components read `vitals.json`.
   - Adaptive Salience Engine and SoundManager respond to vitals and thresholds.
   - Learner sees vitals, waveforms and hears context-aware audio.
```

---

## **4. Planned Platform Map (Future State)**

### **4.1 Target Multi-Layer Architecture**

```text
LAYER 1 – Authoring Factory
- Google Sheets + Apps Script (or Node replacement)
- Responsibility: convert messy text → structured, pedagogical scenarios.

LAYER 2 – Scenario Platform (Backend)
- Django REST API + PostgreSQL (RDS or Supabase) + background workers.
- Responsibility: store, version, and serve scenarios; orchestrate batch jobs.

LAYER 3 – Experiences
- React Native monitor (this repo).
- Next.js instructor dashboard.
- Future modalities (web-based learners, VR/AR, voice-heavy flows).
```

### **4.2 Where This Repo Fits**

- **Today:**
  - Contains almost all of Layer 1 (Apps Script logic) and Layer 3 (monitor), plus tooling that imitates Layer 2 behavior via scripts.

- **Tomorrow:**
  - Layer 1 logic gradually migrates out of Apps Script into Node/TypeScript libraries.
  - Layer 2 is introduced as a Django backend / DB.
  - Layer 3 (monitor) pivots to consume scenarios and vitals from APIs, not directly from Sheets.

---

## **5. Single Source of Truth Summary**

- **Live Monitor Code:** `simulator-core/er-sim-monitor/`
- **GitHub Reference Clone:** `github-external/er-sim-monitor/`
- **Production Apps Script Export:** `google-drive-code/sim-builder-production/`
- **Apps Script Variants & Utilities:** `google-drive-code/apps-script/`, `google-drive-code/atsr-tools/`, `google-drive-code/utilities/`
- **Legacy Apps Script:** `legacy-apps-script/`
- **Scenario Data Snapshot:** `scenario-csv-raw/sheets-exports/`
- **Future Clean Data:** `scenario-csv-clean/` (empty placeholder)
- **Governance & Docs:** `docs/`

This system map is intended as a **high-level navigation aid**: when deciding where to work, first identify whether the task lives in the **authoring factory**, the **monitor runtime**, or the future **platform layer**, then follow the directory map above.
