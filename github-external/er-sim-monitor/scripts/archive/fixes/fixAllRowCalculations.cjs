#!/usr/bin/env node

/**
 * Fix ALL Row Calculations - Comprehensive Fix
 *
 * Problem: Multiple places calculating row numbers starting from 2 instead of 3
 *
 * Row structure:
 *   Row 1: Tier 1 headers
 *   Row 2: Tier 2 headers
 *   Row 3: FIRST DATA ROW ← This is where we should start!
 *
 * Fixes needed:
 * 1. getNext25InputRows_: startRow = 2 + outputDataRows → 3 + outputDataRows
 * 2. runSingleStepBatch: nextInputRow = 2 + outputDataRows → 3 + outputDataRows
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function fixAllRowCalculations() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FIX ALL ROW CALCULATIONS');
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

  console.log('Fixing ALL row calculations to start from row 3...');
  console.log('');

  let changesMade = 0;

  // Fix 1: getNext25InputRows_ function
  const fix1Old = `  const startRow = 2 + outputDataRows;`;
  const fix1New = `  const startRow = 3 + outputDataRows; // Start from row 3 (first data row)`;

  if (source.indexOf(fix1Old) !== -1) {
    source = source.replace(fix1Old, fix1New);
    console.log('✅ Fix 1: getNext25InputRows_ → startRow = 3 + outputDataRows');
    changesMade++;
  } else {
    console.log('⚠️  Fix 1: Pattern already fixed or not found');
  }

  // Fix 2: runSingleStepBatch function
  const fix2Old = `  const nextInputRow = 2 + outputDataRows; // Next Input row to process`;
  const fix2New = `  const nextInputRow = 3 + outputDataRows; // Start from row 3 (first data row)`;

  if (source.indexOf(fix2Old) !== -1) {
    source = source.replace(fix2Old, fix2New);
    console.log('✅ Fix 2: runSingleStepBatch → nextInputRow = 3 + outputDataRows');
    changesMade++;
  } else {
    // Try without comment
    const fix2OldAlt = `  const nextInputRow = 2 + outputDataRows;`;
    if (source.indexOf(fix2OldAlt) !== -1) {
      source = source.replace(fix2OldAlt, fix2New);
      console.log('✅ Fix 2: runSingleStepBatch → nextInputRow = 3 + outputDataRows (alt)');
      changesMade++;
    } else {
      console.log('⚠️  Fix 2: Pattern already fixed or not found');
    }
  }

  console.log('');

  if (changesMade === 0) {
    console.log('⚠️  No changes made - patterns may already be fixed');
    console.log('');
    return;
  }

  // Upload
  console.log(`💾 Uploading fixed code (${changesMade} changes)...`);
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
  console.log('✅ ALL ROW CALCULATIONS FIXED');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('What was fixed:');
  console.log('');
  console.log('Row structure (reminder):');
  console.log('  Row 1: Tier 1 headers (Case_Organization, Monitor_Vital_Signs, etc.)');
  console.log('  Row 2: Tier 2 headers (Spark_Title, Initial_Vitals, etc.)');
  console.log('  Row 3: FIRST DATA ROW ← Processing starts here!');
  console.log('  Row 4: Second data row');
  console.log('  ... etc');
  console.log('');
  console.log('Functions fixed:');
  console.log('  1. getNext25InputRows_() - Calculates which 25 rows to process');
  console.log('  2. runSingleStepBatch() - Processes one row during batch');
  console.log('');
  console.log('Before fix:');
  console.log('  startRow = 2 + 0 = 2 (WRONG - processes Tier 2 headers!)');
  console.log('  startRow = 2 + 1 = 3 (correct)');
  console.log('  startRow = 2 + 2 = 4 (correct)');
  console.log('');
  console.log('After fix:');
  console.log('  startRow = 3 + 0 = 3 (CORRECT - first data row!)');
  console.log('  startRow = 3 + 1 = 4 (correct)');
  console.log('  startRow = 3 + 2 = 5 (correct)');
  console.log('');
  console.log('Test plan:');
  console.log('1. Refresh Google Sheets (F5)');
  console.log('2. Clear output sheet data (keep 2 header rows)');
  console.log('3. Select "First 25 rows" mode');
  console.log('4. Click "Launch Batch Engine"');
  console.log('5. Check Live Logs - should see "Processing row 3..."');
  console.log('6. Should process rows 3-27 (25 data rows)');
  console.log('7. All rows should have complete vitals data!');
  console.log('');
}

if (require.main === module) {
  fixAllRowCalculations().catch(error => {
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

module.exports = { fixAllRowCalculations };
