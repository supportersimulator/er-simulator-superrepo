#!/usr/bin/env node

/**
 * STEP 2: Put script in HEAD instead of body
 * Theory: Script placement in string concatenation is causing issues
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

    console.log('🔧 Creating Step 2 with script in HEAD...\n');

    const funcStart = code.indexOf('function showFieldSelector()');
    const funcEnd = code.indexOf('\nfunction ', funcStart + 50);

    const step2Function = `function showFieldSelector() {
  Logger.log('🎯 STEP 2: Script in HEAD');

  try {
    var roughDraft = getFieldSelectorRoughDraft();
    var allFields = roughDraft.allFields;
    var selected = roughDraft.selected;

    Logger.log('✅ Got ' + allFields.length + ' fields, ' + selected.length + ' selected');

    var allFieldsJson = JSON.stringify(allFields);
    var selectedJson = JSON.stringify(selected);

    var html = '<!DOCTYPE html><html><head><title>Step 2</title>';

    html += '<style>';
    html += 'body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }';
    html += 'h1 { color: #1a73e8; }';
    html += '.debug { background: #fff3cd; padding: 10px; margin: 10px 0; border: 1px solid #ffc107; }';
    html += '.section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }';
    html += '.section-header { font-weight: bold; padding: 8px; }';
    html += '.section-header.default { background: #0d652d; color: white; }';
    html += '.field-item { padding: 5px; background: #f8f9fa; margin: 2px 0; }';
    html += '</style>';

    html += '<script>';
    html += 'var ALL_FIELDS = ' + allFieldsJson + ';';
    html += 'var SELECTED_FIELDS = ' + selectedJson + ';';
    html += 'window.addEventListener("DOMContentLoaded", function() {';
    html += '  try {';
    html += '    document.getElementById("debug").innerHTML = "Step 1: DOM Ready, got " + ALL_FIELDS.length + " fields";';
    html += '    var sectionsDiv = document.getElementById("sections");';
    html += '    document.getElementById("debug").innerHTML = "Step 2: Found sections div";';
    html += '    var html = "<div class=\\\\"section\\\\">";';
    html += '    html += "<div class=\\\\"section-header default\\\\">DEFAULT (" + SELECTED_FIELDS.length + ")</div>";';
    html += '    for (var i = 0; i < Math.min(SELECTED_FIELDS.length, 10); i++) {';
    html += '      html += "<div class=\\\\"field-item\\\\">" + SELECTED_FIELDS[i] + "</div>";';
    html += '    }';
    html += '    html += "</div>";';
    html += '    document.getElementById("debug").innerHTML = "Step 3: Built HTML";';
    html += '    sectionsDiv.innerHTML = html;';
    html += '    document.getElementById("debug").innerHTML = "SUCCESS: Rendered " + SELECTED_FIELDS.length + " fields";';
    html += '  } catch (error) {';
    html += '    document.getElementById("debug").innerHTML = "ERROR: " + error.message;';
    html += '  }';
    html += '});';
    html += '</script>';

    html += '</head><body>';
    html += '<h1>Step 2: Field List Display</h1>';
    html += '<div class="debug" id="debug">Waiting for DOM...</div>';
    html += '<div id="sections"></div>';
    html += '</body></html>';

    var htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(700)
      .setHeight(600);

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Step 2: Script in HEAD');
    Logger.log('✅ Modal displayed');

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
    console.log('🔍 SCRIPT IN HEAD VERSION DEPLOYED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Key changes:');
    console.log('✅ Script moved to <head> instead of end of <body>');
    console.log('✅ Uses DOMContentLoaded listener to wait for page load');
    console.log('✅ Data stored in global variables instead of inline');
    console.log('✅ Cleaner string concatenation pattern\n');
    console.log('Watch the yellow debug box again.');
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
