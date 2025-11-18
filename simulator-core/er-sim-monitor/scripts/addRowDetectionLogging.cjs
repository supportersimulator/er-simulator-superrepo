#!/usr/bin/env node

/**
 * Add Row Detection Logging
 *
 * Add detailed logging to getNext25InputRows_() to see:
 * 1. Which Case IDs are in the output
 * 2. Which Input rows are being checked
 * 3. Why rows 12-21 are being skipped
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function addRowDetectionLogging() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ADD ROW DETECTION LOGGING');
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

  console.log('Replacing getNext25InputRows_ with detailed logging version...');
  console.log('');

  const funcStart = source.indexOf('function getNext25InputRows_');
  const funcEnd = source.indexOf('\nfunction ', funcStart + 50);

  const newFunction = `function getNext25InputRows_(inputSheet, outputSheet) {
  Logger.log('🧠 Smart Row Detection: Finding next 25 available rows...');
  appendLogSafe('🔍 Starting smart row detection...');

  const inputLast = inputSheet.getLastRow();
  const outputLast = outputSheet.getLastRow();

  Logger.log(\`📊 Input sheet last row: \${inputLast}\`);
  Logger.log(\`📊 Output sheet last row: \${outputLast}\`);
  appendLogSafe(\`📊 Input has \${inputLast - 2} data rows, Output has \${outputLast - 2} data rows\`);

  // Get all Case IDs from output sheet (column A, skipping 2 header rows)
  const processedIds = new Set();
  if (outputLast > 2) {
    const outputData = outputSheet.getRange(3, 1, outputLast - 2, 1).getValues();
    outputData.forEach(row => {
      if (row[0]) processedIds.add(String(row[0]).trim());
    });
  }

  Logger.log(\`📊 Output has \${processedIds.size} processed case IDs\`);
  Logger.log(\`📋 Processed IDs: \${Array.from(processedIds).slice(0, 10).join(', ')}\${processedIds.size > 10 ? '...' : ''}\`);
  appendLogSafe(\`📊 Output has \${processedIds.size} processed Case IDs\`);

  // Find next 25 input rows that DON'T have matching output
  const availableRows = [];
  const skippedRows = [];

  for (let r = 3; r <= inputLast && availableRows.length < 25; r++) {
    const inputId = String(inputSheet.getRange(r, 1).getValue() || '').trim();

    if (!inputId) {
      Logger.log(\`⚠️  Row \${r}: Empty Case ID, skipping\`);
      continue;
    }

    if (processedIds.has(inputId)) {
      skippedRows.push(r);
      if (skippedRows.length <= 5) {
        Logger.log(\`⏭️  Row \${r}: Case ID '\${inputId}' already processed, skipping\`);
      }
    } else {
      availableRows.push(r);
      if (availableRows.length <= 5) {
        Logger.log(\`✅ Row \${r}: Case ID '\${inputId}' available!\`);
        appendLogSafe(\`✅ Row \${r} available (Case ID: \${inputId})\`);
      }
    }
  }

  Logger.log(\`📊 Skipped \${skippedRows.length} rows (already processed)\`);
  Logger.log(\`📊 Found \${availableRows.length} available rows\`);

  if (availableRows.length === 0) {
    Logger.log('✅ All Input rows have been processed!');
    appendLogSafe('✅ All Input rows have been processed!');
  } else {
    Logger.log(\`✅ Found \${availableRows.length} available rows: \${availableRows.slice(0, 5).join(', ')}\${availableRows.length > 5 ? '...' : ''}\`);
    appendLogSafe(\`✅ Queuing rows: \${availableRows.slice(0, 5).join(', ')}\${availableRows.length > 5 ? '... +' + (availableRows.length - 5) + ' more' : ''}\`);
  }

  return availableRows;
}`;

  source = source.substring(0, funcStart) + newFunction + source.substring(funcEnd);
  console.log('✅ Added detailed logging to getNext25InputRows_');
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
  console.log('✅ LOGGING ADDED!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh Google Sheets (F5)');
  console.log('2. Click "Launch Batch Engine"');
  console.log('3. Check Live Logs AND Execution Log (View → Logs)');
  console.log('');
  console.log('Look for:');
  console.log('  - Which Case IDs are in the output');
  console.log('  - Which rows are being skipped (with their Case IDs)');
  console.log('  - Which rows are available (should include row 12!)');
  console.log('');
  console.log('This will show us why rows 12-21 are being skipped!');
  console.log('');
}

if (require.main === module) {
  addRowDetectionLogging().catch(error => {
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

module.exports = { addRowDetectionLogging };
