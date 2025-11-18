#!/usr/bin/env node

/**
 * STEP 2 with diagnostics: Find where JavaScript fails
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

    console.log('📥 Downloading current production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Creating Step 2 with diagnostics...\n');

    const funcStart = code.indexOf('function showFieldSelector()');
    const funcEnd = code.indexOf('\nfunction ', funcStart + 50);

    const step2Function = `function showFieldSelector() {
  Logger.log('🎯 STEP 2 with diagnostics');

  try {
    var roughDraft = getFieldSelectorRoughDraft();
    var allFields = roughDraft.allFields;
    var selected = roughDraft.selected;

    Logger.log('✅ Got ' + allFields.length + ' fields, ' + selected.length + ' selected');

    var html = '<!DOCTYPE html>' +
      '<html>' +
      '<head>' +
      '<title>Step 2</title>' +
      '<style>' +
      'body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }' +
      'h1 { color: #1a73e8; }' +
      '.debug { background: #fff3cd; padding: 10px; margin: 10px 0; border: 1px solid #ffc107; }' +
      '.section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }' +
      '.section-header { font-weight: bold; padding: 8px; margin-bottom: 10px; }' +
      '.section-header.default { background: #0d652d; color: white; }' +
      '.field-item { padding: 5px; background: #f8f9fa; margin: 2px 0; }' +
      '</style>' +
      '</head>' +
      '<body>' +
      '<h1>Step 2: Field List Display</h1>' +
      '<div class="debug" id="debug">Initializing JavaScript...</div>' +
      '<div id="sections"></div>' +
      '<script>' +
      'try {' +
      '  document.getElementById("debug").innerHTML = "Step 1: Script started";' +
      '  ' +
      '  var allFields = ' + JSON.stringify(allFields) + ';' +
      '  document.getElementById("debug").innerHTML = "Step 2: Got " + allFields.length + " fields";' +
      '  ' +
      '  var selectedFields = ' + JSON.stringify(selected) + ';' +
      '  document.getElementById("debug").innerHTML = "Step 3: Got " + selectedFields.length + " selected";' +
      '  ' +
      '  var sectionsDiv = document.getElementById("sections");' +
      '  document.getElementById("debug").innerHTML = "Step 4: Found sections div";' +
      '  ' +
      '  var section1 = "<div class=\\"section\\">";' +
      '  section1 += "<div class=\\"section-header default\\">DEFAULT (" + selectedFields.length + ")</div>";' +
      '  section1 += "<div>";' +
      '  for (var i = 0; i < Math.min(selectedFields.length, 5); i++) {' +
      '    section1 += "<div class=\\"field-item\\">" + selectedFields[i] + "</div>";' +
      '  }' +
      '  section1 += "</div></div>";' +
      '  ' +
      '  document.getElementById("debug").innerHTML = "Step 5: Built section HTML";' +
      '  ' +
      '  sectionsDiv.innerHTML = section1;' +
      '  document.getElementById("debug").innerHTML = "Step 6: SUCCESS - Rendered " + selectedFields.length + " fields";' +
      '  ' +
      '} catch (error) {' +
      '  document.getElementById("debug").innerHTML = "ERROR: " + error.message;' +
      '}' +
      '</script>' +
      '</body></html>';

    var htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(700)
      .setHeight(600);

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Step 2: Diagnostics');
    Logger.log('✅ Step 2 diagnostic modal displayed');

  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    SpreadsheetApp.getUi().alert('Error', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
`;

    code = code.substring(0, funcStart) + step2Function + code.substring(funcEnd);

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
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔍 DIAGNOSTIC VERSION DEPLOYED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Watch the yellow debug box - it will show:');
    console.log('- Which step JavaScript reached before failing');
    console.log('- OR "SUCCESS" if all steps complete\n');
    console.log('This will tell us exactly where the rendering breaks.');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deploy();
