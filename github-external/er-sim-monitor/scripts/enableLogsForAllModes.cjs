#!/usr/bin/env node

/**
 * Enable Logs For All Modes
 *
 * Remove the "if (batchMode)" checks so logs appear in BOTH single and batch mode
 * This matches how single row processing shows alerts - we want live logs for everything!
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function enableLogsForAllModes() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ENABLE LOGS FOR ALL MODES');
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

  console.log('Removing batchMode checks from logging calls...');
  console.log('');

  let changesMade = 0;

  // Replace all instances of "if (batchMode) appendLogSafe" with just "appendLogSafe"
  const patterns = [
    {
      old: /if \(batchMode\) appendLogSafe\(/g,
      new: 'appendLogSafe(',
      desc: 'Unconditional appendLogSafe calls'
    }
  ];

  patterns.forEach(({ old, new: replacement, desc }) => {
    const matches = source.match(old);
    if (matches) {
      source = source.replace(old, replacement);
      console.log(`✅ ${desc}: ${matches.length} replacements`);
      changesMade += matches.length;
    } else {
      console.log(`⚠️  ${desc}: No matches found`);
    }
  });

  console.log('');

  if (changesMade === 0) {
    console.log('⚠️  No changes needed - logs may already be enabled for all modes');
    console.log('');
  } else {
    console.log(`Made ${changesMade} changes total`);
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
  console.log('✅ LOGS ENABLED FOR ALL MODES');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Now logs will appear for:');
  console.log('  • Single row processing');
  console.log('  • Batch processing');
  console.log('  • All modes!');
  console.log('');
  console.log('Test:');
  console.log('1. Refresh Google Sheets');
  console.log('2. Process a single row');
  console.log('3. Click "Refresh" in Live Logs');
  console.log('4. Logs should appear!');
  console.log('');
}

if (require.main === module) {
  enableLogsForAllModes().catch(error => {
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

module.exports = { enableLogsForAllModes };
