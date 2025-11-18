# Quick Start - Batch Processing from Row 15

## ⚡ TL;DR

1. **Refresh Google Sheets** (F5)
2. **Select "Next 25 unprocessed"** in dropdown
3. **Click "Launch Batch Engine"**
4. ✅ System will process rows 15-39 with **zero chance of duplicates**

---

## 📊 Current Status

- ✅ Output has 12 processed rows (3-14)
- ✅ Next row to process: **15**
- ✅ Remaining rows: 27 (will take 2 batches)

---

## 🛡️ Duplicate Prevention Active

The system now uses **robust row detection**:
```
Next row = 3 + (number of Output data rows)
         = 3 + 12
         = 15
```

**This means**:
- ✅ Stop/resume batches anytime
- ✅ No duplicates possible
- ✅ No skipped rows
- ✅ Always picks up where it left off

---

## 🚨 If Something Goes Wrong

### Error: "No rows to process"
**Fix**: Verify Output sheet hasn't been modified. Run:
```bash
node scripts/verifyRowDetection.cjs
```

### Error: "Incorrect API key"
**Fix**: Check Settings!B2 has valid API key starting with `sk-proj-`

### Batch shows wrong rows
**Fix**: Run the manual clear:
1. Extensions → Apps Script
2. Find `clearAllBatchProperties()`
3. Click Run
4. Return to sheet and try again

---

## 📈 Progress Tracking

### Batch 1 (Current)
- Rows: 15-39 (25 rows)
- After completion: 37 total processed

### Batch 2 (Final)
- Rows: 40-41 (2 rows)
- After completion: 39 total processed ✅ DONE

---

## 🔍 Verification Scripts

```bash
# Check current state
node scripts/verifyRowDetection.cjs

# Reset queue (if needed)
node scripts/resetBatchToRow15.cjs

# Find sheet structure
node scripts/findSimulationIdColumn.cjs
```

---

## 📞 Support

If batch processing fails:
1. Check [BATCH_RESET_SUMMARY.md](BATCH_RESET_SUMMARY.md) for detailed status
2. Review [DUPLICATE_PREVENTION_SYSTEM.md](docs/DUPLICATE_PREVENTION_SYSTEM.md) for how it works
3. Run verification scripts to diagnose

---

**Ready? Go to Google Sheets and click "Launch Batch Engine"!** 🚀
