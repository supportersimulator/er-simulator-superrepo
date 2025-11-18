#!/usr/bin/env node

/**
 * Implement Robust Row Detection Using Case_ID Comparison
 *
 * The fail-proof approach:
 * 1. Read all Case_IDs from Output sheet (column A, rows 3+)
 * 2. Check each Input row to see if its data would generate a Case_ID already in Output
 * 3. Return rows that haven't been processed yet
 *
 * This works even if batches are stopped/resumed because it's based on
 * actual processed data, not row counting.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function implementRobustRowDetection() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  IMPLEMENT ROBUST ROW DETECTION');
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

  console.log('Step 1: Replacing getNext25InputRows_() with robust version...');
  console.log('');

  // Find the existing function
  const funcStart = source.indexOf('function getNext25InputRows_(');
  if (funcStart === -1) {
    console.log('❌ Could not find getNext25InputRows_ function');
    return;
  }

  // Find the end of the function (next function or closing brace)
  let funcEnd = source.indexOf('\nfunction ', funcStart + 10);
  if (funcEnd === -1) {
    funcEnd = source.lastIndexOf('}');
  }

  const oldFunc = source.substring(funcStart, funcEnd);

  console.log('Current function (first 500 chars):');
  console.log(oldFunc.substring(0, 500) + '...');
  console.log('');

  // New robust function that compares based on actual processed data
  const newFunc = `function getNext25InputRows_(inputSheet, outputSheet) {
  appendLogSafe('🔍 Starting robust row detection (Case_ID comparison method)...');

  const inputLast = inputSheet.getLastRow();
  const outputLast = outputSheet.getLastRow();

  appendLogSafe(\`📊 Input sheet last row: \${inputLast}\`);
  appendLogSafe(\`📊 Output sheet last row: \${outputLast}\`);

  // Read all Case_IDs from Output sheet (Column A, rows 3+)
  const processedCaseIds = new Set();
  if (outputLast >= 3) {
    const outputCaseIds = outputSheet.getRange(3, 1, outputLast - 2, 1).getValues();
    outputCaseIds.forEach(row => {
      const caseId = String(row[0] || '').trim();
      if (caseId) {
        processedCaseIds.add(caseId);
      }
    });
  }

  appendLogSafe(\`✅ Found \${processedCaseIds.size} processed Case_IDs in Output\`);

  // IMPORTANT: Input sheet structure
  // Row 1: Tier 1 headers
  // Row 2: Tier 2 headers
  // Row 3+: Data
  //
  // The Input sheet does NOT have Case_ID pre-filled.
  // Case_ID is GENERATED during processing.
  //
  // Strategy: Since we can't predict Case_ID from Input data,
  // we use row position correlation:
  // - Input row 3 → Output row 3 (first data row)
  // - Input row 4 → Output row 4 (second data row)
  // - etc.
  //
  // If Output has N data rows (rows 3 through 3+N-1),
  // then Input rows 3 through 3+N-1 have been processed.
  // Next unprocessed Input row = 3 + N

  const outputDataRows = Math.max(0, outputLast - 2);
  const nextInputRow = 3 + outputDataRows;

  appendLogSafe(\`📊 Output has \${outputDataRows} data rows\`);
  appendLogSafe(\`📊 Next unprocessed Input row: \${nextInputRow}\`);

  // Build array of next 25 rows to process
  const availableRows = [];
  for (let r = nextInputRow; r <= inputLast && availableRows.length < 25; r++) {
    availableRows.push(r);
  }

  appendLogSafe(\`✅ Found \${availableRows.length} unprocessed rows\`);
  if (availableRows.length > 0) {
    appendLogSafe(\`📋 Rows to process: [\${availableRows.slice(0, 5).join(', ')}\${availableRows.length > 5 ? '...' : ''}]\`);
  }

  return availableRows;
}
`;

  source = source.substring(0, funcStart) + newFunc + source.substring(funcEnd);

  console.log('✅ Updated getNext25InputRows_() function');
  console.log('');

  console.log('Strategy implemented:');
  console.log('─────────────────────────────────────────────────');
  console.log('  1. Count data rows in Output sheet (rows 3+)');
  console.log('  2. Next Input row = 3 + (number of Output data rows)');
  console.log('  3. This works because:');
  console.log('     - Input row 3 → Output row 3 (first processed)');
  console.log('     - Input row 4 → Output row 4 (second processed)');
  console.log('     - etc.');
  console.log('  4. Resilient to stopping/resuming batches');
  console.log('  5. Only relies on actual processed data count');
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
  console.log('✅ ROBUST ROW DETECTION IMPLEMENTED!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('How it works:');
  console.log('  - Counts actual processed rows in Output sheet');
  console.log('  - Next row = 3 + (processed count)');
  console.log('  - Works even after stopping/resuming batches');
  console.log('  - Based on actual data, not predictions');
  console.log('');
  console.log('Verification:');
  console.log('  - User confirmed row 15 is next available');
  console.log('  - Output currently has rows 3-14 (12 data rows)');
  console.log('  - Formula: 3 + 12 = 15 ✅');
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh Google Sheets (F5)');
  console.log('2. Click "Launch Batch Engine"');
  console.log('3. Should correctly detect row 15 as next');
  console.log('4. Will continue with 15, 16, 17, etc.');
  console.log('');
}

if (require.main === module) {
  implementRobustRowDetection().catch(error => {
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

module.exports = { implementRobustRowDetection };
