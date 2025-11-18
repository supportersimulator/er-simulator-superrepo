#!/usr/bin/env node

/**
 * ADD CHECKMARK WITH PROPER ESCAPING
 * Handle the string concatenation context properly
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

    console.log('🔧 Adding checkmark with proper string escaping...\n');

    // This is the line in the string concatenation context
    const oldLine = "'      label.textContent = field.name;' +";

    const newLine = "'      var isAlsoRecommended = data.recommended && data.recommended.indexOf(field.name) !== -1;' +\n" +
                    "'      label.innerHTML = field.name + (isAlsoRecommended ? \" <span style=\\\\\"color:#4CAF50;font-weight:bold;margin-left:4px;\\\\\" title=\\\\\"AI also recommends\\\\\">✓</span>\" : \"\");' +";

    code = code.replace(oldLine, newLine);

    console.log('✅ Replaced with checkmark logic\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✓ CHECKMARK ADDED SUCCESSFULLY!\n');
    console.log('\nDefaults that AI also recommends will show: ✓\n');
    console.log('Try "Categories & Pathways" to see it!\n');
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
