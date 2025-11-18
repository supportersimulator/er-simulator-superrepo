#!/usr/bin/env node

/**
 * Add Test Batch Function
 *
 * Adds a simple test function to manually trigger batch processing
 * so we can see the actual error that occurs
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function addTestFunction() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ADD TEST BATCH FUNCTION');
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

  console.log('📖 Reading current code...');
  const response = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = response.data.files;

  const codeFile = files.find(f => f.name === 'Code');
  let source = codeFile.source;

  console.log('✅ Found Code.gs');
  console.log('');

  // Check if function already exists
  if (source.indexOf('function testBatchProcessRow3()') !== -1) {
    console.log('⚠️  Test function already exists');
    console.log('');
    console.log('You can now manually run testBatchProcessRow3() from the');
    console.log('Apps Script editor to see the error details.');
    console.log('');
    return;
  }

  console.log('🔄 Adding test function...');

  const testFunction = `
// === TEST FUNCTION: Manually trigger batch processing ===
function testBatchProcessRow3() {
  try {
    const ss = SpreadsheetApp.getActive();
    const inSheet = ss.getSheetByName('Input');
    const outSheet = ss.getSheetByName('Master Scenario Convert');

    Logger.log('📋 Starting test batch for Input row 3...');

    const summary = processOneInputRow_(inSheet, outSheet, 3, true);

    Logger.log('✅ Result: ' + JSON.stringify(summary));

    return {
      success: true,
      summary: summary,
      message: summary.message || 'Completed'
    };

  } catch (err) {
    Logger.log('❌ ERROR: ' + err.message);
    Logger.log('Stack: ' + err.stack);

    return {
      success: false,
      error: err.message,
      stack: err.stack,
      errorDetails: err.toString()
    };
  }
}
`;

  // Add at the end
  source += '\n' + testFunction;
  console.log('✅ Added test function');
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
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ TEST FUNCTION ADDED');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('How to test:');
  console.log('1. Open Apps Script editor (Extensions → Apps Script)');
  console.log('2. Select function: testBatchProcessRow3');
  console.log('3. Click Run');
  console.log('4. Check Execution log for error details');
  console.log('');
  console.log('This will process Input row 3 and show the full error');
  console.log('message and stack trace in the logs.');
  console.log('');
}

if (require.main === module) {
  addTestFunction().catch(error => {
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

module.exports = { addTestFunction };
