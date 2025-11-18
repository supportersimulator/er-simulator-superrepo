#!/usr/bin/env node

/**
 * ADD RENDER FIELDS FUNCTION - FIXED
 * Add the renderFields() call and function
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

async function add() {
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

    console.log('🔧 Adding renderFields() call to success handler...\n');

    // Pattern to find and replace
    const oldPattern = `    log("✅ Got " + Object.keys(data.grouped).length + " categories");' +
      '    log("✅ Got " + data.selected.length + " selected fields");' +
      '    log("✅ Got " + data.recommended.length + " recommended fields");' +
      '  }`;

    const newPattern = `    log("✅ Got " + Object.keys(data.grouped).length + " categories");' +
      '    log("✅ Got " + data.selected.length + " selected fields");' +
      '    log("✅ Got " + data.recommended.length + " recommended fields");' +
      '    log("📋 Rendering fields...");' +
      '    renderFields(data);' +
      '  }`;

    if (!code.includes(oldPattern)) {
      console.error('❌ Could not find pattern');
      console.log('Looking for:', oldPattern.substring(0, 100));
      process.exit(1);
    }

    code = code.replace(oldPattern, newPattern);
    console.log('✅ Added renderFields() call\n');

    // Now add the renderFields function and updateCount function before the closing script tag
    console.log('🔧 Adding renderFields() and updateCount() functions...\n');

    const functionsToAdd = `function renderFields(data) {' +
      '  log("🎨 Rendering fields in 3 sections...");' +
      '  var container = document.getElementById("categories");' +
      '  container.innerHTML = "";' +
      '  var selectedFieldsList = [];' +
      '  var recommendedFieldsList = [];' +
      '  var otherFieldsList = [];' +
      '  Object.keys(data.grouped).forEach(function(category) {' +
      '    data.grouped[category].forEach(function(field) {' +
      '      var isSelected = data.selected.indexOf(field.name) !== -1;' +
      '      var isRecommended = data.recommended.indexOf(field.name) !== -1;' +
      '      if (isSelected) {' +
      '        selectedFieldsList.push(field);' +
      '      } else if (isRecommended) {' +
      '        recommendedFieldsList.push(field);' +
      '      } else {' +
      '        otherFieldsList.push(field);' +
      '      }' +
      '    });' +
      '  });' +
      '  log("   ✅ Section 1: " + selectedFieldsList.length + " selected");' +
      '  log("   💡 Section 2: " + recommendedFieldsList.length + " recommended");' +
      '  log("   📋 Section 3: " + otherFieldsList.length + " other");' +
      '  if (selectedFieldsList.length > 0) {' +
      '    var section1Header = document.createElement("div");' +
      '    section1Header.className = "section-header section-selected";' +
      '    section1Header.innerHTML = "✅ SELECTED FIELDS (" + selectedFieldsList.length + ") - Default or Previously Saved";' +
      '    container.appendChild(section1Header);' +
      '    selectedFieldsList.forEach(function(field) {' +
      '      var fieldDiv = document.createElement("div");' +
      '      fieldDiv.className = "field-item field-item-compact";' +
      '      var checkbox = document.createElement("input");' +
      '      checkbox.type = "checkbox";' +
      '      checkbox.id = field.name;' +
      '      checkbox.checked = true;' +
      '      checkbox.onchange = updateCount;' +
      '      var label = document.createElement("label");' +
      '      label.htmlFor = field.name;' +
      '      label.innerHTML = "<span class=\\\\\\\\"field-name\\\\\\\\">" + field.name + "</span>";' +
      '      fieldDiv.appendChild(checkbox);' +
      '      fieldDiv.appendChild(label);' +
      '      container.appendChild(fieldDiv);' +
      '    });' +
      '  }' +
      '  if (recommendedFieldsList.length > 0) {' +
      '    var section2Header = document.createElement("div");' +
      '    section2Header.className = "section-header section-recommended";' +
      '    section2Header.innerHTML = "💡 AI RECOMMENDED TO CONSIDER (" + recommendedFieldsList.length + ")<div class=\\\\\\\\"ai-rationale\\\\\\\\">AI suggests these fields would maximize pathway discovery by revealing clinical reasoning patterns, grouping similar cases, and identifying time-critical scenarios.</div>";' +
      '    container.appendChild(section2Header);' +
      '    recommendedFieldsList.forEach(function(field) {' +
      '      var fieldDiv = document.createElement("div");' +
      '      fieldDiv.className = "field-item field-item-compact";' +
      '      var checkbox = document.createElement("input");' +
      '      checkbox.type = "checkbox";' +
      '      checkbox.id = field.name;' +
      '      checkbox.checked = false;' +
      '      checkbox.onchange = updateCount;' +
      '      var label = document.createElement("label");' +
      '      label.htmlFor = field.name;' +
      '      label.innerHTML = "<span class=\\\\\\\\"field-name\\\\\\\\">" + field.name + "</span>";' +
      '      fieldDiv.appendChild(checkbox);' +
      '      fieldDiv.appendChild(label);' +
      '      container.appendChild(fieldDiv);' +
      '    });' +
      '  }' +
      '  if (otherFieldsList.length > 0) {' +
      '    var section3Header = document.createElement("div");' +
      '    section3Header.className = "section-header section-other";' +
      '    section3Header.textContent = "📋 ALL OTHER AVAILABLE FIELDS (" + otherFieldsList.length + ")";' +
      '    container.appendChild(section3Header);' +
      '    var categorized = {};' +
      '    otherFieldsList.forEach(function(field) {' +
      '      if (!categorized[field.tier1]) categorized[field.tier1] = [];' +
      '      categorized[field.tier1].push(field);' +
      '    });' +
      '    Object.keys(categorized).forEach(function(category) {' +
      '      var catDiv = document.createElement("div");' +
      '      catDiv.className = "category";' +
      '      var catHeader = document.createElement("div");' +
      '      catHeader.className = "category-header";' +
      '      catHeader.innerHTML = "<div><span class=\\\\\\\\"category-title\\\\\\\\">" + category + "</span><span class=\\\\\\\\"category-count\\\\\\\\">(" + categorized[category].length + ")</span></div>";' +
      '      catDiv.appendChild(catHeader);' +
      '      categorized[category].forEach(function(field) {' +
      '        var fieldDiv = document.createElement("div");' +
      '        fieldDiv.className = "field-item";' +
      '        var checkbox = document.createElement("input");' +
      '        checkbox.type = "checkbox";' +
      '        checkbox.id = field.name;' +
      '        checkbox.checked = false;' +
      '        checkbox.onchange = updateCount;' +
      '        var label = document.createElement("label");' +
      '        label.htmlFor = field.name;' +
      '        label.innerHTML = "<span class=\\\\\\\\"field-name\\\\\\\\">" + field.name + "</span>";' +
      '        fieldDiv.appendChild(checkbox);' +
      '        fieldDiv.appendChild(label);' +
      '        catDiv.appendChild(fieldDiv);' +
      '      });' +
      '      container.appendChild(catDiv);' +
      '    });' +
      '  }' +
      '  log("✅ Rendered all fields in 3 sections");' +
      '  updateCount();' +
      '}' +
      'function updateCount() {' +
      '  var count = 0;' +
      '  document.querySelectorAll("input[type=checkbox]:checked").forEach(function() { count++; });' +
      '  document.getElementById("count").textContent = "Selected: " + count + " fields";' +
      '}' +
      'function resetToDefaults() {' +
      '  location.reload();' +
      '}' +
      'function continueToCache() {' +
      '  var selected = [];' +
      '  document.querySelectorAll("input[type=checkbox]:checked").forEach(function(cb) { selected.push(cb.id); });' +
      '  log("💾 Saving " + selected.length + " fields...");' +
      '  google.script.run.withSuccessHandler(function() {' +
      '    log("✅ Saved! Starting cache...");' +
      '    google.script.host.close();' +
      '  }).withFailureHandler(function(err) {' +
      '    log("❌ Save error: " + err.message);' +
      '    alert("Error: " + err.message);' +
      '  }).saveFieldSelectionAndStartCache(selected);' +
      '}' +
      '`;

    // Find where to insert (before the closing script tag)
    const scriptClose = `      '.getFieldSelectorData();' +
      '<\\/script>'`;

    if (!code.includes(scriptClose)) {
      console.error('❌ Could not find script close pattern');
      process.exit(1);
    }

    code = code.replace(scriptClose, `      '.getFieldSelectorData();' +
      '` + functionsToAdd + `<\\/script>'`);

    console.log('✅ Added renderFields() and helper functions\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎨 RENDER FIELDS FUNCTION COMPLETE!\n');
    console.log('Added:\n');
    console.log('  ✅ renderFields() - Displays 3 sections of fields\n');
    console.log('  ✅ updateCount() - Updates selected count\n');
    console.log('  ✅ resetToDefaults() - Reloads page\n');
    console.log('  ✅ continueToCache() - Saves selection and starts cache\n');
    console.log('\nTry "Pre-Cache Rich Data" - should render fields now!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

add();
