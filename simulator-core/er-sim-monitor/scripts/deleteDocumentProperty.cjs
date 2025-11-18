#!/usr/bin/env node

/**
 * Delete Document Property Directly
 *
 * The old API key is stuck in DocumentProperties
 * We need to force delete it so the new one gets read from Settings
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function deleteDocumentProperty() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  DELETE CACHED API KEY FROM DOCUMENT PROPERTIES');
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

  console.log('Modifying readApiKey_() to DELETE the cache first...');
  console.log('');

  // Find readApiKey_ function
  const funcStart = source.indexOf('function readApiKey_()');
  if (funcStart === -1) {
    console.log('❌ Could not find readApiKey_ function');
    return;
  }

  const funcEnd = source.indexOf('\n}', funcStart) + 2;

  // Replace with version that DELETES cache first
  const newFunc = `function readApiKey_() {
  // DELETE the cached key to force fresh read
  try {
    PropertiesService.getDocumentProperties().deleteProperty('OPENAI_API_KEY');
    Logger.log('🗑️ Deleted cached API key');
  } catch (e) {
    Logger.log('⚠️ Could not delete cache: ' + e.message);
  }

  // Read fresh from Settings sheet
  const fromSheet = syncApiKeyFromSettingsSheet_();
  if (fromSheet) {
    Logger.log('✅ Read fresh API key from Settings sheet');
    // DON'T cache it - keep reading fresh
    return fromSheet;
  }

  Logger.log('❌ No API key found in Settings sheet');
  return '';
}`;

  source = source.substring(0, funcStart) + newFunc + source.substring(funcEnd);
  console.log('✅ Modified readApiKey_() to delete cache and read fresh');
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
  console.log('✅ CACHE WILL BE DELETED ON NEXT RUN!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('Changes:');
  console.log('  - readApiKey_() now DELETES cached key first');
  console.log('  - Always reads fresh from Settings!B2');
  console.log('  - Does NOT cache (keeps reading fresh every time)');
  console.log('');
  console.log('Next steps:');
  console.log('1. Refresh Google Sheets (F5)');
  console.log('2. Click "Launch Batch Engine"');
  console.log('3. Will use NEW API key from Settings!B2');
  console.log('');
}

if (require.main === module) {
  deleteDocumentProperty().catch(error => {
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

module.exports = { deleteDocumentProperty };
