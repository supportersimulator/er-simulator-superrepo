#!/usr/bin/env node

/**
 * CREATE MINIMAL WORKING FIELD SELECTOR
 * Strip down to bare minimum to get SOMETHING displaying
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 CREATING MINIMAL WORKING FIELD SELECTOR\n');
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

async function createMinimal() {
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

    console.log('🔧 Replacing showFieldSelector() with minimal test version...\n');

    // Find the entire showFieldSelector function
    const funcStart = code.indexOf('function showFieldSelector()');
    if (funcStart === -1) {
      console.log('❌ showFieldSelector() not found!\n');
      return;
    }

    // Find the end of the function (matching closing brace)
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

    // Extract the old function
    const oldFunction = code.substring(funcStart, funcEnd);

    // Create minimal test version
    const minimalFunction = `function showFieldSelector() {
  try {
    Logger.log('🎯 showFieldSelector() MINIMAL VERSION started');

    // Get basic data
    refreshHeaders();
    const availableFields = getAvailableFields();
    const selectedFields = loadFieldSelection();

    Logger.log('✅ Got ' + availableFields.length + ' available fields');
    Logger.log('✅ Got ' + selectedFields.length + ' selected fields');

    // Create simple HTML with just the field list
    const html =
      '<!DOCTYPE html>' +
      '<html>' +
      '<head>' +
      '<style>' +
      'body { font-family: sans-serif; padding: 20px; }' +
      '.field { padding: 5px; margin: 3px 0; }' +
      '.field input { margin-right: 10px; }' +
      '.selected { background: #e8f5e9; }' +
      '</style>' +
      '</head>' +
      '<body>' +
      '<h2>Field Selector (Minimal Test)</h2>' +
      '<p>Total fields: ' + availableFields.length + '</p>' +
      '<p>Selected: ' + selectedFields.length + '</p>' +
      '<div id="fields"></div>' +
      '<button onclick="closeDialog()">Close</button>' +
      '<script>' +
      'const fields = ' + JSON.stringify(availableFields) + ';' +
      'const selected = ' + JSON.stringify(selectedFields) + ';' +
      'console.log("Fields:", fields);' +
      'console.log("Selected:", selected);' +
      'const container = document.getElementById("fields");' +
      'fields.slice(0, 50).forEach(function(field) {' +
      '  const div = document.createElement("div");' +
      '  div.className = "field";' +
      '  if (selected.indexOf(field.name) !== -1) div.className += " selected";' +
      '  const checkbox = document.createElement("input");' +
      '  checkbox.type = "checkbox";' +
      '  checkbox.checked = selected.indexOf(field.name) !== -1;' +
      '  div.appendChild(checkbox);' +
      '  div.appendChild(document.createTextNode(field.name));' +
      '  container.appendChild(div);' +
      '});' +
      'function closeDialog() { google.script.host.close(); }' +
      '</script>' +
      '</body>' +
      '</html>';

    Logger.log('✅ HTML created');

    const htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(800)
      .setHeight(600);

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Field Selector (Minimal Test)');
    Logger.log('✅ Modal displayed');

  } catch (error) {
    Logger.log('❌ ERROR in showFieldSelector: ' + error.toString());
    Logger.log('   Stack: ' + error.stack);
    SpreadsheetApp.getUi().alert('Error: ' + error.message);
  }
}`;

    // Replace the function
    code = code.substring(0, funcStart) + minimalFunction + code.substring(funcEnd);

    console.log('✅ Replaced with minimal version\n');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-minimal-selector-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up to: ${backupPath}\n`);

    // Deploy
    console.log('📤 Deploying to production...\n');

    const updatedFiles = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: code
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: updatedFiles }
    });

    const newSize = (code.length / 1024).toFixed(1);

    console.log(`✅ Deployment successful! Size: ${newSize} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 MINIMAL FIELD SELECTOR DEPLOYED!\n');
    console.log('This is a SIMPLE test version that:\n');
    console.log('   ✅ Shows first 50 fields only');
    console.log('   ✅ Displays field names with checkboxes');
    console.log('   ✅ Highlights selected fields in green');
    console.log('   ✅ Has minimal styling\n');
    console.log('Click "Pre-Cache Rich Data" button now.\n');
    console.log('If this works, we know the data is fine and the issue is in the complex UI.\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

createMinimal();
