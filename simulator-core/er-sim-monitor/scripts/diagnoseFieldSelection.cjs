#!/usr/bin/env node

/**
 * DIAGNOSE FIELD SELECTION
 *
 * Check what's actually in SELECTED_CACHE_FIELDS and CACHED_MERGED_KEYS
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function diagnose() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current production...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    let code = codeFile.source;

    // Add diagnostic function
    const diagnosticFunction = `
function diagnoseFieldSelection() {
  const docProps = PropertiesService.getDocumentProperties();

  const selectedJson = docProps.getProperty('SELECTED_CACHE_FIELDS');
  const cachedKeysJson = docProps.getProperty('CACHED_MERGED_KEYS');

  Logger.log('='.repeat(70));
  Logger.log('SELECTED_CACHE_FIELDS:');
  if (selectedJson) {
    const selected = JSON.parse(selectedJson);
    Logger.log('Count: ' + selected.length);
    Logger.log('Fields: ' + JSON.stringify(selected, null, 2));
  } else {
    Logger.log('NULL - not set!');
  }

  Logger.log('='.repeat(70));
  Logger.log('CACHED_MERGED_KEYS:');
  if (cachedKeysJson) {
    const keys = JSON.parse(cachedKeysJson);
    Logger.log('Count: ' + keys.length);
    Logger.log('First 10: ' + JSON.stringify(keys.slice(0, 10), null, 2));
  } else {
    Logger.log('NULL - not set!');
  }

  Logger.log('='.repeat(70));

  // Check which selected fields exist in cached keys
  if (selectedJson && cachedKeysJson) {
    const selected = JSON.parse(selectedJson);
    const keys = JSON.parse(cachedKeysJson);

    Logger.log('VALIDATION:');
    let validCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < selected.length; i++) {
      const field = selected[i];
      if (keys.indexOf(field) !== -1) {
        validCount++;
      } else {
        invalidCount++;
        Logger.log('❌ MISSING: ' + field);
      }
    }

    Logger.log('Valid: ' + validCount + ' / ' + selected.length);
    Logger.log('Invalid: ' + invalidCount);
  }

  Logger.log('='.repeat(70));

  return { done: true };
}
`;

    // Add function before the last closing brace
    const lastBrace = code.lastIndexOf('}');
    code = code.substring(0, lastBrace) + diagnosticFunction + code.substring(lastBrace);

    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    console.log('📤 Deploying diagnostic function...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('NOW RUN THIS IN APPS SCRIPT EDITOR:\n');
    console.log('  1. Open Extensions → Apps Script');
    console.log('  2. Find function: diagnoseFieldSelection');
    console.log('  3. Click Run');
    console.log('  4. Check Execution log for full diagnostic output\n');
    console.log('  5. Copy the log output and share it with me\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

diagnose();
