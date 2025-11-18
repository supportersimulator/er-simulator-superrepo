#!/usr/bin/env node

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

    console.log('📥 Downloading...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    // Find showFieldSelector
    const funcStart = code.indexOf('function showFieldSelector() {');
    const funcEnd = code.indexOf('function saveFieldSelectionAndStartCache', funcStart);
    let func = code.substring(funcStart, funcEnd);

    // 1. Add log to renderRoughDraft
    func = func.replace(
      "'function renderRoughDraft() {' +\n      '  render3Sections();'",
      "'function renderRoughDraft() {' +\n      '  liveLog(\\'📋 Rendering rough draft...\\');' +\n      '  render3Sections();'"
    );

    // 2. Add log to updateWithAI
    func = func.replace(
      "'function updateWithAI(aiRecs) {' +\n      '  // Find which defaults AI also recommends (double checkmark)'",
      "'function updateWithAI(aiRecs) {' +\n      '  liveLog(\\'✅ AI recommendations received: \\' + aiRecs.length + \\' suggestions\\');' +\n      '  // Find which defaults AI also recommends (double checkmark)'"
    );

    // 3. Fix failure handler to use liveLog
    func = func.replace(
      ".withFailureHandler(function(err) { console.log(\"AI failed:\", err); })",
      ".withFailureHandler(function(err) { liveLog(\\'⚠️ AI failed: \\' + err.message); })"
    );

    // 4. Add log to continueToCache
    func = func.replace(
      "'function continueToCache() {' +\n      '  var selected = [];'",
      "'function continueToCache() {' +\n      '  liveLog(\\'💾 Saving selection...\\');' +\n      '  var selected = [];'"
    );

    code = code.substring(0, funcStart) + func + code.substring(funcEnd);

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
    console.log('Live logs will now show in modal:\n');
    console.log('  [12:34:56] 📋 Rendering rough draft...');
    console.log('  [12:34:58] ✅ AI recommendations received: 12 suggestions');
    console.log('  [12:35:02] 💾 Saving selection...\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
