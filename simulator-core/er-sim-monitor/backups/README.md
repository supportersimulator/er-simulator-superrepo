# ER Simulator - Backup System

**Last Updated:** 2025-11-03

This directory contains backups of critical tools and code that have required significant development time.

---

## 📂 Directory Structure

```
backups/
├── README.md (this file)
└── tools/
    └── ecg-to-svg-converter/
        └── ecg-to-svg-converter_backup_2025-11-03.html
```

---

## 🛠️ Backed Up Tools

### ECG-to-SVG Converter
**File:** `tools/ecg-to-svg-converter/ecg-to-svg-converter_backup_2025-11-03.html`
**Size:** 130KB
**Date:** November 3, 2025
**Location in Project:** `/ecg-to-svg-converter.html` (root)

**What it does:**
- Converts ECG strip images to medically accurate SVG/PNG waveforms
- Maintains 1:1 pixel preservation (no QRS distortion)
- Auto-tiling with red stitch marks for seamless looping
- Dual independent drag system (bracket slides + waveform panning)
- Vertical-only auto-fit (amplitude scales, horizontal unchanged)
- Real-time baseline adjustment with live preview
- Dual-format export (SVG + PNG simultaneously)

**Why it's backed up:**
This tool required extensive development to achieve perfect medical accuracy. Key features that took significant effort:
- Pixel-perfect waveform extraction
- Complex drag interaction systems
- Auto-tiling algorithm
- Baseline detection and adjustment
- Dual-format export system

**Restoration:**
To restore this tool to the main project:
```bash
cp backups/tools/ecg-to-svg-converter/ecg-to-svg-converter_backup_2025-11-03.html ecg-to-svg-converter.html
```

---

## 🔄 Backup Strategy

### Version Control (Primary)
All backups in this directory are:
- ✅ Tracked in Git
- ✅ Pushed to GitHub (cloud backup)
- ✅ Timestamped for easy version tracking
- ✅ Documented with context

### Cloud Storage (Secondary)
For additional redundancy, critical backups can also be stored in:
- **Google Drive:** `ER Simulator Backups/Tools/`
- **Local Time Machine:** Automatic macOS backups

### When to Create a Backup

Create a new backup when:
1. A tool has required 4+ hours of development time
2. A tool involves complex algorithms or interactions
3. A tool is production-critical (used in workflow)
4. Major refactoring is about to begin
5. Before experimental changes to working code

### Backup Naming Convention

```
{tool-name}_backup_{YYYY-MM-DD}.{extension}
```

Examples:
- `ecg-to-svg-converter_backup_2025-11-03.html`
- `batch-processor_backup_2025-11-03.gs`
- `quality-analyzer_backup_2025-11-03.cjs`

---

## 📋 Backup Scripts

### Automated Backup Creation
```bash
# Create timestamped backup of a file
node scripts/createBackup.cjs [file_path]
```

### Google Drive Upload
```bash
# Upload backup to Google Drive (requires Drive permissions)
node scripts/backupToGoogleDrive.cjs
```

### Backup Verification
```bash
# Verify backups are intact and up-to-date
node scripts/verifyBackups.cjs
```

---

## 🚨 Restoration Procedures

### Emergency Restoration
If a tool is corrupted or accidentally deleted:

1. **Check Git history first:**
   ```bash
   git log -- path/to/file.html
   git checkout [commit_hash] -- path/to/file.html
   ```

2. **Use timestamped backup:**
   ```bash
   cp backups/tools/[tool-name]/[backup-file] [destination]
   ```

3. **Verify restoration:**
   - Open tool in browser
   - Test critical functionality
   - Compare with expected behavior

### Rollback After Failed Changes
```bash
# Restore from backup after experimental changes fail
cp backups/tools/ecg-to-svg-converter/ecg-to-svg-converter_backup_2025-11-03.html ecg-to-svg-converter.html
git diff ecg-to-svg-converter.html  # Review changes
```

---

## 📊 Backup History

### November 3, 2025
- **ECG-to-SVG Converter** (130KB)
  - First backup created
  - All core features working
  - Medical accuracy validated
  - Dual-format export implemented

---

## 🔐 Security & Access

### Git Repository
- **Public Repository:** https://github.com/supportersimulator/er-sim-monitor
- **Access:** Public read, authorized write
- **Branch:** main

### Google Drive
- **Folder:** ER Simulator Backups/Tools
- **Access:** Private (Aaron Tjomsland)
- **Sync:** Manual or scripted

---

## 📝 Maintenance

### Monthly Review
- Verify all backups are current
- Remove outdated backups (keep latest 3 versions)
- Test restoration procedure
- Update documentation

### Before Major Changes
- Create new timestamped backup
- Document what's changing
- Push to Git immediately
- Consider Google Drive sync

---

## 🤝 Team Coordination

**Claude (Lead Implementation):**
- Creates backups during development
- Documents backup context
- Ensures Git commits include backups

**GPT-5 (Systems Architecture):**
- Reviews backup strategy
- Suggests improvements
- Validates restoration procedures

**Aaron (Project Owner):**
- Approves backup policy
- Manages Google Drive storage
- Final authority on restoration

---

## 📖 Related Documentation

- [DEVELOPMENT_ROADMAP.md](../docs/DEVELOPMENT_ROADMAP.md) - Project phases and priorities
- [SIMULATION_CONVERSION_SYSTEM.md](../docs/SIMULATION_CONVERSION_SYSTEM.md) - System overview
- [BATCH_PROCESSING_SYSTEM.md](../docs/BATCH_PROCESSING_SYSTEM.md) - Batch processing docs

---

**Backup System Version:** 1.0
**Last Verified:** 2025-11-03
**Next Review:** 2025-12-03
