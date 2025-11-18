#!/usr/bin/env node

/**
 * Verify Batch Logging
 *
 * Confirms that all live logging is properly installed for batch mode
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function verifyBatchLogging() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  VERIFY BATCH LOGGING INSTALLATION');
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

  // Extract processOneInputRow_ function
  const match = codeFile.source.match(/function processOneInputRow_[\s\S]{1,15000}?(?=\nfunction [a-zA-Z]|$)/);

  if (!match) {
    throw new Error('Could not find processOneInputRow_ function');
  }

  const funcCode = match[0];

  // Check for expected log messages
  const expectedLogs = [
    { pattern: /appendLogSafe.*Starting conversion/, name: 'Starting conversion' },
    { pattern: /appendLogSafe.*Calling OpenAI/, name: 'Calling OpenAI' },
    { pattern: /appendLogSafe.*Received OpenAI response/, name: 'Received response' },
    { pattern: /appendLogSafe.*Parsing AI response/, name: 'Parsing response' },
    { pattern: /appendLogSafe.*Writing scenario/, name: 'Writing row' },
    { pattern: /appendLogSafe.*Row created successfully/, name: 'Row created' }
  ];

  console.log('Checking for live logging calls in processOneInputRow_():');
  console.log('');

  let allPresent = true;
  expectedLogs.forEach((log, i) => {
    const found = log.pattern.test(funcCode);
    const status = found ? '✅' : '❌';
    console.log(`  ${i + 1}. ${status} ${log.name}`);
    if (!found) allPresent = false;
  });

  console.log('');

  // Count total appendLogSafe calls
  const totalCalls = (funcCode.match(/appendLogSafe\(/g) || []).length;
  console.log(`📊 Total appendLogSafe() calls in processOneInputRow_(): ${totalCalls}`);
  console.log('');

  if (allPresent && totalCalls >= 6) {
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ ALL BATCH LOGGING VERIFIED');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('Batch processing will now show live logs with:');
    console.log('  • Progress updates at each step');
    console.log('  • OpenAI call status');
    console.log('  • Response parsing progress');
    console.log('  • Row writing confirmation');
    console.log('');
    console.log('This matches the visibility of single row mode!');
    console.log('');
    console.log('Next: Test batch processing to see logs in action');
    console.log('');
  } else {
    console.log('═══════════════════════════════════════════════════');
    console.log('⚠️  INCOMPLETE BATCH LOGGING');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('Some logging calls are missing. Review the output above.');
    console.log('');
  }
}

if (require.main === module) {
  verifyBatchLogging().catch(error => {
    console.error('');
    console.error('❌ VERIFICATION FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { verifyBatchLogging };
