#!/usr/bin/env node

/**
 * DEPLOY LOGGED FIELD SELECTOR
 * Deploy complete field selector that calls logged getFieldSelectorData_()
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

    // First, replace showFieldSelector with client-side loading version
    console.log('🔧 Replacing showFieldSelector()...\n');

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

    const html = '<!DOCTYPE html><html><head><style>' +
      'body { font-family: sans-serif; margin: 0; padding: 20px; }' +
      '.log-panel { background: #1e1e1e; color: #d4d4d4; padding: 15px; height: 150px; overflow-y: auto; border-radius: 8px; margin-bottom: 20px; border: 3px solid #007acc; }' +
      '.log-header { display: flex; justify-content: space-between; margin-bottom: 10px; }' +
      '.log-title { color: #007acc; font-weight: bold; }' +
      '.btn-copy { background: #007acc; color: white; border: none; padding: 5px 15px; border-radius: 3px; cursor: pointer; }' +
      '.log-panel pre { margin: 0; font-family: monospace; font-size: 11px; white-space: pre-wrap; }' +
      '.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }' +
      '.category { background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }' +
      '.category-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; }' +
      '.section-header { font-weight: bold; font-size: 11px; text-transform: uppercase; margin: 10px 0 5px 0; }' +
      '.section-selected { color: #4caf50; }' +
      '.section-recommended { color: #ff9800; }' +
      '.section-other { color: #999; }' +
      '.field { padding: 8px; margin: 5px 0; background: #f9f9f9; border-radius: 4px; }' +
      '.field input { margin-right: 10px; }' +
      '.field-selected { background: #e8f5e9; }' +
      '.footer { position: sticky; bottom: 0; background: white; padding: 15px; border-top: 2px solid #e0e0e0; }' +
      '.btn { background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; }' +
      '</style></head><body>' +
      '<div class="log-panel"><div class="log-header"><span class="log-title">📋 Live Log</span><button class="btn-copy" onclick="copyLogs()">Copy</button></div><pre id="log"></pre></div>' +
      '<div class="header"><h2>🎯 Select Fields to Cache</h2></div>' +
      '<div id="categories"></div>' +
      '<div class="footer"><span id="count">Loading...</span><button class="btn" onclick="save()">Continue →</button></div>' +
      '<script>' +
      'const logEl = document.getElementById("log");' +
      'const logs = [];' +
      'function log(msg) {' +
      '  const t = new Date().toISOString().substr(11, 8);' +
      '  logs.push("[" + t + "] " + msg);' +
      '  logEl.textContent = logs.join("\\\\n");' +
      '  logEl.scrollTop = logEl.scrollHeight;' +
      '}' +
      'function copyLogs() { navigator.clipboard.writeText(logs.join("\\\\n")).then(() => alert("✅ Copied!")); }' +
      'log("🎯 JavaScript started");' +
      'log("📞 Calling getFieldSelectorData_()...");' +
      'google.script.run' +
      '  .withSuccessHandler(function(data) {' +
      '    log("✅ Data received: " + Object.keys(data.grouped).length + " categories");' +
      '    renderFields(data);' +
      '  })' +
      '  .withFailureHandler(function(err) {' +
      '    log("❌ ERROR: " + err.message);' +
      '  })' +
      '  .getFieldSelectorData_();' +
      'function renderFields(data) {' +
      '  log("📋 Rendering fields...");' +
      '  const container = document.getElementById("categories");' +
      '  let total = 0;' +
      '  Object.keys(data.grouped).forEach(category => {' +
      '    const catDiv = document.createElement("div");' +
      '    catDiv.className = "category";' +
      '    catDiv.innerHTML = "<div class=\\\\\\\\"category-title\\\\\\\\">" + category + " (" + data.grouped[category].length + ")</div>";' +
      '    let lastSection = null;' +
      '    data.grouped[category].forEach(field => {' +
      '      const isSel = data.selected.indexOf(field.name) !== -1;' +
      '      const isRec = data.recommended.indexOf(field.name) !== -1;' +
      '      const section = isSel ? "sel" : (isRec ? "rec" : "other");' +
      '      if (section !== lastSection) {' +
      '        const secDiv = document.createElement("div");' +
      '        secDiv.className = "section-header section-" + section;' +
      '        secDiv.textContent = section === "sel" ? "✅ Selected" : (section === "rec" ? "💡 Recommended" : "📋 Other");' +
      '        catDiv.appendChild(secDiv);' +
      '        lastSection = section;' +
      '      }' +
      '      const fDiv = document.createElement("div");' +
      '      fDiv.className = "field" + (isSel ? " field-selected" : "");' +
      '      const cb = document.createElement("input");' +
      '      cb.type = "checkbox";' +
      '      cb.id = field.name;' +
      '      cb.checked = isSel;' +
      '      cb.onchange = updateCount;' +
      '      fDiv.appendChild(cb);' +
      '      fDiv.appendChild(document.createTextNode(field.name));' +
      '      catDiv.appendChild(fDiv);' +
      '      total++;' +
      '    });' +
      '    container.appendChild(catDiv);' +
      '  });' +
      '  log("✅ Rendered " + total + " fields");' +
      '  updateCount();' +
      '}' +
      'function updateCount() {' +
      '  let count = 0;' +
      '  document.querySelectorAll("input:checked").forEach(() => count++);' +
      '  document.getElementById("count").textContent = "Selected: " + count;' +
      '}' +
      'function save() {' +
      '  const sel = [];' +
      '  document.querySelectorAll("input:checked").forEach(cb => sel.push(cb.id));' +
      '  log("💾 Saving " + sel.length + " fields...");' +
      '  google.script.run.withSuccessHandler(() => {' +
      '    log("✅ Saved!");' +
      '    google.script.host.close();' +
      '  }).saveFieldSelectionAndStartCache(sel);' +
      '}' +
      '</scr' + 'ipt></body></html>';

    Logger.log('✅ HTML created');

    const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(900).setHeight(700);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Select Fields to Cache');

    Logger.log('✅ Modal displayed');

  } catch (error) {
    Logger.log('❌ ERROR: ' + error.toString());
    SpreadsheetApp.getUi().alert('Error: ' + error.message);
  }
}`;

    code = code.substring(0, funcStart) + newShowFieldSelector + code.substring(funcEnd);

    console.log('✅ Replaced showFieldSelector\n');

    // Now make sure getFieldSelectorData_ has logging
    if (!code.includes('🔍 getFieldSelectorData_() START')) {
      console.log('🔧 Adding logging to getFieldSelectorData_()...\n');

      const dataFuncStart = code.indexOf('function getFieldSelectorData_()');
      braceCount = 0;
      inFunction = false;
      let dataFuncEnd = dataFuncStart;

      for (let i = dataFuncStart; i < code.length; i++) {
        if (code[i] === '{') {
          braceCount++;
          inFunction = true;
        } else if (code[i] === '}') {
          braceCount--;
          if (inFunction && braceCount === 0) {
            dataFuncEnd = i + 1;
            break;
          }
        }
      }

      const loggedDataFunction = `function getFieldSelectorData_() {
  try {
    Logger.log('🔍 getFieldSelectorData_() START');

    Logger.log('   Step 1: About to call refreshHeaders()');
    refreshHeaders();
    Logger.log('   ✅ Step 1 complete');

    Logger.log('   Step 2: About to call getAvailableFields()');
    var availableFields = getAvailableFields();
    Logger.log('   ✅ Step 2 complete: ' + availableFields.length + ' fields');

    Logger.log('   Step 3: About to call loadFieldSelection()');
    var selectedFields = loadFieldSelection();
    Logger.log('   ✅ Step 3 complete: ' + selectedFields.length + ' selected');

    Logger.log('   Step 4: About to call getStaticRecommendedFields_()');
    var recommendedFields = getStaticRecommendedFields_(availableFields, selectedFields);
    Logger.log('   ✅ Step 4 complete: ' + recommendedFields.length + ' recommended');

    Logger.log('   Step 5: About to group by category');
    var grouped = {};
    for (var i = 0; i < availableFields.length; i++) {
      var field = availableFields[i];
      var category = field.tier1;
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(field);
    }
    Logger.log('   ✅ Step 5 complete: ' + Object.keys(grouped).length + ' categories');

    Logger.log('   Step 6: Building return object');
    var result = {
      grouped: grouped,
      selected: selectedFields,
      recommended: recommendedFields
    };
    Logger.log('   ✅ Step 6 complete');

    Logger.log('🎉 getFieldSelectorData_() RETURNING SUCCESSFULLY');
    return result;

  } catch (error) {
    Logger.log('❌ ERROR in getFieldSelectorData_(): ' + error.toString());
    Logger.log('   Stack: ' + error.stack);
    throw error;
  }
}`;

      code = code.substring(0, dataFuncStart) + loggedDataFunction + code.substring(dataFuncEnd);
      console.log('✅ Added logging\n');
    } else {
      console.log('✅ Logging already present\n');
    }

    // Deploy
    console.log('📤 Deploying...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 LOGGED FIELD SELECTOR DEPLOYED\n');
    console.log('Now when you click "Pre-Cache Rich Data":\n');
    console.log('1. Live logs will show progress in the modal\n');
    console.log('2. Server logs will show detailed step-by-step execution\n');
    console.log('3. Go to Extensions → Apps Script → Executions to see server logs\n');
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
