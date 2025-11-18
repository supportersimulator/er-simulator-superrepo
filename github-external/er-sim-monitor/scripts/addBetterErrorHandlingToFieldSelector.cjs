#!/usr/bin/env node

/**
 * ADD BETTER ERROR HANDLING TO FIELD SELECTOR
 *
 * When getFieldSelectorData() fails, show a clear error message
 * instead of just "Loading..." forever.
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

    console.log('🔧 Adding better error handling to field selector modal...\n');

    // Find the part where it calls getFieldSelectorData
    const pattern = /google\.script\.run[\s\S]*?\.getFieldSelectorData\(\);/;

    if (!pattern.test(code)) {
      console.log('❌ Could not find getFieldSelectorData() call in modal\n');
      process.exit(1);
    }

    // Replace with better error handling
    const original = code.match(pattern)[0];

    const improved = `google.script.run
.withSuccessHandler(function(data) {
  log("✅ Server responded!");
  if (data.logs) { data.logs.forEach(function(l) { log("   " + l); }); }
  if (data.error) {
    log("❌ Error: " + data.error);
    // Show error to user
    document.getElementById("categories").innerHTML = '<div style="background:#fff3cd;border:2px solid #ffc107;padding:20px;border-radius:8px;margin:20px;">' +
      '<h3 style="color:#856404;margin-top:0;">⚠️ Initialization Required</h3>' +
      '<p style="color:#856404;line-height:1.6;">' + data.error + '</p>' +
      '<p style="color:#856404;"><strong>Solution:</strong></p>' +
      '<ol style="color:#856404;line-height:1.8;">' +
      '<li>Close this modal</li>' +
      '<li>Click <strong>🧠 Sim Builder → 🧩 Categories & Pathways</strong> from the menu</li>' +
      '<li>Wait for the Pathway UI to open (this caches the headers)</li>' +
      '<li>Then click the cache button again</li>' +
      '</ol></div>';
    document.getElementById("count").textContent = "⚠️ Setup required";
  } else {
    log("✅ Got " + Object.keys(data.grouped).length + " categories, " + data.selected.length + " selected, " + data.recommended.length + " recommended");
    renderFields(data);
  }
})
.withFailureHandler(function(err) {
  log("❌ ERROR: " + err.message);
  // Show error to user
  document.getElementById("categories").innerHTML = '<div style="background:#f8d7da;border:2px solid #f5c6cb;padding:20px;border-radius:8px;margin:20px;">' +
    '<h3 style="color:#721c24;margin-top:0;">❌ Server Error</h3>' +
    '<p style="color:#721c24;">' + err.message + '</p>' +
    '<p style="color:#721c24;"><strong>Please try:</strong></p>' +
    '<ol style="color:#721c24;line-height:1.8;">' +
    '<li>Close this modal</li>' +
    '<li>Refresh the Google Sheet (F5)</li>' +
    '<li>Click <strong>🧠 Sim Builder → 🧩 Categories & Pathways</strong></li>' +
    '<li>Wait for Pathway UI, then click cache button</li>' +
    '</ol></div>';
  document.getElementById("count").textContent = "❌ Error";
})
.getFieldSelectorData();`;

    code = code.replace(pattern, improved);

    console.log('✅ Added error handling\n');

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
    console.log('✅ BETTER ERROR HANDLING ADDED!\n');
    console.log('\nNow when field selector fails to load:\n');
    console.log('  ✅ Shows clear error message instead of "Loading..."');
    console.log('  ✅ Explains what went wrong');
    console.log('  ✅ Provides step-by-step solution\n');
    console.log('Try it again:\n');
    console.log('  1. Refresh Google Sheet (F5)');
    console.log('  2. Click 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('  3. Wait for Pathway UI to open');
    console.log('  4. Click the cache button\n');
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
