#!/usr/bin/env node

/**
 * STEP 3: Checkboxes with simpler approach using data attributes
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

    console.log('🔧 Creating Step 3 with simple checkboxes...\n');

    const funcStart = code.indexOf('function showFieldSelector()');
    const funcEnd = code.indexOf('\nfunction ', funcStart + 50);

    const step3Function = `function showFieldSelector() {
  Logger.log('🎯 STEP 3: Simple checkboxes');

  try {
    var roughDraft = getFieldSelectorRoughDraft();
    var allFields = roughDraft.allFields;
    var selected = roughDraft.selected;

    Logger.log('✅ Got ' + allFields.length + ' fields, ' + selected.length + ' selected');

    var allFieldsJson = JSON.stringify(allFields);
    var selectedJson = JSON.stringify(selected);

    var html = '<!DOCTYPE html><html><head><title>Field Selector</title>';

    html += '<style>';
    html += 'body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }';
    html += 'h1 { color: #1a73e8; margin-bottom: 10px; }';
    html += '.section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }';
    html += '.section-header { font-size: 16px; font-weight: bold; padding: 8px; margin-bottom: 10px; border-radius: 3px; }';
    html += '.section-header.default { background: #0d652d; color: white; }';
    html += '.section-header.recommended { background: #ea8600; color: white; }';
    html += '.section-header.other { background: #5f6368; color: white; }';
    html += '.field-list { max-height: 200px; overflow-y: auto; }';
    html += '.field-item { padding: 8px; margin: 4px 0; background: #f8f9fa; border-radius: 3px; cursor: pointer; }';
    html += '.field-item:hover { background: #e8f0fe; }';
    html += '.field-item input { margin-right: 10px; cursor: pointer; }';
    html += '.field-item label { cursor: pointer; }';
    html += '.footer { margin-top: 20px; padding: 15px; background: #f8f9fa; border-top: 2px solid #ddd; }';
    html += '.btn { padding: 10px 20px; margin-right: 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold; }';
    html += '.btn-primary { background: #1a73e8; color: white; }';
    html += '.btn-primary:hover { background: #1557b0; }';
    html += '.btn-secondary { background: #5f6368; color: white; }';
    html += '.btn-secondary:hover { background: #3c4043; }';
    html += '</style>';

    html += '<script>';
    html += 'var ALL_FIELDS = ' + allFieldsJson + ';';
    html += 'var SELECTED_FIELDS = ' + selectedJson + ';';
    html += 'var currentSelection = {};';
    html += '';
    html += 'function initSelection() {';
    html += '  for (var i = 0; i < SELECTED_FIELDS.length; i++) {';
    html += '    currentSelection[SELECTED_FIELDS[i]] = true;';
    html += '  }';
    html += '}';
    html += '';
    html += 'function handleCheckboxChange(event) {';
    html += '  var fieldName = event.target.getAttribute("data-field");';
    html += '  currentSelection[fieldName] = event.target.checked;';
    html += '  updateCounts();';
    html += '}';
    html += '';
    html += 'function updateCounts() {';
    html += '  var count = 0;';
    html += '  for (var field in currentSelection) {';
    html += '    if (currentSelection[field]) count++;';
    html += '  }';
    html += '  document.getElementById("selected-count").textContent = count;';
    html += '}';
    html += '';
    html += 'function saveSelection() {';
    html += '  var selected = [];';
    html += '  for (var field in currentSelection) {';
    html += '    if (currentSelection[field]) selected.push(field);';
    html += '  }';
    html += '  alert("Would save " + selected.length + " fields (Step 4 will implement)");';
    html += '}';
    html += '';
    html += 'window.addEventListener("DOMContentLoaded", function() {';
    html += '  initSelection();';
    html += '';
    html += '  var recommended = [];';
    html += '  var otherFields = ALL_FIELDS.filter(function(f) {';
    html += '    return SELECTED_FIELDS.indexOf(f) === -1 && recommended.indexOf(f) === -1;';
    html += '  });';
    html += '';
    html += '  var sectionsDiv = document.getElementById("sections");';
    html += '  var html = "";';
    html += '';
    html += '  html += "<div class=\\\\"section\\\\">";';
    html += '  html += "<div class=\\\\"section-header default\\\\">✅ DEFAULT (" + SELECTED_FIELDS.length + ")</div>";';
    html += '  html += "<div class=\\\\"field-list\\\\">";';
    html += '  for (var i = 0; i < SELECTED_FIELDS.length; i++) {';
    html += '    var fieldName = SELECTED_FIELDS[i];';
    html += '    html += "<div class=\\\\"field-item\\\\">";';
    html += '    html += "<input type=\\\\"checkbox\\\\" checked data-field=\\\\"" + fieldName + "\\\\" class=\\\\"field-checkbox\\\\">";';
    html += '    html += "<label>" + fieldName + "</label>";';
    html += '    html += "</div>";';
    html += '  }';
    html += '  html += "</div></div>";';
    html += '';
    html += '  html += "<div class=\\\\"section\\\\">";';
    html += '  html += "<div class=\\\\"section-header recommended\\\\">🎯 RECOMMENDED (0)</div>";';
    html += '  html += "<div class=\\\\"field-list\\\\"><em>AI will add recommendations here...</em></div>";';
    html += '  html += "</div>";';
    html += '';
    html += '  html += "<div class=\\\\"section\\\\">";';
    html += '  html += "<div class=\\\\"section-header other\\\\">📋 OTHER (" + otherFields.length + ")</div>";';
    html += '  html += "<div class=\\\\"field-list\\\\">";';
    html += '  for (var i = 0; i < Math.min(otherFields.length, 20); i++) {';
    html += '    var fieldName = otherFields[i];';
    html += '    html += "<div class=\\\\"field-item\\\\">";';
    html += '    html += "<input type=\\\\"checkbox\\\\" data-field=\\\\"" + fieldName + "\\\\" class=\\\\"field-checkbox\\\\">";';
    html += '    html += "<label>" + fieldName + "</label>";';
    html += '    html += "</div>";';
    html += '  }';
    html += '  if (otherFields.length > 20) {';
    html += '    html += "<div style=\\\\"padding: 8px; font-style: italic;\\\\">... and " + (otherFields.length - 20) + " more</div>";';
    html += '  }';
    html += '  html += "</div></div>";';
    html += '';
    html += '  sectionsDiv.innerHTML = html;';
    html += '';
    html += '  var checkboxes = document.querySelectorAll(".field-checkbox");';
    html += '  for (var i = 0; i < checkboxes.length; i++) {';
    html += '    checkboxes[i].addEventListener("change", handleCheckboxChange);';
    html += '  }';
    html += '';
    html += '  updateCounts();';
    html += '});';
    html += '</script>';

    html += '</head><body>';
    html += '<h1>🎯 Select Fields to Cache</h1>';
    html += '<div id="sections"></div>';
    html += '<div class="footer">';
    html += '<div style="margin-bottom: 10px;">Selected: <strong><span id="selected-count">0</span></strong> fields</div>';
    html += '<button class="btn btn-primary" onclick="saveSelection()">💾 Save Selection</button>';
    html += '<button class="btn btn-secondary" onclick="google.script.host.close()">Cancel</button>';
    html += '</div>';
    html += '</body></html>';

    var htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(800)
      .setHeight(700);

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🎯 Select Fields to Cache');
    Logger.log('✅ Step 3 modal displayed');

  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    SpreadsheetApp.getUi().alert('Error', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
`;

    code = code.substring(0, funcStart) + step3Function + code.substring(funcEnd);

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
    console.log('✅ STEP 3: CHECKBOXES DEPLOYED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Features:');
    console.log('✅ Checkboxes with data-field attributes (simpler)');
    console.log('✅ Event listeners attached after rendering');
    console.log('✅ Live selection count');
    console.log('✅ Save button (placeholder)');
    console.log('✅ Cancel button\n');
    console.log('Test: Check/uncheck boxes and watch the count update');
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
