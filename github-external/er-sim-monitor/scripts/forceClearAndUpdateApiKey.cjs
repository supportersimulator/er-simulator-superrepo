#!/usr/bin/env node

/**
 * Force Clear API Key Cache and Update
 *
 * Direct approach:
 * 1. Read current Settings sheet to see what API key is there
 * 2. Modify readApiKey_() to always read from Settings (bypass cache)
 * 3. Or delete the cache property directly via API
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function forceClearAndUpdateApiKey() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  FORCE CLEAR API KEY CACHE');
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

  console.log('Step 1: Modifying readApiKey_() to ALWAYS read fresh from Settings...');
  console.log('');

  // Find readApiKey_ function
  const funcStart = source.indexOf('function readApiKey_()');
  if (funcStart === -1) {
    console.log('❌ Could not find readApiKey_ function');
    return;
  }

  const funcEnd = source.indexOf('\n}', funcStart) + 2;
  const oldFunc = source.substring(funcStart, funcEnd);

  console.log('Current function:');
  console.log(oldFunc);
  console.log('');

  // Replace with version that always reads from Settings (no cache)
  const newFunc = `function readApiKey_() {
  // Always read fresh from Settings sheet (bypass cache for now)
  const fromSheet = syncApiKeyFromSettingsSheet_();
  if (fromSheet) {
    // Update cache for future, but don't rely on it
    setProp(SP_KEYS.API_KEY, fromSheet);
    return fromSheet;
  }
  // Fallback to cache only if Settings sheet fails
  const cached = getProp(SP_KEYS.API_KEY, '').trim();
  return cached;
}`;

  source = source.substring(0, funcStart) + newFunc + source.substring(funcEnd);
  console.log('✅ Modified readApiKey_() to always read fresh from Settings');
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

  console.log('✅ Code updated!');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ API KEY NOW READS FRESH FROM SETTINGS!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Changes:');
  console.log('  - readApiKey_() now ALWAYS reads from Settings sheet first');
  console.log('  - Bypasses the cache completely');
  console.log('  - Will use whatever API key is in Settings!B1');
  console.log('');
  console.log('Next steps:');
  console.log('1. Verify Settings sheet cell B1 has your NEW API key');
  console.log('2. Refresh Google Sheets (F5)');
  console.log('3. Click "Launch Batch Engine"');
  console.log('4. Will use the fresh API key from Settings!');
  console.log('');
}

if (require.main === module) {
  forceClearAndUpdateApiKey().catch(error => {
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

module.exports = { forceClearAndUpdateApiKey };
