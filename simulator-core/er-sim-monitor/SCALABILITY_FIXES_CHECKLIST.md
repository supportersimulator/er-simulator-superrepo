# Batch Processing Scalability - Implementation Checklist

**Date:** November 1, 2025
**Status:** 📋 Action Items for Scaling to 1000+ Scenarios

---

## Phase 1: Critical Stabilization (Day 1-2)

### ✅ Task 1: Add Retry Logic to OpenAI Calls
**Priority:** 🔴 CRITICAL
**Time:** 2 hours
**File:** `/apps-script-backup/Code.gs`

- [ ] Replace `callOpenAI()` function (line 556) with retry wrapper
- [ ] Handle 429 rate limit errors (exponential backoff)
- [ ] Handle 5xx server errors (retry with backoff)
- [ ] Add max retry count (3 attempts recommended)
- [ ] Log retry attempts to console
- [ ] Test with intentional network errors

**Code Location:**
```javascript
// Line 556 in Code.gs
function callOpenAI(promptText, temperature) {
  // REPLACE WITH:
  return callOpenAIWithRetry(promptText, temperature, 3);
}

// ADD NEW FUNCTION:
function callOpenAIWithRetry(promptText, temperature, maxRetries = 3) {
  // Implementation from audit report Section 1.2
}
```

**Test Command:**
```bash
# Test with 5 scenarios
npm run run-batch-http "3,4,5,6,7"
```

---

### ✅ Task 2: Create Progress Tracking Sheet
**Priority:** 🔴 CRITICAL
**Time:** 2 hours
**Files:** `/apps-script-backup/Code.gs`, new sheet

- [ ] Create "Progress_Tracking" sheet with headers:
  - Column A: Row Number
  - Column B: Status (PENDING, IN_PROGRESS, COMPLETED, FAILED)
  - Column C: Case_ID
  - Column D: Started Timestamp
  - Column E: Completed Timestamp
  - Column F: Duration (formula: E - D)
  - Column G: Error Message

- [ ] Add `updateProgress()` function to Code.gs
- [ ] Call `updateProgress()` before processing each row
- [ ] Call `updateProgress()` after completing each row
- [ ] Add error logging on failures

**Code Location:**
```javascript
// ADD TO Code.gs (after line 630)
function ensureProgressTrackingSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName('Progress_Tracking');
  if (!sheet) {
    sheet = ss.insertSheet('Progress_Tracking');
    sheet.getRange('A1:G1').setValues([[
      'Row', 'Status', 'Case_ID', 'Started', 'Completed', 'Duration', 'Error'
    ]]);
  }
  return sheet;
}

function updateProgress_(row, status, caseId, error = null) {
  const sheet = ensureProgressTrackingSheet_();
  const timestamp = new Date();

  sheet.appendRow([
    row,
    status,
    caseId || '',
    status === 'IN_PROGRESS' ? timestamp : '',
    status === 'COMPLETED' || status === 'FAILED' ? timestamp : '',
    '', // Duration calculated by formula
    error || ''
  ]);
}
```

**Test:**
```bash
# Run batch and verify Progress_Tracking sheet populates
npm run run-batch-http "3,4,5"
# Check Progress_Tracking sheet in Google Sheets
```

---

### ✅ Task 3: Implement Checkpoint System
**Priority:** 🔴 CRITICAL
**Time:** 6 hours
**Files:** `/apps-script-backup/Code.gs`, `/scripts/executeBatchDirect.cjs`

- [ ] Create "Checkpoints" sheet with columns:
  - Column A: Batch_ID
  - Column B: Timestamp
  - Column C: Processed_Rows (JSON array)
  - Column D: Remaining_Rows (JSON array)
  - Column E: Failed_Rows (JSON array)
  - Column F: Status (ACTIVE, COMPLETED, ABORTED)

- [ ] Add `saveCheckpoint()` function
- [ ] Save checkpoint every 10 rows
- [ ] Add `resumeFromCheckpoint()` function
- [ ] Update `executeBatchDirect.cjs` to save checkpoints
- [ ] Add resume capability to orchestrator

**Apps Script (Code.gs):**
```javascript
// ADD NEW FUNCTIONS
function ensureCheckpointSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName('Checkpoints');
  if (!sheet) {
    sheet = ss.insertSheet('Checkpoints');
    sheet.getRange('A1:F1').setValues([[
      'Batch_ID', 'Timestamp', 'Processed_Rows', 'Remaining_Rows', 'Failed_Rows', 'Status'
    ]]);
  }
  return sheet;
}

function saveCheckpoint(batchId, processedRows, remainingRows, failedRows) {
  const sheet = ensureCheckpointSheet_();

  // Find existing checkpoint row or create new
  const data = sheet.getDataRange().getValues();
  let checkpointRow = data.findIndex(row => row[0] === batchId && row[5] === 'ACTIVE');

  if (checkpointRow > 0) {
    // Update existing
    sheet.getRange(checkpointRow + 1, 2, 1, 5).setValues([[
      new Date(),
      JSON.stringify(processedRows),
      JSON.stringify(remainingRows),
      JSON.stringify(failedRows),
      'ACTIVE'
    ]]);
  } else {
    // Create new
    sheet.appendRow([
      batchId,
      new Date(),
      JSON.stringify(processedRows),
      JSON.stringify(remainingRows),
      JSON.stringify(failedRows),
      'ACTIVE'
    ]);
  }

  return batchId;
}
```

**Node.js Orchestrator (`executeBatchDirect.cjs`):**
```javascript
// MODIFY processRemainingRows() function (around line 158)
const batchId = process.env.BATCH_ID || require('crypto').randomUUID();
let processedRows = [];
let failedRows = [];

while (hasMore) {
  try {
    const stepResponse = await script.scripts.run({...});

    if (stepResponse.data.error) {
      failedRows.push({ row, error: stepResponse.data.error });
    } else {
      processedRows.push(row);
    }

    // Checkpoint every 10 rows
    if (processedRows.length % 10 === 0) {
      console.log(`💾 Saving checkpoint (${processedRows.length} processed)...`);
      await saveCheckpointToSheet(batchId, processedRows, remainingRows, failedRows);
    }

  } catch (error) {
    console.error('Fatal error:', error.message);
    await saveCheckpointToSheet(batchId, processedRows, remainingRows, failedRows);
    throw new Error(`Batch failed. Resume with: BATCH_ID=${batchId} npm run resume-batch`);
  }
}
```

**Test:**
```bash
# Start batch
npm run run-batch-http "3,4,5,6,7,8,9,10,11,12"

# Kill process mid-way (Ctrl+C after 5 rows)

# Verify Checkpoints sheet has data

# Resume (need to implement resume command)
# npm run resume-batch <batch-id>
```

---

## Phase 2: Optimization (Day 3-5)

### ✅ Task 4: Replace Individual API Calls with Batch Operations
**Priority:** 🟠 HIGH
**Time:** 4 hours
**Files:** `/scripts/addClinicalDefaults.cjs`, `/scripts/validateVitalsJSON.cjs`

- [ ] Replace 3 separate `get()` calls with single `batchGet()`
- [ ] Replace individual `update()` calls with `batchUpdate()`
- [ ] Test with 100 rows
- [ ] Measure API call reduction

**File: `addClinicalDefaults.cjs` (line 268-303)**
```javascript
// REPLACE THIS:
const headerResponse = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: 'Master Scenario Convert!AV1:BF2'
});
const dataResponse = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: 'Master Scenario Convert!A3:BF12'
});
const vitalsDataResponse = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: 'Master Scenario Convert!AV3:BF12'
});

// WITH THIS:
const batchResponse = await sheets.spreadsheets.values.batchGet({
  spreadsheetId: SHEET_ID,
  ranges: [
    'Master Scenario Convert!A1:BF2',    // Headers
    'Master Scenario Convert!A3:BF1002'  // All data (1000 rows)
  ]
});

const [headerRange, dataRange] = batchResponse.data.valueRanges;
const [tier1, tier2] = headerRange.values;
const allData = dataRange.values;
```

**Test:**
```bash
npm run add-clinical-defaults
# Should complete much faster and show reduced API calls in logs
```

---

### ✅ Task 5: Implement OpenAI Prompt Caching
**Priority:** 🟠 HIGH
**Time:** 3 hours
**File:** `/apps-script-backup/Code.gs`

- [ ] Extract system prompt to shared constant
- [ ] Add cache_control parameter to OpenAI requests
- [ ] Measure token usage before/after
- [ ] Document savings

**Code.gs (line 560-570):**
```javascript
// ADD CONSTANT (top of file, around line 40)
const SYSTEM_PROMPT = `You are a world-class simulation scenario writer and exacting data formatter.
Your role is to transform medical case descriptions into structured JSON data for ER simulator training.

CRITICAL REQUIREMENTS:
1. Maintain clinical accuracy
2. Use canonical waveform names (ending in _ecg)
3. Ensure vitals are physiologically plausible
4. Follow exact JSON schema provided
5. Never invent information - use "N/A" if data is missing`;

// MODIFY callOpenAI (line 562)
const payload = {
  model,
  temperature: temperature ?? DEFAULT_TEMP_SINGLE,
  max_tokens: MAX_TOKENS,
  messages: [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' } // ✅ Cache system prompt
    },
    { role: 'user', content: promptText }
  ]
};
```

**Test & Measure:**
```bash
# Process 10 scenarios and check token usage
npm run run-batch-http "3,4,5,6,7,8,9,10,11,12"

# Check cost in Batch_Reports sheet
# Should see ~30% reduction in input token costs
```

---

### ✅ Task 6: Optimize Duplicate Detection
**Priority:** 🟡 MEDIUM
**Time:** 3 hours
**File:** `/apps-script-backup/Code.gs`

- [ ] Build signature Set at batch start
- [ ] Replace linear search with Set.has() (O(1))
- [ ] Test with large dataset
- [ ] Measure performance improvement

**Code.gs (around line 1190):**
```javascript
// ADD GLOBAL CACHE
let SIGNATURE_CACHE = null;

function buildSignatureCache_(sheet) {
  if (SIGNATURE_CACHE !== null) return SIGNATURE_CACHE;

  SIGNATURE_CACHE = new Set();
  const lastRow = sheet.getLastRow();

  if (lastRow < 3) return SIGNATURE_CACHE;

  const statusColIdx = getColumnByName_('Conversion_Status');
  const statusValues = sheet.getRange(3, statusColIdx, lastRow - 2, 1).getValues();

  statusValues.forEach(row => {
    const status = String(row[0]);
    // Extract signature from status string (e.g., "SIG_abc123")
    const match = status.match(/SIG_[0-9a-f]+/);
    if (match) {
      SIGNATURE_CACHE.add(match[0]);
    }
  });

  Logger.log(`Built signature cache: ${SIGNATURE_CACHE.size} entries`);
  return SIGNATURE_CACHE;
}

// REPLACE isDuplicateSignature_ (line 1190)
function isDuplicateSignature_(sheet, signature) {
  const cache = buildSignatureCache_(sheet);
  return cache.has(signature); // ✅ O(1) instead of O(n)
}

// CLEAR CACHE when batch starts
function startBatchFromSidebar(inputSheetName, outputSheetName, mode, spec) {
  SIGNATURE_CACHE = null; // Reset cache for new batch
  // ... rest of function
}
```

**Test:**
```bash
# Run with duplicates
npm run run-batch-http "3,4,5,3,4,5" # Duplicate rows

# Check that duplicates are detected instantly
# Should see "duplicate (hash match)" in logs
```

---

### ✅ Task 7: Add Automated Quality Checks
**Priority:** 🟡 MEDIUM
**Time:** 2 hours
**File:** `/apps-script-backup/Code.gs`

- [ ] Add clinical plausibility validation
- [ ] Check HR range (0-300)
- [ ] Check BP format (sys > dia)
- [ ] Check SpO2 percentage (0-100)
- [ ] Check waveform-vitals consistency
- [ ] Add quality score calculation

**Code.gs (add new function after line 430):**
```javascript
function validateClinicalPlausibility_(vitals, waveform) {
  const errors = [];
  const warnings = [];

  // Heart rate validation
  const hr = vitals.HR || 0;
  if (hr < 0 || hr > 300) {
    errors.push(`Invalid HR: ${hr} (must be 0-300 bpm)`);
  }

  // Arrest rhythm consistency
  const arrestRhythms = ['asystole_ecg', 'vfib_ecg', 'pea_ecg'];
  if (arrestRhythms.includes(waveform)) {
    if (hr > 0) {
      errors.push(`Arrest rhythm ${waveform} should have HR=0, got ${hr}`);
    }
  }

  // Blood pressure validation
  if (vitals.BP) {
    const bpParts = String(vitals.BP).split('/');
    if (bpParts.length === 2) {
      const sys = parseInt(bpParts[0]);
      const dia = parseInt(bpParts[1]);

      if (sys < dia) {
        errors.push(`Invalid BP: ${vitals.BP} (systolic < diastolic)`);
      }
      if (sys < 0 || sys > 300 || dia < 0 || dia > 200) {
        errors.push(`BP out of range: ${vitals.BP}`);
      }
    }
  }

  // SpO2 validation
  const spo2 = vitals.SpO2 || 0;
  if (spo2 < 0 || spo2 > 100) {
    errors.push(`Invalid SpO2: ${spo2} (must be 0-100%)`);
  }

  // Respiratory rate validation
  const rr = vitals.RR || 0;
  if (rr < 0 || rr > 60) {
    warnings.push(`Unusual RR: ${rr} (typical range 0-40 bpm)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// INTEGRATE into processOneInputRow_ (around line 1430)
// After parsing vitals JSON, add:
Object.keys(parsed).forEach(key => {
  if (/vitals/i.test(key)) {
    try {
      const vitals = typeof parsed[key] === 'string'
        ? JSON.parse(parsed[key])
        : parsed[key];

      const waveform = vitals.waveform || 'sinus_ecg';
      const validation = validateClinicalPlausibility_(vitals, waveform);

      if (!validation.valid) {
        Logger.log(`⚠️ ${key} clinical validation failed: ${validation.errors.join('; ')}`);
        appendLogSafe(`⚠️ ${key}: ${validation.errors.join('; ')}`);
      }

      if (validation.warnings.length > 0) {
        Logger.log(`ℹ️ ${key} warnings: ${validation.warnings.join('; ')}`);
      }
    } catch (e) {
      // Skip non-JSON vitals
    }
  }
});
```

**Test:**
```bash
# Manually create a row with invalid vitals (HR=500) in Input sheet
# Run batch processing
npm run run-batch-http "99"

# Should see validation errors in logs
# Scenario should be flagged for review
```

---

## Phase 3: Parallel Processing (Week 2)

### ✅ Task 8: Deploy Web App Endpoint for Parallel Processing
**Priority:** 🟡 MEDIUM
**Time:** 4 hours
**File:** `/apps-script-backup/Code.gs`

- [ ] Add `doPost()` endpoint to handle chunk processing
- [ ] Deploy as web app
- [ ] Get web app URL
- [ ] Update `.env` with WEB_APP_URL
- [ ] Test single chunk via HTTP POST

**Code.gs (add new function):**
```javascript
// ADD WEB APP ENDPOINT
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const { action, chunkId, rows } = payload;

    switch (action) {
      case 'processChunk':
        return ContentService.createTextOutput(
          JSON.stringify(processChunk_(chunkId, rows))
        ).setMimeType(ContentService.MimeType.JSON);

      case 'status':
        return ContentService.createTextOutput(
          JSON.stringify({ status: 'OK', timestamp: new Date() })
        ).setMimeType(ContentService.MimeType.JSON);

      default:
        throw new Error('Unknown action: ' + action);
    }
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function processChunk_(chunkId, rows) {
  const ss = SpreadsheetApp.getActive();
  const inSheet = ss.getSheetByName('Input');
  const outSheet = ss.getSheetByName('Master Scenario Convert');

  const results = {
    chunkId,
    processed: 0,
    failed: 0,
    errors: []
  };

  rows.forEach(row => {
    try {
      const result = processOneInputRow_(inSheet, outSheet, row, true);
      if (result.error) {
        results.failed++;
        results.errors.push({ row, error: result.message });
      } else {
        results.processed++;
      }
    } catch (e) {
      results.failed++;
      results.errors.push({ row, error: e.message });
    }
  });

  return results;
}
```

**Deploy:**
```bash
# Use Apps Script editor
# 1. Save Code.gs
# 2. Deploy → New deployment
# 3. Type: Web app
# 4. Execute as: Me
# 5. Who has access: Anyone
# 6. Deploy
# 7. Copy web app URL

# Add to .env
echo "WEB_APP_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec" >> .env
```

---

### ✅ Task 9: Create Parallel Orchestrator
**Priority:** 🟡 MEDIUM
**Time:** 4 hours
**File:** `/scripts/runBatchParallel.cjs` (NEW FILE)

- [ ] Create partition function (split rows into chunks)
- [ ] Implement parallel fetch to web app
- [ ] Add row-level locking mechanism
- [ ] Handle partial failures gracefully
- [ ] Aggregate results

**Create new file: `/scripts/runBatchParallel.cjs`**
```javascript
#!/usr/bin/env node

const https = require('https');
require('dotenv').config();

const WEB_APP_URL = process.env.WEB_APP_URL;
const CHUNK_SIZE = 100; // Rows per chunk
const MAX_PARALLEL = 10; // Concurrent workers

/**
 * Split rows into chunks for parallel processing
 */
function partitionRows(rows, chunkSize) {
  const chunks = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    chunks.push({
      chunkId: Math.floor(i / chunkSize),
      rows: rows.slice(i, i + chunkSize)
    });
  }
  return chunks;
}

/**
 * Process single chunk via web app
 */
async function processChunk(chunkId, rows) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      action: 'processChunk',
      chunkId,
      rows
    });

    const url = new URL(WEB_APP_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Process all chunks with concurrency limit
 */
async function processBatchParallel(rows, maxParallel = MAX_PARALLEL) {
  console.log(`\\n🚀 PARALLEL BATCH PROCESSING`);
  console.log(`════════════════════════════════════════════════════`);
  console.log(`Total rows: ${rows.length}`);
  console.log(`Chunk size: ${CHUNK_SIZE}`);
  console.log(`Max parallel: ${maxParallel}`);
  console.log(`════════════════════════════════════════════════════\\n`);

  const chunks = partitionRows(rows, CHUNK_SIZE);
  const results = {
    totalProcessed: 0,
    totalFailed: 0,
    chunkResults: []
  };

  // Process chunks with concurrency limit
  for (let i = 0; i < chunks.length; i += maxParallel) {
    const batch = chunks.slice(i, i + maxParallel);

    console.log(`Processing batch ${Math.floor(i / maxParallel) + 1} (${batch.length} chunks)...`);

    const promises = batch.map(chunk =>
      processChunk(chunk.chunkId, chunk.rows)
        .then(result => {
          console.log(`  ✅ Chunk ${chunk.chunkId}: ${result.processed} processed, ${result.failed} failed`);
          return result;
        })
        .catch(error => {
          console.error(`  ❌ Chunk ${chunk.chunkId} failed: ${error.message}`);
          return { chunkId: chunk.chunkId, processed: 0, failed: chunk.rows.length, error: error.message };
        })
    );

    const batchResults = await Promise.all(promises);

    batchResults.forEach(result => {
      results.totalProcessed += result.processed || 0;
      results.totalFailed += result.failed || 0;
      results.chunkResults.push(result);
    });
  }

  console.log(`\\n════════════════════════════════════════════════════`);
  console.log(`✅ BATCH COMPLETE`);
  console.log(`════════════════════════════════════════════════════`);
  console.log(`Total processed: ${results.totalProcessed}`);
  console.log(`Total failed: ${results.totalFailed}`);
  console.log(`Success rate: ${(results.totalProcessed / rows.length * 100).toFixed(1)}%\\n`);

  return results;
}

// Run if called directly
if (require.main === module) {
  // Generate row numbers (e.g., 3-1002 for 1000 scenarios)
  const startRow = parseInt(process.argv[2]) || 3;
  const count = parseInt(process.argv[3]) || 1000;
  const rows = Array.from({ length: count }, (_, i) => startRow + i);

  processBatchParallel(rows, MAX_PARALLEL)
    .then(results => {
      console.log('Full results:', JSON.stringify(results, null, 2));
      process.exit(results.totalFailed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { processBatchParallel };
```

**Add to package.json:**
```json
{
  "scripts": {
    "run-batch-parallel": "node scripts/runBatchParallel.cjs"
  }
}
```

**Test:**
```bash
# Test with 20 rows, 2 parallel chunks
npm run run-batch-parallel 3 20

# Should process 10x faster than sequential
```

---

## Validation & Testing Checklist

### Unit Tests
- [ ] Retry logic handles 429 errors correctly
- [ ] Checkpoint save/resume works after crash
- [ ] Batch API calls reduce quota usage
- [ ] Duplicate detection is O(1)
- [ ] Clinical validation catches invalid vitals

### Integration Tests
- [ ] 10 scenarios complete successfully
- [ ] 50 scenarios complete with <5% failure
- [ ] 100 scenarios complete with <2% failure
- [ ] Resume works after interruption
- [ ] Parallel processing faster than sequential

### Performance Tests
- [ ] 100 scenarios complete in <2 hours
- [ ] Google Sheets API calls <50 for 100 scenarios
- [ ] OpenAI costs within budget
- [ ] Memory usage stable throughout batch

### Quality Tests
- [ ] All processed scenarios have Case_ID
- [ ] All vitals have required fields
- [ ] No clinical implausibilities
- [ ] Quality scores >90 for 95% of scenarios
- [ ] No duplicate Case_IDs

---

## Deployment Checklist

### Pre-Deployment
- [ ] All code changes committed to git
- [ ] Tests passing on dev environment
- [ ] Documentation updated
- [ ] Backup of Google Sheet created
- [ ] Apps Script code backed up

### Deployment Steps
1. [ ] Deploy updated Code.gs to Apps Script
2. [ ] Deploy web app endpoint (if using parallel)
3. [ ] Update .env with new WEB_APP_URL
4. [ ] Test with 5 scenarios on production sheet
5. [ ] Monitor first 50 scenarios closely
6. [ ] Full production run of 1000 scenarios

### Post-Deployment
- [ ] Verify all 1000 scenarios processed
- [ ] Check quality scores
- [ ] Review error logs
- [ ] Calculate actual costs
- [ ] Document lessons learned

---

## Monitoring Dashboard

### Key Metrics to Track
1. **Progress_Tracking Sheet:**
   - Total rows: `=COUNTA(B:B)-1`
   - Completed: `=COUNTIF(B:B,"COMPLETED")`
   - Failed: `=COUNTIF(B:B,"FAILED")`
   - Success rate: `=B2/(B2+B3)*100&"%"`

2. **Performance:**
   - Avg duration: `=AVERAGE(F:F)`
   - Estimated time remaining: `=(B1-B2)*F5`

3. **Costs:**
   - Total API calls (track in PropertiesService)
   - Estimated OpenAI costs (track in Batch_Reports)

### Alerts
- [ ] Email notification if >10 failures
- [ ] Slack notification when batch completes
- [ ] Warning if processing >4 hours

---

## Rollback Plan

### If Something Goes Wrong
1. **Stop Processing:**
   ```bash
   # Kill all running scripts
   killall node
   ```

2. **Assess Damage:**
   - Check Progress_Tracking sheet
   - Identify last successful row
   - Review error logs

3. **Restore from Checkpoint:**
   ```bash
   # Find latest checkpoint
   # Open Checkpoints sheet
   # Note Batch_ID

   # Resume from checkpoint
   BATCH_ID=<batch-id> npm run resume-batch
   ```

4. **Restore from Backup (if needed):**
   - File → Version history → See version history
   - Restore to timestamp before batch started

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Can process 100 scenarios with <5% failure rate
- ✅ Batch resumes successfully after crash
- ✅ All failures automatically retried

### Phase 2 Complete When:
- ✅ Can process 100 scenarios in <2 hours
- ✅ Google Sheets API calls <50
- ✅ OpenAI costs 30% lower than baseline

### Phase 3 Complete When:
- ✅ Can process 1000 scenarios in <3 hours
- ✅ <1% failure rate (<10 failed rows)
- ✅ Zero manual intervention required
- ✅ Full monitoring and dashboards operational

---

## Quick Commands Reference

```bash
# Phase 1 - Critical Fixes
npm run test-batch              # Test basic batch processing
npm run run-batch-http "3,4,5"  # Test with specific rows

# Phase 2 - Optimization
npm run add-clinical-defaults   # Test batch Sheets API
npm run validate-vitals         # Test quality checks

# Phase 3 - Parallel Processing
npm run run-batch-parallel 3 100  # Process 100 rows starting at row 3

# Monitoring
npm run batch-status            # Check current batch status
npm run check-batch-results     # View results summary

# Recovery
npm run resume-batch <batch-id> # Resume failed batch
```

---

**Next Step:** Start with Task 1 (Add Retry Logic) - this is the highest priority fix.
