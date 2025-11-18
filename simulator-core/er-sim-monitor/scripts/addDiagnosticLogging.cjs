#!/usr/bin/env node

/**
 * Add diagnostic logging to showFieldSelector
 * This will help us see where it's failing
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

    console.log('📥 Downloading current production...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');
    let code = codeFile.source;

    console.log('🔧 Adding diagnostic logging...\n');

    // Add alert at the start of renderRoughDraft to confirm JavaScript runs
    const oldRenderStart = "      'function renderRoughDraft() {' +";
    const newRenderStart = "      'function renderRoughDraft() {' +\n" +
      "      '  alert(\"✅ renderRoughDraft called! allFields: \" + allFields.length);' +";

    if (code.includes(oldRenderStart)) {
      code = code.replace(oldRenderStart, newRenderStart);
      console.log('✅ Added alert at renderRoughDraft start\n');
    } else {
      console.log('⚠️ Could not find renderRoughDraft start pattern\n');
    }

    // Add diagnostic logging to liveLog function
    const oldLiveLog = "      'function liveLog(message) {' +";
    const newLiveLog = "      'function liveLog(message) {' +\n" +
      "      '  console.log(\"[liveLog] \" + message);' +";

    if (code.includes(oldLiveLog)) {
      code = code.replace(oldLiveLog, newLiveLog);
      console.log('✅ Added console.log to liveLog\n');
    } else {
      console.log('⚠️ Could not find liveLog pattern\n');
    }

    // Add diagnostic at script start
    const scriptStart = "      '// Load immediately' +";
    const newScriptStart = "      '// Diagnostic logging' +\n" +
      "      'console.log(\"✅ Script loaded. allFields:\", allFields);' +\n" +
      "      'console.log(\"✅ selectedFields:\", selectedFields);' +\n" +
      "      '// Load immediately' +";

    if (code.includes(scriptStart)) {
      code = code.replace(scriptStart, newScriptStart);
      console.log('✅ Added diagnostic at script start\n');
    } else {
      console.log('⚠️ Could not find script start pattern\n');
    }

    console.log('📤 Deploying diagnostic version...\n');

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
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ DIAGNOSTIC VERSION DEPLOYED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Now reload the Google Sheet (F5) and open the modal again.');
    console.log('You should see an alert popup showing how many fields were loaded.');
    console.log('Also press F12 to open browser console for detailed logs.\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
