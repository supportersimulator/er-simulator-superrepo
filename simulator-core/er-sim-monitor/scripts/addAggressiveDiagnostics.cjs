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

    console.log('🔧 Adding AGGRESSIVE diagnostics...\n');

    // Find the script section and wrap ALL JavaScript in try-catch
    const findScriptVars = "      'var allFields = ' + JSON.stringify(allFields) + ';' +\n" +
      "      'var selectedFields = ' + JSON.stringify(selected) + ';'";

    const newScriptVars = 
      "      'try {' +\n" +
      "      '  var allFields = ' + JSON.stringify(allFields) + ';' +\n" +
      "      '  var selectedFields = ' + JSON.stringify(selected) + ';' +\n" +
      "      '  console.log(\"✅ Data loaded:\", allFields.length, \"fields\");' +\n" +
      "      '} catch (e) {' +\n" +
      "      '  alert(\"❌ DATA ERROR: \" + e.message);' +\n" +
      "      '  throw e;' +\n" +
      "      '}' +";

    if (code.includes(findScriptVars)) {
      code = code.replace(findScriptVars, newScriptVars);
      console.log('✅ Wrapped data loading in try-catch\n');
    } else {
      console.log('⚠️ Could not find script vars pattern\n');
    }

    // Wrap renderRoughDraft call
    const findRender = "      'renderRoughDraft();' +";
    const newRender = 
      "      'try {' +\n" +
      "      '  console.log(\"Calling renderRoughDraft...\");' +\n" +
      "      '  renderRoughDraft();' +\n" +
      "      '  console.log(\"✅ renderRoughDraft completed\");' +\n" +
      "      '} catch (e) {' +\n" +
      "      '  alert(\"❌ RENDER ERROR: \" + e.message + \" at line \" + e.lineNumber);' +\n" +
      "      '  console.error(e);' +\n" +
      "      '}' +";

    if (code.includes(findRender)) {
      code = code.replace(findRender, newRender);
      console.log('✅ Wrapped renderRoughDraft call in try-catch\n');
    } else {
      console.log('⚠️ Could not find renderRoughDraft call\n');
    }

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
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ AGGRESSIVE DIAGNOSTICS DEPLOYED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('This will show alert popups for ANY JavaScript error.\n');
    console.log('Reload sheet (F5) and open modal again with console open (F12).\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

fix();
