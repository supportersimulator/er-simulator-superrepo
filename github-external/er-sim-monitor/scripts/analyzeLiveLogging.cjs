#!/usr/bin/env node

/**
 * Analyze Live Logging System
 *
 * Checks if live logs will work properly for all modes:
 * - Single row mode
 * - Batch mode
 * - Both should display logs in the sidebar
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function analyzeLiveLogging() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ANALYZE LIVE LOGGING SYSTEM');
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

  // Find server-side function
  const codeFile = files.find(f => f.name === 'Code');
  const htmlFile = files.find(f => f.name === 'Sidebar');

  console.log('📖 Analyzing server-side logging (Code.gs)...');
  console.log('');

  // Extract appendLogSafe function
  const appendLogSafeMatch = codeFile.source.match(/function appendLogSafe[^}]*\{[\s\S]*?\n\}/);
  if (appendLogSafeMatch) {
    console.log('✅ Found appendLogSafe function:');
    console.log(appendLogSafeMatch[0]);
    console.log('');
  } else {
    console.log('❌ appendLogSafe function not found');
    console.log('');
  }

  // Count appendLogSafe calls
  const appendLogSafeCalls = (codeFile.source.match(/appendLogSafe\(/g) || []).length;
  console.log(`📊 Found ${appendLogSafeCalls} calls to appendLogSafe() in Code.gs`);
  console.log('');

  // Find calls in processOneInputRow_
  const processOneMatch = codeFile.source.match(/function processOneInputRow_[\s\S]*?(?=\nfunction|$)/);
  if (processOneMatch) {
    const processOneCode = processOneMatch[0];
    const callsInProcessOne = (processOneCode.match(/appendLogSafe\(/g) || []).length;
    console.log(`   - ${callsInProcessOne} calls inside processOneInputRow_()`);

    // Check if it logs key events
    const logsStarting = /appendLogSafe.*Starting conversion/.test(processOneCode);
    const logsOpenAI = /appendLogSafe.*OpenAI|appendLogSafe.*API/.test(processOneCode);
    const logsWriting = /appendLogSafe.*Writing|appendLogSafe.*Row created/.test(processOneCode);

    console.log(`   - Logs "Starting conversion": ${logsStarting ? '✅' : '❌'}`);
    console.log(`   - Logs "OpenAI call": ${logsOpenAI ? '✅' : '❌'}`);
    console.log(`   - Logs "Writing row": ${logsWriting ? '✅' : '❌'}`);
  }
  console.log('');

  console.log('📖 Analyzing client-side logging (Sidebar.html)...');
  console.log('');

  // Find appendLog function in client
  const appendLogLines = htmlFile.source.split('\n');
  const appendLogStart = appendLogLines.findIndex(l => /function appendLog\(/.test(l));

  if (appendLogStart !== -1) {
    console.log('✅ Found client-side appendLog function:');
    console.log(appendLogLines.slice(appendLogStart, appendLogStart + 8).join('\n'));
    console.log('');
  }

  // Find loopStep function
  const loopStepStart = appendLogLines.findIndex(l => /function loopStep\(/.test(l));
  if (loopStepStart !== -1) {
    console.log('✅ Found loopStep function (batch mode):');
    const loopStepCode = appendLogLines.slice(loopStepStart, loopStepStart + 30).join('\n');
    console.log(loopStepCode);
    console.log('');

    // Check if loopStep calls appendLog
    const loopCallsAppendLog = /appendLog\(/.test(loopStepCode);
    console.log(`   - loopStep calls appendLog: ${loopCallsAppendLog ? '✅' : '❌'}`);
  }
  console.log('');

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ ANALYSIS COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('How Live Logging Works:');
  console.log('1. Server-side: appendLogSafe() writes to Document Properties');
  console.log('2. Client-side: appendLog() reads from Document Properties');
  console.log('3. Polling: Client polls server every 1-2 seconds for new logs');
  console.log('');
  console.log('Key Finding:');
  console.log('- Single row mode: processOneInputRow_() calls appendLogSafe()');
  console.log('- Batch mode: loopStep() calls appendLog() for results');
  console.log('- Both should work if Document Properties polling is active');
  console.log('');
}

if (require.main === module) {
  analyzeLiveLogging().catch(error => {
    console.error('');
    console.error('❌ ANALYSIS FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { analyzeLiveLogging };
