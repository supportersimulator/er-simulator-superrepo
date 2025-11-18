#!/usr/bin/env node

/**
 * Resume Batch Processing from Checkpoint
 *
 * Intelligently resumes failed batches by:
 * - Reading progress tracker for last batch
 * - Identifying incomplete/failed rows
 * - Retrying only what needs to be done
 * - Preserving all completed work
 *
 * Usage:
 *   node scripts/resumeBatch.cjs [batch-id]
 *   node scripts/resumeBatch.cjs           # Resume most recent batch
 *   node scripts/resumeBatch.cjs batch_123 # Resume specific batch
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const WEB_APP_URL = process.env.WEB_APP_URL;

function loadToken() {
  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  return tokenData;
}

function createSheetsClient() {
  const oauth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  const token = loadToken();
  oauth2Client.setCredentials(token);
  return google.sheets({ version: 'v4', auth: oauth2Client });
}

/**
 * Get progress data for a batch
 */
async function getBatchProgress(sheets, batchId = null) {
  // Read all progress data
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Batch_Progress!A2:O1000'
  });

  const rows = response.data.values || [];

  if (rows.length === 0) {
    return { batch: null, records: [] };
  }

  // If no batch ID specified, find most recent batch
  if (!batchId) {
    const batches = [...new Set(rows.map(r => r[0]))].filter(Boolean);
    batchId = batches[batches.length - 1];
  }

  // Filter records for this batch
  const records = rows
    .filter(row => row[0] === batchId)
    .map((row, idx) => ({
      rowIndex: idx + 2, // +2 for header and 0-indexing
      batchId: row[0],
      rowNumber: parseInt(row[1]),
      caseId: row[2],
      status: row[3],
      startedAt: row[4],
      completedAt: row[5],
      durationSec: parseFloat(row[6]) || 0,
      retryCount: parseInt(row[7]) || 0,
      errorMessage: row[8],
      tokens: parseInt(row[9]) || 0,
      cost: parseFloat(row[10]) || 0,
      vitalsAdded: row[11],
      warnings: row[12],
      lastUpdated: row[13],
      checkpoint: row[14]
    }));

  return {
    batchId,
    records
  };
}

/**
 * Analyze batch status
 */
function analyzeBatch(records) {
  const completed = records.filter(r => r.status === 'COMPLETED').length;
  const failed = records.filter(r => r.status === 'FAILED').length;
  const processing = records.filter(r => r.status === 'PROCESSING').length;
  const pending = records.filter(r => r.status === 'PENDING').length;

  const needsRetry = records.filter(r =>
    r.status === 'FAILED' || r.status === 'PROCESSING' || r.status === 'PENDING'
  );

  const totalTime = records.reduce((sum, r) => sum + r.durationSec, 0);
  const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
  const totalTokens = records.reduce((sum, r) => sum + r.tokens, 0);

  return {
    total: records.length,
    completed,
    failed,
    processing,
    pending,
    needsRetry: needsRetry.map(r => r.rowNumber),
    totalTime,
    totalCost,
    totalTokens
  };
}

/**
 * Resume batch processing
 */
async function resumeBatch(batchId = null) {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('          RESUME BATCH FROM CHECKPOINT');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const sheets = createSheetsClient();

  console.log('📖 Reading batch progress...');
  const { batchId: actualBatchId, records } = await getBatchProgress(sheets, batchId);

  if (!actualBatchId || records.length === 0) {
    console.log('❌ No batch found to resume');
    console.log('');
    console.log('💡 Start a new batch with:');
    console.log('   npm run run-batch-http "4,5,6,7,8"');
    console.log('');
    return;
  }

  console.log(`✅ Found batch: ${actualBatchId}`);
  console.log('');

  const analysis = analyzeBatch(records);

  console.log('📊 BATCH STATUS:');
  console.log('─────────────────────────────────────────────────');
  console.log(`   Total rows: ${analysis.total}`);
  console.log(`   ✅ Completed: ${analysis.completed}`);
  console.log(`   ❌ Failed: ${analysis.failed}`);
  console.log(`   🔄 Processing: ${analysis.processing}`);
  console.log(`   ⏳ Pending: ${analysis.pending}`);
  console.log('');
  console.log(`   ⏱️  Total time: ${Math.round(analysis.totalTime)}s`);
  console.log(`   💰 Total cost: $${analysis.totalCost.toFixed(4)}`);
  console.log(`   🎫 Total tokens: ${analysis.totalTokens.toLocaleString()}`);
  console.log('');

  if (analysis.needsRetry.length === 0) {
    console.log('✅ All rows completed! Nothing to resume.');
    console.log('');
    return;
  }

  console.log('🔄 ROWS TO RETRY:');
  console.log('─────────────────────────────────────────────────');
  const retryRecords = records.filter(r =>
    analysis.needsRetry.includes(r.rowNumber)
  );

  retryRecords.forEach(r => {
    const icon = r.status === 'FAILED' ? '❌' :
                 r.status === 'PROCESSING' ? '🔄' : '⏳';
    console.log(`   ${icon} Row ${r.rowNumber} (${r.caseId || 'Unknown'}): ${r.status}`);
    if (r.errorMessage) {
      console.log(`      Error: ${r.errorMessage.substring(0, 80)}...`);
    }
  });

  console.log('');
  console.log('🚀 Starting retry process...');
  console.log('');

  // Update status to PENDING for retry
  console.log('📝 Resetting status for retry...');

  const updates = retryRecords.map(r => ({
    range: `Batch_Progress!D${r.rowIndex}`,
    values: [['PENDING']]
  }));

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      }
    });
    console.log(`✅ Reset ${updates.length} row(s) to PENDING`);
  }

  console.log('');
  console.log('🔄 Retrying via HTTP batch processor...');
  console.log('');

  // Import and use the HTTP batch runner
  const { runBatchViaHTTP } = require('./runBatchViaHTTP.cjs');

  const rowSpec = analysis.needsRetry.join(',');
  console.log(`Processing rows: ${rowSpec}`);
  console.log('');

  try {
    await runBatchViaHTTP(rowSpec);

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ BATCH RESUME COMPLETE');
    console.log('═══════════════════════════════════════════════════');
    console.log('');

    // Show final status
    const { records: finalRecords } = await getBatchProgress(sheets, actualBatchId);
    const finalAnalysis = analyzeBatch(finalRecords);

    console.log('📊 FINAL STATUS:');
    console.log('─────────────────────────────────────────────────');
    console.log(`   Total rows: ${finalAnalysis.total}`);
    console.log(`   ✅ Completed: ${finalAnalysis.completed}`);
    console.log(`   ❌ Still failed: ${finalAnalysis.failed}`);
    console.log('');

    if (finalAnalysis.failed > 0) {
      console.log('⚠️  Some rows still failed after retry');
      console.log('   Check Batch_Progress sheet for details');
      console.log('   You can run resumeBatch again to retry');
    } else {
      console.log('🎉 All rows completed successfully!');
    }

    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ RESUME FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    console.error('💡 You can try again with:');
    console.error(`   node scripts/resumeBatch.cjs ${actualBatchId}`);
    console.error('');
    throw error;
  }
}

// Command line interface
if (require.main === module) {
  const batchId = process.argv[2];
  resumeBatch(batchId).catch(error => {
    process.exit(1);
  });
}

module.exports = { resumeBatch, getBatchProgress, analyzeBatch };
