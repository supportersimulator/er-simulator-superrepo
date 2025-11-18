#!/usr/bin/env node

/**
 * Create minimal test modal to verify HtmlService works
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

    console.log('📥 Downloading...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');
    let code = codeFile.source;

    console.log('🔧 Replacing showFieldSelector with MINIMAL test...\n');

    // Find showFieldSelector function
    const funcStart = code.indexOf('function showFieldSelector() {');
    const funcEnd = code.indexOf('\n\n\nfunction onOpen', funcStart);
    
    const minimalFunction = `function showFieldSelector() {
  Logger.log('🎯 MINIMAL TEST');
  
  var html = '<!DOCTYPE html>' +
    '<html><head><title>Test</title></head>' +
    '<body>' +
    '<h1>MINIMAL TEST - If you see this, HtmlService works!</h1>' +
    '<script>alert("JavaScript works!");</script>' +
    '</body></html>';
  
  var htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(600)
    .setHeight(400);
  
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Minimal Test');
}

`;

    code = code.substring(0, funcStart) + minimalFunction + code.substring(funcEnd);

    console.log('📤 Deploying minimal test...\n');

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
    console.log('✅ MINIMAL TEST DEPLOYED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Reload sheet, open Categories & Pathways, click cache button.');
    console.log('You should see "MINIMAL TEST" heading and get an alert.\n');
    console.log('If this works, the problem is in the complex HTML generation.\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

fix();
