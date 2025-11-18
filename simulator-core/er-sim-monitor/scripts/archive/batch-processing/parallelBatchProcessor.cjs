#!/usr/bin/env node

/**
 * Parallel Batch Processor
 *
 * Processes multiple scenarios concurrently for 4x throughput improvement
 * Uses worker pool pattern with smart concurrency control
 *
 * Performance:
 * - Before: Sequential processing (1 row at a time)
 * - After: 4-8 concurrent workers (4-8x throughput)
 * - Rate limit aware: Respects OpenAI API quotas
 *
 * Usage:
 *   node scripts/parallelBatchProcessor.cjs --rows 10-50
 *   node scripts/parallelBatchProcessor.cjs --rows 10-50 --workers 6
 *   node scripts/parallelBatchProcessor.cjs --batch-id batch_123
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const {
  batchReadVitals,
  batchReadCaseContext,
  batchUpdateProgress
} = require('./lib/batchSheetsOps.cjs');

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const APPS_SCRIPT_WEB_APP_URL = process.env.APPS_SCRIPT_WEB_APP_URL;

const args = process.argv.slice(2);

// Parse arguments
const workersArg = args.find(arg => arg.startsWith('--workers'));
const MAX_WORKERS = workersArg ? parseInt(workersArg.split('=')[1]) : 4;

const rowsArg = args.find(arg => arg.startsWith('--rows'));
let rowRange = null;
if (rowsArg) {
  const range = rowsArg.split('=')[1];
  if (range.includes('-')) {
    const [start, end] = range.split('-').map(Number);
    rowRange = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  } else {
    rowRange = range.split(',').map(Number);
  }
}

const batchIdArg = args.find(arg => arg.startsWith('--batch-id'));
const BATCH_ID = batchIdArg ? batchIdArg.split('=')[1] : `batch_${Date.now()}`;

/**
 * Worker pool for concurrent processing
 */
class WorkerPool {
  constructor(maxWorkers = 4) {
    this.maxWorkers = maxWorkers;
    this.activeWorkers = 0;
    this.queue = [];
    this.results = [];
    this.errors = [];
  }

  /**
   * Add task to queue
   */
  async enqueue(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process queue with concurrency control
   */
  async processQueue() {
    while (this.queue.length > 0 && this.activeWorkers < this.maxWorkers) {
      const { task, resolve, reject } = this.queue.shift();
      this.activeWorkers++;

      task()
        .then(result => {
          this.results.push(result);
          resolve(result);
        })
        .catch(error => {
          this.errors.push(error);
          reject(error);
        })
        .finally(() => {
          this.activeWorkers--;
          this.processQueue();
        });
    }
  }

  /**
   * Wait for all tasks to complete
   */
  async drain() {
    while (this.queue.length > 0 || this.activeWorkers > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      completed: this.results.length,
      failed: this.errors.length,
      pending: this.queue.length,
      active: this.activeWorkers
    };
  }
}

/**
 * Process single row via Apps Script Web App
 */
async function processRow(rowNum, caseId, retryCount = 0) {
  const startTime = Date.now();

  try {
    const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'processSingleRow',
        rowNumber: rowNum,
        batchId: BATCH_ID
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.json();
    const duration = (Date.now() - startTime) / 1000;

    return {
      rowNum,
      caseId,
      status: result.success ? 'COMPLETED' : 'FAILED',
      duration,
      retryCount,
      errorMessage: result.error || '',
      openaiTokens: result.tokensUsed || 0,
      costUSD: result.cost || 0,
      vitalsAdded: result.vitalsAdded || 0,
      warnings: result.warnings || ''
    };
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;

    // Retry on rate limit (429) or network errors
    const isRetryable = error.message.includes('429') ||
                       error.message.includes('timeout') ||
                       error.message.includes('ECONNRESET');

    if (isRetryable && retryCount < 3) {
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      console.log(`   ⏱️  Rate limited, retrying after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return processRow(rowNum, caseId, retryCount + 1);
    }

    return {
      rowNum,
      caseId,
      status: 'FAILED',
      duration,
      retryCount,
      errorMessage: error.message,
      openaiTokens: 0,
      costUSD: 0,
      vitalsAdded: 0,
      warnings: ''
    };
  }
}

/**
 * Progress reporter (runs in background)
 */
function startProgressReporter(pool, totalRows) {
  const startTime = Date.now();
  let lastReport = 0;

  const interval = setInterval(() => {
    const stats = pool.getStats();
    const completed = stats.completed + stats.failed;
    const progress = (completed / totalRows * 100).toFixed(1);
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = completed / elapsed;
    const eta = (totalRows - completed) / rate;

    // Report every 5%
    const currentPercent = Math.floor(progress / 5) * 5;
    if (currentPercent > lastReport) {
      console.log(`\n📊 Progress: ${progress}% (${completed}/${totalRows})`);
      console.log(`   ⚡ Rate: ${rate.toFixed(2)} rows/sec`);
      console.log(`   ⏱️  ETA: ${Math.round(eta)}s`);
      console.log(`   ✅ Completed: ${stats.completed}`);
      console.log(`   ❌ Failed: ${stats.failed}`);
      console.log(`   🔄 Active: ${stats.active}`);
      lastReport = currentPercent;
    }
  }, 1000);

  return () => clearInterval(interval);
}

/**
 * Main processing function
 */
async function parallelBatchProcess() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('        PARALLEL BATCH PROCESSOR');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Batch ID: ${BATCH_ID}`);
  console.log(`Max Workers: ${MAX_WORKERS}`);
  console.log('');

  // Determine rows to process
  const rowNumbers = rowRange || Array.from({ length: 10 }, (_, i) => i + 3);

  console.log(`📊 Processing ${rowNumbers.length} rows: ${rowNumbers[0]}-${rowNumbers[rowNumbers.length - 1]}`);
  console.log('');

  // Read case context (needed for logging)
  console.log('📖 Reading case context...');
  const caseData = await batchReadCaseContext(SHEET_ID, rowNumbers);
  console.log(`✅ Read ${caseData.length} cases`);
  console.log('');

  // Initialize worker pool
  const pool = new WorkerPool(MAX_WORKERS);
  console.log(`🔧 Starting ${MAX_WORKERS} parallel workers...`);
  console.log('');

  // Start progress reporter
  const stopReporter = startProgressReporter(pool, rowNumbers.length);

  // Enqueue all tasks
  const startTime = Date.now();
  const tasks = rowNumbers.map((rowNum, idx) => {
    const caseRow = caseData[idx];
    return pool.enqueue(() => processRow(rowNum, caseRow.caseId));
  });

  // Wait for all tasks
  await Promise.allSettled(tasks);
  await pool.drain();

  // Stop progress reporter
  stopReporter();

  const totalTime = (Date.now() - startTime) / 1000;

  // Collect results
  const stats = pool.getStats();
  const results = pool.results;

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ BATCH PROCESSING COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`Total rows: ${rowNumbers.length}`);
  console.log(`Completed: ${stats.completed}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Total time: ${totalTime.toFixed(1)}s`);
  console.log(`Average: ${(totalTime / rowNumbers.length).toFixed(2)}s per row`);
  console.log(`Throughput: ${(rowNumbers.length / totalTime).toFixed(2)} rows/sec`);
  console.log('');

  // Cost analysis
  const totalTokens = results.reduce((sum, r) => sum + (r.openaiTokens || 0), 0);
  const totalCost = results.reduce((sum, r) => sum + (r.costUSD || 0), 0);
  const totalVitalsAdded = results.reduce((sum, r) => sum + (r.vitalsAdded || 0), 0);

  console.log('💰 Cost Summary:');
  console.log(`   Tokens used: ${totalTokens.toLocaleString()}`);
  console.log(`   Total cost: $${totalCost.toFixed(2)}`);
  console.log(`   Avg per row: $${(totalCost / rowNumbers.length).toFixed(4)}`);
  console.log('');

  console.log('📋 Quality Summary:');
  console.log(`   Vitals fields added: ${totalVitalsAdded}`);
  console.log(`   Avg per row: ${(totalVitalsAdded / rowNumbers.length).toFixed(1)}`);
  console.log('');

  // Performance comparison
  const sequentialTime = rowNumbers.length * 90; // ~90s per row sequentially
  const speedup = sequentialTime / totalTime;

  console.log('⚡ Performance vs Sequential:');
  console.log(`   Sequential: ~${Math.round(sequentialTime)}s`);
  console.log(`   Parallel: ${Math.round(totalTime)}s`);
  console.log(`   Speedup: ${speedup.toFixed(1)}x faster`);
  console.log('');

  // Write progress updates (batched)
  if (results.length > 0) {
    console.log('💾 Updating progress tracker...');

    const progressUpdates = results.map(r => ({
      batchId: BATCH_ID,
      rowNum: r.rowNum,
      caseId: r.caseId,
      status: r.status,
      startedAt: new Date(Date.now() - r.duration * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      durationSec: Math.round(r.duration),
      retryCount: r.retryCount,
      errorMessage: r.errorMessage,
      openaiTokens: r.openaiTokens,
      costUSD: r.costUSD.toFixed(4),
      vitalsAdded: r.vitalsAdded,
      warnings: r.warnings,
      lastUpdated: new Date().toISOString(),
      checkpoint: r.status === 'COMPLETED' ? 'DONE' : 'RETRY'
    }));

    await batchUpdateProgress(SHEET_ID, progressUpdates);
    console.log('✅ Progress tracking updated');
    console.log('');
  }

  // Failed rows summary
  if (stats.failed > 0) {
    console.log('❌ Failed Rows:');
    pool.errors.forEach(err => {
      console.log(`   Row ${err.rowNum}: ${err.errorMessage}`);
    });
    console.log('');
    console.log(`💡 Tip: Run "npm run resume-batch ${BATCH_ID}" to retry failed rows`);
    console.log('');
  }
}

if (require.main === module) {
  if (!APPS_SCRIPT_WEB_APP_URL) {
    console.error('');
    console.error('❌ ERROR: APPS_SCRIPT_WEB_APP_URL not set in .env');
    console.error('');
    console.error('Add this to your .env file:');
    console.error('APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec');
    console.error('');
    process.exit(1);
  }

  parallelBatchProcess().catch(error => {
    console.error('');
    console.error('❌ PROCESSING FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { parallelBatchProcess, WorkerPool, processRow };
