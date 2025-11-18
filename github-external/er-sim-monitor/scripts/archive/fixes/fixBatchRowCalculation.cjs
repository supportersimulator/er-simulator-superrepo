#!/usr/bin/env node

/**
 * Fix Batch Row Calculation
 *
 * Problem: Batch calculates next row as "2 + outputDataRows"
 * - When output is empty (0 rows) → processes Input row 2 (TIER 2 HEADERS!)
 * - Should start from row 3 (first data row)
 *
 * Fix: Change to "3 + outputDataRows"
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function fixBatchRowCalculation() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FIX BATCH ROW CALCULATION');
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

  console.log('Fixing batch row calculation...');
  console.log('');

  // Fix: Change "2 + outputDataRows" to "3 + outputDataRows"
  const oldCalc = `  const nextInputRow = 2 + outputDataRows; // Next Input row to process`;
  const newCalc = `  const nextInputRow = 3 + outputDataRows; // Start from row 3 (first data row)`;

  if (source.indexOf(oldCalc) !== -1) {
    source = source.replace(oldCalc, newCalc);
    console.log('✅ Fixed batch row calculation');
    console.log('   Old: nextInputRow = 2 + outputDataRows (started from header row)');
    console.log('   New: nextInputRow = 3 + outputDataRows (starts from first data row)');
  } else {
    console.log('⚠️  Exact pattern not found, trying regex...');

    const pattern = /const nextInputRow = 2 \+ outputDataRows;/;
    if (pattern.test(source)) {
      source = source.replace(pattern, 'const nextInputRow = 3 + outputDataRows; // Start from row 3 (first data row)');
      console.log('✅ Fixed via regex');
    } else {
      console.log('❌ Could not find pattern to replace');
      console.log('   Please manually check the runSingleStepBatch function');
      return;
    }
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

  console.log('✅ Code updated successfully!');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ BATCH ROW CALCULATION FIXED');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('How it works NOW:');
  console.log('');
  console.log('Row structure:');
  console.log('  Row 1: Tier 1 headers (Category names)');
  console.log('  Row 2: Tier 2 headers (Field names)');
  console.log('  Row 3: First data row');
  console.log('  Row 4: Second data row');
  console.log('  ... etc');
  console.log('');
  console.log('Batch processing logic:');
  console.log('  1. Count existing rows in output sheet');
  console.log('  2. Calculate: nextInputRow = 3 + outputDataRows');
  console.log('  3. If output empty (0 rows) → process Input row 3 ✅');
  console.log('  4. If output has 1 row → process Input row 4 ✅');
  console.log('  5. Continues until all data rows processed');
  console.log('');
  console.log('Test:');
  console.log('1. Refresh Google Sheets');
  console.log('2. Clear any existing output rows (keep headers)');
  console.log('3. Select "First 25 rows" mode');
  console.log('4. Click "Launch Batch Engine"');
  console.log('5. Should process rows 3-27 (25 data rows)');
  console.log('6. Watch Live Logs for progress!');
  console.log('');
}

if (require.main === module) {
  fixBatchRowCalculation().catch(error => {
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

module.exports = { fixBatchRowCalculation };
