#!/usr/bin/env node

/**
 * ADD "LOAD DEFAULTS" BUTTON
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

    // Find the button section
    const oldButtons = `    html += '<div style="display: flex; gap: 10px; margin-top: 20px;">';
    html += '  <button id="save-btn" style="flex: 1; padding: 12px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">💾 Save Selection</button>';
    html += '  <button id="cache-btn" style="flex: 1; padding: 12px; background: #f57c00; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">📦 Cache Selected Fields</button>';
    html += '  <button onclick="google.script.host.close()" style="flex: 0.5; padding: 12px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Cancel</button>';
    html += '</div>';`;

    const newButtons = `    html += '<div style="display: flex; gap: 10px; margin-top: 20px;">';
    html += '  <button id="load-defaults-btn" style="flex: 1; padding: 12px; background: #34a853; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">🔄 Load Defaults</button>';
    html += '  <button id="save-btn" style="flex: 1; padding: 12px; background: #1a73e8; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">💾 Save Selection</button>';
    html += '  <button id="cache-btn" style="flex: 1; padding: 12px; background: #f57c00; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">📦 Cache Selected Fields</button>';
    html += '  <button onclick="google.script.host.close()" style="flex: 0.5; padding: 12px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Cancel</button>';
    html += '</div>';`;

    code = code.replace(oldButtons, newButtons);

    console.log('✅ Added Load Defaults button\n');

    // Add the click handler for Load Defaults button
    const oldEventListeners = `    html += '  document.getElementById("save-btn").addEventListener("click", saveSelection);';
    html += '  document.getElementById("cache-btn").addEventListener("click", startCaching);';`;

    const newEventListeners = `    html += '  document.getElementById("load-defaults-btn").addEventListener("click", loadDefaults);';
    html += '  document.getElementById("save-btn").addEventListener("click", saveSelection);';
    html += '  document.getElementById("cache-btn").addEventListener("click", startCaching);';`;

    code = code.replace(oldEventListeners, newEventListeners);

    console.log('✅ Added event listener\n');

    // Add the loadDefaults() client function
    const oldSaveSelection = `    html += 'function saveSelection() {';`;

    const loadDefaultsFunction = `    html += 'function loadDefaults() {';
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
    html += '}';
    html += '';
    html += 'function saveSelection() {';`;

    code = code.replace(oldSaveSelection, loadDefaultsFunction);

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
    console.log('\nNew button order:\n');
    console.log('  1. 🔄 Load Defaults (calls restore35Defaults())');
    console.log('  2. 💾 Save Selection');
    console.log('  3. 📦 Cache Selected Fields');
    console.log('  4. Cancel\n');
    console.log('When clicked, it will:');
    console.log('  - Call restore35Defaults() on server');
    console.log('  - Reload the modal to show the 35 defaults selected\n');
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
