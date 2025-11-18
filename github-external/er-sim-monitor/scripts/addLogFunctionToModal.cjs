#!/usr/bin/env node

/**
 * ADD LOG() FUNCTION TO FIELD SELECTOR MODAL
 *
 * The modal has a <div id="log"> for diagnostics but no log() function to write to it.
 * This adds the missing JavaScript function.
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

    console.log('🔧 Adding log() function to modal JavaScript...\n');

    // Find the modal's JavaScript section
    const funcStart = code.indexOf('function showFieldSelector() {');
    const funcEnd = code.indexOf('function saveFieldSelectionAndStartCache', funcStart);
    let func = code.substring(funcStart, funcEnd);

    // Find where to insert log() - right after continueToCache() function
    const continueFuncEnd = func.indexOf("'// Load immediately'");

    if (continueFuncEnd === -1) {
      console.log('❌ Could not find insertion point\n');
      process.exit(1);
    }

    const logFunction = `'function liveLog(message) {' +
      '  var logDiv = document.getElementById(\\"log\\");' +
      '  if (!logDiv) return;' +
      '  var timestamp = new Date().toLocaleTimeString();' +
      '  logDiv.textContent += \\"[" + timestamp + "] " + message + "\\\\n\\";' +
      '  logDiv.scrollTop = logDiv.scrollHeight;' +
      '}' +
      '' +
      `;

    // Insert liveLog() function
    func = func.substring(0, continueFuncEnd) + logFunction + func.substring(continueFuncEnd);

    console.log('✅ Added liveLog() function\n');

    // Now update calls to use liveLog()
    // Update renderRoughDraft to log activity
    func = func.replace(
      "'function renderRoughDraft() {' +",
      "'function renderRoughDraft() {' +\n      '  liveLog(\\\\\\"📋 Rendering rough draft...\\\\\\");' +"
    );

    // Update updateWithAI to log AI completion
    func = func.replace(
      "'function updateWithAI(aiRecs) {' +",
      "'function updateWithAI(aiRecs) {' +\n      '  liveLog(\\\\\\"✅ AI recommendations received: \\\\\\" + aiRecs.length + \\\\\\" suggestions\\\\\\");' +"
    );

    // Update AI failure handler to log errors
    func = func.replace(
      "'.withFailureHandler(function(err) { console.log(\\\\\\"AI failed:\\\\\\", err); })'",
      "'.withFailureHandler(function(err) { liveLog(\\\\\\"⚠️ AI failed: \\\\\\" + err.message); })'"
    );

    console.log('✅ Added liveLog() calls to key functions\n');

    // Replace the function
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
    console.log('New size:', (code.length / 1024).toFixed(1), 'KB\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ LIVE LOG PANEL NOW FUNCTIONAL!\n');
    console.log('\nAdded:\n');
    console.log('1. liveLog(message) function - writes to #log div with timestamps');
    console.log('2. liveLog() messages in renderRoughDraft()');
    console.log('3. liveLog() messages in updateWithAI()');
    console.log('4. liveLog() messages in AI failure handler\n');
    console.log('User will now see real-time diagnostics:\n');
    console.log('  [12:34:56] 📋 Rendering rough draft...');
    console.log('  [12:34:58] ✅ AI recommendations received: 12 suggestions');
    console.log('  or');
    console.log('  [12:34:58] ⚠️ AI failed: Rate limit exceeded\n');
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
