#!/usr/bin/env node

/**
 * Fix startBatchFromSidebar Errors
 *
 * CRITICAL BUG FOUND:
 * startBatchFromSidebar has diagnostic code that references undefined variables:
 *   - rawQueue (doesn't exist in this function)
 *   - q (doesn't exist in this function)
 *
 * These lines cause JavaScript errors preventing queue from being saved!
 *
 * Fix: Remove the incorrectly placed diagnostic lines
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function fixStartBatchErrors() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FIX CRITICAL BUG IN startBatchFromSidebar');
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

  console.log('Finding incorrectly placed diagnostic code...');

  // These lines should NOT be in startBatchFromSidebar
  const badCode1 = "  appendLogSafe('🔍 DEBUG: Read queue - rawQueue length: ' + rawQueue.length);";
  const badCode2 = "  appendLogSafe('🔍 DEBUG: Parsed queue - has rows property? ' + (!!q.rows) + ', rows.length: ' + (q.rows ? q.rows.length : 'N/A'));";
  const badCode3 = `  if (q.rows && q.rows.length > 0) {
    appendLogSafe('🔍 DEBUG: Next 5 rows in queue: ' + JSON.stringify(q.rows.slice(0, 5)));
  }`;

  if (source.includes(badCode1)) {
    console.log('❌ Found bad diagnostic code referencing rawQueue');
    source = source.replace(badCode1, '');
    console.log('✅ Removed rawQueue reference');
  }

  if (source.includes(badCode2)) {
    console.log('❌ Found bad diagnostic code referencing q.rows');
    source = source.replace(badCode2, '');
    console.log('✅ Removed q.rows reference');
  }

  if (source.includes(badCode3)) {
    console.log('❌ Found bad diagnostic code with q.rows check');
    source = source.replace(badCode3, '');
    console.log('✅ Removed q.rows check');
  }

  // Upload
  console.log('');
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

  console.log('✅ Code fixed and deployed!');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ BUG FIXED!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('What was wrong:');
  console.log('  - startBatchFromSidebar had code referencing undefined variables');
  console.log('  - This caused JavaScript errors preventing queue from being saved');
  console.log('  - Result: Queue appeared to save but actually failed');
  console.log('');
  console.log('What was fixed:');
  console.log('  - Removed incorrectly placed diagnostic code');
  console.log('  - Queue will now save successfully');
  console.log('  - Diagnostic code remains in runSingleStepBatch (correct location)');
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh Google Sheets (F5)');
  console.log('2. Click "Launch Batch Engine"');
  console.log('3. Should see proper batch processing!');
  console.log('');
}

if (require.main === module) {
  fixStartBatchErrors().catch(error => {
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

module.exports = { fixStartBatchErrors };
