# Pre-AWS Migration Backup
**Created:** 2025-11-03T05:24:08
**Status:** ✅ 100% IDEAL STATE

## Structure
```
pre-aws-migration/
├── data/           # All spreadsheet data backups
├── scripts/        # Apps Script code snapshots
├── manifests/      # Backup metadata & checksums
└── README.md       # This file
```

## Files

### Data Backups (`data/`)
- `full-backup-2025-11-03T05-24-08.json` (2.4 MB)
  - Complete spreadsheet: 191 rows, 596 columns
  - All headers, formulas, and raw data

- `vitals-only-2025-11-03T05-24-08.json` (56 KB)
  - Isolated vitals records: 189 cases
  - Quick reference for vitals restoration

### Apps Scripts (`scripts/`)
- `Code_ULTIMATE_ATSR.gs-2025-11-03T05-24-08` (131 KB)
  - Ultimate ATSR with batch processing
  - Includes all AI generation functions

- `Code_WITH_CATEGORIES_LIGHT.gs-2025-11-03T05-24-08` (122 KB)
  - Light version with category management
  - Standalone mode support

### Metadata (`manifests/`)
- `backup-manifest-2025-11-03T05-24-08.json` (1 KB)
  - Backup metadata and checksums
  - Data quality verification results

## Data Quality
✅ All 189 vitals records validated
✅ All vitals use lowercase keys
✅ All BP values are objects {sys, dia}
✅ All waveforms valid (registry compliance)
✅ Medical accuracy verified (asystole null spo2)

## Restore Instructions
See: `/Users/aarontjomsland/er-sim-monitor/docs/PRE_AWS_MIGRATION_BACKUP.md`

## Upload to Google Drive
1. Open Google Drive
2. Create folder: "ER Sim Backups"
3. Drag & drop entire `pre-aws-migration/` folder

---
**Backup Script:** `/Users/aarontjomsland/er-sim-monitor/scripts/createLocalBackup.cjs`
