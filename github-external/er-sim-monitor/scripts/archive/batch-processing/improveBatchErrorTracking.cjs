#!/usr/bin/env node

/**
 * Improve Batch Error Tracking
 *
 * Problem: Report shows "Created: 1, Errors: 1" but no row was actually created
 * This means the summary object is returning { created: true } even when an error occurs
 *
 * Fix:
 * 1. Wrap processOneInputRow_ in better try/catch
 * 2. Ensure summary.created is only true if row was ACTUALLY written
 * 3. Add more detailed error logging
 * 4. Make sure errors don't increment created count
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function improveBatchErrorTracking() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  IMPROVE BATCH ERROR TRACKING');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oauth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oauth2Client });

  console.log('📖 Reading current Apps Script code...');
  const response = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = response.data.files;

  const codeFile = files.find(f => f.name === 'Code');
  if (!codeFile) {
    throw new Error('Could not find Code.gs file');
  }

  let source = codeFile.source;
  console.log('✅ Found Code.gs');
  console.log('');

  // Fix the runSingleStepBatch logging to better track errors
  console.log('🔄 Improving error tracking in runSingleStepBatch...');

  const oldBatchStep = `  // Process this ONE row
  const summary = processOneInputRow_(inSheet, outSheet, nextInputRow, true);

  // Update log
  const log = JSON.parse(getProp('BATCH_LOG','{}'));
  log.created += summary.created?1:0;
  log.skipped += summary.skipped?1:0;
  log.dupes   += summary.duplicate?1:0;
  log.errors  += summary.error?1:0;
  setProp('BATCH_LOG', JSON.stringify(log));`;

  const newBatchStep = `  // Process this ONE row
  let summary;
  try {
    summary = processOneInputRow_(inSheet, outSheet, nextInputRow, true);
    Logger.log('✅ Row ' + nextInputRow + ' processed: ' + JSON.stringify(summary));
  } catch (err) {
    Logger.log('❌ ERROR processing row ' + nextInputRow + ': ' + err.message);
    Logger.log('Stack: ' + err.stack);
    summary = {
      error: true,
      message: 'Row ' + nextInputRow + ' failed: ' + err.message,
      errorDetails: err.toString()
    };
  }

  // Update log - ONLY increment created if truly created (not error, not skipped)
  const log = JSON.parse(getProp('BATCH_LOG','{}'));

  if (summary.error) {
    log.errors += 1;
  } else if (summary.skipped || summary.duplicate) {
    log.skipped += summary.skipped?1:0;
    log.dupes   += summary.duplicate?1:0;
  } else {
    // Only count as created if no error AND not skipped
    log.created += 1;
  }

  setProp('BATCH_LOG', JSON.stringify(log));
  Logger.log('📊 Batch log updated: ' + JSON.stringify(log));`;

  if (source.indexOf(oldBatchStep) === -1) {
    console.log('⚠️  Could not find exact match for batch processing code');
    console.log('Trying alternative approach...');

    // Try to find the section by looking for the distinctive pattern
    const altPattern = /const summary = processOneInputRow_\(inSheet, outSheet, nextInputRow, true\);[\s\S]*?setProp\('BATCH_LOG', JSON\.stringify\(log\)\);/;

    if (altPattern.test(source)) {
      source = source.replace(altPattern, newBatchStep);
      console.log('✅ Updated batch error tracking (alternative method)');
    } else {
      throw new Error('Could not find batch processing code section to update');
    }
  } else {
    source = source.replace(oldBatchStep, newBatchStep);
    console.log('✅ Updated batch error tracking');
  }
  console.log('');

  // Upload
  console.log('💾 Uploading improved error tracking...');
  const updatedFiles = files.map(f => {
    if (f.name === 'Code') {
      return { ...f, source };
    }
    return f;
  });

  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: updatedFiles }
  });

  console.log('✅ Code updated successfully!');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ ERROR TRACKING IMPROVED');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Improvements:');
  console.log('1. Added try/catch around processOneInputRow_');
  console.log('2. Log full error message and stack trace');
  console.log('3. Only count as "created" if NO error occurred');
  console.log('4. Better distinction between error/skipped/created');
  console.log('5. Log the batch counters after each update');
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh your Google Sheets tab');
  console.log('2. Open sidebar');
  console.log('3. Try batch again');
  console.log('4. Check Apps Script logs for detailed error info');
  console.log('');
}

if (require.main === module) {
  improveBatchErrorTracking().catch(error => {
    console.error('');
    console.error('❌ IMPROVEMENT FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { improveBatchErrorTracking };
