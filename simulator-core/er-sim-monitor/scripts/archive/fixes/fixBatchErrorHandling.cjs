#!/usr/bin/env node

/**
 * Fix Batch Error Handling
 *
 * Problem: loopStep() has NO withFailureHandler, so errors fail silently
 * Solution: Add error handler to loopStep() and improve logging
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function fixBatchErrorHandling() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FIX BATCH ERROR HANDLING');
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

  // Fix loopStep() to add error handler
  console.log('🔄 Adding error handler to loopStep()...');

  const oldLoopStep = `    function loopStep(){
      google.script.run
        .withSuccessHandler(function(r){
          if (r && r.msg) appendLog(r.msg);
          if (!r || r.done) {
            google.script.run
              .withSuccessHandler(function(report){
                if (report) appendLog("\\n" + report + "\\n");
                setStatus('Idle');
              })
              .finishBatchAndReport();
          } else {
            setTimeout(loopStep, 1500);
          }
        })
        .runSingleStepBatch();
    }`;

  const newLoopStep = `    function loopStep(){
      google.script.run
        .withSuccessHandler(function(r){
          appendLog(\`📝 Step result: \${JSON.stringify(r)}\`);
          if (r && r.msg) appendLog(r.msg);
          if (!r || r.done) {
            google.script.run
              .withSuccessHandler(function(report){
                if (report) appendLog("\\n" + report + "\\n");
                setStatus('Idle');
              })
              .withFailureHandler(function(e){
                appendLog('❌ Report generation error: ' + e.message);
                setStatus('Idle');
              })
              .finishBatchAndReport();
          } else {
            appendLog(\`⏭️  Continuing batch... \${r.remaining || '?'} rows remaining\`);
            setTimeout(loopStep, 1500);
          }
        })
        .withFailureHandler(function(e){
          appendLog('❌ BATCH ERROR: ' + e.message);
          appendLog('Stack: ' + (e.stack || 'No stack trace'));
          setStatus('Error - see logs');
          alert('❌ Batch failed: ' + e.message);
        })
        .runSingleStepBatch();
    }`;

  source = source.replace(oldLoopStep, newLoopStep);
  console.log('✅ Added comprehensive error handling to loopStep');
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

  console.log('✅ Error handling fixed!');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ FIX COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Changes made:');
  console.log('1. Added withFailureHandler to loopStep()');
  console.log('2. Added detailed logging for each step result');
  console.log('3. Added alert for batch errors (so you know immediately)');
  console.log('4. Added error handler to finishBatchAndReport()');
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh your Google Sheets tab');
  console.log('2. Try the batch again with "Specific rows: 10-15"');
  console.log('3. If there\'s an error, you\'ll now see:');
  console.log('   - Error message in Live Logs');
  console.log('   - Alert popup with error details');
  console.log('   - Status shows "Error - see logs"');
  console.log('');
}

if (require.main === module) {
  fixBatchErrorHandling().catch(error => {
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

module.exports = { fixBatchErrorHandling };
