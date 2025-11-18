## Apps Script Production Lineage

**Last Updated:** 2025-11-15  
**Author:** Navigator (with Hermes: Apps Script Gold-Mining)

---

## 1. Purpose

This document defines the **canonical production lineage** for the Google Apps Script components that power the ER Simulator scenario factory.

It answers:
- Which files are **production truth**.
- Which files are **non-production variants, experiments, or snapshots**.
- Where Hermes (Apps Script Gold Miner) is allowed to operate in **Phase II**.

For architectural context, see:
- `docs/system-map.md`
- `docs/apps-script-classification-report.md`
- `docs/code-current-vs-production-comparison.md`

---

## 2. Canonical Production Truth

### 2.1 Sim Builder (Production) – Main Project

**Google Apps Script Project:**
- **Name:** Sim Builder (Production)
- **Script ID:** `12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2`
- **Bound to Sheet:** `Convert_Master_Sim_CSV_Template_with_Input`

**Local export (source of truth in repo):**

| Role | File | Path |
|------|------|------|
| **Main entrypoint (production)** | `Code.gs` | `google-drive-code/sim-builder-production/Code.gs` |
| **Ultimate Categorization Tool (production)** | `Ultimate_Categorization_Tool_Complete.gs` | `google-drive-code/sim-builder-production/Ultimate_Categorization_Tool_Complete.gs` |
| Manifest | `appsscript.json` | `google-drive-code/sim-builder-production/appsscript.json` |
| Metadata | `_project_metadata.json` | `google-drive-code/sim-builder-production/_project_metadata.json` |

These are the **only Apps Script files considered production** for the Sim Builder project in Phase II.

---

### 2.2 Scenario Data Truth

For context, the Apps Script code operates against:

- **Live data hub:**
  - Google Sheet `Convert_Master_Sim_CSV_Template_with_Input` (ID: `1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM`)

- **Local snapshots:**
  - `scenario-csv-raw/sheets-exports/Master_Scenario_Convert.csv`
  - `scenario-csv-raw/sheets-exports/Input.csv`

- **Monitor runtime JSON:**
  - `simulator-core/er-sim-monitor/data/vitals.json`

These are not Apps Script files but are part of the **production data pipeline**.

---

## 3. Non-Production Categories (Phase II)

Every other `.gs` file in the repo is **non-production** in Phase II, and falls into one of the following categories.

### 3.1 Drive Import Snapshots

- **Location:** `google-drive-code/apps-script/`
- **Description:**
  - Imported from Google Drive as part of the super-repo consolidation.
  - Includes many files with names like `Code_COMPLETE_LIGHT.gs`, `Code_FIXED.gs`, `Phase2_*.gs`, `TEST_*.gs`.
- **Status (Phase II):**
  - **Non-production.**
  - Treated as historical snapshots and modularized fragments.

### 3.2 ATSR Tools

- **Location:** `google-drive-code/atsr-tools/`
- **Description:**
  - Standalone ATSR title-generation tools.
  - Variants: `Code_ULTIMATE_ATSR.gs`, `Code_ATSR_Trimmed.gs`, etc.
- **Status (Phase II):**
  - **Non-production** in standalone form.
  - Production ATSR behavior is assumed to be embedded in `sim-builder-production/Code.gs`.

### 3.3 Sim Builder Historical Files

- **Location:** `google-drive-code/sim-builder/`
- **Description:**
  - `ER_Simulator_Builder_v3.7.gs`, `ER_Simulator_Builder_UPDATED.gs`.
- **Status (Phase II):**
  - **Archive only.** Not used in current workflows.

### 3.4 Legacy Apps Script

- **Location:** `legacy-apps-script/`
  - `legacy-apps-script/general/`
  - `legacy-apps-script/atsr-tools/`
  - `legacy-apps-script/misc/`
  - `legacy-apps-script/manifests/`
  - `legacy-apps-script/experimental/`
- **Description:**
  - Time-stamped backups: `production-code-2025-11-06.gs`, `batch-caching-complete-*.gs`, etc.
  - Experiments: `test-with-complete-atsr-2025-11-06.gs`.
  - Archived `Code-CURRENT` experiment (see below).
- **Status (Phase II):**
  - **Archive only** (read-only unless explicitly revived).

### 3.5 Working Lab Copies (Monitor Repo)

- **Locations:**
  - `simulator-core/er-sim-monitor/scripts/`
  - `simulator-core/er-sim-monitor/apps-script-deployable/`
  - `simulator-core/er-sim-monitor/isolated-tools/`
  - `simulator-core/er-sim-monitor/backups/`
  - `simulator-core/er-sim-monitor/temp-*`
- **Description:**
  - These are working copies, deployable bundles, isolated modules, and backups created during development and migration work.
- **Status (Phase II):**
  - **Non-production**, used by Hermes as source material and staging ground, not as canonical truth.

---

## 4. Special Case: Code-CURRENT.gs Experiment

### 4.1 What It Was

- **Original path:** `simulator-core/er-sim-monitor/Code-CURRENT.gs`
- **Now archived as:**
  - `legacy-apps-script/experimental/Code-CURRENT_incomplete-layered-caching-experiment.gs`

### 4.2 Findings

From `docs/code-current-vs-production-comparison.md`:

- Introduced:
  - New menu item: `"✨ Enhanced Categories" → openEnhancedVisualPanel()`
  - New "Cache Management" submenu with 7 layer-specific cache options.
- Missing implementations:
  - `showCacheAllLayersModal`
  - `cacheLayer_basic`
  - `cacheLayer_learning`
  - `cacheLayer_metadata`
  - `cacheLayer_demographics`
  - `cacheLayer_vitals`
  - `cacheLayer_clinical`
  - `cacheLayer_environment`
  - `showCacheStatus`
  - `clearAllCacheLayers`
- **Risk:**
  - If deployed, clicking those menu items would cause runtime errors (functions undefined).

### 4.3 Decision (Phase II)

- **NOT production.**
- Archived as **incomplete experiment**.
- Design idea (7-layer caching) preserved in:
  - `docs/design-layered-caching-concept.md`

---

## 5. Phase II Rules of Engagement (Hermes vs Aaron)

### 5.1 Hermes (Apps Script Gold Miner)

In Phase II, Hermes **may operate** on:

- `google-drive-code/apps-script/` – classify, compare, and later deduplicate.
- `google-drive-code/atsr-tools/` – consolidate ATSR variants.
- `legacy-apps-script/` – organize archives, no deletion without approval.
- `simulator-core/er-sim-monitor/scripts/` – treat as lab copies, not production.
- `simulator-core/er-sim-monitor/apps-script-deployable/` – identify staging vs experiments.
- `simulator-core/er-sim-monitor/backups/` & `temp-*` – group, archive, and eventually propose deletions.

**Hermes may NOT in Phase II without explicit instruction:**

- Modify or overwrite:
  - `google-drive-code/sim-builder-production/Code.gs`
  - `google-drive-code/sim-builder-production/Ultimate_Categorization_Tool_Complete.gs`
- Change the Google Sheet schema (headers, row correspondence).
- Alter `simulator-core/er-sim-monitor/engines/` (adaptive salience) or `data/vitals.json`.

### 5.2 Aaron (Captain)

Aaron:
- Approves which categories of files can be archived or deduplicated.
- Reviews:
  - `docs/apps-script-classification-report.md`
  - `docs/apps-script-production-lineage.md` (this doc)
  - `docs/apps-script-dedup-log.md` (once created)
- Decides when to:
  - Promote any experimental file to production.
  - Initiate destructive actions (deletions) in later Phase II steps.

---

## 6. Summary: What Is Production vs Non-Production

### 6.1 **Production Truth (Apps Script)** ✅

- `google-drive-code/sim-builder-production/Code.gs`
- `google-drive-code/sim-builder-production/Ultimate_Categorization_Tool_Complete.gs`
- `google-drive-code/sim-builder-production/appsscript.json`
- `google-drive-code/sim-builder-production/_project_metadata.json`

### 6.2 **Non-Production (Phase II)** ⚠️

- All `.gs` files in:
  - `google-drive-code/apps-script/`
  - `google-drive-code/atsr-tools/`
  - `google-drive-code/sim-builder/`
  - `legacy-apps-script/`
  - `simulator-core/er-sim-monitor/scripts/`
  - `simulator-core/er-sim-monitor/apps-script-deployable/`
  - `simulator-core/er-sim-monitor/isolated-tools/`
  - `simulator-core/er-sim-monitor/backups/`
  - `simulator-core/er-sim-monitor/temp-*`

These may be:
- Historical backups
- Refactoring experiments
- Feature modules meant to be included in production
- Lab copies used by local tooling

None of them override the production truth until **you explicitly decide to promote them**.

---

## 7. Phase II Checkpoint

This document defines the production lineage for Apps Script in Phase II.

Before moving to Step 2 (non-destructive tagging and classification updates), Aaron should:
- Read this doc.
- Confirm that the files listed as **production truth** match his understanding.
- Confirm that everything else is safe to treat as **non-production** for deduplication and archiving purposes.

Once confirmed, Hermes can proceed with Phase II Step 2 (tagging and classification refinements) under this lineage.
