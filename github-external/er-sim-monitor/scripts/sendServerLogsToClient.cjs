#!/usr/bin/env node

/**
 * SEND SERVER LOGS TO CLIENT
 * Make getFieldSelectorData_() return logs along with data
 * So all debugging info appears in the live log panel
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

    console.log('🔧 Modifying getFieldSelectorData_() to return logs...\n');

    // Replace getFieldSelectorData_ with version that captures logs
    const funcStart = code.indexOf('function getFieldSelectorData_()');
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

    const newFunction = `function getFieldSelectorData_() {
  var logs = [];
  function addLog(msg) {
    logs.push(msg);
    Logger.log(msg);
  }

  try {
    addLog('🔍 getFieldSelectorData_() START');

    addLog('   Step 1: Calling refreshHeaders()');
    refreshHeaders();
    addLog('   ✅ Step 1 complete');

    addLog('   Step 2: Calling getAvailableFields()');
    var availableFields = getAvailableFields();
    addLog('   ✅ Step 2 complete: ' + availableFields.length + ' fields');

    addLog('   Step 3: Calling loadFieldSelection()');
    var selectedFields = loadFieldSelection();
    addLog('   ✅ Step 3 complete: ' + selectedFields.length + ' selected');

    addLog('   Step 4: Calling getStaticRecommendedFields_()');
    var recommendedFields = getStaticRecommendedFields_(availableFields, selectedFields);
    addLog('   ✅ Step 4 complete: ' + recommendedFields.length + ' recommended');

    addLog('   Step 5: Grouping by category');
    var grouped = {};
    for (var i = 0; i < availableFields.length; i++) {
      var field = availableFields[i];
      var category = field.tier1;
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(field);
    }
    addLog('   ✅ Step 5 complete: ' + Object.keys(grouped).length + ' categories');

    addLog('   Step 6: Building return object');
    var result = {
      grouped: grouped,
      selected: selectedFields,
      recommended: recommendedFields,
      logs: logs
    };
    addLog('   ✅ Step 6 complete');

    addLog('🎉 getFieldSelectorData_() RETURNING SUCCESSFULLY');
    return result;

  } catch (error) {
    addLog('❌ ERROR: ' + error.toString());
    addLog('   Stack: ' + error.stack);
    return {
      grouped: {},
      selected: [],
      recommended: [],
      logs: logs,
      error: error.toString()
    };
  }
}`;

    code = code.substring(0, funcStart) + newFunction + code.substring(funcEnd);

    console.log('✅ Modified getFieldSelectorData_()\n');

    console.log('🔧 Updating client-side to display server logs...\n');

    // Update showFieldSelector to display server logs
    const showStart = code.indexOf('function showFieldSelector()');
    braceCount = 0;
    inFunction = false;
    let showEnd = showStart;

    for (let i = showStart; i < code.length; i++) {
      if (code[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (code[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          showEnd = i + 1;
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
      'body { font-family: sans-serif; margin: 0; padding: 20px; }' +
      '.log-panel { background: #1e1e1e; color: #d4d4d4; padding: 15px; height: 200px; overflow-y: auto; border-radius: 8px; margin-bottom: 20px; border: 3px solid #007acc; }' +
      '.log-header { display: flex; justify-content: space-between; margin-bottom: 10px; }' +
      '.log-title { color: #007acc; font-weight: bold; }' +
      '.btn-copy { background: #007acc; color: white; border: none; padding: 5px 15px; border-radius: 3px; cursor: pointer; }' +
      '.log-panel pre { margin: 0; font-family: monospace; font-size: 11px; white-space: pre-wrap; line-height: 1.4; }' +
      '.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }' +
      '.footer { padding: 15px; }' +
      '.btn { background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; }' +
      '</style>' +
      '</head>' +
      '<body>' +
      '<div class="log-panel">' +
      '<div class="log-header">' +
      '<span class="log-title">📋 Live Log</span>' +
      '<button class="btn-copy" onclick="copyLogs()">Copy</button>' +
      '</div>' +
      '<pre id="log"></pre>' +
      '</div>' +
      '<div class="header"><h2>🎯 Select Fields to Cache</h2></div>' +
      '<div id="categories"></div>' +
      '<div class="footer">' +
      '<span id="count">Loading...</span>' +
      '<button class="btn" onclick="save()">Continue →</button>' +
      '</div>' +
      '<script>' +
      'var logEl = document.getElementById("log");' +
      'var logs = [];' +
      'function log(msg) {' +
      '  var t = new Date().toISOString().substr(11, 8);' +
      '  logs.push("[" + t + "] " + msg);' +
      '  logEl.textContent = logs.join("\\\\n");' +
      '  logEl.scrollTop = logEl.scrollHeight;' +
      '}' +
      'function copyLogs() {' +
      '  navigator.clipboard.writeText(logs.join("\\\\n")).then(function() {' +
      '    alert("✅ Copied!");' +
      '  });' +
      '}' +
      'function save() {' +
      '  log("💾 Saving...");' +
      '}' +
      'log("🎯 Client JavaScript started");' +
      'log("📞 Calling server getFieldSelectorData_()...");' +
      'google.script.run' +
      '.withSuccessHandler(function(data) {' +
      '  log("✅ Server responded!");' +
      '  if (data.logs) {' +
      '    log("📋 Server logs:");' +
      '    for (var i = 0; i < data.logs.length; i++) {' +
      '      log("   " + data.logs[i]);' +
      '    }' +
      '  }' +
      '  if (data.error) {' +
      '    log("❌ Server error: " + data.error);' +
      '  } else {' +
      '    log("✅ Got " + Object.keys(data.grouped).length + " categories");' +
      '    log("✅ Got " + data.selected.length + " selected fields");' +
      '    log("✅ Got " + data.recommended.length + " recommended fields");' +
      '  }' +
      '})' +
      '.withFailureHandler(function(err) {' +
      '  log("❌ CLIENT ERROR: " + err.message);' +
      '})' +
      '.getFieldSelectorData_();' +
      '<\\/script>' +
      '</body>' +
      '</html>';

    Logger.log('✅ HTML content created');

    var htmlOutput = HtmlService.createHtmlOutput(htmlContent)
      .setWidth(900)
      .setHeight(700);

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Select Fields to Cache');

    Logger.log('✅ Modal displayed');

  } catch (error) {
    Logger.log('❌ ERROR: ' + error.toString());
    SpreadsheetApp.getUi().alert('Error: ' + error.message);
  }
}`;

    code = code.substring(0, showStart) + newShowFieldSelector + code.substring(showEnd);

    console.log('✅ Updated showFieldSelector()\n');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-server-logs-to-client-2025-11-06.gs');
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

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📋 SERVER LOGS → CLIENT LIVE LOG\n');
    console.log('Now ALL logs (client + server) appear in the Live Log panel!\n');
    console.log('Click "Pre-Cache Rich Data" and watch the live logs show:\n');
    console.log('  • Client startup\n');
    console.log('  • Server function call\n');
    console.log('  • Server step-by-step execution\n');
    console.log('  • Exactly where it succeeds or fails\n');
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
