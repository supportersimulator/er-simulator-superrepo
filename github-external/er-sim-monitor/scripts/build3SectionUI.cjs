#!/usr/bin/env node

/**
 * BUILD 3-SECTION UI
 * Integrate the complete field selector UI with compact styling for first 2 sections
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

async function build() {
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

    console.log('🔧 Replacing showFieldSelector with complete 3-section UI...\n');

    // Find and replace showFieldSelector
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

    const newShowFieldSelector = `function showFieldSelector() {
  try {
    Logger.log('🎯 showFieldSelector() started');

    var htmlContent = '<!DOCTYPE html>' +
      '<html>' +
      '<head>' +
      '<meta charset="utf-8">' +
      '<style>' +
      'body { font-family: -apple-system, sans-serif; padding: 16px; background: #f5f5f5; margin: 0; }' +
      '.log-panel { background: #1e1e1e; color: #d4d4d4; padding: 12px; height: 120px; overflow-y: auto; border-radius: 6px; margin-bottom: 16px; border: 2px solid #007acc; }' +
      '.log-header { display: flex; justify-content: space-between; margin-bottom: 8px; }' +
      '.log-title { color: #007acc; font-weight: bold; font-size: 13px; }' +
      '.btn-copy { background: #007acc; color: white; border: none; padding: 4px 12px; border-radius: 3px; cursor: pointer; font-size: 11px; }' +
      '.log-panel pre { margin: 0; font-family: monospace; font-size: 10px; white-space: pre-wrap; line-height: 1.3; }' +
      '.header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 16px; border-radius: 6px; margin-bottom: 16px; }' +
      '.header h2 { margin: 0 0 8px 0; font-size: 18px; }' +
      '.header p { margin: 0; opacity: 0.9; font-size: 13px; }' +
      '.categories-container { max-height: 420px; overflow-y: auto; padding-right: 8px; }' +
      '.category { background: white; border-radius: 6px; padding: 12px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }' +
      '.category-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 2px solid #e0e0e0; }' +
      '.category-title { font-weight: bold; font-size: 14px; color: #333; }' +
      '.category-count { color: #667eea; font-size: 12px; margin-left: 6px; }' +
      '.category-actions button { font-size: 10px; padding: 3px 6px; margin-left: 4px; cursor: pointer; border: 1px solid #ddd; background: white; border-radius: 3px; }' +
      '.section-header { margin-top: 10px; margin-bottom: 4px; padding-top: 4px; padding-bottom: 2px; font-weight: bold; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; }' +
      '.section-selected { color: #4caf50; border-top: 1px solid #e0e0e0; }' +
      '.section-recommended { color: #ff9800; border-top: 1px solid #e0e0e0; }' +
      '.section-other { color: #999; border-top: 1px solid #e0e0e0; }' +
      '.ai-rationale { font-size: 11px; font-weight: normal; color: #666; font-style: italic; margin-top: 3px; padding-left: 20px; line-height: 1.4; }' +
      '.field-item { padding: 4px 6px; margin: 2px 0; background: #f9f9f9; border-radius: 3px; display: flex; align-items: center; font-size: 11px; }' +
      '.field-item-compact { padding: 3px 4px; font-size: 10px; }' +
      '.field-item:hover { background: #f0f0f0; }' +
      '.field-item input { margin-right: 6px; cursor: pointer; width: 13px; height: 13px; }' +
      '.field-item label { cursor: pointer; flex: 1; line-height: 1.2; }' +
      '.field-name { font-weight: 500; color: #333; }' +
      '.footer { position: sticky; bottom: 0; background: white; padding: 12px 16px; border-top: 2px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 -2px 8px rgba(0,0,0,0.1); margin: 0 -16px -16px -16px; }' +
      '.field-count { font-weight: bold; color: #667eea; font-size: 14px; }' +
      '.btn-continue { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 10px 20px; border-radius: 5px; font-size: 14px; font-weight: bold; cursor: pointer; }' +
      '.btn-continue:hover { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(102,126,234,0.4); }' +
      '.btn-reset { background: white; color: #667eea; border: 2px solid #667eea; padding: 8px 16px; border-radius: 5px; font-size: 12px; font-weight: bold; cursor: pointer; margin-right: 8px; }' +
      '</style>' +
      '</head>' +
      '<body>' +
      '<div class=\"log-panel\"><div class=\"log-header\"><span class=\"log-title\">📋 Live Log</span><button class=\"btn-copy\" onclick=\"copyLogs()\">Copy</button></div><pre id=\"log\"></pre></div>' +
      '<div class=\"header\"><h2>🎯 Select Fields to Cache</h2><p>Choose fields for AI pathway discovery analysis</p></div>' +
      '<div class=\"categories-container\" id=\"categories\"></div>' +
      '<div class=\"footer\">' +
      '<span class=\"field-count\" id=\"count\">Loading...</span>' +
      '<div style=\"display: flex; gap: 8px;\"><button class=\"btn-reset\" onclick=\"resetToDefaults()\">🔄 Reset to Defaults</button><button class=\"btn-continue\" onclick=\"continueToCache()\">Continue to Cache →</button></div>' +
      '</div>' +
      '<script>' +
      'var logEl = document.getElementById(\"log\");' +
      'var logs = [];' +
      'function log(msg) {' +
      '  var t = new Date().toISOString().substr(11, 8);' +
      '  logs.push(\"[\" + t + \"] \" + msg);' +
      '  logEl.textContent = logs.join(\"\\\\n\");' +
      '  logEl.scrollTop = logEl.scrollHeight;' +
      '}' +
      'function copyLogs() {' +
      '  navigator.clipboard.writeText(logs.join(\"\\\\n\")).then(function() { alert(\"✅ Copied!\"); });' +
      '}' +
      'log(\"🎯 JavaScript started\");' +
      'log(\"📞 Calling server...\");' +
      'google.script.run' +
      '.withSuccessHandler(function(data) {' +
      '  log(\"✅ Server responded!\");' +
      '  if (data.logs) { data.logs.forEach(function(l) { log(\"   \" + l); }); }' +
      '  if (data.error) {' +
      '    log(\"❌ Error: \" + data.error);' +
      '  } else {' +
      '    log(\"✅ Got \" + Object.keys(data.grouped).length + \" categories, \" + data.selected.length + \" selected, \" + data.recommended.length + \" recommended\");' +
      '    renderFields(data);' +
      '  }' +
      '})' +
      '.withFailureHandler(function(err) {' +
      '  log(\"❌ ERROR: \" + err.message);' +
      '})' +
      '.getFieldSelectorData();' +
      'function renderFields(data) {' +
      '  log(\"📋 Rendering fields...\");' +
      '  var container = document.getElementById(\"categories\");' +
      '  container.innerHTML = \"\";' +
      '  var totalRendered = 0;' +
      '  Object.keys(data.grouped).forEach(function(category) {' +
      '    var catDiv = document.createElement(\"div\");' +
      '    catDiv.className = \"category\";' +
      '    var headerDiv = document.createElement(\"div\");' +
      '    headerDiv.className = \"category-header\";' +
      '    headerDiv.innerHTML = \"<div><span class=\\\\\"category-title\\\\\">\" + category + \"</span><span class=\\\\\"category-count\\\\\">(\" + data.grouped[category].length + \")</span></div>\";' +
      '    catDiv.appendChild(headerDiv);' +
      '    var lastSection = null;' +
      '    var aiRationaleShown = false;' +
      '    data.grouped[category].forEach(function(field) {' +
      '      var isSelected = data.selected.indexOf(field.name) !== -1;' +
      '      var isRecommended = data.recommended.indexOf(field.name) !== -1;' +
      '      var currentSection = isSelected ? \"selected\" : (isRecommended ? \"recommended\" : \"other\");' +
      '      if (currentSection !== lastSection) {' +
      '        var sectionDiv = document.createElement(\"div\");' +
      '        sectionDiv.className = \"section-header section-\" + currentSection;' +
      '        if (currentSection === \"selected\") {' +
      '          sectionDiv.textContent = \"✅ SELECTED FIELDS (Default or Previously Saved)\";' +
      '        } else if (currentSection === \"recommended\") {' +
      '          sectionDiv.innerHTML = \"💡 AI RECOMMENDED TO CONSIDER<div class=\\\\\"ai-rationale\\\\\">AI suggests these fields would maximize pathway discovery by revealing clinical reasoning patterns, grouping similar cases, and identifying time-critical scenarios.</div>\";' +
      '          aiRationaleShown = true;' +
      '        } else {' +
      '          sectionDiv.textContent = \"📋 ALL OTHER AVAILABLE FIELDS\";' +
      '        }' +
      '        catDiv.appendChild(sectionDiv);' +
      '        lastSection = currentSection;' +
      '      }' +
      '      var fieldDiv = document.createElement(\"div\");' +
      '      fieldDiv.className = \"field-item\" + (currentSection !== \"other\" ? \" field-item-compact\" : \"\");' +
      '      var checkbox = document.createElement(\"input\");' +
      '      checkbox.type = \"checkbox\";' +
      '      checkbox.id = field.name;' +
      '      checkbox.checked = isSelected;' +
      '      checkbox.onchange = updateCount;' +
      '      var label = document.createElement(\"label\");' +
      '      label.htmlFor = field.name;' +
      '      label.innerHTML = \"<span class=\\\\\"field-name\\\\\">\" + field.name + \"</span>\";' +
      '      fieldDiv.appendChild(checkbox);' +
      '      fieldDiv.appendChild(label);' +
      '      catDiv.appendChild(fieldDiv);' +
      '      totalRendered++;' +
      '    });' +
      '    container.appendChild(catDiv);' +
      '  });' +
      '  log(\"✅ Rendered \" + totalRendered + \" fields\");' +
      '  updateCount();' +
      '}' +
      'function updateCount() {' +
      '  var count = 0;' +
      '  document.querySelectorAll(\"input[type=checkbox]:checked\").forEach(function() { count++; });' +
      '  document.getElementById(\"count\").textContent = \"Selected: \" + count + \" fields\";' +
      '}' +
      'function resetToDefaults() {' +
      '  location.reload();' +
      '}' +
      'function continueToCache() {' +
      '  var selected = [];' +
      '  document.querySelectorAll(\"input[type=checkbox]:checked\").forEach(function(cb) { selected.push(cb.id); });' +
      '  log(\"💾 Saving \" + selected.length + \" fields...\");' +
      '  google.script.run.withSuccessHandler(function() {' +
      '    log(\"✅ Saved! Starting cache...\");' +
      '    google.script.host.close();' +
      '  }).withFailureHandler(function(err) {' +
      '    log(\"❌ Save error: \" + err.message);' +
      '    alert(\"Error: \" + err.message);' +
      '  }).saveFieldSelectionAndStartCache(selected);' +
      '}' +
      '<\\/script>' +
      '</body>' +
      '</html>';

    Logger.log('✅ HTML created');

    var htmlOutput = HtmlService.createHtmlOutput(htmlContent)
      .setWidth(900)
      .setHeight(750);

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🎯 Select Fields to Cache');

    Logger.log('✅ Modal displayed');

  } catch (error) {
    Logger.log('❌ ERROR: ' + error.toString());
    SpreadsheetApp.getUi().alert('Error: ' + error.message);
  }
}`;

    code = code.substring(0, funcStart) + newShowFieldSelector + code.substring(funcEnd);

    console.log('✅ Built 3-section UI\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎨 3-SECTION UI COMPLETE!\n');
    console.log('Features:\n');
    console.log('  ✅ Section 1: Selected (compact, green) - defaults or saved\n');
    console.log('  💡 Section 2: AI Recommended (compact, orange) - with rationale\n');
    console.log('  📋 Section 3: All Other (normal size, gray)\n');
    console.log('  🔄 Reset button to restore defaults\n');
    console.log('  💾 Continue button saves & starts cache\n');
    console.log('  📋 Live logging throughout\n');
    console.log('Try "Pre-Cache Rich Data" - full UI should render!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

build();
