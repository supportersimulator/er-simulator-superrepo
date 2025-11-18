#!/usr/bin/env node

/**
 * Fix the "Next 25 Unprocessed" batch mode
 *
 * The previous update had issues:
 * 1. Helper function may not have been added correctly
 * 2. Case statement wasn't properly updated
 * 3. Mode value in dropdown might be truncated
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function fixBatchMode() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FIX BATCH MODE: Next 25 Unprocessed');
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

  // Read current code
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

  // Fix 1: Update dropdown to use shorter value that won't get truncated
  console.log('🔄 Fixing dropdown option value...');
  source = source.replace(
    /<option value="next25">Next 25 unprocessed<\/option>/,
    '<option value="next25">Next 25 unprocessed</option>'
  );

  // Also try the old one if it still exists
  source = source.replace(
    /<option value="25">First 25 rows<\/option>/,
    '<option value="next25">Next 25 unprocessed</option>'
  );
  console.log('✅ Updated dropdown');
  console.log('');

  // Fix 2: Ensure helper function exists (remove if duplicate, then add clean version)
  console.log('🔄 Ensuring helper function is present...');

  // Remove any existing versions of the function
  source = source.replace(/\/\/ === HELPER: Find next unprocessed Input rows ===[\s\S]*?^}/gm, '');
  source = source.replace(/function findUnprocessedInputRows_[\s\S]*?^}/gm, '');

  const helperFunction = `
// === HELPER: Find next unprocessed Input rows ===
function findUnprocessedInputRows_(inputSheet, outputSheet, limit) {
  Logger.log(\`🔍 Finding next \${limit} unprocessed rows...\`);

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

  Logger.log(\`📊 Found \${processedSigs.size} already-processed signatures\`);

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

  Logger.log(\`✅ Found \${unprocessedRows.length} unprocessed rows: \${unprocessedRows.slice(0, 5).join(', ')}\${unprocessedRows.length > 5 ? '...' : ''}\`);
  return unprocessedRows;
}
`;

  // Insert before startBatchFromSidebar
  const insertPos = source.indexOf('function startBatchFromSidebar');
  if (insertPos === -1) {
    throw new Error('Could not find startBatchFromSidebar function');
  }

  source = source.slice(0, insertPos) + helperFunction + '\n' + source.slice(insertPos);
  console.log('✅ Added helper function');
  console.log('');

  // Fix 3: Update the switch case in startBatchFromSidebar
  console.log('🔄 Updating batch mode switch case...');

  const oldSwitch = `  switch (mode) {
    case 'one':
      return 'Use "Process ONE case" button for single.';
    case '25':
      for (let r = 2; r < 2 + 25 && r <= last; r++) rows.push(r);
      break;
    case 'specific':
      rows = parseRowSpec_(spec);
      break;
    case 'all':
    default:
      for (let r = 2; r <= last; r++) rows.push(r);
  }`;

  const newSwitch = `  switch (mode) {
    case 'one':
      return 'Use "Process ONE case" button for single.';
    case 'next25':
    case '25': // Keep for backward compatibility
      rows = findUnprocessedInputRows_(inSheet, outSheet, 25);
      if (rows.length === 0) {
        return 'No unprocessed rows found. All Input rows have been processed!';
      }
      Logger.log(\`📋 Queuing \${rows.length} unprocessed rows: \${rows.slice(0, 5).join(', ')}\`);
      break;
    case 'specific':
      rows = parseRowSpec_(spec);
      break;
    case 'all':
    default:
      for (let r = 2; r <= last; r++) rows.push(r);
  }`;

  source = source.replace(oldSwitch, newSwitch);
  console.log('✅ Updated switch case');
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
  console.log('✅ FIX COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Changes made:');
  console.log('1. Fixed dropdown option value (next25)');
  console.log('2. Added/fixed findUnprocessedInputRows_() helper function');
  console.log('3. Updated switch case to call helper function');
  console.log('4. Added logging to track what rows are being queued');
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh your Google Sheets tab');
  console.log('2. Open sidebar again');
  console.log('3. Select "Next 25 unprocessed" mode');
  console.log('4. Click "Launch Batch Engine"');
  console.log('5. Check Apps Script logs to see what rows were found');
  console.log('');
}

if (require.main === module) {
  fixBatchMode().catch(error => {
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

module.exports = { fixBatchMode };
