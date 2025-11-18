#!/usr/bin/env node

/**
 * TEST SIMPLEST POSSIBLE CALL
 * Create the absolute simplest google.script.run test possible
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

async function test() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    // Add super simple test function
    const testFunction = `
function simpleTest() {
  return "Hello from server!";
}
`;

    // Insert at top
    code = testFunction + '\n' + code;

    // Replace showFieldSelector with simplest possible test
    const funcStart = code.indexOf('function showFieldSelector()');
    let braceCount = 0;
    let inFunction = false;
    let funcEnd = funcStart;

    for (let i = funcStart; i < code.length; i++) {
      if (code[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (code[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          funcEnd = i + 1;
          break;
        }
      }
    }

    const simpleHTML = `function showFieldSelector() {
  const html = '<!DOCTYPE html><html><body>' +
    '<h1>Simple Test</h1>' +
    '<div id="result">Waiting...</div>' +
    '<script>' +
    'document.getElementById("result").textContent = "JavaScript is running";' +
    'setTimeout(function() {' +
    '  document.getElementById("result").textContent = "Calling server...";' +
    '  google.script.run' +
    '    .withSuccessHandler(function(msg) {' +
    '      document.getElementById("result").textContent = "SUCCESS: " + msg;' +
    '    })' +
    '    .withFailureHandler(function(err) {' +
    '      document.getElementById("result").textContent = "ERROR: " + err.message;' +
    '    })' +
    '    .simpleTest();' +
    '}, 1000);' +
    '</scr' + 'ipt>' +
    '</body></html>';

  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(400).setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Simple Test');
}`;

    code = code.substring(0, funcStart) + simpleHTML + code.substring(funcEnd);

    console.log('✅ Created simplest possible test\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🧪 SIMPLEST POSSIBLE TEST\n');
    console.log('Click "Pre-Cache Rich Data" and watch:\n');
    console.log('1. "JavaScript is running" should appear immediately\n');
    console.log('2. "Calling server..." should appear after 1 second\n');
    console.log('3. Either "SUCCESS: Hello from server!" or "ERROR: ..." should appear\n');
    console.log('This will tell us if google.script.run works AT ALL.\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

test();
