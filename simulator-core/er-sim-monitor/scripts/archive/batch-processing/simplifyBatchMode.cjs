#!/usr/bin/env node

/**
 * Simplify Batch Mode - Use Single Row Logic
 *
 * Philosophy: Single row mode WORKS perfectly. Why reinvent the wheel?
 *
 * Current batch mode:
 *   - Stores rowsToProcess: count (just a number)
 *   - Recalculates which row to process each time
 *   - Complex, error-prone
 *
 * New simplified batch mode:
 *   - Stores rows: [3, 4, 5, 6, ...] (actual array)
 *   - Pops one row at a time
 *   - Calls EXACT same code as single mode
 *   - Simple, reliable!
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function simplifyBatchMode() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  SIMPLIFY BATCH MODE - USE SINGLE ROW LOGIC');
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
  const response = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = response.data.files;

  const codeFile = files.find(f => f.name === 'Code');
  let source = codeFile.source;

  console.log('Step 1: Modifying startBatchFromSidebar to store row array...');
  console.log('');

  // Find and replace the queue storage to store actual rows array
  const oldQueuePattern = /setProp\('BATCH_QUEUE',\s*JSON\.stringify\(\{[^}]*rowsToProcess:\s*rows\.length[^}]*\}\)\);/;

  const newQueueSetup = `setProp('BATCH_QUEUE', JSON.stringify({
    inputSheetName,
    outputSheetName: finalOutputName,
    rows: rows, // ⭐ Store actual array of row numbers
    mode: mode,
    spec: spec
  }));`;

  if (oldQueuePattern.test(source)) {
    source = source.replace(oldQueuePattern, newQueueSetup);
    console.log('✅ Modified queue setup to store rows array');
  } else {
    console.log('⚠️  Queue setup pattern not found');
  }

  console.log('');
  console.log('Step 2: Rewriting runSingleStepBatch to use single row logic...');
  console.log('');

  // Find runSingleStepBatch and replace it completely
  const funcStart = source.indexOf('function runSingleStepBatch()');
  if (funcStart === -1) {
    console.log('❌ Could not find runSingleStepBatch function');
    return;
  }

  const funcEnd = source.indexOf('\nfunction ', funcStart + 50);
  const newFunction = `function runSingleStepBatch() {
  Logger.log('🔁 runSingleStepBatch triggered');

  const rawQueue = getProp('BATCH_QUEUE','{}');
  const q = JSON.parse(rawQueue);

  // Check if we have rows left to process
  if (!q.rows || q.rows.length === 0) {
    return { done:true, msg:'✅ All rows processed!' };
  }

  if (getProp('BATCH_STOP','')) {
    return { done:true, msg:'Stopped by user.' };
  }

  const ss = SpreadsheetApp.getActive();
  const inSheet = ss.getSheetByName(q.inputSheetName);
  const outSheet = ss.getSheetByName(q.outputSheetName);

  if (!inSheet || !outSheet) {
    return { done:true, msg:'❌ Sheets missing.' };
  }

  // ⭐ POP the next row from the array (just like single mode gets a specific row!)
  const nextInputRow = q.rows.shift(); // Remove first element
  appendLogSafe(\`📊 Processing Input row \${nextInputRow} (\${q.rows.length} remaining)\`);

  // ⭐ Process this ONE row using EXACT same logic as single mode
  let summary;
  try {
    cacheHeaders(outSheet);
    summary = processOneInputRow_(inSheet, outSheet, nextInputRow, true);
    appendLogSafe('✅ Row ' + nextInputRow + ' processed successfully');
  } catch (err) {
    appendLogSafe('❌ ERROR processing row ' + nextInputRow + ': ' + err.message);
    summary = {
      error: true,
      message: 'Row ' + nextInputRow + ' failed: ' + err.message
    };
  }

  // Update log
  const log = JSON.parse(getProp('BATCH_LOG','{}'));

  if (summary.error) {
    log.errors += 1;
  } else if (summary.skipped || summary.duplicate) {
    log.skipped += summary.skipped?1:0;
    log.dupes   += summary.duplicate?1:0;
  } else {
    log.created += 1;
  }

  setProp('BATCH_LOG', JSON.stringify(log));

  // Save updated queue (with row removed)
  setProp('BATCH_QUEUE', JSON.stringify(q));

  const more = q.rows.length > 0 && !getProp('BATCH_STOP','');

  return {
    done: !more,
    row: nextInputRow,
    msg: summary.message || \`Processed Input row \${nextInputRow}\`,
    remaining: q.rows.length
  };
}`;

  source = source.substring(0, funcStart) + newFunction + source.substring(funcEnd);
  console.log('✅ Completely rewrote runSingleStepBatch');
  console.log('');

  // Upload
  console.log('💾 Uploading simplified batch code...');
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
  console.log('✅ BATCH MODE SIMPLIFIED!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('How it works now:');
  console.log('');
  console.log('1. startBatchFromSidebar():');
  console.log('   - Calculates which rows to process: [3, 4, 5, 6, ...]');
  console.log('   - Stores ACTUAL array in queue');
  console.log('   - No more "rowsToProcess: count"!');
  console.log('');
  console.log('2. runSingleStepBatch():');
  console.log('   - Pops next row from array: rows.shift()');
  console.log('   - Calls processOneInputRow_(inSheet, outSheet, row, true)');
  console.log('   - EXACT same as single mode!');
  console.log('   - Saves updated queue with row removed');
  console.log('');
  console.log('3. Client loopStep():');
  console.log('   - Waits 1.5 seconds');
  console.log('   - Calls runSingleStepBatch() again');
  console.log('   - Repeats until rows array is empty');
  console.log('');
  console.log('Benefits:');
  console.log('  ✅ No row calculations (just pop from array)');
  console.log('  ✅ Uses EXACT same logic as single mode (proven to work!)');
  console.log('  ✅ Simpler, more reliable');
  console.log('  ✅ Easy to debug (just check rows array)');
  console.log('');
}

if (require.main === module) {
  simplifyBatchMode().catch(error => {
    console.error('');
    console.error('❌ SIMPLIFICATION FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { simplifyBatchMode };
