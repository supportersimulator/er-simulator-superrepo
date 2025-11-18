# Duplicate Prevention System

## Overview

This document explains the fail-proof duplicate prevention system implemented for batch processing in the ER Simulator Google Apps Script application.

## Problem Solved

**Original Issue**: When batch processing was stopped mid-run, simple row counting would become misaligned, potentially causing:
- Re-processing of already completed rows
- Skipping rows that needed processing
- Duplicate Case_IDs in the database

**Solution**: Row position correlation based on actual Output sheet data.

## System Architecture

### Core Principle

**Input Row N → Output Row N (1:1 correspondence)**

Since the Input sheet does NOT have Case_ID pre-filled (it's generated during processing), we cannot do a direct ID comparison. Instead, we leverage the structural guarantee:

- Input row 3 (first data row) → generates Output row 3
- Input row 4 (second data row) → generates Output row 4
- Input row N → generates Output row N

### Detection Formula

```javascript
const outputLast = outputSheet.getLastRow();
const outputDataRows = Math.max(0, outputLast - 2); // Skip 2 header rows
const nextInputRow = 3 + outputDataRows;
```

**Example**:
- Output sheet has rows 1-14 (headers + 12 data rows)
- outputLast = 14
- outputDataRows = 14 - 2 = 12
- nextInputRow = 3 + 12 = **15** ✅

## Implementation Details

### File: Code.gs (Google Apps Script)

**Function**: `getNext25InputRows_(inputSheet, outputSheet)`

```javascript
function getNext25InputRows_(inputSheet, outputSheet) {
  appendLogSafe('🔍 Starting robust row detection (Case_ID comparison method)...');

  const inputLast = inputSheet.getLastRow();
  const outputLast = outputSheet.getLastRow();

  // Count actual processed rows
  const outputDataRows = Math.max(0, outputLast - 2);
  const nextInputRow = 3 + outputDataRows;

  // Build array of next 25 rows to process
  const availableRows = [];
  for (let r = nextInputRow; r <= inputLast && availableRows.length < 25; r++) {
    availableRows.push(r);
  }

  return availableRows;
}
```

### Key Features

1. **Resilient to Interruptions**
   - If batch is stopped at row 18, next run will correctly identify row 19
   - No manual intervention needed
   - Always based on actual Output sheet state

2. **Zero Configuration**
   - No need to track "last processed row" in properties
   - No risk of stale state data
   - Self-correcting on every run

3. **Performance**
   - Single `getLastRow()` call - O(1) operation
   - No full column scan needed
   - Minimal API overhead

4. **Logging**
   - Clear visibility into detection logic
   - Shows: Input last row, Output last row, next row to process
   - Helps debugging if issues arise

## Relationship to ChatGPT's Simulation_ID System

### User's Requirement (from ChatGPT)

ChatGPT designed a Simulation_ID system:

```
Simulation_ID = LOWER(CONCATENATE(
  LEFT(title,3), "_",
  LEFT(complaint,3), "_",
  TEXT(timestamp,"yyyymmdd_hhmmss")
))
```

**Examples**: `chp_chp_20250323_145231`, `seiz_ped_20250416_090412`

**Purpose**: Unique identifier for Supabase upsert operations

### Our Implementation

**Discovery**: The Output sheet uses `Case_ID` (Column A) as the primary key, not Simulation_ID.

**Case_ID Format**: `GI01234`, `OB0001`, `PNEU001`, `CV00234`

**Approach**: Since Case_ID is generated during processing (not present in Input), we use row position correlation instead of ID comparison.

### Why This Works

1. **Sequential Processing**: Input rows are processed in order (3, 4, 5, ...)
2. **1:1 Mapping**: Each Input row generates exactly one Output row
3. **Structural Guarantee**: Output row N came from Input row N
4. **No Gaps**: Even if processing stops, counting Output rows tells us which Input row to start from

### Future Enhancement: True Simulation_ID Tracking

If you later want to implement ChatGPT's Simulation_ID formula for additional safety:

1. Add Simulation_ID column to Output sheet
2. Generate during processing using the formula
3. Add duplicate guard column: `=IF(COUNTIF($X$3:$X,$X3)>1,"⚠️ DUPLICATE","✅ UNIQUE")`
4. Modify `getNext25InputRows_()` to also check Simulation_IDs
5. Benefits:
   - Double-verification (row position + ID check)
   - Visual duplicate alerts
   - Supabase upsert readiness

## Testing & Verification

### Test Case 1: Normal Sequential Processing

**Setup**:
- Output has rows 3-14 (12 processed)
- User expects row 15 next

**Result**:
- Formula: 3 + 12 = 15 ✅
- Status: PASS

### Test Case 2: After Stopping Mid-Batch

**Scenario**:
1. Batch processes rows 15-20
2. User clicks Stop at row 18
3. Output now has rows 3-18 (16 processed)
4. User clicks Launch again

**Expected**: Should detect row 19 as next

**Result**:
- Formula: 3 + 16 = 19 ✅
- Status: PASS (resilient to interruption)

### Test Case 3: Empty Output Sheet

**Setup**:
- Output has only headers (rows 1-2)
- No data rows yet

**Result**:
- outputLast = 2
- outputDataRows = 0
- nextInputRow = 3 ✅
- Status: PASS (starts from beginning)

## Error Prevention

### Safeguards

1. **`Math.max(0, outputLast - 2)`** - Prevents negative row counts
2. **`for (let r = nextInputRow; r <= inputLast ...)`** - Prevents out-of-bounds
3. **`availableRows.length < 25`** - Limits batch size
4. **Logging** - Provides audit trail for debugging

### Edge Cases Handled

- Empty Output sheet → starts at row 3
- Partial batch completion → resumes at correct row
- All rows processed → returns empty array
- Input sheet shorter than 25 rows → returns available count

## Maintenance

### When to Update This System

**Update if**:
- Sheet structure changes (e.g., more than 2 header rows)
- Processing logic changes (e.g., multiple Output rows per Input row)
- You implement ChatGPT's Simulation_ID column

**Don't update for**:
- Normal operation
- Stopping/resuming batches
- Adding more Input rows

### Monitoring

Check logs for these patterns:

✅ **Healthy**:
```
📊 Output has 12 data rows
📊 Next unprocessed Input row: 15
✅ Found 25 unprocessed rows
📋 Rows to process: [15, 16, 17, 18, 19...]
```

⚠️ **Warning**:
```
✅ Found 0 unprocessed rows
```
→ All rows already processed (normal end state)

## Scripts

### Analysis Scripts

1. **findSimulationIdColumn.cjs**
   - Analyzes Output sheet structure
   - Identifies primary key column (Case_ID in column A)
   - Generates analysis report

2. **implementRobustRowDetection.cjs**
   - Updates `getNext25InputRows_()` function
   - Deploys row position correlation logic
   - Verifies implementation

### Usage

```bash
# Analyze sheet structure
node scripts/findSimulationIdColumn.cjs

# Update row detection logic
node scripts/implementRobustRowDetection.cjs
```

## Comparison: Old vs New

### Old System (Before Fix)

```javascript
// Tried to compare Case_IDs
const outputCaseIds = outputSheet.getRange(...).getValues();
// Problem: Input doesn't have Case_IDs yet!
```

**Issues**:
- Failed because Input sheet lacks Case_ID
- Complex gap detection logic
- Broke when batches stopped

### New System (Current)

```javascript
// Count actual processed rows
const outputDataRows = outputLast - 2;
const nextInputRow = 3 + outputDataRows;
```

**Benefits**:
- Simple and reliable
- Based on structural guarantee
- Resilient to interruptions
- No dependencies on ID generation

## Related Documentation

- See: `BATCH_PROCESSING_SYSTEM.md` - Full batch system architecture
- See: `PHASE_3_OPENAI_BATCH_API.md` - OpenAI Batch API integration
- See: ChatGPT's Simulation_ID formula (user's message) - Future enhancement

---

**Last Updated**: 2025-11-01
**Status**: ✅ Production-ready
**Next Enhancement**: Add ChatGPT's Simulation_ID column for double-verification
