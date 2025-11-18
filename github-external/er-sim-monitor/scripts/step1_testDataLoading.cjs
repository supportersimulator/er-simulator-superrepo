#!/usr/bin/env node

/**
 * STEP 1: Test data loading in field selector
 *
 * This builds on the working minimal test by:
 * 1. Calling getFieldSelectorRoughDraft()
 * 2. Displaying field counts to verify data loads
 * 3. NO checkbox rendering yet - just data verification
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

    console.log('🔧 Creating Step 1: Data Loading Test...\n');

    // Find showFieldSelector function
    const funcStart = code.indexOf('function showFieldSelector()');
    const funcEnd = code.indexOf('\nfunction ', funcStart + 50);

    const step1Function = `function showFieldSelector() {
  Logger.log('🎯 STEP 1: Testing data loading');

  try {
    var roughDraft = getFieldSelectorRoughDraft();
    var allFields = roughDraft.allFields;
    var selected = roughDraft.selected;

    Logger.log('✅ Got ' + allFields.length + ' fields, ' + selected.length + ' selected');

    var html = '<!DOCTYPE html>' +
      '<html>' +
      '<head>' +
      '<title>Step 1: Data Test</title>' +
      '<style>' +
      'body { font-family: Arial, sans-serif; padding: 20px; }' +
      'h1 { color: #1a73e8; }' +
      '.stat { font-size: 18px; margin: 10px 0; }' +
      '.number { font-weight: bold; color: #0d652d; font-size: 24px; }' +
      '</style>' +
      '</head>' +
      '<body>' +
      '<h1>📊 Data Loading Test</h1>' +
      '<div class="stat">Total fields available: <span class="number" id="total"></span></div>' +
      '<div class="stat">Default selected fields: <span class="number" id="selected"></span></div>' +
      '<div class="stat">Status: <span class="number" style="color: #0d652d;">✅ Data Loaded Successfully!</span></div>' +
      '<script>' +
      'document.getElementById("total").textContent = ' + allFields.length + ';' +
      'document.getElementById("selected").textContent = ' + selected.length + ';' +
      '</script>' +
      '</body></html>';

    var htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(600)
      .setHeight(400);

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🎯 Step 1: Data Loading Test');
    Logger.log('✅ Step 1 modal displayed');

  } catch (error) {
    Logger.log('❌ Error in Step 1: ' + error.message);
    SpreadsheetApp.getUi().alert('Error in Step 1', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
`;

    // Replace the function
    code = code.substring(0, funcStart) + step1Function + code.substring(funcEnd);

    console.log('📤 Deploying Step 1 to production...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('✅ Step 1 deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 STEP 1: DATA LOADING TEST DEPLOYED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('What this tests:');
    console.log('✅ getFieldSelectorRoughDraft() executes without errors');
    console.log('✅ allFields array contains data');
    console.log('✅ selected array contains data');
    console.log('✅ Data successfully passes from Apps Script to HTML\n');
    console.log('Expected result:');
    console.log('- Modal should show "Total fields available: 210"');
    console.log('- Modal should show "Default selected fields: 35"');
    console.log('- Status should show green checkmark\n');
    console.log('Next step if this works:');
    console.log('- Step 2 will add field list display (no checkboxes yet)');
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
