#!/usr/bin/env node

/**
 * ADD LOAD DEFAULTS BUTTON HTML ONLY
 *
 * The loadDefaults() function already exists, just add the button HTML
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

    console.log('🔧 Adding Load Defaults button HTML using exact same pattern...\n');

    // EXACT pattern from existing code - just add the button
    const oldButtons = `    html += '<button class="btn btn-primary" onclick="saveSelection()">💾 Save Selection</button>';`;

    const newButtons = `    html += '<button class="btn btn-primary" id="load-defaults-btn" onclick="loadDefaults()" style="background: #34a853;">🔄 Load Defaults</button>';
    html += '<button class="btn btn-primary" onclick="saveSelection()" style="margin-left: 10px;">💾 Save Selection</button>';`;

    code = code.replace(oldButtons, newButtons);

    console.log('✅ Added button HTML\n');

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
    console.log('✅ ADDED LOAD DEFAULTS BUTTON!\n');
    console.log('\nButton structure (exact pattern as other buttons):\n');
    console.log('  class="btn btn-primary"');
    console.log('  id="load-defaults-btn"');
    console.log('  onclick="loadDefaults()"');
    console.log('  style="background: #34a853;" (green)\n');
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
