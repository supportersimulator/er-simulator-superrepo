#!/usr/bin/env node

/**
 * Fix Row Detection - Use Row Position Not Case ID
 *
 * REALIZATION:
 * - Input sheet Column A is EMPTY (no Case_ID yet)
 * - Case_ID is GENERATED during processing
 * - We can't compare Case IDs that don't exist yet!
 *
 * SIMPLE SOLUTION:
 * - Output row 3 = Input row 3 processed
 * - Output row 4 = Input row 4 processed
 * - etc.
 * - Just check if output row N exists, if not, process input row N
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function fixRowDetectionSimple() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FIX ROW DETECTION - USE SIMPLE ROW POSITION');
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

  console.log('Replacing getNext25InputRows_ with simple row counting...');
  console.log('');

  const funcStart = source.indexOf('function getNext25InputRows_');
  const funcEnd = source.indexOf('\nfunction ', funcStart + 50);

  const newFunction = `function getNext25InputRows_(inputSheet, outputSheet) {
  appendLogSafe('🔍 Starting row detection (simple row position method)...');

  const inputLast = inputSheet.getLastRow();
  const outputLast = outputSheet.getLastRow();

  // Output rows 3+ are data (rows 1-2 are headers)
  // Output row 3 corresponds to Input row 3
  // Output row 4 corresponds to Input row 4, etc.
  const outputDataRows = Math.max(0, outputLast - 2); // Number of processed rows

  const nextInputRow = 3 + outputDataRows; // Next row to process

  appendLogSafe(\`📊 Output has \${outputDataRows} data rows (last row: \${outputLast})\`);
  appendLogSafe(\`📊 Next available Input row: \${nextInputRow}\`);

  // Build array of next 25 rows to process
  const availableRows = [];
  for (let r = nextInputRow; r <= inputLast && availableRows.length < 25; r++) {
    availableRows.push(r);
  }

  if (availableRows.length === 0) {
    appendLogSafe('✅ All Input rows have been processed!');
  } else {
    appendLogSafe(\`✅ Queuing \${availableRows.length} rows: \${availableRows.slice(0, 5).join(', ')}\${availableRows.length > 5 ? '...' : ''}\`);
  }

  Logger.log(\`📊 Output last row: \${outputLast}, data rows: \${outputDataRows}\`);
  Logger.log(\`✅ Next input row: \${nextInputRow}, queuing \${availableRows.length} rows\`);

  return availableRows;
}`;

  source = source.substring(0, funcStart) + newFunction + source.substring(funcEnd);
  console.log('✅ Replaced with simple row position logic');
  console.log('');

  // Upload
  console.log('💾 Uploading code...');
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
  console.log('✅ ROW DETECTION FIXED!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('How it works now:');
  console.log('  1. Count output data rows (outputLast - 2)');
  console.log('  2. Next input row = 3 + outputDataRows');
  console.log('  3. Queue next 25 sequential rows');
  console.log('');
  console.log('Example:');
  console.log('  Output has 9 data rows (rows 3-11 filled)');
  console.log('  outputDataRows = 11 - 2 = 9');
  console.log('  nextInputRow = 3 + 9 = 12 ✅');
  console.log('  Queue rows: [12, 13, 14, ... 36]');
  console.log('');
  console.log('Test:');
  console.log('1. Refresh Google Sheets (F5)');
  console.log('2. Click "Launch Batch Engine"');
  console.log('3. Should now start processing from row 12!');
  console.log('');
}

if (require.main === module) {
  fixRowDetectionSimple().catch(error => {
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

module.exports = { fixRowDetectionSimple };
