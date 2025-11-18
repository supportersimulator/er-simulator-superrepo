#!/usr/bin/env node

/**
 * REVERT: clearCacheSheet() should NOT delete SELECTED_CACHE_FIELDS
 * 
 * Correct behavior:
 * - Clear the Field_Cache_Incremental sheet (cached data)
 * - Reset LAST_CACHED_ROW counter (progress)
 * - KEEP SELECTED_CACHE_FIELDS (user's field selection)
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

    console.log('🔧 Reverting clearCacheSheet() to preserve field selection...\n');

    const currentVersion = `  var docProps = PropertiesService.getDocumentProperties();
  docProps.deleteProperty('LAST_CACHED_ROW');
  docProps.deleteProperty('SELECTED_CACHE_FIELDS');
  Logger.log('✅ Progress counter reset');
  Logger.log('✅ Field selection reset (35 defaults will load next time)');
  
  return { success: true };
}`;

    const correctVersion = `  PropertiesService.getDocumentProperties().deleteProperty('LAST_CACHED_ROW');
  Logger.log('✅ Cache sheet and progress reset');
  Logger.log('✅ Field selection preserved');
  
  return { success: true };
}`;

    code = code.replace(currentVersion, correctVersion);

    console.log('✅ Reverted - field selection will be preserved\n');

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
    console.log('✅ CLEAR CACHE NOW PRESERVES FIELD SELECTION');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Correct behavior:');
    console.log('  When user clicks "🔄 Cache Selected Fields":');
    console.log('  1. Deletes Field_Cache_Incremental sheet (old cached data)');
    console.log('  2. Resets LAST_CACHED_ROW = 0 (start from beginning)');
    console.log('  3. KEEPS SELECTED_CACHE_FIELDS (preserves field selection)');
    console.log('  4. Saves field selection (from current checkboxes)');
    console.log('  5. Caches all 207 rows with selected fields\n');
    console.log('Next time field selector opens:');
    console.log('  - Loads the saved field selection');
    console.log('  - Shows fields in DEFAULT section');
    console.log('  - User can modify and re-cache if needed\n');
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
