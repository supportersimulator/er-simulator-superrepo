#!/usr/bin/env node

/**
 * REMOVE DUPLICATE SAVED SELECTION LOGIC
 * The saved selection check is overriding our 35 defaults
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

    console.log('🔧 Removing duplicate saved selection logic that overrides defaults...\n');

    // Find the section that checks saved properties AFTER we've already set defaults
    const dupCheckStart = code.indexOf("var docProps = PropertiesService.getDocumentProperties();", 173000);

    if (dupCheckStart === -1) {
      console.log('❌ Could not find duplicate saved check\n');
      return;
    }

    // Find where this duplicate section ends (look for Step 3 complete)
    const dupCheckEnd = code.indexOf("addLog('   ✅ Step 3 complete:", dupCheckStart);

    if (dupCheckEnd === -1) {
      console.log('❌ Could not find end of duplicate section\n');
      return;
    }

    console.log(`Found duplicate saved logic at ${dupCheckStart}`);
    console.log(`Removing from ${dupCheckStart} to ${dupCheckEnd}\n`);

    // Remove the entire duplicate saved selection check
    // Just keep the "Step 3 complete" log
    code = code.substring(0, dupCheckStart) + '\n    ' + code.substring(dupCheckEnd);

    console.log('✅ Removed duplicate saved selection logic\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ DUPLICATE LOGIC REMOVED!\n');
    console.log('\nNow the flow is clean:\n');
    console.log('  1. Load 35 intelligent defaults');
    console.log('  2. Filter against available fields');
    console.log('  3. Use filtered defaults (no override!)\n');
    console.log('Try "Categories & Pathways" - should show ~30 defaults!\n');
    console.log('(Some of the 35 may not exist in your sheet, which is fine)\n');
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
