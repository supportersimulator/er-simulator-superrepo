#!/usr/bin/env node

/**
 * Add Log Diagnostic Function
 *
 * Adds a test function to Apps Script that you can run manually to:
 * 1. Test if appendLogSafe() is working
 * 2. Check if Document Properties are readable
 * 3. Verify the Live Logs polling works
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function addLogDiagnostic() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ADD LOG DIAGNOSTIC FUNCTION');
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

  console.log('Adding diagnostic function...');

  const diagnosticFunction = `

// === DIAGNOSTIC FUNCTION: Test Live Logging System ===
function testLiveLogging() {
  try {
    Logger.log('🔍 Starting Live Logging Diagnostic Test');

    // Test 1: Can we write to Document Properties?
    Logger.log('Test 1: Writing to Document Properties...');
    appendLogSafe('🧪 TEST LOG 1: appendLogSafe() is working!');
    Logger.log('✅ Test 1 passed');

    // Test 2: Can we read back what we wrote?
    Logger.log('Test 2: Reading from Document Properties...');
    const logs = getSidebarLogs();
    Logger.log('Retrieved logs: ' + logs);
    Logger.log('✅ Test 2 passed');

    // Test 3: Add more logs
    Logger.log('Test 3: Adding multiple log entries...');
    appendLogSafe('🧪 TEST LOG 2: Second entry');
    appendLogSafe('🧪 TEST LOG 3: Third entry with timestamp');
    Logger.log('✅ Test 3 passed');

    // Test 4: Read final result
    const finalLogs = getSidebarLogs();
    Logger.log('Final logs content:');
    Logger.log(finalLogs);

    return {
      success: true,
      message: 'All tests passed! Check execution logs for details.',
      logsLength: finalLogs.length,
      logsPreview: finalLogs.substring(0, 200)
    };

  } catch (err) {
    Logger.log('❌ ERROR: ' + err.message);
    Logger.log('Stack: ' + err.stack);
    return {
      success: false,
      error: err.message,
      stack: err.stack
    };
  }
}

// === DIAGNOSTIC FUNCTION: Check if batch mode flag is set ===
function testBatchModeFlag() {
  try {
    const inSheet = SpreadsheetApp.getActive().getSheetByName('Input');
    const outSheet = SpreadsheetApp.getActive().getSheetByName('Master Scenario Convert');

    Logger.log('🔍 Testing batch mode flag...');
    Logger.log('');

    // Call processOneInputRow_ with batchMode=true
    Logger.log('Calling processOneInputRow_ with batchMode=true on row 3...');
    const result = processOneInputRow_(inSheet, outSheet, 3, true);

    Logger.log('Result: ' + JSON.stringify(result));
    Logger.log('');
    Logger.log('Now check Document Properties:');

    const logs = getSidebarLogs();
    Logger.log('Sidebar_Logs content:');
    Logger.log(logs || '(empty)');

    return {
      success: true,
      result: result,
      logsFound: logs && logs.length > 0,
      logsLength: (logs || '').length,
      logsPreview: (logs || '').substring(0, 300)
    };

  } catch (err) {
    Logger.log('❌ ERROR: ' + err.message);
    return {
      success: false,
      error: err.message
    };
  }
}
`;

  // Check if functions already exist
  if (source.indexOf('function testLiveLogging()') !== -1) {
    console.log('⚠️  Diagnostic functions already exist');
    console.log('');
  } else {
    // Add at the end
    source += '\n' + diagnosticFunction;
    console.log('✅ Added diagnostic functions');
    console.log('');

    // Upload
    console.log('💾 Uploading...');
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
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ DIAGNOSTIC FUNCTIONS ADDED');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('How to test:');
  console.log('');
  console.log('1. Open Apps Script editor (Tools → Script editor)');
  console.log('2. In function dropdown, select: testLiveLogging');
  console.log('3. Click Run (▶)');
  console.log('4. Check execution log (View → Logs or Ctrl+Enter)');
  console.log('');
  console.log('Then in your sidebar:');
  console.log('5. Click the "Refresh" button in Live Logs');
  console.log('6. You should see the test log entries appear!');
  console.log('');
  console.log('If logs appear after this test, it means appendLogSafe()');
  console.log('works, but batch processing is not calling it properly.');
  console.log('');
}

if (require.main === module) {
  addLogDiagnostic().catch(error => {
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

module.exports = { addLogDiagnostic };
