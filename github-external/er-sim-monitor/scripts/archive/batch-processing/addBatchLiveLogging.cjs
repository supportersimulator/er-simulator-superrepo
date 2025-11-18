#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function addBatchLiveLogging() {
  console.log('\nAdding live logging to diagnose queue issue...\n');

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

  // Add logging to startBatchFromSidebar AFTER setProp
  const afterSetProp = `  setProp('BATCH_QUEUE', JSON.stringify({
    inputSheetName,
    outputSheetName: finalOutputName,
    rows: rows, // ⭐ Store actual array of row numbers
    mode: mode,
    spec: spec
  }));`;

  const withLogging = `  setProp('BATCH_QUEUE', JSON.stringify({
    inputSheetName,
    outputSheetName: finalOutputName,
    rows: rows, // ⭐ Store actual array of row numbers
    mode: mode,
    spec: spec
  }));
  appendLogSafe('🔍 Saved queue with ' + rows.length + ' rows: ' + JSON.stringify(rows.slice(0, 3)));
  const verify = JSON.parse(getProp('BATCH_QUEUE','{}'));
  appendLogSafe('🔍 Verified queue has: ' + (verify.rows ? verify.rows.length : 0) + ' rows');`;

  if (source.includes(afterSetProp)) {
    source = source.replace(afterSetProp, withLogging);
    console.log('✅ Added logging to startBatchFromSidebar');
  } else {
    console.log('⚠️  Could not find exact setProp pattern');
  }

  // Add logging to runSingleStepBatch
  const oldBatchStart = `function runSingleStepBatch() {
  const rawQueue = getProp('BATCH_QUEUE','{}');
  const q = JSON.parse(rawQueue);

  // Check if we have rows left
  if (!q.rows || q.rows.length === 0) {
    return { done: true, msg: '✅ All rows processed!' };
  }`;

  const newBatchStart = `function runSingleStepBatch() {
  const rawQueue = getProp('BATCH_QUEUE','{}');
  appendLogSafe('🔍 Reading queue: ' + rawQueue.substring(0, 100));
  const q = JSON.parse(rawQueue);
  appendLogSafe('🔍 Queue has ' + (q.rows ? q.rows.length : 0) + ' rows');

  // Check if we have rows left
  if (!q.rows || q.rows.length === 0) {
    appendLogSafe('❌ Queue is empty!');
    return { done: true, msg: '✅ All rows processed!' };
  }`;

  if (source.includes(oldBatchStart)) {
    source = source.replace(oldBatchStart, newBatchStart);
    console.log('✅ Added logging to runSingleStepBatch');
  } else {
    console.log('⚠️  Could not find exact batch start pattern');
  }

  // Upload
  console.log('\n💾 Uploading code with logging...');
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

  console.log('✅ Logging added!\n');
  console.log('Now refresh Google Sheets and run batch mode.');
  console.log('Watch Live Logs for 🔍 DEBUG messages.\n');
}

addBatchLiveLogging().catch(err => console.error('Error:', err.message));
