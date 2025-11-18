#!/usr/bin/env node

/**
 * Update Apps Script to change "First 25 rows" to "Next 25 unprocessed rows"
 *
 * This updates the batch mode to intelligently find the next 25 Input rows
 * that haven't been processed yet by checking against Conversion_Status signatures
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function updateBatchMode() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  UPDATE BATCH MODE: First 25 → Next 25 Unprocessed');
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

  // Step 1: Read current Apps Script code
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

  // Step 2: Update the dropdown label
  console.log('🔄 Updating dropdown label...');
  source = source.replace(
    '<option value="25">First 25 rows</option>',
    '<option value="next25">Next 25 unprocessed</option>'
  );
  console.log('✅ Updated dropdown: "First 25 rows" → "Next 25 unprocessed"');
  console.log('');

  // Step 3: Add helper function to find unprocessed rows
  console.log('🔄 Adding helper function to find unprocessed rows...');

  const helperFunction = `
// === HELPER: Find next unprocessed Input rows ===
function findUnprocessedInputRows_(inputSheet, outputSheet, limit) {
  // Get all content signatures from output sheet's Conversion_Status column
  const outputData = outputSheet.getDataRange().getValues();
  const header2 = outputData[1] || [];
  const metaIdx = header2.indexOf('Conversion_Status');

  const processedSigs = new Set();
  if (metaIdx > -1) {
    // Collect all signatures from Conversion_Status column (skip header rows)
    for (let r = 2; r < outputData.length; r++) {
      const val = outputData[r][metaIdx];
      if (val && String(val).trim()) {
        // Extract signature (it may be stored as "value | signature")
        const parts = String(val).split('|').map(s => s.trim());
        processedSigs.add(parts[parts.length - 1]); // Last part is the signature
      }
    }
  }

  // Read all Input rows and find unprocessed ones
  const inputData = inputSheet.getDataRange().getValues();
  const unprocessedRows = [];

  for (let r = 1; r < inputData.length; r++) { // Start at row 2 (index 1), skip header
    const row = inputData[r];

    // Extract Input columns: A=Formal_Info, B=HTML, C=DOC, D=Extra
    const formal = String(row[0] || '');
    const html = String(row[1] || '');
    const docRaw = String(row[2] || '');
    const extra = String(row[3] || '');

    // Skip empty rows
    if (!formal && !html && !docRaw && !extra) continue;

    // Generate signature for this row (same logic as processOneInputRow_)
    const sniff = (formal + '\\n' + html + '\\n' + docRaw + '\\n' + extra).slice(0, 1000);
    const sig = hashText(sniff);

    // Check if this signature is already processed
    if (!processedSigs.has(sig)) {
      unprocessedRows.push(r + 1); // Convert to 1-based row number

      if (unprocessedRows.length >= limit) break; // Stop when we have enough
    }
  }

  return unprocessedRows;
}
`;

  // Find a good place to insert the helper function (before startBatchFromSidebar)
  const insertBeforePattern = /function startBatchFromSidebar/;
  const insertPos = source.search(insertBeforePattern);

  if (insertPos === -1) {
    throw new Error('Could not find insertion point for helper function');
  }

  source = source.slice(0, insertPos) + helperFunction + '\n' + source.slice(insertPos);
  console.log('✅ Added findUnprocessedInputRows_ helper function');
  console.log('');

  // Step 4: Update the startBatchFromSidebar case '25' logic
  console.log('🔄 Updating batch mode logic...');

  const oldCaseLogic = `    case '25':
      for (let r = 2; r < 2 + 25 && r <= last; r++) rows.push(r);
      break;`;

  const newCaseLogic = `    case 'next25':
    case '25': // Keep for backward compatibility
      rows = findUnprocessedInputRows_(inSheet, outSheet, 25);
      if (rows.length === 0) {
        return 'No unprocessed rows found. All Input rows have been processed!';
      }
      break;`;

  source = source.replace(oldCaseLogic, newCaseLogic);
  console.log('✅ Updated batch mode logic to find next 25 unprocessed rows');
  console.log('');

  // Step 5: Upload updated code
  console.log('💾 Uploading updated code to Apps Script...');

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
  console.log('✅ UPDATE COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Changes made:');
  console.log('1. Dropdown now shows "Next 25 unprocessed" instead of "First 25 rows"');
  console.log('2. Added findUnprocessedInputRows_() helper function');
  console.log('3. Updated batch mode logic to:');
  console.log('   - Read all Conversion_Status signatures from Master Scenario Convert');
  console.log('   - Check each Input row hash against processed signatures');
  console.log('   - Select next 25 Input rows that haven\'t been processed yet');
  console.log('');
  console.log('Next steps:');
  console.log('1. Open Google Sheets sidebar');
  console.log('2. Select "Next 25 unprocessed" mode');
  console.log('3. Click "Launch Batch Engine"');
  console.log('4. System will automatically find and process next 25 unprocessed rows');
  console.log('');
}

if (require.main === module) {
  updateBatchMode().catch(error => {
    console.error('');
    console.error('❌ UPDATE FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { updateBatchMode };
