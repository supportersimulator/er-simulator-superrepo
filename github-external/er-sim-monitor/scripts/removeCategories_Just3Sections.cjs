#!/usr/bin/env node

/**
 * REMOVE CATEGORIES - JUST 3 FLAT SECTIONS
 *
 * Remove all category grouping logic.
 * Show 3 simple flat lists:
 * 1. Default (selected fields)
 * 2. Recommended to consider
 * 3. Other
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

    console.log('📥 Downloading current code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Removing all category logic, keeping only 3 flat sections...\n');

    // Find the renderCategories function and replace it with render3Sections
    const renderStart = code.indexOf("'function renderCategories() {'");
    const renderEnd = code.indexOf("'renderCategories();'");

    if (renderStart === -1 || renderEnd === -1) {
      console.log('❌ Could not find renderCategories function\n');
      process.exit(1);
    }

    const new3SectionRender = `'function render3Sections() {' +
    '  const container = document.getElementById("categories");' +
    '  container.innerHTML = "";' +
    '  ' +
    '  // Section 1: Selected/Default fields' +
    '  const selectedSection = document.createElement("div");' +
    '  selectedSection.className = "category";' +
    '  selectedSection.innerHTML = "<div class=\\"category-header\\" style=\\"background: #4caf50; color: white; border-radius: 6px; padding: 12px;\\"><div><span class=\\"category-title\\">✅ DEFAULT</span><span class=\\"category-count\\" style=\\"color: white;\\">(" + selectedFields.length + ")</span></div></div>";' +
    '  selectedFields.forEach(fieldName => {' +
    '    const field = allFieldsFlat.find(f => f.name === fieldName);' +
    '    if (field) {' +
    '      selectedSection.appendChild(createFieldCheckbox(field, true));' +
    '    }' +
    '  });' +
    '  container.appendChild(selectedSection);' +
    '  ' +
    '  // Section 2: Recommended fields' +
    '  if (recommendedFieldNames.length > 0) {' +
    '    const recommendedSection = document.createElement("div");' +
    '    recommendedSection.className = "category";' +
    '    recommendedSection.innerHTML = "<div class=\\"category-header\\" style=\\"background: #ff9800; color: white; border-radius: 6px; padding: 12px;\\"><div><span class=\\"category-title\\">💡 RECOMMENDED TO CONSIDER</span><span class=\\"category-count\\" style=\\"color: white;\\">(" + recommendedFieldNames.length + ")</span></div></div>";' +
    '    recommendedFieldNames.forEach(fieldName => {' +
    '      const field = allFieldsFlat.find(f => f.name === fieldName);' +
    '      if (field && !selectedFields.includes(fieldName)) {' +
    '        recommendedSection.appendChild(createFieldCheckbox(field, false));' +
    '      }' +
    '    });' +
    '    container.appendChild(recommendedSection);' +
    '  }' +
    '  ' +
    '  // Section 3: All other fields' +
    '  const otherFields = allFieldsFlat.filter(f => !selectedFields.includes(f.name) && !recommendedFieldNames.includes(f.name));' +
    '  const otherSection = document.createElement("div");' +
    '  otherSection.className = "category";' +
    '  otherSection.innerHTML = "<div class=\\"category-header\\" style=\\"background: #999; color: white; border-radius: 6px; padding: 12px;\\"><div><span class=\\"category-title\\">📋 OTHER</span><span class=\\"category-count\\" style=\\"color: white;\\">(" + otherFields.length + ")</span></div></div>";' +
    '  otherFields.forEach(field => {' +
    '    otherSection.appendChild(createFieldCheckbox(field, false));' +
    '  });' +
    '  container.appendChild(otherSection);' +
    '  ' +
    '  updateCount();' +
    '}' +
    'function createFieldCheckbox(field, isChecked) {' +
    '  const fieldDiv = document.createElement("div");' +
    '  fieldDiv.className = "field-item";' +
    '  const checkbox = document.createElement("input");' +
    '  checkbox.type = "checkbox";' +
    '  checkbox.id = field.name;' +
    '  checkbox.checked = isChecked;' +
    '  checkbox.onchange = updateCount;' +
    '  const label = document.createElement("label");' +
    '  label.htmlFor = field.name;' +
    '  label.innerHTML = "<span class=\\"field-name\\">" + field.name + "</span>";' +
    '  fieldDiv.appendChild(checkbox);' +
    '  fieldDiv.appendChild(label);' +
    '  return fieldDiv;' +
    '}' +
    'function updateCount() {' +
    '  let selected = 0;' +
    '  allFieldsFlat.forEach(field => {' +
    '    const checkbox = document.getElementById(field.name);' +
    '    if (checkbox && checkbox.checked) selected++;' +
    '  });' +
    '  document.getElementById("count").textContent = "Selected: " + selected + "/" + totalFields + " fields";' +
    '  document.querySelector(".btn-continue").disabled = selected === 0;' +
    '}' +
    'function resetToDefault27() {' +
    '  const defaultFields = ' + JSON.stringify(getDefaultFieldNames_()) + ';' +
    '  allFieldsFlat.forEach(field => {' +
    '    const checkbox = document.getElementById(field.name);' +
    '    if (checkbox) {' +
    '      checkbox.checked = defaultFields.includes(field.name);' +
    '    }' +
    '  });' +
    '  updateCount();' +
    '  alert("✅ Reset to original 27 default fields");' +
    '}' +
    'function continueToCache() {' +
    '  const selected = [];' +
    '  allFieldsFlat.forEach(field => {' +
    '    const checkbox = document.getElementById(field.name);' +
    '    if (checkbox && checkbox.checked) {' +
    '      selected.push(field.name);' +
    '    }' +
    '  });' +
    '  google.script.run' +
    '    .withSuccessHandler(function() {' +
    '      google.script.host.close();' +
    '    })' +
    '    .withFailureHandler(function(e) {' +
    '      alert("Error saving selection: " + e.message);' +
    '    })' +
    '    .saveFieldSelectionAndStartCache(selected);' +
    '}' +
    'render3Sections();'`;

    code = code.substring(0, renderStart) + new3SectionRender + code.substring(renderEnd + 23);

    // Also need to change the data structure from categoriesData to allFieldsFlat
    code = code.replace(
      /'const categoriesData = ' \+ categoriesJson \+ ';'/g,
      "'const allFieldsFlat = ' + JSON.stringify(getAllFieldsFlat()) + ';'"
    );

    console.log('✅ Replaced rendering with 3 flat sections\n');

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
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ 3 FLAT SECTIONS - NO CATEGORIES!\n');
    console.log('\n  ✅ Section 1: DEFAULT (green)');
    console.log('  💡 Section 2: RECOMMENDED TO CONSIDER (orange)');
    console.log('  📋 Section 3: OTHER (gray)\n');
    console.log('Try it now!\n');
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
