#!/usr/bin/env node

/**
 * FIX FIELD SECTION RENDERING - SIMPLE VERSION
 * Sort fields into 3 clear sections with compact multi-column display
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

    console.log('🔧 Updating CSS for multi-column layout...\n');

    // Add new CSS styles after existing styles
    const styleEnd = code.indexOf('</style>');
    const newStyles = `
.section-container { background: white; border-radius: 6px; padding: 12px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.field-grid-compact { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 8px; margin-top: 8px; }
.field-item-compact { padding: 2px 4px; background: #f9f9f9; border-radius: 3px; display: flex; align-items: center; font-size: 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.field-item-compact input { margin-right: 4px; cursor: pointer; width: 11px; height: 11px; flex-shrink: 0; }
.field-item-compact label { cursor: pointer; flex: 1; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; }
`;

    code = code.substring(0, styleEnd) + newStyles + code.substring(styleEnd);

    console.log('✅ Added multi-column CSS\n');

    // Make modal bigger
    code = code.replace('.setWidth(900)', '.setWidth(1200)');
    code = code.replace('.setHeight(750)', '.setHeight(850)');

    console.log('✅ Increased modal size to 1200x850\n');

    // Now update the renderFields function - find the start
    const renderStart = code.indexOf('function renderFields(data) {');
    if (renderStart === -1) {
      console.error('❌ Could not find renderFields function');
      process.exit(1);
    }

    // Find the end by counting braces
    let braceCount = 0;
    let inFunction = false;
    let renderEnd = renderStart;

    for (let i = renderStart; i < code.length; i++) {
      if (code[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (code[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          renderEnd = i + 1;
          break;
        }
      }
    }

    // Read the new function from a template file
    const newRenderFunction = `function renderFields(data) {
  log('📋 Rendering fields in 3 sections...');
  var container = document.getElementById('categories');
  container.innerHTML = '';

  var selectedFieldsList = [];
  var recommendedFieldsList = [];
  var otherFieldsList = [];

  Object.keys(data.grouped).forEach(function(category) {
    data.grouped[category].forEach(function(field) {
      var isSelected = data.selected.indexOf(field.name) !== -1;
      var isRecommended = data.recommended.indexOf(field.name) !== -1;
      if (isSelected) {
        selectedFieldsList.push(field);
      } else if (isRecommended) {
        recommendedFieldsList.push(field);
      } else {
        otherFieldsList.push(field);
      }
    });
  });

  log('   ✅ Section 1: ' + selectedFieldsList.length + ' selected');
  log('   💡 Section 2: ' + recommendedFieldsList.length + ' recommended');
  log('   📋 Section 3: ' + otherFieldsList.length + ' other');

  if (selectedFieldsList.length > 0) {
    var section1 = document.createElement('div');
    section1.className = 'section-container';
    var header1 = document.createElement('div');
    header1.className = 'section-header section-selected';
    header1.textContent = '✅ SELECTED FIELDS (' + selectedFieldsList.length + ')';
    section1.appendChild(header1);
    var grid1 = document.createElement('div');
    grid1.className = 'field-grid-compact';
    selectedFieldsList.forEach(function(field) {
      var fieldDiv = document.createElement('div');
      fieldDiv.className = 'field-item-compact';
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = field.name;
      checkbox.checked = true;
      checkbox.onchange = updateCount;
      var label = document.createElement('label');
      label.htmlFor = field.name;
      label.textContent = field.name;
      fieldDiv.appendChild(checkbox);
      fieldDiv.appendChild(label);
      grid1.appendChild(fieldDiv);
    });
    section1.appendChild(grid1);
    container.appendChild(section1);
  }

  if (recommendedFieldsList.length > 0) {
    var section2 = document.createElement('div');
    section2.className = 'section-container';
    var header2 = document.createElement('div');
    header2.className = 'section-header section-recommended';
    header2.innerHTML = '💡 AI RECOMMENDED (' + recommendedFieldsList.length + ')<div class=\\"ai-rationale\\">AI suggests these fields maximize pathway discovery</div>';
    section2.appendChild(header2);
    var grid2 = document.createElement('div');
    grid2.className = 'field-grid-compact';
    recommendedFieldsList.forEach(function(field) {
      var fieldDiv = document.createElement('div');
      fieldDiv.className = 'field-item-compact';
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = field.name;
      checkbox.checked = false;
      checkbox.onchange = updateCount;
      var label = document.createElement('label');
      label.htmlFor = field.name;
      label.textContent = field.name;
      fieldDiv.appendChild(checkbox);
      fieldDiv.appendChild(label);
      grid2.appendChild(fieldDiv);
    });
    section2.appendChild(grid2);
    container.appendChild(section2);
  }

  if (otherFieldsList.length > 0) {
    var header3 = document.createElement('div');
    header3.className = 'section-header section-other';
    header3.textContent = '📋 ALL OTHER FIELDS (' + otherFieldsList.length + ')';
    container.appendChild(header3);
    var categorized = {};
    otherFieldsList.forEach(function(field) {
      if (!categorized[field.tier1]) categorized[field.tier1] = [];
      categorized[field.tier1].push(field);
    });
    Object.keys(categorized).forEach(function(category) {
      var catDiv = document.createElement('div');
      catDiv.className = 'category';
      var catHeader = document.createElement('div');
      catHeader.className = 'category-header';
      catHeader.innerHTML = '<div><span class=\\"category-title\\">' + category + '</span><span class=\\"category-count\\">(' + categorized[category].length + ')</span></div>';
      catDiv.appendChild(catHeader);
      categorized[category].forEach(function(field) {
        var fieldDiv = document.createElement('div');
        fieldDiv.className = 'field-item';
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = field.name;
        checkbox.checked = false;
        checkbox.onchange = updateCount;
        var label = document.createElement('label');
        label.htmlFor = field.name;
        label.textContent = field.name;
        fieldDiv.appendChild(checkbox);
        fieldDiv.appendChild(label);
        catDiv.appendChild(fieldDiv);
      });
      container.appendChild(catDiv);
    });
  }

  log('✅ Rendered all 3 sections');
  updateCount();
}`;

    code = code.substring(0, renderStart) + newRenderFunction + code.substring(renderEnd);

    console.log('✅ Updated renderFields function\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎨 3-SECTION LAYOUT WITH MULTI-COLUMN DISPLAY!\n');
    console.log('Improvements:\n');
    console.log('  ✅ Section 1: Selected fields in 3-column grid (very compact)\n');
    console.log('  💡 Section 2: AI recommended in 3-column grid (very compact)\n');
    console.log('  📋 Section 3: Other fields grouped by category (normal size)\n');
    console.log('  📏 Modal: 1200x850 for much better viewing\n');
    console.log('  🎯 See many more fields without scrolling!\n');
    console.log('\nTry "Pre-Cache Rich Data" - should be MUCH more visible now!\n');
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
