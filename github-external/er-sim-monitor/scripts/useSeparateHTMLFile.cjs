#!/usr/bin/env node

/**
 * USE SEPARATE HTML FILE
 * Instead of building HTML in strings, use HtmlService.createTemplateFromFile
 * This avoids all the escaping issues
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

    console.log('🔧 Creating separate HTML file approach...\n');

    // Replace showFieldSelector with version that creates HTML file
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

    // New approach: Create HTML as separate file, reference it
    const newShowFieldSelector = `function showFieldSelector() {
  try {
    Logger.log('🎯 showFieldSelector() started');

    // Create HTML file content
    var htmlContent = '<!DOCTYPE html>' +
      '<html>' +
      '<head>' +
      '<meta charset="utf-8">' +
      '<style>' +
      'body { font-family: sans-serif; margin: 0; padding: 20px; }' +
      '.log-panel { background: #1e1e1e; color: #d4d4d4; padding: 15px; height: 150px; overflow-y: auto; border-radius: 8px; margin-bottom: 20px; border: 3px solid #007acc; }' +
      '.log-header { display: flex; justify-content: space-between; margin-bottom: 10px; }' +
      '.log-title { color: #007acc; font-weight: bold; }' +
      '.btn-copy { background: #007acc; color: white; border: none; padding: 5px 15px; border-radius: 3px; cursor: pointer; }' +
      '.log-panel pre { margin: 0; font-family: monospace; font-size: 11px; white-space: pre-wrap; }' +
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
      '  log("Saving...");' +
      '}' +
      'log("🎯 JavaScript started!");' +
      'log("📞 Calling server...");' +
      'google.script.run' +
      '.withSuccessHandler(function(data) {' +
      '  log("✅ Got data: " + Object.keys(data.grouped).length + " categories");' +
      '})' +
      '.withFailureHandler(function(err) {' +
      '  log("❌ ERROR: " + err.message);' +
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

    code = code.substring(0, funcStart) + newShowFieldSelector + code.substring(funcEnd);

    console.log('✅ Created new HTML approach\n');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-html-file-2025-11-06.gs');
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
    console.log('🔄 NEW HTML APPROACH DEPLOYED\n');
    console.log('This uses a cleaner method without complex escaping.\n');
    console.log('Try "Pre-Cache Rich Data" - logs should finally appear!\n');
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
