# ER Simulator Super-Repo Inventory

**Last Updated:** 2025-11-14
**Total Items:** 308 files from Drive + 13 Sheet tabs + 1 local file

---

## 📁 Directory Structure

```
er-simulator-superrepo/
├── docs/                          # Documentation
│   ├── drive-imports/             # Imported from Google Drive
│   │   ├── deployment/            # 12 deployment summaries
│   │   ├── testing/               # 6 testing guides
│   │   ├── technical/             # 7 technical docs (cache fixes)
│   │   ├── tools/                 # 6 tool inventories
│   │   ├── guides/                # 5 README files
│   │   ├── legacy/                # 1 legacy analysis
│   │   └── misc/                  # 1 other doc
│   ├── env-setup.md               # Environment variable guide
│   └── superrepo_inventory.md     # This file
│
├── google-drive-code/             # Current code from Drive
│   ├── sim-builder-production/    # Production Apps Script export
│   │   ├── appsscript.json
│   │   ├── Code.gs
│   │   ├── Ultimate_Categorization_Tool_Complete.gs
│   │   └── _project_metadata.json
│   ├── sim-builder/               # Sim Builder variants
│   │   ├── ER_Simulator_Builder_v3.7.gs
│   │   └── ER_Simulator_Builder_UPDATED.gs
│   ├── atsr-tools/                # 16 ATSR title generation tools
│   ├── apps-script/               # 70 Apps Script files
│   ├── utilities/                 # 37 utility scripts (sync, fetch, etc.)
│   ├── manifests/                 # 2 manifest files
│   └── misc/                      # 18 miscellaneous code files
│
├── legacy-apps-script/            # Legacy/archived code
│   ├── general/                   # 18 archived Apps Script files
│   ├── manifests/                 # 5 legacy manifests
│   ├── misc/                      # 3 miscellaneous legacy files
│   └── atsr-tools/                # 1 legacy ATSR tool
│
├── scenario-csv-raw/              # Raw scenario data
│   └── sheets-exports/            # 13 exported Google Sheets tabs
│       ├── Master_Scenario_Convert.csv (209 rows)
│       ├── Input.csv (211 rows)
│       ├── Field_Cache_Incremental.csv (207 rows)
│       ├── AI_Categorization_Results.csv (208 rows)
│       ├── Batch_Reports.csv (45 rows)
│       ├── Batch_Progress.csv (29 rows)
│       ├── Tools_Workflow_Tracker.csv (49 rows)
│       ├── Pathways_Master.csv (13 rows)
│       ├── Logic_Type_Library.csv (8 rows)
│       ├── Settings.csv (2 rows)
│       ├── Pathway_Analysis_Cache.csv (2 rows)
│       ├── accronym_symptom_system_mapping.csv (43 rows)
│       ├── BACKUP_2Tier_Headers.csv (191 rows)
│       └── _sheets_metadata.json
│
├── scenario-csv-clean/            # Processed scenario data
│   └── (empty - future use)
│
├── simulator-core/                # Live working codebase
│   └── er-sim-monitor/            # React Native + Expo monitor app
│       ├── app/                   # Expo Router screens
│       ├── assets/                # Waveforms, sounds, images
│       ├── components/            # React components (Monitor, etc.)
│       ├── config/                # OAuth tokens, configs
│       ├── constants/             # App constants
│       ├── data/                  # vitals.json and data files
│       ├── docs/                  # Project-specific docs
│       ├── engines/               # Adaptive Salience engine
│       ├── hooks/                 # React hooks
│       ├── scripts/               # Node scripts (sync, deploy, etc.)
│       ├── .env                   # Environment variables (NOT committed)
│       ├── .env.example           # Environment template
│       └── package.json           # Dependencies
│
├── github-external/               # READ-ONLY reference
│   └── er-sim-monitor/            # GitHub clone (reference only)
│       └── (same structure as simulator-core/er-sim-monitor)
│
├── tmp/                           # Temporary files and reports
│   ├── superrepo-backup-before-drive-import.zip (39 MB)
│   ├── drive-inventory.json       # Drive discovery results
│   ├── code-import-report.json    # Code import stats
│   └── docs-import-report.json    # Docs import stats
│
├── scripts/                       # Super-repo level scripts
│   └── discoverDriveFiles.cjs     # Drive discovery script
│
└── .gitignore                     # Git ignore rules
```

---

## 📊 Inventory by Source

### Google Drive (308 files discovered, 209 imported)

| Category | Files | Destination | Confidence |
|----------|-------|-------------|------------|
| **Code Files** | 142 | `google-drive-code/` + `legacy-apps-script/` | High |
| **Apps Script Tools** | 17 | `google-drive-code/atsr-tools/` | High |
| **Sim Builder** | 2 | `google-drive-code/sim-builder/` | High |
| **Apps Script General** | 70 | `google-drive-code/apps-script/` | Medium |
| **Utilities (JS/JSON)** | 37 | `google-drive-code/utilities/` | High |
| **Legacy Code** | 27 | `legacy-apps-script/` | High |
| **Documentation** | 67 | `docs/drive-imports/` + `google-drive-code/utilities/` | High |
| **Google Sheets** | 2 discovered | N/A (exported as CSVs) | High |
| **Folders** | 97 discovered | Used for organization | N/A |

**Note:** 29 files classified as "docs" were actually `.cjs` scripts - moved to `google-drive-code/utilities/`

---

### Google Sheets (13 tabs exported)

| Tab Name | Rows | Purpose | Destination |
|----------|------|---------|-------------|
| **Master_Scenario_Convert** | 209 | Output scenarios (structured JSON) | `scenario-csv-raw/sheets-exports/` |
| **Input** | 211 | Raw input scenarios | `scenario-csv-raw/sheets-exports/` |
| **Field_Cache_Incremental** | 207 | Field caching for batch processing | `scenario-csv-raw/sheets-exports/` |
| **AI_Categorization_Results** | 208 | AI-generated categories | `scenario-csv-raw/sheets-exports/` |
| **Batch_Reports** | 45 | Batch processing reports | `scenario-csv-raw/sheets-exports/` |
| **Batch_Progress** | 29 | Current batch progress | `scenario-csv-raw/sheets-exports/` |
| **Tools_Workflow_Tracker** | 49 | Tool usage tracking | `scenario-csv-raw/sheets-exports/` |
| **Pathways_Master** | 13 | Pathways definitions | `scenario-csv-raw/sheets-exports/` |
| **Logic_Type_Library** | 8 | Logic types library | `scenario-csv-raw/sheets-exports/` |
| **Settings** | 2 | Sheet settings (API keys, etc.) | `scenario-csv-raw/sheets-exports/` |
| **Pathway_Analysis_Cache** | 2 | Pathway analysis cache | `scenario-csv-raw/sheets-exports/` |
| **accronym_symptom_system_mapping** | 43 | Symptom→System mappings | `scenario-csv-raw/sheets-exports/` |
| **BACKUP_2Tier_Headers** | 191 | Header backup | `scenario-csv-raw/sheets-exports/` |

---

### Apps Script API (3 files exported)

From "Sim Builder (Production)" project:

| File | Type | Purpose | Destination |
|------|------|---------|-------------|
| `Code.gs` | SERVER_JS | Main Apps Script code | `google-drive-code/sim-builder-production/` |
| `Ultimate_Categorization_Tool_Complete.gs` | SERVER_JS | Ultimate categorization tool | `google-drive-code/sim-builder-production/` |
| `appsscript.json` | JSON | Project manifest | `google-drive-code/sim-builder-production/` |

---

### Local Filesystem (1 file found)

| File | Location | Destination |
|------|----------|-------------|
| `ER_Simulator_Builder_UPDATED.gs` | `~/Desktop` | `google-drive-code/sim-builder/` |

---

## 🏷️ Classification Summary

### Code Files by Type

| Type | Count | Examples |
|------|-------|----------|
| **Apps Script (.gs)** | ~120 | `Code.gs`, `Ultimate_Categorization_Tool_Complete.gs`, `Phase2_*.gs` |
| **JavaScript (.js/.cjs)** | ~40 | `liveSyncServer.js`, `syncVitalsToSheets.js`, deployment scripts |
| **JSON (manifests)** | ~10 | `appsscript.json`, `BACKUP_METADATA.json`, backup manifests |
| **HTML** | ~5 | `appsscript.html`, `WaveformAdjustmentTool.html` |

### Documentation by Category

| Category | Count | Topics |
|----------|-------|--------|
| **Deployment** | 12 | Deployment summaries, release notes |
| **Testing** | 6 | Testing guides, test results |
| **Technical** | 7 | Cache fixes, implementation details |
| **Tools** | 6 | Tool inventories, workflow docs |
| **Guides** | 5 | README files, user guides |
| **Legacy** | 1 | Legacy code analysis |

---

## 🔍 Key Observations

### Duplicates Found

Many files have multiple versions in Drive:
- `Code.gs` appears 4+ times in different folders
- `Phase2_*.gs` files have multiple copies
- `Ultimate_Categorization_Tool_Complete.gs` duplicated

**Strategy:** All versions preserved in super-repo for safety. Can deduplicate in Phase 10.

### Naming Patterns

**Dated Backups:**
- Pattern: `*_2025-11-##*` or `*_Backup_##-##-####*`
- Automatically sorted into `legacy-apps-script/`

**Feature Flags:**
- Pattern: `Phase2_*`, `TEST_*`, `ATSR_*`, `Code_*`
- Indicates different feature sets or experimental branches

### Missing Items

- ✅ No standalone CSV files in Drive (all in Google Sheets)
- ✅ No Python scripts found
- ✅ No Docker/deployment configs (expected - local dev only)

---

## 📈 Import Statistics

### By Phase

| Phase | Items | Status |
|-------|-------|--------|
| **Phase 0: Backup** | 1 zip (39 MB) | ✅ Complete |
| **Phase 1: Discovery** | 308 files | ✅ Complete |
| **Phase 2: Apps Script Export** | 3 files | ✅ Complete |
| **Phase 3: Sheets Export** | 13 tabs | ✅ Complete |
| **Phase 4: Drive Code Import** | 142 files | ✅ Complete |
| **Phase 5: Drive CSV Import** | 0 files | ⏭️ Skipped (no CSVs) |
| **Phase 6: Drive Docs Import** | 67 files | ✅ Complete |
| **Phase 7: Local Scan** | 1 file | ✅ Complete |
| **Phase 8: Environment Setup** | 2 docs | ✅ Complete |

### Success Rate

- **Total Attempted:** 226 files (142 code + 67 docs + 3 Apps Script + 13 sheets + 1 local)
- **Successfully Imported:** 226 files
- **Failed:** 0 files
- **Success Rate:** 100%

---

## 🎯 Next Steps

See [migration_next_steps.md](migration_next_steps.md) for:
- Deduplication strategy
- Code consolidation plan
- Apps Script → Node.js migration roadmap

---

## 📝 Maintenance

To refresh this inventory:

```bash
cd /Users/aarontjomsland/Documents/er-simulator-superrepo/simulator-core/er-sim-monitor
node scripts/discoverDriveFiles.cjs
```

This will regenerate `tmp/drive-inventory.json` with latest Drive state.
