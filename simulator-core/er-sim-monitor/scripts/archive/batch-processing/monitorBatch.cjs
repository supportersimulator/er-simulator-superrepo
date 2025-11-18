#!/usr/bin/env node

/**
 * OpenAI Batch Monitor
 *
 * Monitor and manage OpenAI batch jobs
 *
 * Usage:
 *   node scripts/monitorBatch.cjs list
 *   node scripts/monitorBatch.cjs status <batch_id>
 *   node scripts/monitorBatch.cjs cancel <batch_id>
 *   node scripts/monitorBatch.cjs download <batch_id>
 */

require('dotenv').config();

const {
  listBatches,
  getBatchStatus,
  cancelBatch,
  downloadBatchResults
} = require('./lib/openAIBatchAPI.cjs');

const command = process.argv[2];
const batchId = process.argv[3];

/**
 * List all batches
 */
async function listAllBatches() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('           OPENAI BATCH JOBS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const response = await listBatches(20);

  if (!response.data || response.data.length === 0) {
    console.log('No batch jobs found.');
    console.log('');
    return;
  }

  response.data.forEach((batch, idx) => {
    console.log(`${idx + 1}. Batch ID: ${batch.id}`);
    console.log(`   Status: ${batch.status}`);
    console.log(`   Created: ${new Date(batch.created_at * 1000).toISOString()}`);

    if (batch.request_counts) {
      console.log(`   Progress: ${batch.request_counts.completed}/${batch.request_counts.total}`);
      if (batch.request_counts.failed > 0) {
        console.log(`   Failed: ${batch.request_counts.failed}`);
      }
    }

    if (batch.metadata && Object.keys(batch.metadata).length > 0) {
      console.log(`   Metadata: ${JSON.stringify(batch.metadata)}`);
    }

    console.log('');
  });
}

/**
 * Show batch status
 */
async function showBatchStatus() {
  if (!batchId) {
    console.error('Error: Batch ID required');
    console.error('Usage: node scripts/monitorBatch.cjs status <batch_id>');
    process.exit(1);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`         BATCH STATUS: ${batchId}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const batch = await getBatchStatus(batchId);

  console.log(`Status: ${batch.status}`);
  console.log(`Endpoint: ${batch.endpoint}`);
  console.log(`Created: ${new Date(batch.created_at * 1000).toLocaleString()}`);

  if (batch.in_progress_at) {
    console.log(`Started: ${new Date(batch.in_progress_at * 1000).toLocaleString()}`);
  }

  if (batch.completed_at) {
    console.log(`Completed: ${new Date(batch.completed_at * 1000).toLocaleString()}`);

    const duration = batch.completed_at - (batch.in_progress_at || batch.created_at);
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    console.log(`Duration: ${hours}h ${minutes}m`);
  }

  console.log('');
  console.log('Request Counts:');
  console.log(`  Total: ${batch.request_counts?.total || 0}`);
  console.log(`  Completed: ${batch.request_counts?.completed || 0}`);
  console.log(`  Failed: ${batch.request_counts?.failed || 0}`);

  if (batch.request_counts?.total > 0) {
    const progress = ((batch.request_counts.completed / batch.request_counts.total) * 100).toFixed(1);
    console.log(`  Progress: ${progress}%`);
  }

  console.log('');

  if (batch.output_file_id) {
    console.log(`Output File: ${batch.output_file_id}`);
    console.log(`Download: node scripts/monitorBatch.cjs download ${batchId}`);
    console.log('');
  }

  if (batch.error_file_id) {
    console.log(`⚠️  Error File: ${batch.error_file_id}`);
    console.log('');
  }

  if (batch.errors && batch.errors.data && batch.errors.data.length > 0) {
    console.log('Errors:');
    batch.errors.data.forEach((error, idx) => {
      console.log(`  ${idx + 1}. ${error.message}`);
    });
    console.log('');
  }

  if (batch.metadata && Object.keys(batch.metadata).length > 0) {
    console.log('Metadata:');
    Object.entries(batch.metadata).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('');
  }
}

/**
 * Cancel batch
 */
async function cancelBatchJob() {
  if (!batchId) {
    console.error('Error: Batch ID required');
    console.error('Usage: node scripts/monitorBatch.cjs cancel <batch_id>');
    process.exit(1);
  }

  console.log('');
  console.log(`⚠️  Cancelling batch: ${batchId}`);
  console.log('');

  const result = await cancelBatch(batchId);

  console.log(`✅ Batch cancelled`);
  console.log(`   Status: ${result.status}`);
  console.log('');
}

/**
 * Download batch results
 */
async function downloadResults() {
  if (!batchId) {
    console.error('Error: Batch ID required');
    console.error('Usage: node scripts/monitorBatch.cjs download <batch_id>');
    process.exit(1);
  }

  console.log('');
  console.log('📥 Downloading batch results...');
  console.log('');

  const batch = await getBatchStatus(batchId);

  if (batch.status !== 'completed') {
    console.error(`Error: Batch is ${batch.status}, not completed`);
    process.exit(1);
  }

  if (!batch.output_file_id) {
    console.error('Error: No output file available');
    process.exit(1);
  }

  const outputPath = `./temp/batch_${batchId}_results.json`;
  const results = await downloadBatchResults(batch.output_file_id, outputPath);

  console.log(`✅ Downloaded ${results.length} results`);
  console.log(`   Saved to: ${outputPath}`);
  console.log('');

  // Summary
  const successful = results.filter(r => !r.error).length;
  const failed = results.filter(r => r.error).length;

  console.log('Summary:');
  console.log(`  Total: ${results.length}`);
  console.log(`  Successful: ${successful}`);
  console.log(`  Failed: ${failed}`);
  console.log('');
}

/**
 * Main
 */
async function main() {
  try {
    switch (command) {
      case 'list':
        await listAllBatches();
        break;

      case 'status':
        await showBatchStatus();
        break;

      case 'cancel':
        await cancelBatchJob();
        break;

      case 'download':
        await downloadResults();
        break;

      default:
        console.log('OpenAI Batch Monitor');
        console.log('');
        console.log('Usage:');
        console.log('  node scripts/monitorBatch.cjs list');
        console.log('  node scripts/monitorBatch.cjs status <batch_id>');
        console.log('  node scripts/monitorBatch.cjs cancel <batch_id>');
        console.log('  node scripts/monitorBatch.cjs download <batch_id>');
        console.log('');
        process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error('❌ ERROR');
    console.error('════════════════════════════════════════════════════');
    console.error(`${error.message}`);
    console.error('');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
