#!/usr/bin/env node

/**
 * ADD "LOAD DEFAULTS" BUTTON (FIXED)
 *
 * Add a button to load the 35 default fields via restore35Defaults()
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

    console.log('🔧 Adding Load Defaults button...\n');

    // Find and replace the exact button HTML
    const oldButtonHTML = `    html += '<button class="btn btn-primary" onclick="saveSelection()">💾 Save Selection</button>';
    html += '<button class="btn btn-primary" id="cache-btn" onclick="startCaching()" style="background: #ea8600; margin-left: 10px;">🔄 Cache Selected Fields</button>';
    html += '<button class="btn btn-secondary" onclick="google.script.host.close()">Cancel</button>';`;

    const newButtonHTML = `    html += '<button class="btn btn-primary" onclick="loadDefaults()" style="background: #34a853;">🔄 Load Defaults</button>';
    html += '<button class="btn btn-primary" onclick="saveSelection()" style="margin-left: 10px;">💾 Save Selection</button>';
    html += '<button class="btn btn-primary" id="cache-btn" onclick="startCaching()" style="background: #ea8600; margin-left: 10px;">📦 Cache Selected Fields</button>';
    html += '<button class="btn btn-secondary" onclick="google.script.host.close()" style="margin-left: 10px;">Cancel</button>';`;

    code = code.replace(oldButtonHTML, newButtonHTML);

    console.log('✅ Added Load Defaults button HTML\n');

    // Add the loadDefaults() JavaScript function
    const saveSelectionFunction = `function saveSelection() {`;

    const loadDefaultsFunction = `function loadDefaults() {
  log('🔄 Loading 35 default fields...');
  google.script.run
    .withSuccessHandler(function() {
      log('✅ Defaults loaded! Refreshing...');
      setTimeout(function() { window.location.reload(); }, 1000);
    })
    .withFailureHandler(function(e) {
      log('❌ Error loading defaults: ' + e.message);
    })
    .restore35Defaults();
}

function saveSelection() {`;

    code = code.replace(saveSelectionFunction, loadDefaultsFunction);

    console.log('✅ Added loadDefaults() function\n');

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
    console.log('\nNew buttons (left to right):\n');
    console.log('  1. 🔄 Load Defaults (green)');
    console.log('  2. 💾 Save Selection (blue)');
    console.log('  3. 📦 Cache Selected Fields (orange)');
    console.log('  4. Cancel (gray)\n');
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
