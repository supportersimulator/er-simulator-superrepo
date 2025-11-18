#!/usr/bin/env node

/**
 * FIX showFieldSelector() HTML TO MATCH getFieldSelectorRoughDraft() OUTPUT
 *
 * Problem: The restored showFieldSelector() has old HTML with categories
 * but getFieldSelectorRoughDraft() returns { allFields, selected }
 *
 * Solution: Update HTML to use 3-section layout that matches the data structure
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

async function fix() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current production...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Finding showFieldSelector() function...\n');

    // Find showFieldSelector function
    const funcStart = code.indexOf('function showFieldSelector() {');
    if (funcStart === -1) {
      console.log('❌ Could not find showFieldSelector()\n');
      process.exit(1);
    }

    // Find end of function
    let funcEnd = funcStart;
    let braceCount = 0;
    let foundStart = false;

    for (let i = funcStart; i < code.length; i++) {
      if (code[i] === '{') {
        braceCount++;
        foundStart = true;
      } else if (code[i] === '}') {
        braceCount--;
        if (foundStart && braceCount === 0) {
          funcEnd = i + 1;
          break;
        }
      }
    }

    console.log('✅ Found function\n');
    console.log('🔧 Replacing with fixed 3-section HTML...\n');

    // New version with 3-section layout
    const newFunction = `function showFieldSelector() {
  Logger.log('🎯 showFieldSelector() START');

  try {
    // Get rough draft data instantly (from cache)
    Logger.log('📋 Getting rough draft data...');
    var roughDraft = getFieldSelectorRoughDraft();
    var allFields = roughDraft.allFields;
    var selected = roughDraft.selected;

    Logger.log('✅ Got ' + allFields.length + ' fields, ' + selected.length + ' selected');

    // Build 3-section HTML
    var html =
      '<!DOCTYPE html>' +
      '<html>' +
      '<head>' +
      '<style>' +
      'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 20px; background: #f8f9fa; margin: 0; }' +
      '.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }' +
      '.header h2 { margin: 0 0 10px 0; }' +
      '.header p { margin: 0; opacity: 0.9; font-size: 14px; }' +
      '.section { background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }' +
      '.section-header { font-weight: bold; font-size: 16px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px solid #e0e0e0; }' +
      '.section-header.default { color: #28a745; }' +
      '.section-header.recommended { color: #ff6b00; }' +
      '.section-header.other { color: #666; }' +
      '.field-item { padding: 8px; margin: 5px 0; background: #f9f9f9; border-radius: 4px; display: flex; align-items: center; }' +
      '.field-item:hover { background: #f0f0f0; }' +
      '.field-item input { margin-right: 10px; cursor: pointer; }' +
      '.field-item label { cursor: pointer; flex: 1; font-size: 14px; }' +
      '.field-name { font-weight: 500; color: #333; }' +
      '.ai-checkmark { color: #28a745; font-weight: bold; margin-right: 5px; }' +
      '.rationale { color: #666; font-size: 12px; margin-top: 4px; font-style: italic; }' +
      '.footer { position: sticky; bottom: 0; background: white; padding: 15px 20px; border-top: 2px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 -2px 10px rgba(0,0,0,0.1); margin: 0 -20px -20px -20px; }' +
      '.field-count { font-weight: bold; color: #667eea; font-size: 16px; }' +
      '.btn-continue { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.2s; }' +
      '.btn-continue:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }' +
      '</style>' +
      '</head>' +
      '<body>' +
      '<div class="header">' +
      '  <h2>🎯 Select Fields to Cache</h2>' +
      '  <p>Choose which fields the AI will analyze for pathway discovery</p>' +
      '</div>' +
      '<div id="sections"></div>' +
      '<div class="footer">' +
      '  <span class="field-count" id="count">Loading...</span>' +
      '  <button class="btn-continue" onclick="continueToCache()">Continue to Cache →</button>' +
      '</div>' +
      '<script>' +
      'var allFields = ' + JSON.stringify(allFields) + ';' +
      'var selectedFields = ' + JSON.stringify(selected) + ';' +
      'var recommendedFields = [];' +
      'var aiAgreedFields = [];' +
      '' +
      'function renderRoughDraft() {' +
      '  render3Sections();' +
      '  ' +
      '  // Call AI for recommendations (async)' +
      '  google.script.run' +
      '    .withSuccessHandler(updateWithAI)' +
      '    .withFailureHandler(function(err) { console.log("AI failed:", err); })' +
      '    .getRecommendedFields(allFields, selectedFields);' +
      '}' +
      '' +
      'function updateWithAI(aiRecs) {' +
      '  // Find which defaults AI also recommends (double checkmark)' +
      '  aiAgreedFields = aiRecs.filter(function(rec) {' +
      '    var fieldName = typeof rec === "string" ? rec : rec.name;' +
      '    return selectedFields.indexOf(fieldName) !== -1;' +
      '  }).map(function(rec) {' +
      '    return typeof rec === "string" ? rec : rec.name;' +
      '  });' +
      '  ' +
      '  // Recommendations are AI suggestions NOT in defaults' +
      '  recommendedFields = aiRecs.filter(function(rec) {' +
      '    var fieldName = typeof rec === "string" ? rec : rec.name;' +
      '    return selectedFields.indexOf(fieldName) === -1;' +
      '  });' +
      '  ' +
      '  // Re-render with AI data' +
      '  render3Sections();' +
      '}' +
      '' +
      'function render3Sections() {' +
      '  var container = document.getElementById("sections");' +
      '  container.innerHTML = "";' +
      '  ' +
      '  // Section 1: DEFAULT' +
      '  var section1 = document.createElement("div");' +
      '  section1.className = "section";' +
      '  section1.innerHTML = "<div class=\\"section-header default\\">✅ DEFAULT (" + selectedFields.length + ")</div>";' +
      '  selectedFields.forEach(function(fieldName) {' +
      '    var hasAIAgreement = aiAgreedFields.indexOf(fieldName) !== -1;' +
      '    var checkbox = createCheckbox(fieldName, true, hasAIAgreement);' +
      '    section1.appendChild(checkbox);' +
      '  });' +
      '  container.appendChild(section1);' +
      '  ' +
      '  // Section 2: RECOMMENDED' +
      '  if (recommendedFields.length > 0) {' +
      '    var section2 = document.createElement("div");' +
      '    section2.className = "section";' +
      '    section2.innerHTML = "<div class=\\"section-header recommended\\">💡 RECOMMENDED TO CONSIDER (" + recommendedFields.length + ")</div>";' +
      '    recommendedFields.forEach(function(rec) {' +
      '      var fieldName = typeof rec === "string" ? rec : rec.name;' +
      '      var rationale = typeof rec === "object" ? rec.rationale : "";' +
      '      var checkbox = createCheckbox(fieldName, false, false, rationale);' +
      '      section2.appendChild(checkbox);' +
      '    });' +
      '    container.appendChild(section2);' +
      '  }' +
      '  ' +
      '  // Section 3: OTHER' +
      '  var otherFields = allFields.filter(function(f) {' +
      '    var recNames = recommendedFields.map(function(r) { return typeof r === "string" ? r : r.name; });' +
      '    return selectedFields.indexOf(f) === -1 && recNames.indexOf(f) === -1;' +
      '  });' +
      '  ' +
      '  var section3 = document.createElement("div");' +
      '  section3.className = "section";' +
      '  section3.innerHTML = "<div class=\\"section-header other\\">📋 OTHER (" + otherFields.length + ")</div>";' +
      '  otherFields.forEach(function(fieldName) {' +
      '    var checkbox = createCheckbox(fieldName, false, false);' +
      '    section3.appendChild(checkbox);' +
      '  });' +
      '  container.appendChild(section3);' +
      '  ' +
      '  updateCount();' +
      '}' +
      '' +
      'function createCheckbox(fieldName, isChecked, hasAIAgreement, rationale) {' +
      '  var div = document.createElement("div");' +
      '  div.className = "field-item";' +
      '  ' +
      '  var checkbox = document.createElement("input");' +
      '  checkbox.type = "checkbox";' +
      '  checkbox.id = fieldName;' +
      '  checkbox.checked = isChecked;' +
      '  checkbox.onchange = updateCount;' +
      '  ' +
      '  var label = document.createElement("label");' +
      '  label.htmlFor = fieldName;' +
      '  ' +
      '  var labelHTML = "<span class=\\"field-name\\">" + fieldName + "</span>";' +
      '  if (hasAIAgreement) {' +
      '    labelHTML = "<span class=\\"ai-checkmark\\">✓✓</span> " + labelHTML;' +
      '  }' +
      '  if (rationale) {' +
      '    labelHTML += "<div class=\\"rationale\\">" + rationale + "</div>";' +
      '  }' +
      '  label.innerHTML = labelHTML;' +
      '  ' +
      '  div.appendChild(checkbox);' +
      '  div.appendChild(label);' +
      '  return div;' +
      '}' +
      '' +
      'function updateCount() {' +
      '  var count = 0;' +
      '  allFields.forEach(function(f) {' +
      '    var cb = document.getElementById(f);' +
      '    if (cb && cb.checked) count++;' +
      '  });' +
      '  document.getElementById("count").textContent = "Selected: " + count + "/" + allFields.length;' +
      '}' +
      '' +
      'function continueToCache() {' +
      '  var selected = [];' +
      '  allFields.forEach(function(f) {' +
      '    var cb = document.getElementById(f);' +
      '    if (cb && cb.checked) selected.push(f);' +
      '  });' +
      '  google.script.run' +
      '    .withSuccessHandler(function() { google.script.host.close(); })' +
      '    .withFailureHandler(function(e) { alert("Error: " + e.message); })' +
      '    .saveFieldSelectionAndStartCache(selected);' +
      '}' +
      '' +
      '// Load immediately' +
      'renderRoughDraft();' +
      '</script>' +
      '</body>' +
      '</html>';

    Logger.log('📋 Creating HTML output...');
    var htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(800)
      .setHeight(700);

    Logger.log('📋 Showing modal dialog...');
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🎯 Select Fields to Cache');
    Logger.log('✅ Field selector modal displayed');

  } catch (error) {
    Logger.log('❌ Error in showFieldSelector: ' + error.message);
    SpreadsheetApp.getUi().alert('Error', 'Could not open field selector: ' + error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}`;

    // Replace the function
    code = code.substring(0, funcStart) + newFunction + code.substring(funcEnd);

    console.log('✅ Function updated\n');
    console.log('📤 Deploying...\n');

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
    console.log('New size:', (code.length / 1024).toFixed(1), 'KB\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ FIXED showFieldSelector() HTML!\n');
    console.log('\nChanges:\n');
    console.log('- Removed category grouping (old structure)');
    console.log('- Removed log panel (causing confusion)');
    console.log('- Added 3-section layout: DEFAULT, RECOMMENDED, OTHER');
    console.log('- Matches getFieldSelectorRoughDraft() output structure');
    console.log('- Rough draft renders immediately');
    console.log('- AI recommendations update asynchronously\n');
    console.log('Now try clicking the cache button again - should populate!\n');
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
