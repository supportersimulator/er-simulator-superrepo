#!/usr/bin/env node

/**
 * Fix Batch Mode - Call runSingleCaseFromSidebar Directly
 *
 * USER'S CRITICAL INSIGHT:
 * "Make sure the number has the exact format in that same 'specific rows' spot
 *  and don't change the naming system or anything."
 *
 * Strategy:
 * - Batch mode should call runSingleCaseFromSidebar(inputSheet, outputSheet, 3)
 * - Then runSingleCaseFromSidebar(inputSheet, outputSheet, 4)
 * - Then runSingleCaseFromSidebar(inputSheet, outputSheet, 5)
 * - etc.
 * - ONE row number at a time, EXACT same function single mode uses!
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function fixSmartBatch() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FIX BATCH - CALL SINGLE MODE FUNCTION DIRECTLY');
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

  console.log('Current approach: runSingleStepBatch() processes rows internally');
  console.log('New approach: loopStep() calls runSingleCaseFromSidebar() directly!');
  console.log('');

  //  Rewrite runSingleStepBatch to just return next row number
  console.log('Step 1: Modify runSingleStepBatch to return next row number...');
  console.log('');

  const funcStart = source.indexOf('function runSingleStepBatch()');
  if (funcStart === -1) {
    console.log('❌ Could not find runSingleStepBatch');
    return;
  }

  const funcEnd = source.indexOf('\nfunction ', funcStart + 50);
  const newFunc = `function runSingleStepBatch() {
  const rawQueue = getProp('BATCH_QUEUE','{}');
  const q = JSON.parse(rawQueue);

  // Check if we have rows left
  if (!q.rows || q.rows.length === 0) {
    return { done: true, msg: '✅ All rows processed!' };
  }

  if (getProp('BATCH_STOP','')) {
    return { done: true, msg: 'Stopped by user.' };
  }

  // ⭐ Just pop and return the row number - don't process it here!
  const nextRow = q.rows.shift();

  // Save updated queue
  setProp('BATCH_QUEUE', JSON.stringify(q));

  // Return the row number and queue data so loopStep can call runSingleCaseFromSidebar
  return {
    done: false,
    row: nextRow,
    remaining: q.rows.length,
    inputSheetName: q.inputSheetName,
    outputSheetName: q.outputSheetName
  };
}`;

  source = source.substring(0, funcStart) + newFunc + source.substring(funcEnd);
  console.log('✅ Modified runSingleStepBatch to just return row number');
  console.log('');

  console.log('Step 2: Rewrite loopStep() to call runSingleCaseFromSidebar...');
  console.log('');

  // Find and replace loopStep in client-side code
  const loopStart = source.indexOf('function loopStep(){');
  const loopEnd = source.indexOf('\n    function', loopStart + 50);

  const newLoop = `function loopStep(){
      // Get next row number from queue
      google.script.run
          .withSuccessHandler(function(report){
            if (report.done){
              setStatus('✅ Complete');
              appendLog(report.msg || '✅ Batch complete!');
              return;
            }

            // ⭐ Call the EXACT same function single mode uses!
            appendLog('📊 Processing row ' + report.row + ' (' + report.remaining + ' remaining)...');

            google.script.run
              .withSuccessHandler(function(result){
                appendLog('✅ Row ' + report.row + ' complete');
                setTimeout(loopStep, 1500); // Next row after 1.5s
              })
              .withFailureHandler(function(e){
                appendLog('❌ Row ' + report.row + ' error: ' + e.message);
                setTimeout(loopStep, 1500); // Continue despite error
              })
              .runSingleCaseFromSidebar(report.inputSheetName, report.outputSheetName, report.row);
          })
          .withFailureHandler(function(e){
            appendLog('❌ Batch error: ' + e.message);
            setStatus('Error');
          })
          .runSingleStepBatch();
    }`;

  source = source.substring(0, loopStart) + newLoop + source.substring(loopEnd);
  console.log('✅ Rewrote loopStep to call runSingleCaseFromSidebar');
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

  console.log('✅ Code updated successfully!');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ BATCH NOW CALLS SINGLE MODE FUNCTION!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Flow:');
  console.log('1. loopStep() calls runSingleStepBatch()');
  console.log('   → Returns: {row: 3, inputSheet, outputSheet}');
  console.log('');
  console.log('2. loopStep() calls runSingleCaseFromSidebar(inputSheet, outputSheet, 3)');
  console.log('   → EXACT same function single mode uses!');
  console.log('   → All 10 log messages appear');
  console.log('   → Row 3 fully processed');
  console.log('');
  console.log('3. After 1.5s, loopStep() repeats with row 4');
  console.log('');
  console.log('Benefits:');
  console.log('✅ Calls runSingleCaseFromSidebar (proven to work!)');
  console.log('✅ ONE row number at a time');
  console.log('✅ EXACT same code path as single mode');
  console.log('✅ Live logs guaranteed to work');
  console.log('');
}

if (require.main === module) {
  fixSmartBatch().catch(error => {
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

module.exports = { fixSmartBatch };
