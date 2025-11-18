# Header Flattening Implementation Plan

**Date**: 2025-11-01
**Status**: 📋 Planning Complete, Ready to Execute
**Impact**: MAJOR - Affects entire system architecture

---

## Executive Summary

### Goal
Transform 2-tier header system into single flattened header structure for Django migration compatibility while maintaining human readability.

### Why This Matters
- **Django requirement**: Single-row headers for model field mapping
- **CSV compatibility**: Standard CSV format for data import/export
- **AI processing**: Simpler for programmatic field access
- **Database migration**: Direct column → field mapping

### Approach
Keep a human-readable reference row ABOVE the flattened headers:
```
Row 1: Human labels (Tier 2 - for Aaron's readability)
Row 2: Flattened headers (Tier1_Tier2 - for Django/AI)
Row 3+: Data (unchanged)
```

---

## Current State Analysis

### Current Structure (2-Tier)
```
Row 1: Case_Organization | Case_Organization | Case_Organization | Monitor_Vital_Signs | ...
Row 2: Case_ID          | Spark_Title      | Reveal_Title     | State1_Vitals      | ...
Row 3: GI01234          | Abdominal Pain   | Cholangitis      | {"hr": 95, ...}    | ...
```

**Problems**:
- ❌ Django can't parse 2-tier headers automatically
- ❌ CSV import requires manual header merging
- ❌ Scripts need complex logic to merge tiers
- ❌ Not standard database format

### Proposed Structure (Flattened + Reference)
```
Row 1: Case_ID          | Spark_Title      | Reveal_Title     | State1_Vitals      | ... (Human-readable)
Row 2: Case_Organization_Case_ID | Case_Organization_Spark_Title | Case_Organization_Reveal_Title | Monitor_Vital_Signs_State1_Vitals | ... (Flattened)
Row 3: GI01234          | Abdominal Pain   | Cholangitis      | {"hr": 95, ...}    | ... (Data)
```

**Benefits**:
- ✅ Django reads Row 2 as standard single header
- ✅ Aaron can reference Row 1 for human-friendly names
- ✅ CSV export uses Row 2-onward (standard format)
- ✅ AI systems read Row 2 programmatically
- ✅ Database migration straightforward

---

## Implementation Phases

### Phase 1: Backup & Preparation ✅ READY TO EXECUTE

**Tasks**:
1. Create backup sheet `BACKUP_2Tier_Headers` with full copy
2. Save header mapping to `HEADER_MAPPING.md`
3. Document current column structure

**Script**: `scripts/backupHeadersAndFlatten.cjs`

**Command**:
```bash
node scripts/backupHeadersAndFlatten.cjs
```

**Expected Duration**: 2-3 minutes

**Verification**:
- [ ] Backup sheet created with all data
- [ ] HEADER_MAPPING.md generated
- [ ] Row 1 = Human labels (Tier 2 copy)
- [ ] Row 2 = Flattened headers (Tier1_Tier2)
- [ ] Row 3+ = Data unchanged

---

### Phase 2: Apps Script Updates 🔧 MAJOR REFACTOR

**Affected Functions**:

#### 2.1 Header Caching System
**File**: `Code.gs` (Apps Script)

**Current**:
```javascript
function cacheHeaders(outputSheet) {
  const tier1 = outputSheet.getRange(1, 1, 1, outputSheet.getLastColumn()).getValues()[0];
  const tier2 = outputSheet.getRange(2, 1, 1, outputSheet.getLastColumn()).getValues()[0];

  // Merge tiers
  const headers = tier1.map((t1, idx) => {
    return t1 + ':' + tier2[idx];
  });
}
```

**Updated**:
```javascript
function cacheHeaders(outputSheet) {
  // Row 1 = Human-readable (skip)
  // Row 2 = Flattened headers (use this!)
  const headers = outputSheet.getRange(2, 1, 1, outputSheet.getLastColumn()).getValues()[0];

  // Headers are now flattened, no merging needed
  headerCache = {};
  headers.forEach((h, idx) => {
    headerCache[h] = idx + 1; // Column index (1-based)
  });
}
```

#### 2.2 Writing Scenario Data
**Current**:
```javascript
function writeScenarioToSheet(outputSheet, data) {
  const headers = cacheHeaders(outputSheet);
  const row = [];

  // Map data to columns using 'Tier1:Tier2' format
  row.push(data['Case_Organization:Case_ID']);
  row.push(data['Case_Organization:Spark_Title']);
  // ...
}
```

**Updated**:
```javascript
function writeScenarioToSheet(outputSheet, data) {
  const headers = cacheHeaders(outputSheet);
  const row = [];

  // Map data to columns using 'Tier1_Tier2' format
  row.push(data['Case_Organization_Case_ID']);
  row.push(data['Case_Organization_Spark_Title']);
  // ...
}
```

#### 2.3 OpenAI Response Parsing
**Current**:
```javascript
function parseAIResponse(response) {
  return {
    'Case_Organization:Case_ID': extractField(response, 'Case_ID'),
    'Case_Organization:Spark_Title': extractField(response, 'Spark_Title'),
    // ...
  };
}
```

**Updated**:
```javascript
function parseAIResponse(response) {
  return {
    'Case_Organization_Case_ID': extractField(response, 'Case_ID'),
    'Case_Organization_Spark_Title': extractField(response, 'Spark_Title'),
    // ...
  };
}
```

#### 2.4 Row Detection (Unchanged! ✅)
```javascript
function getAllInputRows_(inputSheet, outputSheet) {
  const outputLast = outputSheet.getLastRow();
  const outputDataRows = Math.max(0, outputLast - 3); // NOW SKIP 2 HEADER ROWS + 1 HUMAN ROW = 3
  const nextInputRow = 3 + outputDataRows;
  // ...
}
```

**Change**: Update from `outputLast - 2` to `outputLast - 3` (account for extra human row)

---

### Phase 3: OpenAI Prompt Updates 🤖 CRITICAL

**Current Prompt Structure**:
```javascript
const systemPrompt = `
You are generating medical scenarios with the following fields:

Case_Organization:Case_ID
Case_Organization:Spark_Title
Case_Organization:Reveal_Title
...
`;
```

**Updated Prompt Structure**:
```javascript
const systemPrompt = `
You are generating medical scenarios with the following fields:

Case_Organization_Case_ID
Case_Organization_Spark_Title
Case_Organization_Reveal_Title
...
`;
```

**Files to Update**:
- `Code.gs` (Apps Script) - Main scenario generation prompt
- Any prompt templates or documentation

**Critical**: OpenAI response parsing MUST match new field names

---

### Phase 4: Import/Export Script Updates 📦

#### 4.1 Import Script (`importEmsimFinal.cjs`)
**Current**:
```javascript
// Reads row 1 (tier1) and row 2 (tier2)
const tier1 = rows[0];
const tier2 = rows[1];
```

**Updated**:
```javascript
// Reads row 1 (human labels - skip), row 2 (flattened headers)
const humanLabels = rows[0]; // For reference only
const headers = rows[1]; // Actual flattened headers
```

#### 4.2 Export/Sync Scripts
- Update any scripts that read/write Master Scenario Convert
- Change header row from `row 2` to `row 2` (but expect flattened format)
- Update header index from `rows.slice(0, 2)` to `rows.slice(0, 2)` (same, but different interpretation)

---

### Phase 5: Verification Scripts 🧪

#### 5.1 New Verification Script
**File**: `scripts/verifyFlattenedHeaders.cjs`

**Purpose**:
- Verify Row 1 = Human labels (Tier 2 copy)
- Verify Row 2 = Flattened headers (Tier1_Tier2 format)
- Check all flattened headers follow pattern
- Verify data starts at Row 3
- Check column count matches

#### 5.2 End-to-End Test
**File**: `scripts/testFlattenedWorkflow.cjs`

**Purpose**:
- Process 1 test scenario end-to-end
- Verify Apps Script reads flattened headers correctly
- Verify OpenAI response maps to flattened fields
- Verify data writes to correct columns
- Compare with backup to ensure no data loss

---

## Detailed Migration Steps

### Step 1: Pre-Migration Checklist ✅

**Before running ANY scripts**:
- [ ] Current batch completed (all 209 rows processed)
- [ ] No pending changes in Apps Script
- [ ] All git changes committed
- [ ] User (Aaron) ready to test new structure

### Step 2: Execute Backup & Flatten

**Run**:
```bash
node scripts/backupHeadersAndFlatten.cjs
```

**Verify**:
1. Open Google Sheets
2. Check new sheet: `BACKUP_2Tier_Headers` exists
3. Check `Master Scenario Convert`:
   - Row 1 = Human labels (e.g., "Case_ID", "Spark_Title")
   - Row 2 = Flattened (e.g., "Case_Organization_Case_ID", "Case_Organization_Spark_Title")
   - Row 3 = First data row (e.g., "GI01234")

**Rollback** (if needed):
```bash
# Manual: Copy BACKUP_2Tier_Headers back to Master Scenario Convert
```

### Step 3: Update Apps Script (CRITICAL)

**Files to modify in Apps Script**:
1. Open `Extensions → Apps Script`
2. Locate all instances of `:` in header references
3. Replace with `_`
4. Update `cacheHeaders()` function
5. Update row detection (`outputLast - 2` → `outputLast - 3`)
6. Update all field name references
7. Save and deploy

**Verification**:
```javascript
// Add temporary logging
Logger.log('Headers: ' + JSON.stringify(headerCache));
// Should show: {"Case_Organization_Case_ID": 1, "Case_Organization_Spark_Title": 2, ...}
```

### Step 4: Update OpenAI Prompts

**Locate prompt in Apps Script**:
```javascript
const systemPrompt = `...`;
```

**Find/Replace**:
- Find: `Case_Organization:` → Replace: `Case_Organization_`
- Find: `Monitor_Vital_Signs:` → Replace: `Monitor_Vital_Signs_`
- (etc. for all tier1 categories)

**Test**:
- Run single scenario conversion
- Check logs for OpenAI response structure
- Verify field names match flattened format

### Step 5: Update Import Scripts

**Files**:
- `scripts/importEmsimFinal.cjs`
- Any other import scripts

**Changes**:
- Update header row references
- Change `:` to `_` in field names
- Update documentation strings

### Step 6: End-to-End Testing

**Test Scenario 1: Single Row Processing**
```bash
# In Google Sheets sidebar:
# - Select "Specific rows"
# - Enter "212" (a new test row)
# - Click "Launch Batch Engine"
```

**Expected**:
- Row processes successfully
- Data appears in Row 213 (after Row 212)
- All columns populated correctly
- No header parsing errors

**Test Scenario 2: Batch Processing**
```bash
# Process 5 test rows
# - Select "Specific rows"
# - Enter "212-216"
# - Click "Launch Batch Engine"
```

**Expected**:
- All 5 rows process
- No errors in execution log
- Data integrity maintained

### Step 7: Verification & Validation

**Run**:
```bash
node scripts/verifyFlattenedHeaders.cjs
node scripts/verifyRowDetection.cjs
```

**Check**:
- [ ] Row 1 = Human labels
- [ ] Row 2 = Flattened headers (all match `Tier1_Tier2` pattern)
- [ ] Row 3+ = Data
- [ ] All 209 existing scenarios preserved
- [ ] Test scenarios processed correctly

---

## Rollback Plan 🔙

### If Something Goes Wrong

**Immediate Rollback**:
1. Open Google Sheets
2. Delete current `Master Scenario Convert` sheet
3. Rename `BACKUP_2Tier_Headers` → `Master Scenario Convert`
4. Revert Apps Script changes (use version history)
5. No data loss (all preserved in backup)

**Apps Script Rollback**:
1. Extensions → Apps Script
2. Click version history (clock icon)
3. Restore to version before flattening changes

---

## Risk Assessment

### HIGH RISK
- ⚠️ **Apps Script errors**: Field name mismatches could break processing
  - **Mitigation**: Thorough testing, backup before execution
- ⚠️ **OpenAI prompt mismatch**: AI might not return correct field names
  - **Mitigation**: Update prompts, test with 1 scenario first
- ⚠️ **Data loss**: Incorrect script could overwrite data
  - **Mitigation**: Full backup in separate sheet before any changes

### MEDIUM RISK
- ⚠️ **Import script failures**: Might not read new structure
  - **Mitigation**: Update and test import scripts separately
- ⚠️ **Header count mismatch**: Off-by-one errors in row counting
  - **Mitigation**: Verification scripts, manual spot checks

### LOW RISK
- ✅ **Data integrity**: Data rows unchanged, only headers modified
- ✅ **Rollback**: Easy to revert using backup sheet
- ✅ **Testing**: Can test with single scenarios before full batch

---

## Success Criteria

### Must Achieve
- [ ] Backup sheet created with all original data
- [ ] Row 1 = Human-readable labels (Tier 2 copy)
- [ ] Row 2 = Flattened headers (Tier1_Tier2 format)
- [ ] All 209 existing scenarios preserved
- [ ] Apps Script processes test scenario successfully
- [ ] OpenAI returns fields in flattened format
- [ ] Single row batch completes without errors

### Nice to Have
- [ ] 5-row test batch completes successfully
- [ ] Import script works with new structure
- [ ] All verification scripts pass
- [ ] Documentation updated with new field names

---

## Timeline Estimate

| Phase | Duration | Complexity |
|-------|----------|------------|
| **Phase 1: Backup & Flatten** | 5 minutes | Low |
| **Phase 2: Apps Script Updates** | 2-3 hours | High |
| **Phase 3: OpenAI Prompt Updates** | 30 minutes | Medium |
| **Phase 4: Import Script Updates** | 1 hour | Medium |
| **Phase 5: Verification Scripts** | 30 minutes | Low |
| **Phase 6: End-to-End Testing** | 1 hour | Medium |
| **Total** | **5-6 hours** | **High** |

**Recommendation**: Allocate full day for implementation and testing

---

## Immediate Next Steps

### Before Starting
1. ✅ Review this plan with Aaron
2. ✅ Confirm batch processing complete (all 209 rows done)
3. ✅ Address duplicate Case_ID issue first (if critical for Django)
4. ✅ Git commit current state

### Execute Phase 1 (Backup)
```bash
# When ready:
node scripts/backupHeadersAndFlatten.cjs
```

### Verify Backup
1. Open Google Sheets
2. Check `BACKUP_2Tier_Headers` sheet exists
3. Check `Master Scenario Convert` has new structure
4. Verify Row 1 = human labels, Row 2 = flattened

### Proceed to Phase 2 (Apps Script)
- Update Apps Script code (see Phase 2 details)
- Test with single scenario
- If successful, proceed to full testing

---

## Questions for Aaron

Before proceeding, please confirm:

1. **Batch complete?** Are all 209 scenarios processed?
2. **Duplicate Case_IDs?** Do we fix these before or after header flattening?
3. **Timing?** Ready to execute now, or wait until specific time?
4. **Testing approach?** Test with fake data first, or use real scenarios?
5. **Rollback comfort?** Comfortable with backup/restore process if needed?

---

**Plan Created By**: Claude Code (Anthropic)
**Plan Date**: 2025-11-01
**Status**: Ready for Review & Execution
**Risk Level**: HIGH (Major refactor, but well-mitigated)
**Recommendation**: Proceed with caution, test thoroughly at each phase
