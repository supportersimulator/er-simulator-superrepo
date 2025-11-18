#!/usr/bin/env node

/**
 * Connect All Batch Modes to startBatchFromSidebar
 *
 * Ensures startBatchFromSidebar calls the correct detection function
 * based on the mode parameter
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function connectBatchModes() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  CONNECT BATCH MODES TO STARTER');
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

  console.log('Finding startBatchFromSidebar function...');
  console.log('');

  // Find startBatchFromSidebar function
  const funcStart = source.indexOf('function startBatchFromSidebar(');
  if (funcStart === -1) {
    console.log('❌ Could not find startBatchFromSidebar function');
    return;
  }

  // Find the end of the function
  let funcEnd = source.indexOf('\nfunction ', funcStart + 10);
  if (funcEnd === -1) {
    funcEnd = source.indexOf('\n}', funcStart + 100);
    let braceCount = 1;
    let pos = source.indexOf('{', funcStart) + 1;
    while (braceCount > 0 && pos < source.length) {
      if (source[pos] === '{') braceCount++;
      if (source[pos] === '}') braceCount--;
      pos++;
    }
    funcEnd = pos;
  }

  const oldFunc = source.substring(funcStart, funcEnd);

  console.log('Current function (first 500 chars):');
  console.log(oldFunc.substring(0, 500) + '...');
  console.log('');

  // New version with all three modes
  const newFunc = `function startBatchFromSidebar(inputSheetName, outputSheetName, mode, spec) {
  const ss = SpreadsheetApp.getActive();
  const inSheet = ss.getSheetByName(inputSheetName);
  let outSheet = ss.getSheetByName(outputSheetName);

  // Dynamic output sheet detection (check Settings)
  const settingsSheet = ss.getSheetByName('Settings');
  const settingsOut = settingsSheet ? settingsSheet.getRange('A1').getValue() : '';
  if (settingsOut) {
    outSheet = ss.getSheetByName(settingsOut) || outSheet;
  }

  if (!inSheet || !outSheet) {
    throw new Error('❌ Could not find selected sheets.');
  }

  cacheHeaders(outSheet);

  appendLogSafe('─────────────────────────────────────────');
  appendLogSafe(\`📋 Starting batch mode: \${mode}\`);
  appendLogSafe('─────────────────────────────────────────');

  let rows;

  if (mode === 'next25') {
    rows = getNext25InputRows_(inSheet, outSheet);
  } else if (mode === 'all') {
    rows = getAllInputRows_(inSheet, outSheet);
  } else if (mode === 'specific') {
    rows = getSpecificInputRows_(inSheet, outSheet, spec);
  } else {
    throw new Error('Unknown batch mode: ' + mode);
  }

  if (!rows || rows.length === 0) {
    appendLogSafe('⚠️  No rows to process.');
    return { success: false, message: 'No unprocessed rows found.' };
  }

  // Save queue to DocumentProperties (separate properties for reliability)
  setProp('BATCH_ROWS', JSON.stringify(rows));
  setProp('BATCH_INPUT_SHEET', inputSheetName);
  setProp('BATCH_OUTPUT_SHEET', outputSheetName);
  setProp('BATCH_MODE', mode);
  setProp('BATCH_SPEC', spec);
  setProp('BATCH_STOP', ''); // Clear stop flag

  // Also save as single queue object for backwards compatibility
  const q = {
    rows: rows,
    inputSheetName: inputSheetName,
    outputSheetName: outputSheetName,
    mode: mode,
    spec: spec
  };
  setProp('BATCH_QUEUE', JSON.stringify(q));

  appendLogSafe(\`✅ Batch queued with \${rows.length} row(s)\`);
  appendLogSafe(\`📋 Rows: [\${rows.slice(0, 10).join(', ')}\${rows.length > 10 ? '...' : ''}]\`);
  appendLogSafe('─────────────────────────────────────────');

  return { success: true, count: rows.length, rows: rows };
}
`;

  source = source.substring(0, funcStart) + newFunc + source.substring(funcEnd);

  console.log('✅ Updated startBatchFromSidebar() with all three modes');
  console.log('');

  console.log('💾 Uploading code...');
  console.log('');

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
  console.log('✅ ALL BATCH MODES CONNECTED!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Batch mode routing:');
  console.log('  mode="next25" → getNext25InputRows_() ✅');
  console.log('  mode="all" → getAllInputRows_() ✅');
  console.log('  mode="specific" → getSpecificInputRows_() ✅');
  console.log('');
  console.log('🚀 READY TO LAUNCH!');
  console.log('');
  console.log('Recommended:');
  console.log('  1. Refresh Google Sheets (F5)');
  console.log('  2. Select "All remaining rows"');
  console.log('  3. Click "Launch Batch Engine"');
  console.log('  4. Will process all 27 rows (15-41)');
  console.log('');
}

if (require.main === module) {
  connectBatchModes().catch(error => {
    console.error('');
    console.error('❌ FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { connectBatchModes };
