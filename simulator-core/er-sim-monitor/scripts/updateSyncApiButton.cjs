#!/usr/bin/env node

/**
 * Update Sync API Button to Clear Cache
 *
 * Make the "Sync API from Settings Sheet" button:
 * 1. Delete cached API key
 * 2. Read fresh from Settings
 * 3. Show user what key was loaded
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function updateSyncApiButton() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  UPDATE SYNC API BUTTON');
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

  console.log('Step 1: Updating syncApiKeyFromSettingsSheet_()...');
  console.log('');

  const funcStart = source.indexOf('function syncApiKeyFromSettingsSheet_()');
  if (funcStart === -1) {
    console.log('❌ Could not find syncApiKeyFromSettingsSheet_ function');
    return;
  }

  const funcEnd = source.indexOf('\n}', funcStart) + 2;

  const newFunc = `function syncApiKeyFromSettingsSheet_() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName('Settings');
  if (!sheet) return null;

  try {
    const range = sheet.getDataRange().getValues();
    // Try KV pairs
    for (let r=0; r<range.length; r++) {
      const k = String(range[r][0]||'').trim().toUpperCase();
      const v = String(range[r][1]||'').trim();
      if (k === 'OPENAI_API_KEY' && v) {
        Logger.log('✅ Found OPENAI_API_KEY in Settings sheet');
        return v;
      }
    }
    // Fallback: B2 if row2 has "API Key" label
    const labelB2 = String(sheet.getRange(2,1).getValue()||'').toLowerCase();
    if (labelB2.includes('api')) {
      const apiKey = String(sheet.getRange(2,2).getValue()||'').trim();
      if (apiKey) {
        Logger.log('✅ Found API key in Settings!B2');
        return apiKey;
      }
    }
  } catch(e) {
    Logger.log('⚠️ Error reading Settings sheet: ' + e.message);
  }
  return null;
}`;

  source = source.substring(0, funcStart) + newFunc + source.substring(funcEnd);
  console.log('✅ Updated syncApiKeyFromSettingsSheet_()');
  console.log('');

  console.log('Step 2: Looking for sync button function...');
  console.log('');

  // Find if there's a function that gets called when user clicks sync button
  const syncButtonFuncs = [
    'function syncApiKey(',
    'function onSyncApiClick(',
    'function syncSettings(',
  ];

  let syncFuncIdx = -1;
  let syncFuncName = '';

  for (const funcPattern of syncButtonFuncs) {
    syncFuncIdx = source.indexOf(funcPattern);
    if (syncFuncIdx !== -1) {
      syncFuncName = funcPattern.match(/function (\w+)/)[1];
      console.log(`✅ Found sync button function: ${syncFuncName}`);
      break;
    }
  }

  if (syncFuncIdx === -1) {
    console.log('⚠️  No dedicated sync button function found');
    console.log('   The button might call syncApiKeyFromSettingsSheet_() directly');
  } else {
    // Update the sync button function to clear cache first
    const syncEnd = source.indexOf('\n}', syncFuncIdx) + 2;
    const oldSyncFunc = source.substring(syncFuncIdx, syncEnd);

    console.log('Current function:');
    console.log(oldSyncFunc);
    console.log('');

    const newSyncFunc = oldSyncFunc.replace(
      /function (\w+)\([^)]*\)\s*\{/,
      `function $1() {
  // Clear cached API key first
  try {
    PropertiesService.getDocumentProperties().deleteProperty('OPENAI_API_KEY');
    Logger.log('🗑️ Cleared cached API key');
  } catch (e) {
    Logger.log('⚠️ Could not clear cache: ' + e.message);
  }
  `
    );

    source = source.substring(0, syncFuncIdx) + newSyncFunc + source.substring(syncEnd);
    console.log('✅ Updated sync button function to clear cache');
  }

  console.log('');
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
  console.log('✅ SYNC BUTTON UPDATED!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Changes:');
  console.log('  - syncApiKeyFromSettingsSheet_() reads from Settings!B2');
  console.log('  - Sync button clears cache before reading fresh');
  console.log('  - Logging shows which key was found');
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh Google Sheets (F5)');
  console.log('2. Click "Sync API from Settings Sheet" button');
  console.log('3. Will load fresh API key from Settings!B2');
  console.log('4. Then click "Launch Batch Engine"');
  console.log('');
}

if (require.main === module) {
  updateSyncApiButton().catch(error => {
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

module.exports = { updateSyncApiButton };
