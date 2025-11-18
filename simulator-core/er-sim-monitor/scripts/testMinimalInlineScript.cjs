#!/usr/bin/env node

/**
 * TEST MINIMAL INLINE SCRIPT
 * Deploy a super simple modal with inline JavaScript to see if it executes
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

async function deploy() {
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

    console.log('🔧 Adding minimal test function...\n');

    // Find a good insertion point (after showCacheAllLayersModal)
    const insertPos = code.indexOf('function showCacheAllLayersModal()');

    if (insertPos === -1) {
      console.log('❌ Could not find insertion point\\n');
      return;
    }

    const testFunc = `
/**
 * TEST MINIMAL INLINE SCRIPT
 * Super simple modal to test if JavaScript executes
 */
function testMinimalInlineScript() {
  var html = '<!DOCTYPE html>' +
    '<html>' +
    '<head><meta charset="utf-8"></head>' +
    '<body>' +
    '<h2>Minimal Script Test</h2>' +
    '<div id="output" style="padding:20px;background:#eee;">Waiting for JavaScript...</div>' +
    '<script>' +
    'document.getElementById("output").textContent = "✅ JavaScript executed!";' +
    'alert("✅ JavaScript is working!");' +
    '</script>' +
    '</body>' +
    '</html>';

  var htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(400)
    .setHeight(300);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Minimal Test');
}

`;

    code = code.substring(0, insertPos) + testFunc + code.substring(insertPos);

    console.log('✅ Added test function\\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\\n');
    console.log('═══════════════════════════════════════════════════════════════\\n');
    console.log('✅ TEST FUNCTION ADDED!\\n');
    console.log('\\nNow in Apps Script editor:');
    console.log('  1. Run: testMinimalInlineScript()\\n');
    console.log('Expected behavior:');
    console.log('  ✅ Modal opens');
    console.log('  ✅ Div text changes to "JavaScript executed!"');
    console.log('  ✅ Alert popup appears\\n');
    console.log('If it works: Inline scripts ARE supported');
    console.log('If it fails: Inline scripts are blocked → need different approach\\n');
    console.log('═══════════════════════════════════════════════════════════════\\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deploy();
