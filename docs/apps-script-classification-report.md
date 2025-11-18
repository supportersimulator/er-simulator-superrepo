

---

## 8. Phase II Tagging & Classification (Navigator → Hermes)

This section defines **non-destructive tags** for Phase II so Hermes can safely reason about files without moving or deleting anything.

### 8.1 Status Tags

Hermes should treat each Apps Script file as belonging to one of these categories:

- **[PRODUCTION]** – Canonical, protected code currently in use.
- **[SNAPSHOT]** – Imported copy from Drive (for historical reference).
- **[LAB]** – Working copy used by local tools or experiments.
- **[ARCHIVE]** – Historical backup, not expected to run.
- **[EXPERIMENTAL]** – Incomplete or exploratory work; never deployed.

These tags are **conceptual only** in Phase II Step 2 (documentation, reports, and logs) – no file paths change yet.

---

### 8.2 Directory → Tag Mapping (Phase II)

Hermes should apply the following **default tags** when reasoning about directories:

| Directory | Default Tag(s) | Notes |
|-----------|----------------|-------|
| `google-drive-code/sim-builder-production/` | **[PRODUCTION]** | Authoritative working copy from Google Drive (Sim Builder Production). |
| `google-drive-code/apps-script/` | **[SNAPSHOT]** | Drive import snapshots of Apps Script files (historical). |
| `google-drive-code/atsr-tools/` | **[SNAPSHOT] / [EXPERIMENTAL]** | Standalone ATSR tools; production behavior lives inside `Code.gs`. |
| `google-drive-code/sim-builder/` | **[ARCHIVE]** | Older Sim Builder variants. |
| `legacy-apps-script/` | **[ARCHIVE] / [EXPERIMENTAL]** | Time-stamped backups, experiments, and the archived `Code-CURRENT` experiment. |
| `simulator-core/er-sim-monitor/scripts/` | **[LAB]** | Working copies for Node-based manipulation and testing. |
| `simulator-core/er-sim-monitor/apps-script-deployable/` | **[LAB]** | Staging bundles for deployment; not canonical truth. |
| `simulator-core/er-sim-monitor/isolated-tools/` | **[LAB] / [SNAPSHOT]** | Modularized extractions from Apps Script for analysis/refactoring. |
| `simulator-core/er-sim-monitor/backups/` | **[ARCHIVE]** | Local backups of Apps Script states. |
| `simulator-core/er-sim-monitor/temp-*` | **[EXPERIMENTAL] / [ARCHIVE]** | Temporary restore/deploy states; candidates for cleanup later. |

Hermes may refine these tags in future reports (e.g., when a specific file is clearly both [SNAPSHOT] and [ARCHIVE]), but this table is the **Phase II default**.

---

### 8.3 Untouchable Set (Phase II)

The following files are **untouchable in Phase II** unless Aaron explicitly directs otherwise:

- **Sim Builder Production (Apps Script)**
  - `google-drive-code/sim-builder-production/Code.gs`
  - `google-drive-code/sim-builder-production/Ultimate_Categorization_Tool_Complete.gs`
  - `google-drive-code/sim-builder-production/appsscript.json`
  - `google-drive-code/sim-builder-production/_project_metadata.json`

- **Scenario Data Schema (Sheets/CSV)**
  - Logical schema of the Google Sheet `Convert_Master_Sim_CSV_Template_with_Input`.
  - Column structure of `scenario-csv-raw/sheets-exports/Master_Scenario_Convert.csv`.

- **Monitor Core Engines & Runtime Data**
  - `simulator-core/er-sim-monitor/engines/AdaptiveSalienceEngine.js`
  - `simulator-core/er-sim-monitor/engines/SoundManager.js`
  - `simulator-core/er-sim-monitor/data/vitals.json`

Hermes can **reference** these files (for understanding, mapping, and documentation) but must **not modify, move, or delete** them in Phase II.

---

### 8.4 Hermes’ Scope for Phase II Step 2

Within this classification:

- Hermes **may**:
  - Use these tags in future reports (e.g., `apps-script-dedup-log.md`).
  - Cross-reference directory status when recommending deduplication strategies.
  - Suggest future moves (e.g., which [SNAPSHOT] → [ARCHIVE]) verbally or in docs.

- Hermes **may NOT** in Step 2:
  - Change any file locations.
  - Rename files.
  - Delete anything.

All changes in Step 2 are limited to **documentation and classification logic**. Actual file moves/deletions belong to later Phase II steps and require separate approval.
