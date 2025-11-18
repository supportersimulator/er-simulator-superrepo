# Batch Mode Test Plan - All Three Modes

**Date**: 2025-11-01
**Status**: ✅ Ready for Testing
**Version**: 2.0 (All modes implemented)

## Overview

This document provides a comprehensive test plan for all three batch processing modes to ensure they work perfectly with the robust row detection system.

## Prerequisites

- ✅ Output sheet has 12 processed rows (rows 3-14)
- ✅ Input sheet has 41 total rows
- ✅ Next row to process: 15
- ✅ API key valid in Settings!B2
- ✅ All batch mode functions deployed

## Test Mode 1: Next 25 Unprocessed ✅

### Expected Behavior
- Detects next unprocessed row (15)
- Queues 25 rows: [15, 16, 17, ..., 39]
- Processes sequentially
- Auto-closes success toasts
- Stops/resumes correctly

### Test Steps

1. **Refresh Google Sheets** (F5)
2. **Open sidebar** (if not open: Extensions → Apps Script Sidebar)
3. **Select "Next 25 unprocessed"** from Run mode dropdown
4. **Click "Launch Batch Engine"**

### Expected Console Output (Apps Script Logs)
```
🔍 Starting robust row detection (Case_ID comparison method)...
📊 Input sheet last row: 41
📊 Output sheet last row: 14
📊 Output has 12 processed rows
📊 Next unprocessed Input row: 15
✅ Found 25 unprocessed rows
📋 Rows to process: [15, 16, 17, 18, 19...]
✅ Batch queued with 25 row(s)
```

### Expected Sidebar Messages
```
Batch queued. Processing...
Processing row 15 (24 remaining)...
Processing row 16 (23 remaining)...
Processing row 17 (22 remaining)...
...
Processing row 39 (0 remaining)...
✅ All rows processed!
```

### Expected Toast Notifications
```
Row 15: Created. ($2.35)  [auto-closes after 3 seconds]
Row 16: Created. ($2.40)  [auto-closes after 3 seconds]
Row 17: Created. ($2.28)  [auto-closes after 3 seconds]
...
```

### Verification After Test
```bash
node scripts/verifyRowDetection.cjs
```

**Expected Output**:
- Output sheet: 39 total rows (37 processed)
- Next row: 40
- Remaining: 2 rows

### Stop/Resume Test

**During processing** (at row 20):
1. Click **Stop** button
2. Wait for current row to finish
3. Verify sidebar shows "Stopped by user"
4. Click **Launch Batch Engine** again
5. Should resume at row 21 (NOT restart from 15)

**Expected Console**:
```
📊 Output has 17 processed rows  [stopped at row 19]
📊 Next unprocessed Input row: 20
✅ Found 20 unprocessed rows  [20-39]
```

---

## Test Mode 2: All Remaining ✅

### Setup
Reset to known state:
- If you completed Test 1, Output now has 37 rows (3-39)
- Next row should be 40
- Only 2 rows remaining (40-41)

### Expected Behavior
- Detects ALL unprocessed rows (not just 25)
- Queues: [40, 41]
- Processes all remaining in one go

### Test Steps

1. **Refresh Google Sheets** (F5)
2. **Select "All remaining rows"** from Run mode dropdown
3. **Click "Launch Batch Engine"**

### Expected Console Output
```
🔍 Starting detection for ALL remaining rows...
📊 Input sheet last row: 41
📊 Output sheet last row: 39
📊 Output has 37 processed rows
📊 Next unprocessed Input row: 40
✅ Found 2 unprocessed rows (all remaining)
📋 Will process rows 40 through 41
✅ Batch queued with 2 row(s)
```

### Expected Sidebar Messages
```
Batch queued. Processing...
Processing row 40 (1 remaining)...
Processing row 41 (0 remaining)...
✅ All rows processed!
```

### Verification After Test
```bash
node scripts/verifyRowDetection.cjs
```

**Expected Output**:
- Output sheet: 41 total rows (39 processed)
- Next row: 42 (exceeds Input last row)
- Remaining: 0 rows
- Status: **All complete!** ✅

### Edge Case: Run Again When Complete

**Click "Launch Batch Engine" again**:

**Expected Console**:
```
📊 Next unprocessed Input row: 42
✅ Found 0 unprocessed rows (all remaining)
✅ Batch queued with 0 row(s)
```

**Expected Sidebar**:
```
Batch queued. Processing...
✅ All rows processed!  [immediately]
```

---

## Test Mode 3: Specific Rows ✅

### Scenario A: Fresh Specific Rows

**Setup**: Reset to known state with 12 processed (rows 3-14)

### Expected Behavior
- Parses row specification
- Filters out already-processed rows
- Queues only unprocessed rows from spec

### Test Steps

1. **Refresh Google Sheets** (F5)
2. **Select "Specific rows"** from Run mode dropdown
3. **Enter specification**: `15-20`
4. **Click "Launch Batch Engine"**

### Expected Console Output
```
🔍 Starting detection for SPECIFIC rows: 15-20
📊 Already processed rows: 3 through 14 (12 total)
📋 Requested rows: [15, 16, 17, 18, 19, 20]
✅ Will process 6 rows: [15, 16, 17, 18, 19, 20]
✅ Batch queued with 6 row(s)
```

### Expected Sidebar Messages
```
Batch queued. Processing...
Processing row 15 (5 remaining)...
Processing row 16 (4 remaining)...
Processing row 17 (3 remaining)...
Processing row 18 (2 remaining)...
Processing row 19 (1 remaining)...
Processing row 20 (0 remaining)...
✅ All rows processed!
```

### Verification After Test
```bash
node scripts/verifyRowDetection.cjs
```

**Expected Output**:
- Output sheet: 20 total rows (18 processed, rows 3-20)
- Next row: 21

---

### Scenario B: Specific with Some Already Processed

**Setup**: After Scenario A, rows 3-20 are processed

### Test Steps

1. **Refresh Google Sheets** (F5)
2. **Select "Specific rows"** from Run mode dropdown
3. **Enter specification**: `15-25` (some already done)
4. **Click "Launch Batch Engine"**

### Expected Console Output
```
🔍 Starting detection for SPECIFIC rows: 15-25
📊 Already processed rows: 3 through 20 (18 total)
📋 Requested rows: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
⚠️  Skipping already-processed rows: [15, 16, 17, 18, 19, 20]
✅ Will process 5 rows: [21, 22, 23, 24, 25]
✅ Batch queued with 5 row(s)
```

**Key Point**: Automatically skipped rows 15-20 (already processed) ✅

### Expected Sidebar Messages
```
Batch queued. Processing...
Processing row 21 (4 remaining)...
Processing row 22 (3 remaining)...
Processing row 23 (2 remaining)...
Processing row 24 (1 remaining)...
Processing row 25 (0 remaining)...
✅ All rows processed!
```

---

### Scenario C: Mixed Specification Syntax

**Test various syntax options**:

| Spec | Parsed As | Notes |
|------|-----------|-------|
| `15,20,25` | [15, 20, 25] | Individual rows |
| `15-20` | [15, 16, 17, 18, 19, 20] | Range |
| `15-20,25,30-35` | [15, 16, 17, 18, 19, 20, 25, 30, 31, 32, 33, 34, 35] | Mixed |
| `40-41` | [40, 41] | Last two rows |
| `3` | [3] | Single row (already processed, will skip) |

**For each, verify**:
- Console shows correct parsing
- Already-processed rows are skipped
- Only unprocessed rows are queued

---

## Common Issues & Fixes

### Issue 1: Wrong Rows Queued

**Symptom**: Console shows rows 22-26 instead of 15-39

**Fix**:
```bash
node scripts/resetBatchToRow15.cjs
```

Or manually:
1. Extensions → Apps Script
2. Find `clearAllBatchProperties()`
3. Click Run
4. Return to sheet and try again

---

### Issue 2: API Key Error

**Symptom**: `Incorrect API key provided: sk-proj-...`

**Fix**:
1. Check Settings!B2 has valid key (starts with `sk-proj-`)
2. Key should be ~164 characters
3. Must be project API key (not old `sk-` format)

---

### Issue 3: Duplicate Rows in Output

**Symptom**: Same Case_ID appears multiple times

**Check**:
```bash
node scripts/verifyRowDetection.cjs
```

**Expected**: Should show any duplicates

**Why**: New system prevents future duplicates, but existing ones (like TR0002) are from old processing

**Fix for existing duplicates**:
1. Identify correct row (compare data quality)
2. Manually delete duplicate row from Output
3. This shifts row numbers down
4. Re-run batch - system auto-adjusts

---

### Issue 4: Batch Stops Immediately

**Symptom**: Click "Launch", shows "✅ All rows processed!" instantly

**Possible Causes**:
1. All rows already processed (check Output sheet)
2. Input sheet name wrong
3. Output sheet name wrong
4. Row detection found 0 rows

**Debug**:
```bash
node scripts/verifyRowDetection.cjs
```

Shows:
- Current row count
- Next row calculation
- Rows remaining

---

## Performance Expectations

### Processing Time

| Rows | Time (approx) | Rate |
|------|---------------|------|
| 1 row | ~10-15 seconds | Single API call |
| 25 rows | ~6-8 minutes | 1.5s client delay between rows |
| All 39 rows | ~10-15 minutes | Continuous processing |

### API Costs

Based on `Row N: Created. ($X.XX)` messages:
- Average: ~$2.30 per row
- 25 rows: ~$57.50
- All 39 rows: ~$89.70

**Note**: Actual cost varies by scenario complexity (longer prompts cost more)

---

## Success Criteria

### For Each Mode

✅ **Next 25**:
- [ ] Detects correct next row (15)
- [ ] Queues exactly 25 rows
- [ ] Processes sequentially without errors
- [ ] Toast notifications appear and auto-close
- [ ] Stop/resume works correctly
- [ ] After completion, next batch starts at row 40

✅ **All Remaining**:
- [ ] Detects all unprocessed rows
- [ ] Queues ALL (not just 25)
- [ ] Processes entire Input sheet
- [ ] Shows "0 remaining" when complete
- [ ] Running again shows "0 unprocessed rows"

✅ **Specific Rows**:
- [ ] Parses ranges correctly (`15-20`)
- [ ] Parses individual rows (`15,20,25`)
- [ ] Parses mixed syntax (`15-20,25,30-35`)
- [ ] Skips already-processed rows automatically
- [ ] Warns about skipped rows in console
- [ ] Only processes requested unprocessed rows

### Overall System

✅ **Duplicate Prevention**:
- [ ] No duplicate Case_IDs created
- [ ] Row detection always correct
- [ ] Works after stop/resume
- [ ] Based on actual Output count

✅ **Error Handling**:
- [ ] API key errors show clear message
- [ ] Invalid specs show error
- [ ] Network errors don't crash system
- [ ] Can recover from failures

✅ **User Experience**:
- [ ] Clear progress indicators
- [ ] Auto-closing success messages
- [ ] No manual OK clicking needed
- [ ] Easy to stop/resume
- [ ] Accurate remaining count

---

## Final Verification Script

After all tests complete:

```bash
node scripts/verifyRowDetection.cjs
```

**Expected Final State**:
```
Total rows in Output: 41
Next row = 42 (exceeds Input last row 41)
Remaining to process: 0 rows

✅ ALL PROCESSING COMPLETE!
```

---

## Troubleshooting Commands

```bash
# Check current state
node scripts/verifyRowDetection.cjs

# Reset queue if stuck
node scripts/resetBatchToRow15.cjs

# Re-deploy all batch modes
node scripts/implementAllBatchModes.cjs

# Analyze sheet structure
node scripts/findSimulationIdColumn.cjs

# List all sheets
node scripts/listAllSheets.cjs
```

---

**Test Status**: ⏳ Ready to begin
**Next Step**: Execute Test Mode 1 (Next 25 Unprocessed)
**Estimated Total Test Time**: 30-45 minutes (includes all three modes)
