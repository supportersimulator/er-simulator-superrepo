#!/usr/bin/env node

/**
 * STEP 2: Display field list (no checkboxes yet)
 *
 * This builds on Step 1 by:
 * 1. Rendering the 3 sections (DEFAULT, RECOMMENDED, OTHER)
 * 2. Displaying field names as simple text list
 * 3. NO checkboxes yet - just verify rendering works
 * 4. NO AI recommendations yet - just section headers
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

    console.log('🔧 Creating Step 2: Field List Display...\n');

    // Find showFieldSelector function
    const funcStart = code.indexOf('function showFieldSelector()');
    const funcEnd = code.indexOf('\nfunction ', funcStart + 50);

    const step2Function = `function showFieldSelector() {
  Logger.log('🎯 STEP 2: Displaying field list');

  try {
    var roughDraft = getFieldSelectorRoughDraft();
    var allFields = roughDraft.allFields;
    var selected = roughDraft.selected;

    Logger.log('✅ Got ' + allFields.length + ' fields, ' + selected.length + ' selected');

    var html = '<!DOCTYPE html>' +
      '<html>' +
      '<head>' +
      '<title>Step 2: Field List</title>' +
      '<style>' +
      'body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }' +
      'h1 { color: #1a73e8; margin-bottom: 20px; }' +
      '.section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }' +
      '.section-header { font-size: 16px; font-weight: bold; margin-bottom: 10px; padding: 8px; border-radius: 3px; }' +
      '.section-header.default { background: #0d652d; color: white; }' +
      '.section-header.recommended { background: #ea8600; color: white; }' +
      '.section-header.other { background: #5f6368; color: white; }' +
      '.field-list { max-height: 150px; overflow-y: auto; }' +
      '.field-item { padding: 5px; margin: 2px 0; background: #f8f9fa; border-radius: 3px; }' +
      '</style>' +
      '</head>' +
      '<body>' +
      '<h1>📊 Step 2: Field List Display</h1>' +
      '<div id="sections"></div>' +
      '<script>' +
      'var allFields = ' + JSON.stringify(allFields) + ';' +
      'var selectedFields = ' + JSON.stringify(selected) + ';' +
      '' +
      'var recommended = [];' +
      'var otherFields = allFields.filter(function(f) {' +
      '  return selectedFields.indexOf(f) === -1 && recommended.indexOf(f) === -1;' +
      '});' +
      '' +
      'var sectionsDiv = document.getElementById("sections");' +
      '' +
      'var section1 = "<div class=\\"section\\">";' +
      'section1 += "<div class=\\"section-header default\\">✅ DEFAULT (" + selectedFields.length + ")</div>";' +
      'section1 += "<div class=\\"field-list\\">";' +
      'for (var i = 0; i < selectedFields.length; i++) {' +
      '  section1 += "<div class=\\"field-item\\">" + selectedFields[i] + "</div>";' +
      '}' +
      'section1 += "</div></div>";' +
      '' +
      'var section2 = "<div class=\\"section\\">";' +
      'section2 += "<div class=\\"section-header recommended\\">🎯 RECOMMENDED (0 - AI pending)</div>";' +
      'section2 += "<div class=\\"field-list\\"><em>AI recommendations will appear here...</em></div>";' +
      'section2 += "</div>";' +
      '' +
      'var section3 = "<div class=\\"section\\">";' +
      'section3 += "<div class=\\"section-header other\\">📋 OTHER (" + otherFields.length + ")</div>";' +
      'section3 += "<div class=\\"field-list\\">";' +
      'for (var i = 0; i < Math.min(otherFields.length, 20); i++) {' +
      '  section3 += "<div class=\\"field-item\\">" + otherFields[i] + "</div>";' +
      '}' +
      'if (otherFields.length > 20) {' +
      '  section3 += "<div class=\\"field-item\\"><em>... and " + (otherFields.length - 20) + " more</em></div>";' +
      '}' +
      'section3 += "</div></div>";' +
      '' +
      'sectionsDiv.innerHTML = section1 + section2 + section3;' +
      '</script>' +
      '</body></html>';

    var htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(700)
      .setHeight(600);

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🎯 Step 2: Field List Display');
    Logger.log('✅ Step 2 modal displayed');

  } catch (error) {
    Logger.log('❌ Error in Step 2: ' + error.message);
    SpreadsheetApp.getUi().alert('Error in Step 2', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
`;

    // Replace the function
    code = code.substring(0, funcStart) + step2Function + code.substring(funcEnd);

    console.log('📤 Deploying Step 2 to production...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('✅ Step 2 deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 STEP 2: FIELD LIST DISPLAY DEPLOYED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('What this tests:');
    console.log('✅ Renders 3 sections: DEFAULT, RECOMMENDED, OTHER');
    console.log('✅ Displays field names as simple text list');
    console.log('✅ Filters fields correctly (default vs other)');
    console.log('✅ innerHTML rendering works without syntax errors\n');
    console.log('Expected result:');
    console.log('- DEFAULT section shows 35 field names');
    console.log('- RECOMMENDED section shows placeholder text');
    console.log('- OTHER section shows first 20 of ~175 remaining fields\n');
    console.log('Next step if this works:');
    console.log('- Step 3 will add checkboxes and interactivity');
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
