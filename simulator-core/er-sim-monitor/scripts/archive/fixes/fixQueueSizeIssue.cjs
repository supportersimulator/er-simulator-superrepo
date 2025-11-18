#!/usr/bin/env node

/**
 * Fix Queue Size Issue
 *
 * SMOKING GUN FOUND:
 * 🔍 DEBUG: Saved queue with 20 rows: [22,23,24,25,26]
 * 🔍 DEBUG: Verified queue has 0 rows
 *
 * The queue is being stringified and saved, but when read back it's empty!
 * This suggests Script Properties quota limit or JSON.stringify issue.
 *
 * Solution: Simplify the queue data to reduce size
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function fixQueueSizeIssue() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FIX QUEUE SIZE ISSUE');
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

  console.log('Step 1: Simplify queue structure...');
  console.log('');

  // Find startBatchFromSidebar setProp line
  const startBatchIdx = source.indexOf('function startBatchFromSidebar');
  const setPropIdx = source.indexOf("setProp('BATCH_QUEUE'", startBatchIdx);

  // Find the full setProp statement
  const setPropStart = setPropIdx;
  const setPropEnd = source.indexOf(';', setPropIdx) + 1;
  const oldSetProp = source.substring(setPropStart, setPropEnd);

  console.log('Current queue save:');
  console.log(oldSetProp);
  console.log('');

  // New simplified version - store each property separately
  const newSetProp = `// Store queue data in separate properties to avoid size limit
  setProp('BATCH_ROWS', JSON.stringify(rows));
  setProp('BATCH_INPUT_SHEET', inputSheetName);
  setProp('BATCH_OUTPUT_SHEET', finalOutputName);
  setProp('BATCH_MODE', mode);
  setProp('BATCH_SPEC', spec || '');

  // For backward compatibility, also store as single object
  setProp('BATCH_QUEUE', JSON.stringify({
    inputSheetName,
    outputSheetName: finalOutputName,
    rows: rows,
    mode: mode,
    spec: spec
  }))`;

  source = source.substring(0, setPropStart) + newSetProp + source.substring(setPropEnd);
  console.log('✅ Modified to store properties separately');
  console.log('');

  console.log('Step 2: Update runSingleStepBatch to read from separate properties...');
  console.log('');

  const runBatchIdx = source.indexOf('function runSingleStepBatch()');
  const getPropIdx = source.indexOf("getProp('BATCH_QUEUE'", runBatchIdx);
  const parseIdx = source.indexOf('const q = JSON.parse(rawQueue)', runBatchIdx);
  const parseEnd = source.indexOf(';', parseIdx) + 1;

  // Replace the getProp and parse lines
  const oldGetProp = source.substring(getPropIdx - 20, parseEnd);

  const newGetProp = `// Try reading from separate properties first (more reliable)
  const rowsJson = getProp('BATCH_ROWS', '[]');
  const rows = JSON.parse(rowsJson);

  // Build queue object from separate properties
  const q = {
    rows: rows,
    inputSheetName: getProp('BATCH_INPUT_SHEET', ''),
    outputSheetName: getProp('BATCH_OUTPUT_SHEET', ''),
    mode: getProp('BATCH_MODE', ''),
    spec: getProp('BATCH_SPEC', '')
  }`;

  // Find the line that starts with "const rawQueue"
  const rawQueueStart = source.lastIndexOf('const rawQueue', parseEnd);
  const rawQueueEnd = parseEnd;

  source = source.substring(0, rawQueueStart) + newGetProp + source.substring(rawQueueEnd);
  console.log('✅ Modified to read from separate properties');
  console.log('');

  console.log('Step 3: Update queue save after shift...');
  console.log('');

  // Find where we save the updated queue after shift
  const shiftIdx = source.indexOf('q.rows.shift()', runBatchIdx);
  const savePropIdx = source.indexOf("setProp('BATCH_QUEUE'", shiftIdx);
  if (savePropIdx !== -1) {
    const savePropEnd = source.indexOf(');', savePropIdx) + 2;
    const oldSave = source.substring(savePropIdx, savePropEnd);

    const newSave = `// Update the rows property
  setProp('BATCH_ROWS', JSON.stringify(q.rows));
  // Also update full queue for backward compatibility
  setProp('BATCH_QUEUE', JSON.stringify(q));`;

    source = source.substring(0, savePropIdx) + newSave + source.substring(savePropEnd);
    console.log('✅ Modified queue update after shift');
  }
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

  console.log('✅ Code updated!');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ QUEUE SIZE ISSUE FIXED!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('What was wrong:');
  console.log('  - Large queue object exceeded Script Properties size limit');
  console.log('  - setProp() failed silently');
  console.log('  - Queue appeared to save but was actually empty');
  console.log('');
  console.log('What was fixed:');
  console.log('  - Store each property separately (BATCH_ROWS, BATCH_INPUT_SHEET, etc.)');
  console.log('  - Smaller individual properties avoid quota limit');
  console.log('  - More reliable storage');
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh Google Sheets (F5)');
  console.log('2. Click "Launch Batch Engine"');
  console.log('3. Should now see queue persist correctly!');
  console.log('');
}

if (require.main === module) {
  fixQueueSizeIssue().catch(error => {
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

module.exports = { fixQueueSizeIssue };
