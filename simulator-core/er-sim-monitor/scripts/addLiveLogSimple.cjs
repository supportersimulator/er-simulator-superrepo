#!/usr/bin/env node

/**
 * ADD LIVELOG FUNCTION - SIMPLIFIED
 * Just add the function, don't try to add calls to it yet
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

    console.log('🔧 Adding liveLog() function to modal...\n');

    // Find showFieldSelector function
    const funcStart = code.indexOf('function showFieldSelector() {');
    const funcEnd = code.indexOf('function saveFieldSelectionAndStartCache', funcStart);
    let func = code.substring(funcStart, funcEnd);

    // Find insertion point - before "// Load immediately"
    const insertBefore = "'// Load immediately'";
    const insertPoint = func.indexOf(insertBefore);

    if (insertPoint === -1) {
      console.log('❌ Could not find insertion point\n');
      process.exit(1);
    }

    // Add liveLog function
    const liveLogFunc =
      "'function liveLog(message) {' +\n" +
      "      '  var logDiv = document.getElementById(\\'log\\');' +\n" +
      "      '  if (!logDiv) return;' +\n" +
      "      '  var timestamp = new Date().toLocaleTimeString();' +\n" +
      "      '  logDiv.textContent += \\'[\\' + timestamp + \\'] \\' + message + \\'\\\\n\\';' +\n" +
      "      '  logDiv.scrollTop = logDiv.scrollHeight;' +\n" +
      "      '}' +\n" +
      "      '' +\n";

    func = func.substring(0, insertPoint) + liveLogFunc + func.substring(insertPoint);

    console.log('✅ Added liveLog() function\n');

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
    console.log('✅ LIVELOG FUNCTION ADDED!\n');
    console.log('\nNext: Manually call liveLog() from modal JavaScript:\n');
    console.log('  - liveLog("📋 Rendering rough draft...")');
    console.log('  - liveLog("✅ AI recommendations received")');
    console.log('  - liveLog("⚠️ AI failed: " + err.message)\n');
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
