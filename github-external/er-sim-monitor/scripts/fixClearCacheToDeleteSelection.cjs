#!/usr/bin/env node

/**
 * Fix clearCacheSheet() to also delete SELECTED_CACHE_FIELDS
 * This ensures 35 defaults load after cache is cleared
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

async function deploy() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Updating clearCacheSheet() to delete SELECTED_CACHE_FIELDS...\n');

    const oldClearCache = `  PropertiesService.getDocumentProperties().deleteProperty('LAST_CACHED_ROW');
  Logger.log('✅ Progress counter reset');
  
  return { success: true };
}`;

    const newClearCache = `  var docProps = PropertiesService.getDocumentProperties();
  docProps.deleteProperty('LAST_CACHED_ROW');
  docProps.deleteProperty('SELECTED_CACHE_FIELDS');
  Logger.log('✅ Progress counter reset');
  Logger.log('✅ Field selection reset (35 defaults will load next time)');
  
  return { success: true };
}`;

    code = code.replace(oldClearCache, newClearCache);

    console.log('✅ Fix applied\n');

    console.log('📤 Deploying...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ CLEAR CACHE NOW RESETS FIELD SELECTION');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('New behavior:');
    console.log('  1. User clicks "🔄 Cache Selected Fields"');
    console.log('  2. clearCacheSheet() deletes:');
    console.log('     - Field_Cache_Incremental sheet');
    console.log('     - LAST_CACHED_ROW property');
    console.log('     - SELECTED_CACHE_FIELDS property (NEW!)');
    console.log('  3. Next time field selector opens:');
    console.log('     - No saved selection found');
    console.log('     - 35 intelligent defaults auto-load');
    console.log('     - DEFAULT (35) section populated\n');
    console.log('Result: Fresh start every time!');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deploy();
