#!/usr/bin/env node

/**
 * STEP 4: Complete field selector with Save + Live Log
 * This is the final production version!
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

    console.log('🔧 Creating Step 4: FINAL VERSION with Save + Live Log...\n');

    const funcStart = code.indexOf('function showFieldSelector()');
    const funcEnd = code.indexOf('\nfunction ', funcStart + 50);

    const finalFunction = `function showFieldSelector() {
  Logger.log('🎯 Field Selector - FINAL VERSION');

  try {
    var roughDraft = getFieldSelectorRoughDraft();
    var allFields = roughDraft.allFields;
    var selected = roughDraft.selected;

    Logger.log('✅ Got ' + allFields.length + ' fields, ' + selected.length + ' selected');

    var allFieldsJson = JSON.stringify(allFields);
    var selectedJson = JSON.stringify(selected);

    var html = '<!DOCTYPE html><html><head><title>Field Selector</title>';

    html += '<style>';
    html += 'body { font-family: Arial, sans-serif; margin: 0; padding: 0; display: flex; flex-direction: column; height: 100vh; }';
    html += '.live-log-header { background: #1a1a1a; color: #0f0; padding: 5px 10px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }';
    html += '.live-log { background: #000; color: #0f0; font-family: monospace; font-size: 12px; padding: 10px; height: 100px; overflow-y: auto; border-bottom: 3px solid #0f0; }';
    html += '.copy-btn { background: #0f0; color: #000; border: none; padding: 4px 12px; border-radius: 3px; cursor: pointer; font-weight: bold; font-size: 11px; }';
    html += '.copy-btn:hover { background: #0c0; }';
    html += '.main-content { flex: 1; overflow-y: auto; padding: 20px; }';
    html += 'h1 { color: #1a73e8; margin: 0 0 20px 0; }';
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
    html += '.footer { padding: 15px; background: #f8f9fa; border-top: 2px solid #ddd; }';
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
    html += 'function log(msg) {';
    html += '  var logDiv = document.getElementById("live-log");';
    html += '  var timestamp = new Date().toLocaleTimeString();';
    html += '  logDiv.innerHTML += "[" + timestamp + "] " + msg + "<br>";';
    html += '  logDiv.scrollTop = logDiv.scrollHeight;';
    html += '}';
    html += '';
    html += 'function copyLog() {';
    html += '  var logDiv = document.getElementById("live-log");';
    html += '  var text = logDiv.innerText;';
    html += '  navigator.clipboard.writeText(text).then(function() {';
    html += '    log("📋 Log copied to clipboard!");';
    html += '  });';
    html += '}';
    html += '';
    html += 'function initSelection() {';
    html += '  for (var i = 0; i < SELECTED_FIELDS.length; i++) {';
    html += '    currentSelection[SELECTED_FIELDS[i]] = true;';
    html += '  }';
    html += '  log("✅ Loaded " + SELECTED_FIELDS.length + " default fields");';
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
    html += '  log("💾 Saving " + selected.length + " fields to properties...");';
    html += '  google.script.run';
    html += '    .withSuccessHandler(function() {';
    html += '      log("✅ Selection saved successfully!");';
    html += '      log("🚀 Ready to cache data for these fields");';
    html += '      setTimeout(function() { google.script.host.close(); }, 1500);';
    html += '    })';
    html += '    .withFailureHandler(function(error) {';
    html += '      log("❌ Error saving: " + error.message);';
    html += '    })';
    html += '    .saveFieldSelection(selected);';
    html += '}';
    html += '';
    html += 'window.addEventListener("DOMContentLoaded", function() {';
    html += '  log("🎯 Field Selector initialized");';
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
    html += '  html += "<div class=\\\\"field-list\\\\"><em>AI recommendations will appear here in future update...</em></div>";';
    html += '  html += "</div>";';
    html += '';
    html += '  html += "<div class=\\\\"section\\\\">";';
    html += '  html += "<div class=\\\\"section-header other\\\\">📋 OTHER (" + otherFields.length + ")</div>";';
    html += '  html += "<div class=\\\\"field-list\\\\">";';
    html += '  for (var i = 0; i < Math.min(otherFields.length, 30); i++) {';
    html += '    var fieldName = otherFields[i];';
    html += '    html += "<div class=\\\\"field-item\\\\">";';
    html += '    html += "<input type=\\\\"checkbox\\\\" data-field=\\\\"" + fieldName + "\\\\" class=\\\\"field-checkbox\\\\">";';
    html += '    html += "<label>" + fieldName + "</label>";';
    html += '    html += "</div>";';
    html += '  }';
    html += '  if (otherFields.length > 30) {';
    html += '    html += "<div style=\\\\"padding: 8px; font-style: italic;\\\\">... and " + (otherFields.length - 30) + " more</div>";';
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
    html += '  log("📊 Displaying " + ALL_FIELDS.length + " total fields");';
    html += '});';
    html += '</script>';

    html += '</head><body>';
    html += '<div class="live-log-header">';
    html += '<span>📡 LIVE LOG</span>';
    html += '<button class="copy-btn" onclick="copyLog()">📋 COPY</button>';
    html += '</div>';
    html += '<div class="live-log" id="live-log"></div>';
    html += '<div class="main-content">';
    html += '<h1>🎯 Select Fields to Cache</h1>';
    html += '<div id="sections"></div>';
    html += '</div>';
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
    Logger.log('✅ Field selector displayed');

  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    SpreadsheetApp.getUi().alert('Error', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function saveFieldSelection(selectedFields) {
  try {
    Logger.log('💾 Saving ' + selectedFields.length + ' fields to properties');

    var docProps = PropertiesService.getDocumentProperties();
    docProps.setProperty('SELECTED_FIELDS', JSON.stringify(selectedFields));

    Logger.log('✅ Field selection saved');
    return { success: true };
  } catch (error) {
    Logger.log('❌ Error saving: ' + error.message);
    throw error;
  }
}
`;

    code = code.substring(0, funcStart) + finalFunction + code.substring(funcEnd);

    console.log('📤 Deploying FINAL VERSION...\n');

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
    console.log('🎉 FINAL VERSION DEPLOYED - FIELD SELECTOR COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Complete features:');
    console.log('✅ 3-section layout (DEFAULT, RECOMMENDED, OTHER)');
    console.log('✅ Interactive checkboxes');
    console.log('✅ Live selection count');
    console.log('✅ Save functionality (stores to DocumentProperties)');
    console.log('✅ Live log panel at bottom (shows activity)');
    console.log('✅ Auto-close after save');
    console.log('✅ Cancel button\n');
    console.log('How to use:');
    console.log('1. Open field selector from menu');
    console.log('2. Adjust checkboxes as needed');
    console.log('3. Click Save Selection');
    console.log('4. Modal closes automatically after save\n');
    console.log('Next steps:');
    console.log('- Add AI field recommendations (future)');
    console.log('- Integrate with batch caching system');
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
