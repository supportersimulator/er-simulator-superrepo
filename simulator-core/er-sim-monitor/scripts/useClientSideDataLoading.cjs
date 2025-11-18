#!/usr/bin/env node

/**
 * USE CLIENT-SIDE DATA LOADING
 * Instead of embedding data in HTML, fetch it via google.script.run after page loads
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 SWITCHING TO CLIENT-SIDE DATA LOADING\n');
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

async function fix() {
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

    console.log('🔧 Adding server-side data provider function...\n');

    // Add a function that returns the field data
    const dataProviderFunction = `
/**
 * Get field selector data for client-side rendering
 */
function getFieldSelectorData_() {
  refreshHeaders();
  const availableFields = getAvailableFields();
  const selectedFields = loadFieldSelection();
  const recommendedFields = getStaticRecommendedFields_(availableFields, selectedFields);

  // Group by category
  const grouped = {};
  availableFields.forEach(function(field) {
    const category = field.tier1;
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(field);
  });

  // Sort within categories
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

  return {
    grouped: grouped,
    selected: selectedFields,
    recommended: recommendedFields
  };
}
`;

    // Insert before showFieldSelector
    const insertPos = code.indexOf('function showFieldSelector()');
    if (insertPos !== -1) {
      code = code.slice(0, insertPos) + dataProviderFunction + '\n' + code.slice(insertPos);
      console.log('✅ Added getFieldSelectorData_() function\n');
    }

    // Now replace showFieldSelector with simpler version
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

    // Create simple HTML that loads data via google.script.run
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
      'log("📞 Calling server for data...");' +
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
      '    catDiv.innerHTML = "<div class=\\\\"category-title\\\\">" + category + " (" + data.grouped[category].length + ")</div>";' +
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

    code = code.substring(0, funcStart) + newShowFieldSelector + code.substring(funcEnd);

    console.log('✅ Replaced showFieldSelector with client-side loading version\n');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-client-side-loading-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up\n`);

    // Deploy
    console.log('📤 Deploying...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log(`✅ Deployment successful!\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 CLIENT-SIDE DATA LOADING ENABLED!\n');
    console.log('Now data is fetched via google.script.run AFTER page loads.\n');
    console.log('This avoids embedding huge JSON in the HTML.\n');
    console.log('Click "Pre-Cache Rich Data" - logs should show the API call!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
