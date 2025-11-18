#!/usr/bin/env node

/**
 * BUILD COMPLETE FIELD SELECTOR
 * Now that minimal version works, build the full 3-section categorized version
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 BUILDING COMPLETE FIELD SELECTOR\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

async function buildComplete() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Replacing with complete field selector...\n');

    // Find and replace showFieldSelector function
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

    const completeFunction = `function showFieldSelector() {
  try {
    Logger.log('🎯 showFieldSelector() started');

    // Get data
    refreshHeaders();
    const availableFields = getAvailableFields();
    const selectedFields = loadFieldSelection();
    const recommendedFields = getStaticRecommendedFields_(availableFields, selectedFields);

    Logger.log('✅ Data loaded: ' + availableFields.length + ' fields, ' + selectedFields.length + ' selected, ' + recommendedFields.length + ' recommended');

    // Group by category
    const grouped = {};
    availableFields.forEach(function(field) {
      const category = field.tier1;
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(field);
    });

    // Sort within categories: selected > recommended > other
    Object.keys(grouped).forEach(function(category) {
      grouped[category].sort(function(a, b) {
        const aSelected = selectedFields.indexOf(a.name) !== -1;
        const bSelected = selectedFields.indexOf(b.name) !== -1;
        const aRecommended = recommendedFields.indexOf(a.name) !== -1;
        const bRecommended = recommendedFields.indexOf(b.name) !== -1;

        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        if (!aSelected && !bSelected) {
          if (aRecommended && !bRecommended) return -1;
          if (!aRecommended && bRecommended) return 1;
        }
        return a.name.localeCompare(b.name);
      });
    });

    Logger.log('✅ Grouped into ' + Object.keys(grouped).length + ' categories');

    const html = '<!DOCTYPE html><html><head><style>' +
      'body { font-family: sans-serif; margin: 0; padding: 20px; }' +
      '.log-panel { background: #1e1e1e; color: #d4d4d4; padding: 15px; height: 180px; overflow-y: auto; border-radius: 8px; margin-bottom: 20px; border: 3px solid #007acc; }' +
      '.log-header { display: flex; justify-content: space-between; margin-bottom: 10px; }' +
      '.log-title { color: #007acc; font-weight: bold; font-size: 14px; }' +
      '.btn-copy { background: #007acc; color: white; border: none; padding: 5px 15px; border-radius: 3px; cursor: pointer; font-size: 12px; }' +
      '.btn-copy:hover { background: #005a9e; }' +
      '.log-panel pre { margin: 0; font-family: "Courier New", monospace; font-size: 11px; white-space: pre-wrap; line-height: 1.4; }' +
      '.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }' +
      '.category { background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }' +
      '.category-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 2px solid #e0e0e0; }' +
      '.section-header { font-weight: bold; font-size: 11px; text-transform: uppercase; margin: 15px 0 8px 0; padding: 5px 0; }' +
      '.section-selected { color: #4caf50; }' +
      '.section-recommended { color: #ff9800; }' +
      '.section-other { color: #999; }' +
      '.field { padding: 8px; margin: 5px 0; background: #f9f9f9; border-radius: 4px; }' +
      '.field input { margin-right: 10px; cursor: pointer; }' +
      '.field-selected { background: #e8f5e9; }' +
      '.footer { position: sticky; bottom: 0; background: white; padding: 15px; border-top: 2px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; margin: 20px -20px -20px -20px; }' +
      '.btn { background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: bold; }' +
      '.btn:hover { background: #5568d3; }' +
      '</style></head><body>' +
      '<div class="log-panel"><div class="log-header"><span class="log-title">📋 Live Execution Log</span><button class="btn-copy" onclick="copyLogs()">📋 Copy Logs</button></div><pre id="log"></pre></div>' +
      '<div class="header"><h2>🎯 Select Fields to Cache</h2><p>Choose which fields the AI will analyze for pathway discovery</p></div>' +
      '<div id="categories"></div>' +
      '<div class="footer"><span id="count">Loading...</span><button class="btn" onclick="save()">Continue to Cache →</button></div>' +
      '<script>' +
      'const logEl = document.getElementById("log");' +
      'const logs = [];' +
      'function log(msg) {' +
      '  const t = new Date().toISOString().substr(11, 8);' +
      '  const line = "[" + t + "] " + msg;' +
      '  logs.push(line);' +
      '  logEl.textContent = logs.join("\\\\n");' +
      '  logEl.scrollTop = logEl.scrollHeight;' +
      '}' +
      'function copyLogs() { navigator.clipboard.writeText(logs.join("\\\\n")).then(() => alert("✅ Copied!")); }' +
      'log("🎯 Field Selector JavaScript started");' +
      'log("📥 Loading data from server...");' +
      'const grouped = ' + JSON.stringify(grouped) + ';' +
      'const selected = ' + JSON.stringify(selectedFields) + ';' +
      'const recommended = ' + JSON.stringify(recommendedFields) + ';' +
      'log("✅ Data received:");' +
      'log("   • " + Object.keys(grouped).length + " categories");' +
      'log("   • " + selected.length + " selected fields");' +
      'log("   • " + recommended.length + " recommended fields");' +
      'log("📋 Building category panels...");' +
      'const container = document.getElementById("categories");' +
      'let totalFieldsRendered = 0;' +
      'Object.keys(grouped).forEach(category => {' +
      '  const catDiv = document.createElement("div");' +
      '  catDiv.className = "category";' +
      '  catDiv.innerHTML = "<div class=\\"category-title\\">" + category + " (" + grouped[category].length + ")</div>";' +
      '  let lastSection = null;' +
      '  grouped[category].forEach(field => {' +
      '    const isSelected = selected.indexOf(field.name) !== -1;' +
      '    const isRecommended = recommended.indexOf(field.name) !== -1;' +
      '    const section = isSelected ? "selected" : (isRecommended ? "recommended" : "other");' +
      '    if (section !== lastSection) {' +
      '      const secDiv = document.createElement("div");' +
      '      secDiv.className = "section-header section-" + section;' +
      '      secDiv.textContent = section === "selected" ? "✅ Selected" : (section === "recommended" ? "💡 Recommended" : "📋 Other");' +
      '      catDiv.appendChild(secDiv);' +
      '      lastSection = section;' +
      '    }' +
      '    const fieldDiv = document.createElement("div");' +
      '    fieldDiv.className = "field" + (isSelected ? " field-selected" : "");' +
      '    const checkbox = document.createElement("input");' +
      '    checkbox.type = "checkbox";' +
      '    checkbox.id = field.name;' +
      '    checkbox.checked = isSelected;' +
      '    checkbox.onchange = updateCount;' +
      '    fieldDiv.appendChild(checkbox);' +
      '    fieldDiv.appendChild(document.createTextNode(field.name));' +
      '    catDiv.appendChild(fieldDiv);' +
      '    totalFieldsRendered++;' +
      '  });' +
      '  container.appendChild(catDiv);' +
      '});' +
      'log("✅ Rendered " + totalFieldsRendered + " fields across " + Object.keys(grouped).length + " categories");' +
      'function updateCount() {' +
      '  let count = 0;' +
      '  document.querySelectorAll("input[type=checkbox]:checked").forEach(() => count++);' +
      '  document.getElementById("count").textContent = "Selected: " + count + " fields";' +
      '}' +
      'function save() {' +
      '  const selected = [];' +
      '  document.querySelectorAll("input[type=checkbox]:checked").forEach(cb => selected.push(cb.id));' +
      '  log("💾 Saving " + selected.length + " fields...");' +
      '  google.script.run.withSuccessHandler(() => {' +
      '    log("✅ Saved! Starting cache...");' +
      '    google.script.host.close();' +
      '  }).saveFieldSelectionAndStartCache(selected);' +
      '}' +
      'updateCount();' +
      'log("✅ Field selector ready!");' +
      '</script></body></html>';

    Logger.log('✅ HTML created');

    const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(900).setHeight(700);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Select Fields to Cache');

    Logger.log('✅ Modal displayed');

  } catch (error) {
    Logger.log('❌ ERROR: ' + error.toString());
    SpreadsheetApp.getUi().alert('Error: ' + error.message);
  }
}`;

    code = code.substring(0, funcStart) + completeFunction + code.substring(funcEnd);

    console.log('✅ Replaced with complete version\n');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-complete-selector-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up to: ${backupPath}\n`);

    // Deploy
    console.log('📤 Deploying to production...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log(`✅ Deployment successful!\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 COMPLETE FIELD SELECTOR DEPLOYED!\n');
    console.log('Features:\n');
    console.log('   ✅ 3-section display (Selected, Recommended, Other)');
    console.log('   ✅ Grouped by category');
    console.log('   ✅ Live log panel with copy button');
    console.log('   ✅ Field counter');
    console.log('   ✅ Save functionality\n');
    console.log('Click "Pre-Cache Rich Data" to see the full field selector!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

buildComplete();
