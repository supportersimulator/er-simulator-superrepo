# Feature-Based Code Testing Guide

**Date:** 2025-11-04
**Test Spreadsheet:** TEST_Convert_Master_Sim_CSV_Template_with_Input
**Status:** Ready for Testing

---

## 🎯 Quick Start

### Test Spreadsheet
**URL:** https://docs.google.com/spreadsheets/d/1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI/edit

### Original Spreadsheet (Reference)
**URL:** https://docs.google.com/spreadsheets/d/1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM/edit

---

## 📋 Pre-Test Checklist

Before testing, verify:
- [ ] Test spreadsheet opens successfully
- [ ] Extensions > Apps Script shows 3 feature files + manifest
- [ ] Original spreadsheet is untouched
- [ ] You have edit permissions on test spreadsheet
- [ ] API key is configured in Settings sheet (if needed)

---

## 🧪 Test 1: ATSR Title Generator Feature

### Purpose
Verify complete ATSR workflow with golden prompts preserved

### Steps

#### 1. Access ATSR Feature
1. Open test spreadsheet
2. Navigate to "Master Scenario Convert" tab
3. Select any row with scenario data (e.g., row 2)
4. Look for ATSR menu item or run button

#### 2. Run ATSR Title Generator
**Expected:**
- Function `runATSRTitleGenerator()` executes
- UI dialog appears with "Sim Mastery ATSR" branding
- Golden prompts trigger AI processing

**What to Check:**
- [ ] Dialog opens without errors
- [ ] "Sim Mastery ATSR — Automated Titles, Summary & Review Generator" title appears
- [ ] Progress indicator shows (if implemented)
- [ ] No console errors (check View > Logs in Apps Script)

#### 3. Verify AI Response
**Expected:**
- AI generates multiple title options
- Summary generated
- Review content generated

**What to Check:**
- [ ] JSON response parsed correctly
- [ ] Multiple title options presented (typically 3-5)
- [ ] Summary text is clinically accurate
- [ ] Review content matches scenario

#### 4. Test Selection Interface
**Expected:**
- UI displays selection controls
- Radio buttons or dropdowns for title selection
- Apply/Cancel buttons functional

**What to Check:**
- [ ] Can select different title options
- [ ] Selection highlights visually
- [ ] Apply button enabled when selection made
- [ ] Cancel button dismisses dialog

#### 5. Apply Selection
**Expected:**
- Selected title written to correct column
- Summary written to correct column
- Review written to correct column
- Memory tracking updates (if implemented)

**What to Check:**
- [ ] Title appears in output column
- [ ] Summary appears in output column
- [ ] Review appears in output column
- [ ] No overwriting of input data
- [ ] Formatting preserved

#### 6. Compare with Original
1. Run same ATSR test on original spreadsheet
2. Compare outputs side-by-side

**What to Check:**
- [ ] Identical functionality
- [ ] Same AI-generated content quality
- [ ] Same column mapping
- [ ] Same formatting

---

## 🧪 Test 2: Batch Processing Sidebar Feature

### Purpose
Verify complete batch processing workflow

### Steps

#### 1. Open Batch Sidebar
1. Look for "Sim Processing" menu
2. Click "Open Sidebar" or similar option
3. Function `openSimSidebar()` should execute

**Expected:**
- Sidebar opens on right side of spreadsheet
- All controls visible (start/stop/refresh)
- Status display shows "Ready" or similar

**What to Check:**
- [ ] Sidebar opens without errors
- [ ] All UI elements render correctly
- [ ] No console errors
- [ ] Controls are clickable

#### 2. Test Single Row Processing
1. Select a single row in Master Scenario Convert tab
2. Click "Process Selected Row" or similar button
3. Watch for processing updates

**Expected:**
- Row processes using `processOneInputRow_()` function
- Vitals validated via `validateVitalsFields_()`
- Clinical defaults applied via `applyClinicalDefaults_()`
- Output written to correct columns

**What to Check:**
- [ ] Single row processes successfully
- [ ] Vitals validation works (rejects invalid data)
- [ ] Clinical defaults fill missing fields
- [ ] Output columns populated
- [ ] Progress indicator updates
- [ ] Logging shows processing steps

#### 3. Test Batch Processing
1. Select multiple rows (e.g., rows 2-5)
2. Click "Process Batch" or similar button
3. Watch batch progress

**Expected:**
- Multiple rows process sequentially
- Progress bar or counter updates
- Each row logged individually
- Batch completes with summary

**What to Check:**
- [ ] All selected rows process
- [ ] Progress updates in real-time
- [ ] Logging shows each row
- [ ] No rows skipped or duplicated
- [ ] Batch completes successfully
- [ ] Summary shows count processed

#### 4. Test Error Handling
1. Select a row with invalid vitals data
2. Process the row

**Expected:**
- Validation catches invalid data
- Error message displays clearly
- Processing stops gracefully
- No partial data written

**What to Check:**
- [ ] Invalid data rejected
- [ ] Clear error message shown
- [ ] No corrupt data written
- [ ] Can continue after error

#### 5. Test Logging Display
**Expected:**
- Logs show in sidebar
- Timestamps included
- Row numbers identified
- Success/error status clear

**What to Check:**
- [ ] Logging updates in real-time
- [ ] Timestamps accurate
- [ ] Row numbers correct
- [ ] Status messages clear
- [ ] Refresh button clears logs

#### 6. Compare with Original
1. Run same batch test on original spreadsheet
2. Compare outputs and behavior

**What to Check:**
- [ ] Identical processing results
- [ ] Same validation behavior
- [ ] Same error handling
- [ ] Same logging format

---

## 🧪 Test 3: Core Processing Engine (Shared Logic)

### Purpose
Verify shared business logic works correctly for both features

### Steps

#### 1. Test `processOneInputRow_()`
**How to Test:**
- Run single row via batch sidebar
- Run ATSR on same row
- Compare results

**What to Check:**
- [ ] Same core processing logic used
- [ ] No duplicate code execution
- [ ] Results consistent between features
- [ ] Performance acceptable (<2 seconds per row)

#### 2. Test `validateVitalsFields_()`
**How to Test:**
Create test rows with:
- Valid vitals data
- Missing required fields
- Invalid data types
- Out-of-range values

**Expected Validation:**
- Heart Rate: 0-300 bpm (warn if <40 or >180)
- SpO2: 0-100% (critical if <85)
- BP: Systolic 40-250, Diastolic 20-150
- Respiratory Rate: 0-60 breaths/min
- Temperature: 32-43°C

**What to Check:**
- [ ] Valid data passes validation
- [ ] Missing fields trigger defaults
- [ ] Invalid types rejected
- [ ] Out-of-range values flagged
- [ ] Warning messages clear

#### 3. Test `applyClinicalDefaults_()`
**How to Test:**
Create test rows with missing vitals fields

**Expected Defaults:**
- Heart Rate: 80 bpm
- SpO2: 98%
- BP: 120/80 mmHg
- Respiratory Rate: 16 breaths/min
- Temperature: 37.0°C
- Waveform: sinus_ecg

**What to Check:**
- [ ] Missing fields filled with defaults
- [ ] Existing data not overwritten
- [ ] Defaults clinically appropriate
- [ ] All required fields populated

#### 4. Test `tryParseJSON()`
**How to Test:**
Process rows with JSON vitals data

**What to Check:**
- [ ] Valid JSON parsed correctly
- [ ] Invalid JSON handled gracefully
- [ ] Error messages clear
- [ ] No crashes on malformed JSON

---

## 🧪 Test 4: Golden Prompts Validation

### Purpose
Verify all AI prompts preserved and functional

### Steps

#### 1. Check ATSR Prompts
**Look for these exact phrases in responses:**
- "Sim Mastery ATSR"
- "Automated Titles, Summary & Review Generator"
- Clinical accuracy requirements
- Specific formatting instructions

**What to Check:**
- [ ] Branding appears in UI
- [ ] AI responses follow prompt structure
- [ ] Titles clinically accurate
- [ ] Summaries comprehensive
- [ ] Reviews educational

#### 2. Check Batch Processing Prompts
**Look for:**
- Vitals validation messages
- Clinical default notifications
- Processing status updates

**What to Check:**
- [ ] Messages match original system
- [ ] Clinical terminology consistent
- [ ] Error messages helpful
- [ ] Success messages clear

#### 3. Compare AI Output Quality
1. Run same scenario on original spreadsheet
2. Run on test spreadsheet
3. Compare AI-generated content

**What to Check:**
- [ ] Same prompt structure
- [ ] Same output quality
- [ ] Same clinical accuracy
- [ ] Same formatting

---

## 🧪 Test 5: Integration Testing

### Purpose
Verify features work together correctly

### Steps

#### 1. ATSR → Batch Processing
1. Run ATSR on a row
2. Then process same row via batch sidebar

**Expected:**
- No conflicts
- Outputs complement each other
- No duplicate processing
- No data corruption

#### 2. Batch Processing → ATSR
1. Process row via batch sidebar
2. Then run ATSR on same row

**Expected:**
- ATSR uses batch-processed data
- No validation errors
- Outputs compatible
- No performance issues

#### 3. Concurrent Operations
1. Start batch processing
2. Try to run ATSR during batch

**Expected:**
- Either queues gracefully OR
- Shows appropriate "busy" message OR
- Allows concurrent operation safely

**What to Check:**
- [ ] No data race conditions
- [ ] No corrupt outputs
- [ ] Clear user feedback
- [ ] System remains stable

---

## 📊 Performance Testing

### Benchmarks to Check

#### ATSR Feature
- [ ] Single title generation: <10 seconds
- [ ] UI response time: <1 second
- [ ] Selection interface: Instant
- [ ] Apply changes: <2 seconds

#### Batch Processing
- [ ] Single row: <2 seconds
- [ ] 10 rows: <20 seconds
- [ ] 50 rows: <2 minutes
- [ ] 100 rows: <5 minutes (with API limits)

#### Core Engine
- [ ] Validation: <100ms per row
- [ ] Clinical defaults: <50ms per row
- [ ] JSON parsing: <10ms per row

---

## 🔍 Error Scenarios to Test

### Test These Deliberately

#### 1. Missing Data
- [ ] Empty input row
- [ ] Missing required vitals
- [ ] Missing scenario description
- [ ] Missing waveform specification

#### 2. Invalid Data
- [ ] Malformed JSON in vitals
- [ ] Non-numeric vital signs
- [ ] Out-of-range values
- [ ] Invalid waveform names

#### 3. API Issues
- [ ] Missing API key
- [ ] Invalid API key
- [ ] Rate limit exceeded
- [ ] Network timeout

#### 4. Permission Issues
- [ ] Read-only access to sheet
- [ ] Protected ranges
- [ ] Locked cells

#### 5. Edge Cases
- [ ] Very long scenario descriptions (>10,000 chars)
- [ ] Special characters in inputs
- [ ] Unicode characters
- [ ] Empty strings vs null values

---

## ✅ Success Criteria

### Feature Parity
- [ ] All original features work in test environment
- [ ] No functionality lost during decomposition
- [ ] Performance equal or better
- [ ] User experience unchanged

### Code Quality
- [ ] No console errors during normal use
- [ ] Clear error messages for user errors
- [ ] Graceful degradation on failures
- [ ] Logs helpful for debugging

### Organization Benefits
- [ ] Easy to identify which feature file to edit
- [ ] Changes to ATSR don't affect batch processing
- [ ] Changes to batch don't affect ATSR
- [ ] Shared logic truly reusable

---

## 📝 Testing Checklist Summary

### Quick Validation (15 minutes)
- [ ] ATSR runs on one row
- [ ] Batch sidebar opens
- [ ] Single row processes
- [ ] No console errors
- [ ] Outputs match original

### Comprehensive Testing (1-2 hours)
- [ ] All ATSR functions tested
- [ ] All batch functions tested
- [ ] Core engine validated
- [ ] Golden prompts verified
- [ ] Performance benchmarked
- [ ] Error scenarios tested
- [ ] Integration validated
- [ ] Documentation verified

---

## 🐛 Issue Reporting Template

If you find issues, document:

```markdown
## Issue: [Short Description]

**Feature Affected:** ATSR / Batch / Core Engine

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**


**Actual Behavior:**


**Console Errors:**
[Paste from View > Logs in Apps Script]

**Screenshot:**
[If applicable]

**Test Spreadsheet Row:**
[Row number that triggered issue]

**Comparison with Original:**
[Does original have same issue?]
```

---

## 🎯 Next Actions After Testing

### If All Tests Pass
1. Document success in testing log
2. Deploy to original spreadsheet
3. Archive monolithic code
4. Update team documentation

### If Issues Found
1. Document each issue using template above
2. Prioritize: Critical / High / Medium / Low
3. Fix in feature files
4. Re-extract and re-deploy
5. Re-test affected features

### Partial Success
1. Document which features work
2. Use working features in production
3. Continue debugging failing features
4. Keep original as fallback

---

## 📞 Support Resources

### Documentation
- [FEATURE_DEPLOYMENT_COMPLETE.md](./FEATURE_DEPLOYMENT_COMPLETE.md) - Deployment summary
- [FINAL_ORGANIZATION_SUMMARY.md](./FINAL_ORGANIZATION_SUMMARY.md) - Organization strategy
- [FEATURE_BASED_ORGANIZATION_STRATEGY.md](./FEATURE_BASED_ORGANIZATION_STRATEGY.md) - Detailed strategy

### Code Locations
- **Test Spreadsheet:** https://docs.google.com/spreadsheets/d/1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI/edit
- **Apps Script Project:** Extensions > Apps Script in test spreadsheet
- **Local Feature Files:** `apps-script-deployable/*.gs`
- **Deployment Scripts:** `scripts/deploy*.cjs`

---

**Status:** Ready for Testing
**Generated:** 2025-11-04
**Project:** ER Simulator Dev - Feature-Based Code Testing
