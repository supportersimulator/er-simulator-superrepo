#!/usr/bin/env node

/**
 * Debug Script Properties Storage
 *
 * Issue: Rows are being saved but read back as empty
 *
 * "Saved queue with 20 rows: [22,23,24,25,26]"
 * "Verified BATCH_ROWS has 0 rows"
 *
 * Need to see:
 * 1. What setProp actually saves
 * 2. What getProp actually returns
 * 3. If there's a size limit issue
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function debugScriptProperties() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  DEBUG SCRIPT PROPERTIES STORAGE');
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

  console.log('Step 1: Adding detailed logging to setProp calls...');
  console.log('');

  // Find the line where we save BATCH_ROWS
  const startBatchIdx = source.indexOf('function startBatchFromSidebar');
  const batchRowsSetIdx = source.indexOf("setProp('BATCH_ROWS'", startBatchIdx);

  if (batchRowsSetIdx === -1) {
    console.log('❌ Could not find setProp BATCH_ROWS');
    return;
  }

  // Find the line
  const lineStart = source.lastIndexOf('\n', batchRowsSetIdx);
  const lineEnd = source.indexOf(';', batchRowsSetIdx) + 1;
  const oldLine = source.substring(lineStart, lineEnd);

  console.log('Current BATCH_ROWS save:');
  console.log(oldLine.trim());
  console.log('');

  const newLines = `
  const rowsJson = JSON.stringify(rows);
  appendLogSafe('🔍 DEBUG: About to save BATCH_ROWS, JSON length: ' + rowsJson.length + ' chars');
  appendLogSafe('🔍 DEBUG: Sample: ' + rowsJson.substring(0, 50) + '...');
  setProp('BATCH_ROWS', rowsJson);

  // Immediately verify what was saved
  const verifyJson = getProp('BATCH_ROWS', 'NULL');
  if (verifyJson === 'NULL') {
    appendLogSafe('❌ ERROR: BATCH_ROWS was NOT saved! getProp returned NULL');
  } else {
    appendLogSafe('✅ BATCH_ROWS saved, retrieved length: ' + verifyJson.length + ' chars');
    try {
      const verifyParsed = JSON.parse(verifyJson);
      appendLogSafe('✅ BATCH_ROWS parsed successfully, contains ' + verifyParsed.length + ' rows');
    } catch (e) {
      appendLogSafe('❌ ERROR: BATCH_ROWS JSON parse failed: ' + e.message);
    }
  }`;

  source = source.substring(0, lineStart) + newLines + source.substring(lineEnd);
  console.log('✅ Added detailed save/verify logging');
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
  console.log('✅ DEBUG LOGGING ADDED!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh Google Sheets (F5)');
  console.log('2. Click "Launch Batch Engine"');
  console.log('3. Watch Live Logs for:');
  console.log('');
  console.log('Expected messages:');
  console.log('  🔍 DEBUG: About to save BATCH_ROWS, JSON length: XXX chars');
  console.log('  ✅ BATCH_ROWS saved, retrieved length: XXX chars');
  console.log('  ✅ BATCH_ROWS parsed successfully, contains 20 rows');
  console.log('');
  console.log('OR if there is an error:');
  console.log('  ❌ ERROR: BATCH_ROWS was NOT saved! getProp returned NULL');
  console.log('  ❌ ERROR: BATCH_ROWS JSON parse failed: ...');
  console.log('');
  console.log('This will tell us EXACTLY what is happening with Script Properties!');
  console.log('');
}

if (require.main === module) {
  debugScriptProperties().catch(error => {
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

module.exports = { debugScriptProperties };
