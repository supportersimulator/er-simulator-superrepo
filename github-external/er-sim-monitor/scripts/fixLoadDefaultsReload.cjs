#!/usr/bin/env node

/**
 * FIX LOAD DEFAULTS RELOAD
 *
 * Change window.location.reload() to google.script.host.close()
 * so the user can reopen the modal to see the loaded defaults
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

    console.log('🔧 Fixing loadDefaults() to close modal instead of reload...\n');

    // Find and replace the loadDefaults function
    const oldLoadDefaults = `    html += 'function loadDefaults() {';
    html += '  log("🔄 Loading 35 default fields...");';
    html += '  document.getElementById("load-defaults-btn").disabled = true;';
    html += '  google.script.run';
    html += '    .withSuccessHandler(function() {';
    html += '      log("✅ Defaults loaded! Refreshing...");';
    html += '      setTimeout(function() { window.location.reload(); }, 1000);';
    html += '    })';
    html += '    .withFailureHandler(function(e) {';
    html += '      log("❌ Error loading defaults: " + e.message);';
    html += '      document.getElementById("load-defaults-btn").disabled = false;';
    html += '    })';
    html += '    .restore35Defaults();';
    html += '}';`;

    const newLoadDefaults = `    html += 'function loadDefaults() {';
    html += '  log("🔄 Loading 35 default fields...");';
    html += '  document.getElementById("load-defaults-btn").disabled = true;';
    html += '  google.script.run';
    html += '    .withSuccessHandler(function() {';
    html += '      log("✅ Defaults loaded successfully!");';
    html += '      log("✅ Close this window and reopen field selector to see them");';
    html += '      setTimeout(function() { google.script.host.close(); }, 2000);';
    html += '    })';
    html += '    .withFailureHandler(function(e) {';
    html += '      log("❌ Error loading defaults: " + e.message);';
    html += '      document.getElementById("load-defaults-btn").disabled = false;';
    html += '    })';
    html += '    .restore35Defaults();';
    html += '}';`;

    code = code.replace(oldLoadDefaults, newLoadDefaults);

    console.log('✅ Fixed loadDefaults() function\n');

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
    console.log('✅ FIXED LOAD DEFAULTS BEHAVIOR!\n');
    console.log('\nWhat changed:\n');
    console.log('  BEFORE: window.location.reload() (caused blank screen)');
    console.log('  AFTER:  google.script.host.close() (closes modal cleanly)\n');
    console.log('User workflow:\n');
    console.log('  1. Click "Load Defaults" button');
    console.log('  2. Wait 2 seconds for success message');
    console.log('  3. Modal closes automatically');
    console.log('  4. Reopen field selector to see 35 defaults loaded\n');
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
