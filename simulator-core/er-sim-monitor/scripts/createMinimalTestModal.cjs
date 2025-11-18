#!/usr/bin/env node

/**
 * CREATE MINIMAL TEST MODAL
 * Strip everything down to basics to see where it breaks
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

async function create() {
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

    // Create a minimal test function
    const testFunc = `
function testMinimalModal() {
  try {
    Logger.log('🧪 TEST: Starting minimal modal');

    var html =
      '<!DOCTYPE html>' +
      '<html><head><title>Test</title></head>' +
      '<body>' +
      '<h1>TEST MODAL</h1>' +
      '<p>If you see this, HTML generation works!</p>' +
      '<div id="log" style="background: black; color: lime; padding: 20px; font-family: monospace;"></div>' +
      '<script>' +
      'var log = document.getElementById(\\'log\\');' +
      'log.textContent = \\'JavaScript is running!\\';' +
      '</script>' +
      '</body></html>';

    Logger.log('🧪 TEST: HTML created, length:', html.length);

    var htmlOutput = HtmlService.createHtmlOutput(html).setWidth(600).setHeight(400);

    Logger.log('🧪 TEST: HtmlOutput created');

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Test Modal');

    Logger.log('🧪 TEST: Modal displayed');

  } catch (error) {
    Logger.log('🧪 TEST ERROR:', error.toString());
    SpreadsheetApp.getUi().alert('Test Error: ' + error.toString());
  }
}
`;

    // Add test function before showFieldSelector
    const insertBefore = code.indexOf('function showFieldSelector() {');
    code = code.substring(0, insertBefore) + testFunc + '\\n\\n' + code.substring(insertBefore);

    console.log('📤 Deploying test function...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('✅ Deployed!\\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('TEST FUNCTION ADDED\\n');
    console.log('To test:\\n');
    console.log('1. In Google Sheet, open Tools → Script editor');
    console.log('2. In script editor, click Run → Select function → testMinimalModal');
    console.log('3. Click Run button\\n');
    console.log('This will show if basic modal functionality works.');
    console.log('If test modal shows, problem is in showFieldSelector() logic.');
    console.log('If test modal fails, problem is more fundamental.\\n');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

create();
