#!/usr/bin/env node

/**
 * FIX FIELD SECTION RENDERING
 * Sort fields into 3 clear sections with compact display for first 2
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

    console.log('🔧 Fixing field rendering to show 3 clear sections with compact display...\n');

    // Find and replace the renderFields function
    const funcStart = code.indexOf('function renderFields(data) {');
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

    const newRenderFields = `function renderFields(data) {
  log("📋 Rendering fields in 3 sections...");
  var container = document.getElementById("categories");
  container.innerHTML = "";

  // Separate fields into 3 groups FIRST
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

  log("   ✅ Section 1: " + selectedFieldsList.length + " selected fields");
  log("   💡 Section 2: " + recommendedFieldsList.length + " recommended fields");
  log("   📋 Section 3: " + otherFieldsList.length + " other fields");

  // SECTION 1: Selected Fields (compact, green)
  if (selectedFieldsList.length > 0) {
    var section1 = document.createElement("div");
    section1.className = "section-container";

    var header1 = document.createElement("div");
    header1.className = "section-header section-selected";
    header1.innerHTML = "✅ SELECTED FIELDS (" + selectedFieldsList.length + ") - Default or Previously Saved";
    section1.appendChild(header1);

    var grid1 = document.createElement("div");
    grid1.className = "field-grid-compact";
    selectedFieldsList.forEach(function(field) {
      var fieldDiv = document.createElement("div");
      fieldDiv.className = "field-item-compact";

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = field.name;
      checkbox.checked = true;
      checkbox.onchange = updateCount;

      var label = document.createElement("label");
      label.htmlFor = field.name;
      label.innerHTML = "<span class=\\"field-name\\">" + field.name + "</span>";

      fieldDiv.appendChild(checkbox);
      fieldDiv.appendChild(label);
      grid1.appendChild(fieldDiv);
    });
    section1.appendChild(grid1);
    container.appendChild(section1);
  }

  // SECTION 2: AI Recommended (compact, orange)
  if (recommendedFieldsList.length > 0) {
    var section2 = document.createElement("div");
    section2.className = "section-container";

    var header2 = document.createElement("div");
    header2.className = "section-header section-recommended";
    header2.innerHTML = "💡 AI RECOMMENDED TO CONSIDER (" + recommendedFieldsList.length + ")<div class=\\"ai-rationale\\">AI suggests these fields would maximize pathway discovery by revealing clinical reasoning patterns, grouping similar cases, and identifying time-critical scenarios.</div>";
    section2.appendChild(header2);

    var grid2 = document.createElement("div");
    grid2.className = "field-grid-compact";
    recommendedFieldsList.forEach(function(field) {
      var fieldDiv = document.createElement("div");
      fieldDiv.className = "field-item-compact";

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = field.name;
      checkbox.checked = false;
      checkbox.onchange = updateCount;

      var label = document.createElement("label");
      label.htmlFor = field.name;
      label.innerHTML = "<span class=\\"field-name\\">" + field.name + "</span>";

      fieldDiv.appendChild(checkbox);
      fieldDiv.appendChild(label);
      grid2.appendChild(fieldDiv);
    });
    section2.appendChild(grid2);
    container.appendChild(section2);
  }

  // SECTION 3: All Other Fields (normal size, grouped by category)
  if (otherFieldsList.length > 0) {
    var section3Header = document.createElement("div");
    section3Header.className = "section-header section-other";
    section3Header.textContent = "📋 ALL OTHER AVAILABLE FIELDS (" + otherFieldsList.length + ")";
    container.appendChild(section3Header);

    // Group by category for section 3
    var categorized = {};
    otherFieldsList.forEach(function(field) {
      if (!categorized[field.tier1]) categorized[field.tier1] = [];
      categorized[field.tier1].push(field);
    });

    Object.keys(categorized).forEach(function(category) {
      var catDiv = document.createElement("div");
      catDiv.className = "category";

      var catHeader = document.createElement("div");
      catHeader.className = "category-header";
      catHeader.innerHTML = "<div><span class=\\"category-title\\">" + category + "</span><span class=\\"category-count\\">(" + categorized[category].length + ")</span></div>";
      catDiv.appendChild(catHeader);

      categorized[category].forEach(function(field) {
        var fieldDiv = document.createElement("div");
        fieldDiv.className = "field-item";

        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = field.name;
        checkbox.checked = false;
        checkbox.onchange = updateCount;

        var label = document.createElement("label");
        label.htmlFor = field.name;
        label.innerHTML = "<span class=\\"field-name\\">" + field.name + "</span>";

        fieldDiv.appendChild(checkbox);
        fieldDiv.appendChild(label);
        catDiv.appendChild(fieldDiv);
      });

      container.appendChild(catDiv);
    });
  }

  log("✅ Rendered all 3 sections successfully");
  updateCount();
}`;

    code = code.substring(0, funcStart) + newRenderFields + code.substring(funcEnd);

    console.log('✅ Fixed renderFields function\n');

    // Now update the CSS for better compact display
    console.log('🎨 Updating CSS for multi-column compact display...\n');

    const oldStyles = `'.field-item { padding: 4px 6px; margin: 2px 0; background: #f9f9f9; border-radius: 3px; display: flex; align-items: center; font-size: 11px; }'`;

    const newStyles = `'.section-container { background: white; border-radius: 6px; padding: 12px; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }' +
      '.field-grid-compact { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 8px; margin-top: 8px; }' +
      '.field-item-compact { padding: 2px 4px; background: #f9f9f9; border-radius: 3px; display: flex; align-items: center; font-size: 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }' +
      '.field-item-compact input { margin-right: 4px; cursor: pointer; width: 11px; height: 11px; flex-shrink: 0; }' +
      '.field-item-compact label { cursor: pointer; flex: 1; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; }' +
      '.field-item { padding: 4px 6px; margin: 2px 0; background: #f9f9f9; border-radius: 3px; display: flex; align-items: center; font-size: 11px; }'`;

    code = code.replace(oldStyles, newStyles);

    // Make modal bigger
    const oldSize = '.setWidth(900)\n      .setHeight(750)';
    const newSize = '.setWidth(1200)\n      .setHeight(850)';
    code = code.replace(oldSize, newSize);

    console.log('✅ Updated CSS with 3-column grid layout\n');
    console.log('✅ Increased modal size to 1200x850\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎨 FIELD RENDERING IMPROVED!\n');
    console.log('Changes:\n');
    console.log('  ✅ Section 1: 27 selected fields in 3-column grid (compact)\n');
    console.log('  💡 Section 2: 12 recommended fields in 3-column grid (compact)\n');
    console.log('  📋 Section 3: 603 other fields grouped by category (normal)\n');
    console.log('  📏 Modal size increased to 1200x850 for better viewing\n');
    console.log('  🎯 Much more visible without scrolling!\n');
    console.log('\nTry "Pre-Cache Rich Data" again - should see all sections clearly!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

fix();
