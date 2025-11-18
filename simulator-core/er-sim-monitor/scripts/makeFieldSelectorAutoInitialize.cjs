#!/usr/bin/env node

/**
 * MAKE FIELD SELECTOR AUTO-INITIALIZE
 *
 * Problem: getFieldSelectorData() fails if cache doesn't exist
 * Solution: Auto-call refreshHeaders() if CACHED_HEADER2 is missing
 *
 * This makes the field selector work from ANY entry point:
 * - From menu (showCacheAllLayersModal)
 * - From Pathway UI (after runPathwayChainBuilder)
 * - From preCacheRichData()
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

async function fix() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Making getFieldSelectorData() auto-initialize...\n');

    // Find the function
    const funcStart = code.indexOf('function getFieldSelectorData() {');
    const checkPoint = code.indexOf('if (!cachedHeader2) {', funcStart);

    if (funcStart === -1 || checkPoint === -1) {
      console.log('❌ Could not find target location\n');
      process.exit(1);
    }

    // Find the error throw
    const errorThrow = code.indexOf("throw new Error('Headers not cached", checkPoint);
    const errorEnd = code.indexOf(';', errorThrow) + 1;

    if (errorThrow === -1) {
      console.log('❌ Could not find error throw\n');
      process.exit(1);
    }

    // Replace the error throw with auto-initialization
    const autoInit = `// Auto-initialize if not cached yet
      addLog('   ⚠️ Headers not cached yet - initializing now...');
      refreshHeaders();
      cachedHeader2 = docProps.getProperty('CACHED_HEADER2');
      if (!cachedHeader2) {
        throw new Error('Failed to initialize headers cache');
      }
      addLog('   ✅ Headers cache initialized')`;

    code = code.substring(0, errorThrow) + autoInit + code.substring(errorEnd);

    console.log('✅ Added auto-initialization\n');

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

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ FIELD SELECTOR NOW AUTO-INITIALIZES!\n');
    console.log('\nHow it works now:\n');
    console.log('  ✅ Can be opened from ANY menu item or button');
    console.log('  ✅ Auto-calls refreshHeaders() if cache missing');
    console.log('  ✅ Works whether you clicked "Categories & Pathways" first or not\n');
    console.log('Try it now:\n');
    console.log('  1. Refresh Google Sheet (F5)');
    console.log('  2. Click any cache menu item or button');
    console.log('  3. Modal should load fields successfully\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
