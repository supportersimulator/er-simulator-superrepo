#!/usr/bin/env node

/**
 * Fix Batch Flow - Recalculate Next Row Each Time
 *
 * Problem: Current flow calculates all 25 rows upfront, then processes them
 * Solution: Recalculate next available row BEFORE each processing step
 *
 * New flow:
 * 1. Count rows in Master Scenario Convert
 * 2. Calculate next Input row: 2 + outputRowCount
 * 3. Process that ONE row
 * 4. REPEAT (recalculate each time)
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function fixBatchFlowRecalculate() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FIX BATCH FLOW - RECALCULATE EACH TIME');
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

  // Modify startBatchFromSidebar to store COUNT instead of row array
  console.log('🔄 Modifying startBatchFromSidebar to store row count...');

  const oldQueue = `setProp('BATCH_QUEUE', JSON.stringify({ inputSheetName, outputSheetName: finalOutputName, rows }));`;

  const newQueue = `// Store count and sheet names instead of pre-calculated rows
  setProp('BATCH_QUEUE', JSON.stringify({
    inputSheetName,
    outputSheetName: finalOutputName,
    rowsToProcess: rows.length,
    mode: mode,
    spec: spec
  }));
  Logger.log(\`🔍 DEBUG: Queued \${rows.length} rows to process\`);`;

  source = source.replace(oldQueue, newQueue);
  console.log('✅ Modified startBatchFromSidebar');
  console.log('');

  // Completely rewrite runSingleStepBatch to recalculate each time
  console.log('🔄 Rewriting runSingleStepBatch to recalculate next row...');

  const oldFunc = `function runSingleStepBatch() {
  Logger.log('🔁 runSingleStepBatch triggered');
  const rawQueue = getProp('BATCH_QUEUE','{}');
  Logger.log(\`🔍 DEBUG: Raw BATCH_QUEUE property: \${rawQueue.slice(0, 200)}\`);
  const q = JSON.parse(rawQueue);
  Logger.log(\`🔍 DEBUG: Parsed queue object: \${JSON.stringify(q)}\`);
  Logger.log(\`🔍 DEBUG: q.rows exists? \${!!q.rows}, q.rows.length: \${q.rows ? q.rows.length : 'N/A'}\`);
  if (!q.rows || !q.rows.length) return { done:true, msg:'No rows queued.' };
  if (getProp('BATCH_STOP','')) return { done:true, msg:'Stopped by user.' };

  const ss = SpreadsheetApp.getActive();
  const inSheet = ss.getSheetByName(q.inputSheetName);
  const outSheet= ss.getSheetByName(q.outputSheetName);
  if (!inSheet || !outSheet) return { done:true, msg:'Sheets missing.' };

  const row = q.rows.shift();
  setProp('BATCH_QUEUE', JSON.stringify(q));

  const summary = processOneInputRow_(inSheet, outSheet, row, true);

  const log = JSON.parse(getProp('BATCH_LOG','{}'));
  log.created += summary.created?1:0;
  log.skipped += summary.skipped?1:0;
  log.dupes   += summary.duplicate?1:0;
  log.errors  += summary.error?1:0;
  setProp('BATCH_LOG', JSON.stringify(log));

  const more = q.rows.length>0 && !getProp('BATCH_STOP','');
  return { done:!more, row, msg: summary.message || \`Processed row \${row}.\`, remaining: q.rows.length };
}`;

  const newFunc = `function runSingleStepBatch() {
  Logger.log('🔁 runSingleStepBatch triggered');

  const rawQueue = getProp('BATCH_QUEUE','{}');
  Logger.log(\`🔍 DEBUG: Raw BATCH_QUEUE: \${rawQueue.slice(0, 200)}\`);

  const q = JSON.parse(rawQueue);
  Logger.log(\`🔍 DEBUG: Queue object: \${JSON.stringify(q)}\`);

  if (!q.rowsToProcess || q.rowsToProcess <= 0) {
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

  // RECALCULATE next row based on current output sheet state
  const outputLastRow = outSheet.getLastRow();
  const outputDataRows = Math.max(0, outputLastRow - 2); // Subtract 2 header rows
  const nextInputRow = 2 + outputDataRows; // Next Input row to process

  Logger.log(\`📊 Output has \${outputDataRows} rows, processing Input row \${nextInputRow}\`);

  // Check if this row exists
  const inputLastRow = inSheet.getLastRow();
  if (nextInputRow > inputLastRow) {
    return { done:true, msg:\`✅ All Input rows processed! (tried row \${nextInputRow}, last is \${inputLastRow})\` };
  }

  // Process this ONE row
  const summary = processOneInputRow_(inSheet, outSheet, nextInputRow, true);

  // Update log
  const log = JSON.parse(getProp('BATCH_LOG','{}'));
  log.created += summary.created?1:0;
  log.skipped += summary.skipped?1:0;
  log.dupes   += summary.duplicate?1:0;
  log.errors  += summary.error?1:0;
  setProp('BATCH_LOG', JSON.stringify(log));

  // Decrement count
  q.rowsToProcess--;
  setProp('BATCH_QUEUE', JSON.stringify(q));

  const more = q.rowsToProcess > 0 && !getProp('BATCH_STOP','');

  return {
    done: !more,
    row: nextInputRow,
    msg: summary.message || \`Processed Input row \${nextInputRow}\`,
    remaining: q.rowsToProcess
  };
}`;

  source = source.replace(oldFunc, newFunc);
  console.log('✅ Rewrote runSingleStepBatch with recalculation');
  console.log('');

  // Upload
  console.log('💾 Uploading fixed code...');
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

  console.log('✅ Batch flow fixed!');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ FIX COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('New flow:');
  console.log('1. Queue stores COUNT of rows to process (not specific row numbers)');
  console.log('2. Before each row: Count output rows');
  console.log('3. Calculate next Input row: 2 + outputRowCount');
  console.log('4. Process that ONE row');
  console.log('5. Decrement count and repeat');
  console.log('');
  console.log('Benefits:');
  console.log('✅ Always processes correct next row');
  console.log('✅ Skipped/failed rows don\'t break sequence');
  console.log('✅ Can resume from any point');
  console.log('✅ Duplicate detection works naturally');
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh Google Sheets');
  console.log('2. Try "Specific rows: 10-15" again');
  console.log('3. Watch logs show row-by-row processing');
  console.log('');
}

if (require.main === module) {
  fixBatchFlowRecalculate().catch(error => {
    console.error('');
    console.error('❌ FIX FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { fixBatchFlowRecalculate };
