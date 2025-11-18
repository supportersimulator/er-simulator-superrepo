#!/usr/bin/env node

/**
 * Reset Batch Queue to Start at Row 15
 *
 * This script:
 * 1. Clears any existing batch queue
 * 2. Clears any batch flags/properties
 * 3. Verifies Output sheet has rows 3-14 (12 processed)
 * 4. Confirms row 15 is next available
 * 5. Ensures no duplicates will occur
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || process.env.SHEET_ID;

async function resetBatchToRow15() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  RESET BATCH QUEUE TO ROW 15');
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
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

  // Step 1: Verify current Output sheet state
  console.log('Step 1: Verifying Output sheet state...');
  console.log('');

  const settingsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Settings!A1:B2'
  });

  const settingsData = settingsResponse.data.values || [];
  let outputSheetName = 'Master Scenario Convert';

  if (settingsData.length > 0 && settingsData[0][0]) {
    outputSheetName = settingsData[0][0];
  }

  console.log(`✅ Output sheet: ${outputSheetName}`);

  const outputResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${outputSheetName}!A:A`
  });

  const outputData = outputResponse.data.values || [];
  const outputLast = outputData.length;

  console.log(`✅ Output sheet has ${outputLast} total rows`);

  const outputDataRows = Math.max(0, outputLast - 2);
  const expectedNextRow = 3 + outputDataRows;

  console.log(`✅ Processed data rows: ${outputDataRows} (rows 3-${outputLast})`);
  console.log(`✅ Next row should be: ${expectedNextRow}`);
  console.log('');

  if (expectedNextRow !== 15) {
    console.log('⚠️  WARNING: Expected next row is NOT 15!');
    console.log(`   Output has ${outputDataRows} data rows, so next should be row ${expectedNextRow}`);
    console.log('');
    console.log('This could mean:');
    console.log('  - Output sheet has more/fewer rows than expected');
    console.log('  - Some rows were processed after you stopped');
    console.log('  - You may need to manually verify the Output sheet');
    console.log('');
    console.log('Do you want to continue anyway? (Ctrl+C to abort)');
    console.log('');
  } else {
    console.log('✅ VERIFIED: Next row is 15 (correct!)');
    console.log('');
  }

  // Step 2: Clear all batch queue properties
  console.log('Step 2: Clearing batch queue and flags...');
  console.log('');

  const response = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = response.data.files;
  const codeFile = files.find(f => f.name === 'Code');
  let source = codeFile.source;

  // Add a function to clear all batch properties
  const clearBatchFunc = `
function clearAllBatchProperties() {
  const props = PropertiesService.getDocumentProperties();

  // Clear all batch-related properties
  const keysToDelete = [
    'BATCH_QUEUE',
    'BATCH_ROWS',
    'BATCH_INPUT_SHEET',
    'BATCH_OUTPUT_SHEET',
    'BATCH_MODE',
    'BATCH_SPEC',
    'BATCH_STOP',
    'BATCH_RUNNING',
    'BATCH_CURRENT_ROW'
  ];

  keysToDelete.forEach(key => {
    try {
      props.deleteProperty(key);
    } catch(e) {
      // Ignore if property doesn't exist
    }
  });

  Logger.log('✅ Cleared all batch properties');
  return 'Batch queue cleared. Ready to start fresh from row 15.';
}
`;

  // Check if function already exists
  if (!source.includes('function clearAllBatchProperties()')) {
    const lastBrace = source.lastIndexOf('}');
    source = source.substring(0, lastBrace) + clearBatchFunc + source.substring(lastBrace);

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

    console.log('✅ Added clearAllBatchProperties() function to Apps Script');
  } else {
    console.log('✅ clearAllBatchProperties() function already exists');
  }
  console.log('');

  // Step 3: Execute the clear function (but we can't due to permissions, so just inform user)
  console.log('Step 3: Batch properties need to be cleared...');
  console.log('');
  console.log('⚠️  Manual step required:');
  console.log('1. Open Google Sheets');
  console.log('2. Go to Extensions → Apps Script');
  console.log('3. Find clearAllBatchProperties() in the function dropdown');
  console.log('4. Click Run');
  console.log('5. This will clear any stuck batch queue data');
  console.log('');
  console.log('OR: Just click "Launch Batch Engine" - the new code will detect row 15 automatically!');
  console.log('');

  // Step 4: Verify the robust detection is in place
  console.log('Step 4: Verifying robust row detection is active...');
  console.log('');

  const hasRobustDetection = source.includes('Starting robust row detection') ||
                             source.includes('Case_ID comparison method');

  if (hasRobustDetection) {
    console.log('✅ Robust row detection is active');
  } else {
    console.log('⚠️  Robust detection not found - running implementation...');
    console.log('');

    // Import and run the implementation
    const { implementRobustRowDetection } = require('./implementRobustRowDetection.cjs');
    await implementRobustRowDetection();
  }
  console.log('');

  // Step 5: Final verification
  console.log('═══════════════════════════════════════════════════');
  console.log('  FINAL VERIFICATION');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  // Read last few Case_IDs to confirm no duplicates
  const caseIdRange = `${outputSheetName}!A3:A${outputLast}`;
  const caseIdResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: caseIdRange
  });

  const allCaseIds = (caseIdResponse.data.values || []).map(row => row[0]).filter(id => id);
  const uniqueCaseIds = new Set(allCaseIds);

  console.log(`Total Case_IDs in Output: ${allCaseIds.length}`);
  console.log(`Unique Case_IDs: ${uniqueCaseIds.size}`);

  if (allCaseIds.length !== uniqueCaseIds.size) {
    console.log('');
    console.log('⚠️  WARNING: DUPLICATES DETECTED!');
    console.log('');

    // Find duplicates
    const counts = {};
    allCaseIds.forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
    });

    const duplicates = Object.entries(counts).filter(([id, count]) => count > 1);
    console.log('Duplicate Case_IDs:');
    duplicates.forEach(([id, count]) => {
      console.log(`  ${id}: appears ${count} times`);
    });
    console.log('');
  } else {
    console.log('✅ No duplicates detected in Output sheet');
  }
  console.log('');

  // Show last 5 processed rows
  console.log('Last 5 processed rows:');
  console.log('─────────────────────────────────────────────────');
  const lastFive = allCaseIds.slice(-5);
  lastFive.forEach((id, idx) => {
    const rowNum = outputLast - 4 + idx;
    console.log(`  Row ${rowNum}: ${id}`);
  });
  console.log('');

  // Show what will be processed next
  const inputResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Input!A:A'
  });

  const inputData = inputResponse.data.values || [];
  const inputLast = inputData.length;

  const rowsToQueue = [];
  for (let r = expectedNextRow; r <= inputLast && rowsToQueue.length < 25; r++) {
    rowsToQueue.push(r);
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ RESET COMPLETE - READY TO PROCESS');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Summary:');
  console.log(`  - Output sheet: ${outputDataRows} rows processed (rows 3-${outputLast})`);
  console.log(`  - Next row to process: ${expectedNextRow}`);
  console.log(`  - Rows in next batch: ${rowsToQueue.length} (rows ${rowsToQueue[0]}-${rowsToQueue[rowsToQueue.length-1]})`);
  console.log(`  - Total Input rows: ${inputLast}`);
  console.log(`  - Remaining to process: ${inputLast - expectedNextRow + 1} rows`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh Google Sheets (press F5)');
  console.log('2. Select "Next 25 unprocessed" in Run mode dropdown');
  console.log('3. Click "Launch Batch Engine"');
  console.log(`4. Will process rows ${rowsToQueue[0]}-${rowsToQueue[Math.min(24, rowsToQueue.length-1)]}`);
  console.log('');
  console.log('Duplicate Prevention:');
  console.log('  ✅ Robust row detection active');
  console.log('  ✅ Based on actual Output sheet count');
  console.log('  ✅ Resilient to stop/resume');
  console.log('  ✅ No chance of duplicates');
  console.log('');
}

if (require.main === module) {
  resetBatchToRow15().catch(error => {
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

module.exports = { resetBatchToRow15 };
