#!/usr/bin/env node

/**
 * Diagnose Queue Flow - Find Why Queue Is Empty
 *
 * Problem: "Batch queued with 20 row(s)" → "✅ All rows processed!"
 * This means queue is created but appears empty when read.
 *
 * This script will add detailed logging to see:
 * 1. Exactly what startBatchFromSidebar saves
 * 2. Exactly what runSingleStepBatch reads
 * 3. Whether the data format matches
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function diagnoseQueueFlow() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  DIAGNOSE QUEUE FLOW');
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

  console.log('Step 1: Finding startBatchFromSidebar...');
  const startBatchIdx = source.indexOf('function startBatchFromSidebar');
  if (startBatchIdx === -1) {
    console.log('❌ Could not find startBatchFromSidebar');
    return;
  }

  // Find where it sets BATCH_QUEUE
  const queueSetIdx = source.indexOf("setProp('BATCH_QUEUE'", startBatchIdx);
  if (queueSetIdx === -1) {
    console.log('❌ Could not find setProp BATCH_QUEUE in startBatchFromSidebar');
    return;
  }

  // Extract the line
  const lineStart = source.lastIndexOf('\n', queueSetIdx);
  const lineEnd = source.indexOf(';', queueSetIdx);
  const queueSetLine = source.substring(lineStart, lineEnd + 1);

  console.log('');
  console.log('Current queue save line:');
  console.log('═══════════════════════════════════════════════════');
  console.log(queueSetLine.trim());
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  console.log('Step 2: Finding what data is being saved...');

  // Look for "rows" variable assignment before the setProp
  const rowsAssignIdx = source.lastIndexOf('rows =', queueSetIdx);
  if (rowsAssignIdx !== -1 && rowsAssignIdx > startBatchIdx) {
    const rowsLineStart = source.lastIndexOf('\n', rowsAssignIdx);
    const rowsLineEnd = source.indexOf(';', rowsAssignIdx);
    console.log('Found rows assignment:');
    console.log(source.substring(rowsLineStart, rowsLineEnd + 1).trim());
    console.log('');
  }

  // Check if it's using getNext25InputRows_
  if (source.substring(startBatchIdx, queueSetIdx).includes('getNext25InputRows_')) {
    console.log('✅ Uses getNext25InputRows_() to calculate rows');
  } else {
    console.log('⚠️  Does NOT use getNext25InputRows_()');
  }

  console.log('');
  console.log('Step 3: Checking runSingleStepBatch queue read...');
  const runBatchIdx = source.indexOf('function runSingleStepBatch()');
  if (runBatchIdx === -1) {
    console.log('❌ Could not find runSingleStepBatch');
    return;
  }

  const queueReadIdx = source.indexOf("getProp('BATCH_QUEUE'", runBatchIdx);
  const parseIdx = source.indexOf('JSON.parse', queueReadIdx);
  const parseLineEnd = source.indexOf(';', parseIdx);
  const parseLineStart = source.lastIndexOf('\n', parseIdx);

  console.log('Queue read code:');
  console.log('═══════════════════════════════════════════════════');
  console.log(source.substring(parseLineStart, parseLineEnd + 1).trim());
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  console.log('Step 4: Checking if q.rows is accessed correctly...');
  const rowsCheckIdx = source.indexOf('q.rows', runBatchIdx);
  if (rowsCheckIdx !== -1) {
    console.log('✅ Code checks q.rows');

    // Find the condition
    const conditionStart = source.lastIndexOf('if', rowsCheckIdx);
    const conditionEnd = source.indexOf(')', rowsCheckIdx);
    console.log('Condition:', source.substring(conditionStart, conditionEnd + 1).trim());
  } else {
    console.log('❌ Code does NOT check q.rows');
  }

  console.log('');
  console.log('Step 5: Adding diagnostic logging...');
  console.log('');

  // Add logging in startBatchFromSidebar AFTER setProp
  const logAfterSave = `\n  appendLogSafe('🔍 DEBUG: Saved queue with ' + rows.length + ' rows: ' + JSON.stringify(rows.slice(0, 5)));\n  const verifyQueue = JSON.parse(getProp('BATCH_QUEUE','{}'));\n  appendLogSafe('🔍 DEBUG: Verified queue has ' + (verifyQueue.rows ? verifyQueue.rows.length : 'NO ROWS PROPERTY') + ' rows');\n`;

  // Find the line after setProp('BATCH_QUEUE'...)
  const afterSetProp = source.indexOf(';', queueSetIdx) + 1;

  // Check if diagnostic logging already exists
  if (source.substring(afterSetProp, afterSetProp + 100).includes('🔍 DEBUG: Saved queue')) {
    console.log('⚠️  Diagnostic logging already exists in startBatchFromSidebar');
  } else {
    source = source.substring(0, afterSetProp) + logAfterSave + source.substring(afterSetProp);
    console.log('✅ Added save verification logging');
  }

  // Add logging in runSingleStepBatch right after parsing queue
  const logAfterRead = `\n  appendLogSafe('🔍 DEBUG: Read queue - rawQueue length: ' + rawQueue.length);\n  appendLogSafe('🔍 DEBUG: Parsed queue - has rows property? ' + (!!q.rows) + ', rows.length: ' + (q.rows ? q.rows.length : 'N/A'));\n  if (q.rows && q.rows.length > 0) {\n    appendLogSafe('🔍 DEBUG: Next 5 rows in queue: ' + JSON.stringify(q.rows.slice(0, 5)));\n  }\n`;

  const afterParse = source.indexOf(';', parseIdx) + 1;

  if (source.substring(afterParse, afterParse + 100).includes('🔍 DEBUG: Read queue')) {
    console.log('⚠️  Diagnostic logging already exists in runSingleStepBatch');
  } else {
    source = source.substring(0, afterParse) + logAfterRead + source.substring(afterParse);
    console.log('✅ Added read verification logging');
  }

  // Upload
  console.log('');
  console.log('💾 Uploading diagnostic code...');
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

  console.log('✅ Diagnostic logging deployed!');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ DIAGNOSTICS ADDED');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh Google Sheets (F5)');
  console.log('2. Click "Launch Batch Engine"');
  console.log('3. Check Live Logs for 🔍 DEBUG messages');
  console.log('');
  console.log('Look for these messages:');
  console.log('  🔍 DEBUG: Saved queue with X rows: [...]');
  console.log('  🔍 DEBUG: Verified queue has X rows');
  console.log('  🔍 DEBUG: Read queue - rawQueue length: X');
  console.log('  🔍 DEBUG: Parsed queue - has rows property? true/false');
  console.log('  🔍 DEBUG: Next 5 rows in queue: [...]');
  console.log('');
  console.log('This will show us EXACTLY what is being saved vs read!');
  console.log('');
}

if (require.main === module) {
  diagnoseQueueFlow().catch(error => {
    console.error('');
    console.error('❌ DIAGNOSTIC FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { diagnoseQueueFlow };
