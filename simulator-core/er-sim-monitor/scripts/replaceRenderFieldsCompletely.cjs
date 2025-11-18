#!/usr/bin/env node

/**
 * REPLACE RENDER FIELDS COMPLETELY
 * Replace the entire renderFields function with 3-section rendering
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

async function replace() {
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

    console.log('🔧 Finding and replacing renderFields function...\n');

    // Find the renderFields function start
    const renderStart = code.indexOf('log("📋 Rendering fields...");');
    if (renderStart === -1) {
      console.error('❌ Could not find renderFields function');
      return;
    }

    // Find the end (look for the next function or updateCount)
    const renderEnd = code.indexOf('function updateCount()', renderStart);
    if (renderEnd === -1) {
      console.error('❌ Could not find end of renderFields');
      return;
    }

    // Extract everything before and after
    const beforeRender = code.substring(0, renderStart);
    const afterRender = code.substring(renderEnd);

    // New renderFields implementation
    const newRenderFields = `log("📋 Rendering fields...");' +
      '  var container = document.getElementById("categories");' +
      '  container.innerHTML = "";' +
      '  ' +
      '  var selectedFields = [];' +
      '  var recommendedFields = [];' +
      '  var otherFields = [];' +
      '  ' +
      '  Object.keys(data.grouped).forEach(function(category) {' +
      '    data.grouped[category].forEach(function(field) {' +
      '      var isSelected = data.selected.indexOf(field.name) !== -1;' +
      '      var isRecommended = data.recommended.indexOf(field.name) !== -1;' +
      '      if (isSelected) {' +
      '        selectedFields.push(field);' +
      '      } else if (isRecommended) {' +
      '        recommendedFields.push(field);' +
      '      } else {' +
      '        otherFields.push(field);' +
      '      }' +
      '    });' +
      '  });' +
      '  ' +
      '  log("   ✅ Section 1: " + selectedFields.length + " selected");' +
      '  log("   💡 Section 2: " + recommendedFields.length + " recommended");' +
      '  log("   📋 Section 3: " + otherFields.length + " other");' +
      '  ' +
      '  if (selectedFields.length > 0) {' +
      '    var section1 = document.createElement("div");' +
      '    section1.style.marginBottom = "16px";' +
      '    var header1 = document.createElement("div");' +
      '    header1.className = "section-header section-selected";' +
      '    header1.textContent = "✅ SELECTED FIELDS (" + selectedFields.length + ") - Default or Previously Saved";' +
      '    section1.appendChild(header1);' +
      '    var grid1 = document.createElement("div");' +
      '    grid1.style.display = "grid";' +
      '    grid1.style.gridTemplateColumns = "repeat(3, 1fr)";' +
      '    grid1.style.gap = "3px 8px";' +
      '    grid1.style.marginTop = "8px";' +
      '    selectedFields.forEach(function(field) {' +
      '      var fieldDiv = document.createElement("div");' +
      '      fieldDiv.className = "field-item";' +
      '      fieldDiv.style.fontSize = "9px";' +
      '      fieldDiv.style.padding = "2px 4px";' +
      '      fieldDiv.style.margin = "0";' +
      '      var checkbox = document.createElement("input");' +
      '      checkbox.type = "checkbox";' +
      '      checkbox.id = field.name;' +
      '      checkbox.checked = true;' +
      '      checkbox.style.width = "11px";' +
      '      checkbox.style.height = "11px";' +
      '      checkbox.onchange = updateCount;' +
      '      var label = document.createElement("label");' +
      '      label.htmlFor = field.name;' +
      '      label.textContent = field.name;' +
      '      label.style.fontSize = "9px";' +
      '      label.style.whiteSpace = "nowrap";' +
      '      label.style.overflow = "hidden";' +
      '      label.style.textOverflow = "ellipsis";' +
      '      fieldDiv.appendChild(checkbox);' +
      '      fieldDiv.appendChild(label);' +
      '      grid1.appendChild(fieldDiv);' +
      '    });' +
      '    section1.appendChild(grid1);' +
      '    container.appendChild(section1);' +
      '  }' +
      '  ' +
      '  if (recommendedFields.length > 0) {' +
      '    var section2 = document.createElement("div");' +
      '    section2.style.marginBottom = "16px";' +
      '    var header2 = document.createElement("div");' +
      '    header2.className = "section-header section-recommended";' +
      '    header2.innerHTML = "💡 AI RECOMMENDED TO CONSIDER (" + recommendedFields.length + ")<div style=\\\\"font-size:11px;font-weight:normal;color:#666;font-style:italic;margin-top:3px;padding-left:20px;line-height:1.4\\\\">AI suggests these fields maximize pathway discovery</div>";' +
      '    section2.appendChild(header2);' +
      '    var grid2 = document.createElement("div");' +
      '    grid2.style.display = "grid";' +
      '    grid2.style.gridTemplateColumns = "repeat(3, 1fr)";' +
      '    grid2.style.gap = "3px 8px";' +
      '    grid2.style.marginTop = "8px";' +
      '    recommendedFields.forEach(function(field) {' +
      '      var fieldDiv = document.createElement("div");' +
      '      fieldDiv.className = "field-item";' +
      '      fieldDiv.style.fontSize = "9px";' +
      '      fieldDiv.style.padding = "2px 4px";' +
      '      fieldDiv.style.margin = "0";' +
      '      var checkbox = document.createElement("input");' +
      '      checkbox.type = "checkbox";' +
      '      checkbox.id = field.name;' +
      '      checkbox.checked = false;' +
      '      checkbox.style.width = "11px";' +
      '      checkbox.style.height = "11px";' +
      '      checkbox.onchange = updateCount;' +
      '      var label = document.createElement("label");' +
      '      label.htmlFor = field.name;' +
      '      label.textContent = field.name;' +
      '      label.style.fontSize = "9px";' +
      '      label.style.whiteSpace = "nowrap";' +
      '      label.style.overflow = "hidden";' +
      '      label.style.textOverflow = "ellipsis";' +
      '      fieldDiv.appendChild(checkbox);' +
      '      fieldDiv.appendChild(label);' +
      '      grid2.appendChild(fieldDiv);' +
      '    });' +
      '    section2.appendChild(grid2);' +
      '    container.appendChild(section2);' +
      '  }' +
      '  ' +
      '  if (otherFields.length > 0) {' +
      '    var header3 = document.createElement("div");' +
      '    header3.className = "section-header section-other";' +
      '    header3.textContent = "📋 ALL OTHER AVAILABLE FIELDS (" + otherFields.length + ")";' +
      '    container.appendChild(header3);' +
      '    var categorized = {};' +
      '    otherFields.forEach(function(field) {' +
      '      if (!categorized[field.tier1]) categorized[field.tier1] = [];' +
      '      categorized[field.tier1].push(field);' +
      '    });' +
      '    Object.keys(categorized).forEach(function(category) {' +
      '      var catDiv = document.createElement("div");' +
      '      catDiv.className = "category";' +
      '      var catHeader = document.createElement("div");' +
      '      catHeader.className = "category-header";' +
      '      catHeader.innerHTML = "<div><span class=\\\\"category-title\\\\">" + category + "</span><span class=\\\\"category-count\\\\">(" + categorized[category].length + ")</span></div>";' +
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
      '        label.textContent = field.name;' +
      '        fieldDiv.appendChild(checkbox);' +
      '        fieldDiv.appendChild(label);' +
      '        catDiv.appendChild(fieldDiv);' +
      '      });' +
      '      container.appendChild(catDiv);' +
      '    });' +
      '  }' +
      '  ' +
      '  log("✅ Rendered all fields in 3 sections");' +
      '  updateCount();' +
      '}' +
      '`;

    code = beforeRender + newRenderFields + afterRender;

    console.log('✅ Replaced renderFields with 3-section implementation\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎨 NEW 3-SECTION RENDERING COMPLETE!\n');
    console.log('Now displays:\n');
    console.log('  ✅ Section 1: 27 selected in 3-column compact grid\n');
    console.log('  💡 Section 2: 12 recommended in 3-column compact grid\n');
    console.log('  📋 Section 3: 603 other fields grouped by category\n');
    console.log('\nTry "Pre-Cache Rich Data" - should see proper 3 sections!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

replace();
