#!/usr/bin/env node

/**
 * Implement Smart Batch Mode
 *
 * Strategy:
 * 1. Count how many rows exist in Master Scenario Convert (output sheet)
 * 2. Calculate next 25 Input rows to process based on output count
 * 3. Automatically advance with each batch
 *
 * Example:
 * - Master has 10 rows (8 data + 2 headers) → Process Input rows 2-26
 * - After batch, Master has 35 rows → Process Input rows 27-51
 * - After batch, Master has 60 rows → Process Input rows 52-76
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function implementSmartBatch() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  IMPLEMENT SMART BATCH MODE');
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

  // Remove any existing helper functions
  console.log('🔄 Cleaning up old helper functions...');
  source = source.replace(/\/\/ === HELPER: Find next unprocessed Input rows ===[\\s\\S]*?^function startBatchFromSidebar/gm, 'function startBatchFromSidebar');
  source = source.replace(/function findUnprocessedInputRows_[\\s\\S]*?^}/gm, '');
  console.log('✅ Removed old helper functions');
  console.log('');

  // Add new smart helper function
  console.log('🔄 Adding smart batch helper function...');

  const helperFunction = `
// === SMART BATCH: Calculate next 25 rows based on output sheet progress ===
function getNext25InputRows_(inputSheet, outputSheet) {
  Logger.log('🧠 Smart Batch: Calculating next 25 rows to process...');

  // Count existing data rows in output sheet (skip 2-tier headers)
  const outputLastRow = outputSheet.getLastRow();
  const outputDataRows = Math.max(0, outputLastRow - 2); // Subtract 2 header rows

  Logger.log(\`📊 Output sheet has \${outputDataRows} processed rows\`);

  // Calculate starting Input row for next batch
  // Each output row corresponds to one Input row
  // Input row 2 = first data row, so:
  // If 0 output rows processed → start at Input row 2
  // If 25 output rows processed → start at Input row 27
  // If 50 output rows processed → start at Input row 52
  const startRow = 2 + outputDataRows;
  const endRow = startRow + 24; // Process 25 rows

  const inputLastRow = inputSheet.getLastRow();
  const actualEndRow = Math.min(endRow, inputLastRow);

  Logger.log(\`📋 Next batch: Input rows \${startRow}-\${actualEndRow}\`);

  const rows = [];
  for (let r = startRow; r <= actualEndRow; r++) {
    rows.push(r);
  }

  if (rows.length === 0) {
    Logger.log('✅ All Input rows have been processed!');
  } else {
    Logger.log(\`✅ Queuing \${rows.length} rows for processing\`);
  }

  return rows;
}
`;

  // Insert before startBatchFromSidebar
  const insertPos = source.indexOf('function startBatchFromSidebar');
  if (insertPos === -1) {
    throw new Error('Could not find startBatchFromSidebar function');
  }

  source = source.slice(0, insertPos) + helperFunction + '\n' + source.slice(insertPos);
  console.log('✅ Added smart batch helper function');
  console.log('');

  // Update the switch case to use the new helper
  console.log('🔄 Updating batch mode switch case...');

  const newSwitch = `  switch (mode) {
    case 'one':
      return 'Use "Process ONE case" button for single.';
    case 'next25':
    case '25': // Keep for backward compatibility
      rows = getNext25InputRows_(inSheet, outSheet);
      if (rows.length === 0) {
        return '✅ All Input rows have been processed! No more rows to process.';
      }
      Logger.log(\`📋 Smart Batch queuing \${rows.length} rows: \${rows[0]}-\${rows[rows.length-1]}\`);
      break;
    case 'specific':
      rows = parseRowSpec_(spec);
      break;
    case 'all':
    default:
      for (let r = 2; r <= last; r++) rows.push(r);
  }`;

  // Find and replace the switch statement
  const switchPattern = /  switch \(mode\) \{[\s\S]*?  \}/m;
  if (!switchPattern.test(source)) {
    throw new Error('Could not find switch statement to replace');
  }

  source = source.replace(switchPattern, newSwitch);
  console.log('✅ Updated switch case');
  console.log('');

  // Upload
  console.log('💾 Uploading smart batch code...');
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
  console.log('✅ SMART BATCH IMPLEMENTED');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('How it works now:');
  console.log('1. Counts processed rows in Master Scenario Convert');
  console.log('2. Calculates next 25 Input rows to process');
  console.log('3. Automatically advances with each batch');
  console.log('');
  console.log('Example progression:');
  console.log('  0 rows processed → Process Input rows 2-26');
  console.log('  25 rows processed → Process Input rows 27-51');
  console.log('  50 rows processed → Process Input rows 52-76');
  console.log('  ...');
  console.log('  150 rows processed → Process Input rows 152-176');
  console.log('');
  console.log('Benefits:');
  console.log('✅ Fully automatic - just keep clicking "Launch Batch Engine"');
  console.log('✅ No manual row calculation needed');
  console.log('✅ Safe to run multiple times (duplicate detection still works)');
  console.log('✅ Shows completion message when all rows processed');
  console.log('');
}

if (require.main === module) {
  implementSmartBatch().catch(error => {
    console.error('');
    console.error('❌ IMPLEMENTATION FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { implementSmartBatch };
