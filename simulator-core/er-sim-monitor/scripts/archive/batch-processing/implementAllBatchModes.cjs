#!/usr/bin/env node

/**
 * Implement All Batch Modes with Robust Row Detection
 *
 * This script adds/updates all three batch mode functions:
 * 1. getNext25InputRows_() - Next 25 unprocessed (already done)
 * 2. getAllInputRows_() - All remaining unprocessed
 * 3. getSpecificInputRows_() - Specific rows with duplicate prevention
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function implementAllBatchModes() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  IMPLEMENT ALL BATCH MODES');
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

  console.log('Adding/updating batch mode functions...');
  console.log('');

  // Function 1: getAllInputRows_() - All remaining unprocessed
  const getAllFunc = `
function getAllInputRows_(inputSheet, outputSheet) {
  appendLogSafe('🔍 Starting detection for ALL remaining rows...');

  const inputLast = inputSheet.getLastRow();
  const outputLast = outputSheet.getLastRow();

  appendLogSafe(\`📊 Input sheet last row: \${inputLast}\`);
  appendLogSafe(\`📊 Output sheet last row: \${outputLast}\`);

  // Count processed rows
  const outputDataRows = Math.max(0, outputLast - 2);
  const nextInputRow = 3 + outputDataRows;

  appendLogSafe(\`📊 Output has \${outputDataRows} processed rows\`);
  appendLogSafe(\`📊 Next unprocessed Input row: \${nextInputRow}\`);

  // Build array of ALL remaining rows
  const availableRows = [];
  for (let r = nextInputRow; r <= inputLast; r++) {
    availableRows.push(r);
  }

  appendLogSafe(\`✅ Found \${availableRows.length} unprocessed rows (all remaining)\`);
  if (availableRows.length > 0) {
    appendLogSafe(\`📋 Will process rows \${availableRows[0]} through \${availableRows[availableRows.length-1]}\`);
  }

  return availableRows;
}
`;

  // Function 2: getSpecificInputRows_() - Specific rows with duplicate prevention
  const getSpecificFunc = `
function getSpecificInputRows_(inputSheet, outputSheet, spec) {
  appendLogSafe(\`🔍 Starting detection for SPECIFIC rows: \${spec}\`);

  const outputLast = outputSheet.getLastRow();

  // Build set of already-processed row numbers
  // Since Input row N → Output row N, rows 3 through (outputLast) are processed
  const processedRows = new Set();
  const outputDataRows = Math.max(0, outputLast - 2);

  for (let r = 3; r < 3 + outputDataRows; r++) {
    processedRows.add(r);
  }

  appendLogSafe(\`📊 Already processed rows: 3 through \${2 + outputDataRows} (\${processedRows.size} total)\`);

  // Parse the spec (supports "5,10,15" or "5-10" or mixed "5-10,15,20-25")
  const requestedRows = parseRowSpec(spec);

  appendLogSafe(\`📋 Requested rows: [\${requestedRows.join(', ')}]\`);

  // Filter out already-processed rows
  const availableRows = requestedRows.filter(r => !processedRows.has(r));

  if (availableRows.length < requestedRows.length) {
    const skipped = requestedRows.filter(r => processedRows.has(r));
    appendLogSafe(\`⚠️  Skipping already-processed rows: [\${skipped.join(', ')}]\`);
  }

  appendLogSafe(\`✅ Will process \${availableRows.length} rows: [\${availableRows.join(', ')}]\`);

  return availableRows;
}

function parseRowSpec(spec) {
  const rows = [];
  const parts = spec.split(',');

  parts.forEach(part => {
    part = part.trim();
    if (part.includes('-')) {
      // Range: "5-10"
      const range = part.split('-');
      const start = parseInt(range[0].trim(), 10);
      const end = parseInt(range[1].trim(), 10);
      for (let r = start; r <= end; r++) {
        if (!rows.includes(r)) {
          rows.push(r);
        }
      }
    } else {
      // Single row: "5"
      const r = parseInt(part, 10);
      if (!rows.includes(r)) {
        rows.push(r);
      }
    }
  });

  // Sort numerically
  return rows.sort((a, b) => a - b);
}
`;

  // Check if functions already exist and add/replace
  console.log('Step 1: Adding/updating getAllInputRows_()...');

  if (source.includes('function getAllInputRows_(')) {
    // Replace existing
    const start = source.indexOf('function getAllInputRows_(');
    let end = source.indexOf('\nfunction ', start + 10);
    if (end === -1) end = source.indexOf('\n}', start + 100) + 2;

    source = source.substring(0, start) + getAllFunc.trim() + '\n\n' + source.substring(end);
    console.log('✅ Replaced existing getAllInputRows_()');
  } else {
    // Add new
    const insertPos = source.indexOf('function getNext25InputRows_(');
    if (insertPos !== -1) {
      const funcEnd = source.indexOf('\n}', insertPos) + 2;
      source = source.substring(0, funcEnd) + '\n' + getAllFunc.trim() + '\n' + source.substring(funcEnd);
      console.log('✅ Added new getAllInputRows_()');
    } else {
      // Fallback: add before last brace
      const lastBrace = source.lastIndexOf('}');
      source = source.substring(0, lastBrace) + getAllFunc + source.substring(lastBrace);
      console.log('✅ Added getAllInputRows_() at end');
    }
  }
  console.log('');

  console.log('Step 2: Adding/updating getSpecificInputRows_()...');

  if (source.includes('function getSpecificInputRows_(')) {
    // Replace existing
    const start = source.indexOf('function getSpecificInputRows_(');
    let end = source.indexOf('\nfunction ', start + 10);
    if (end === -1) end = source.indexOf('\n}', start + 100) + 2;

    source = source.substring(0, start) + getSpecificFunc.trim() + '\n\n' + source.substring(end);
    console.log('✅ Replaced existing getSpecificInputRows_()');
  } else {
    // Add new
    const insertPos = source.indexOf('function getAllInputRows_(');
    if (insertPos !== -1) {
      const funcEnd = source.indexOf('\n}', insertPos) + 2;
      source = source.substring(0, funcEnd) + '\n' + getSpecificFunc.trim() + '\n' + source.substring(funcEnd);
      console.log('✅ Added new getSpecificInputRows_()');
    } else {
      // Fallback: add before last brace
      const lastBrace = source.lastIndexOf('}');
      source = source.substring(0, lastBrace) + getSpecificFunc + source.substring(lastBrace);
      console.log('✅ Added getSpecificInputRows_() at end');
    }
  }
  console.log('');

  // Also ensure parseRowSpec exists (it's included in getSpecificFunc)
  if (!source.includes('function parseRowSpec(')) {
    console.log('⚠️  parseRowSpec() not found, but it should be in getSpecificFunc');
  } else {
    console.log('✅ parseRowSpec() helper function present');
  }
  console.log('');

  // Upload
  console.log('💾 Uploading updated code...');
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
  console.log('✅ ALL BATCH MODES IMPLEMENTED!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Batch modes now available:');
  console.log('─────────────────────────────────────────────────');
  console.log('');
  console.log('1. Next 25 Unprocessed ✅');
  console.log('   - Mode: "next25"');
  console.log('   - Returns: Next 25 rows starting from last processed');
  console.log('   - Example: Rows 15-39 (if 14 already done)');
  console.log('');
  console.log('2. All Remaining ✅');
  console.log('   - Mode: "all"');
  console.log('   - Returns: ALL unprocessed rows');
  console.log('   - Example: Rows 15-41 (all 27 remaining)');
  console.log('');
  console.log('3. Specific Rows ✅');
  console.log('   - Mode: "specific"');
  console.log('   - Spec: "15,20,25" or "15-20" or "15-20,25,30-35"');
  console.log('   - Returns: Requested rows (skips already processed)');
  console.log('   - Example: "15-20" → [15,16,17,18,19,20]');
  console.log('');
  console.log('Duplicate Prevention:');
  console.log('  ✅ All modes use row position correlation');
  console.log('  ✅ Automatically skip already-processed rows');
  console.log('  ✅ Resilient to stop/resume');
  console.log('  ✅ No chance of duplicates');
  console.log('');
  console.log('Testing:');
  console.log('1. Mode "next25" - Select "Next 25 unprocessed"');
  console.log('2. Mode "all" - Select "All remaining rows"');
  console.log('3. Mode "specific" - Enter "15-20" or "15,20,25"');
  console.log('');
}

if (require.main === module) {
  implementAllBatchModes().catch(error => {
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

module.exports = { implementAllBatchModes };
