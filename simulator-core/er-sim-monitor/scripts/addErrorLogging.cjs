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

    // Add window.onerror handler at the START of <script>
    func = func.replace(
      "'<script>' +",
      "'<script>' +\n" +
      "      'window.onerror = function(msg, url, line, col, error) {' +\n" +
      "      '  var logDiv = document.getElementById(\\'log\\');' +\n" +
      "      '  if (logDiv) logDiv.textContent += \\'ERROR: \\' + msg + \\'  Line: \\' + line + \\'\\\\n\\';' +\n" +
      "      '  alert(\\'JavaScript Error: \\' + msg + \\'  Line: \\' + line);' +\n" +
      "      '  return false;' +\n" +
      "      '};' +\n"
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
    console.log("Now if there's a JavaScript error, you'll see an alert with the error message.\n");

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
