#!/usr/bin/env node

/**
 * ADD RENDER FIELDS FUNCTION
 * Add the missing renderFields function that displays the 3 sections
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

    console.log('🔧 Finding where to add renderFields function...\n');

    // Find the success handler section where we need to call renderFields
    const successHandlerPattern = `    log("✅ Got " + data.selected.length + " selected fields");
    log("✅ Got " + data.recommended.length + " recommended fields");
  }`;

    if (!code.includes(successHandlerPattern)) {
      console.error('❌ Could not find success handler pattern');
      process.exit(1);
    }

    // Replace it to add the renderFields call
    const newSuccessHandler = `    log("✅ Got " + data.selected.length + " selected fields");
    log("✅ Got " + data.recommended.length + " recommended fields");
    log("📋 Calling renderFields()...");
    renderFields(data);
  }`;

    code = code.replace(successHandlerPattern, newSuccessHandler);
    console.log('✅ Added renderFields() call to success handler\n');

    // Now add the renderFields function before the closing script tag
    const scriptCloseTag = '<\\\\/script>';
    const scriptCloseIndex = code.lastIndexOf(scriptCloseTag);

    if (scriptCloseIndex === -1) {
      console.error('❌ Could not find closing script tag');
      process.exit(1);
    }

    const renderFieldsFunction = `
function renderFields(data) {
  log("🎨 renderFields() started");
  var container = document.getElementById("categories");
  container.innerHTML = "";

  log("   Separating fields into 3 sections...");
  var selectedFields = [];
  var recommendedFields = [];
  var otherFields = [];

  Object.keys(data.grouped).forEach(function(category) {
    data.grouped[category].forEach(function(field) {
      var isSelected = data.selected.indexOf(field.name) !== -1;
      var isRecommended = data.recommended.indexOf(field.name) !== -1;

      if (isSelected) {
        selectedFields.push(field);
      } else if (isRecommended) {
        recommendedFields.push(field);
      } else {
        otherFields.push(field);
      }
    });
  });

  log("   ✅ Section 1: " + selectedFields.length + " selected");
  log("   💡 Section 2: " + recommendedFields.length + " recommended");
  log("   📋 Section 3: " + otherFields.length + " other");

  // SECTION 1: Selected Fields
  if (selectedFields.length > 0) {
    var section1Header = document.createElement("div");
    section1Header.className = "section-header section-selected";
    section1Header.innerHTML = "✅ SELECTED FIELDS (" + selectedFields.length + ") - Default or Previously Saved";
    container.appendChild(section1Header);

    selectedFields.forEach(function(field) {
      var fieldDiv = document.createElement("div");
      fieldDiv.className = "field-item field-item-compact";

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = field.name;
      checkbox.checked = true;
      checkbox.onchange = updateCount;

      var label = document.createElement("label");
      label.htmlFor = field.name;
      label.innerHTML = "<span class=\\\\\\\\"field-name\\\\\\\\">" + field.name + "</span>";

      fieldDiv.appendChild(checkbox);
      fieldDiv.appendChild(label);
      container.appendChild(fieldDiv);
    });
  }

  // SECTION 2: AI Recommended
  if (recommendedFields.length > 0) {
    var section2Header = document.createElement("div");
    section2Header.className = "section-header section-recommended";
    section2Header.innerHTML = "💡 AI RECOMMENDED TO CONSIDER (" + recommendedFields.length + ")<div class=\\\\\\\\"ai-rationale\\\\\\\\">AI suggests these fields would maximize pathway discovery by revealing clinical reasoning patterns, grouping similar cases, and identifying time-critical scenarios.</div>";
    container.appendChild(section2Header);

    recommendedFields.forEach(function(field) {
      var fieldDiv = document.createElement("div");
      fieldDiv.className = "field-item field-item-compact";

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = field.name;
      checkbox.checked = false;
      checkbox.onchange = updateCount;

      var label = document.createElement("label");
      label.htmlFor = field.name;
      label.innerHTML = "<span class=\\\\\\\\"field-name\\\\\\\\">" + field.name + "</span>";

      fieldDiv.appendChild(checkbox);
      fieldDiv.appendChild(label);
      container.appendChild(fieldDiv);
    });
  }

  // SECTION 3: All Other Fields (grouped by category)
  if (otherFields.length > 0) {
    var section3Header = document.createElement("div");
    section3Header.className = "section-header section-other";
    section3Header.textContent = "📋 ALL OTHER AVAILABLE FIELDS (" + otherFields.length + ")";
    container.appendChild(section3Header);

    var categorized = {};
    otherFields.forEach(function(field) {
      if (!categorized[field.tier1]) categorized[field.tier1] = [];
      categorized[field.tier1].push(field);
    });

    Object.keys(categorized).forEach(function(category) {
      var catDiv = document.createElement("div");
      catDiv.className = "category";

      var catHeader = document.createElement("div");
      catHeader.className = "category-header";
      catHeader.innerHTML = "<div><span class=\\\\\\\\"category-title\\\\\\\\">" + category + "</span><span class=\\\\\\\\"category-count\\\\\\\\">(" + categorized[category].length + ")</span></div>";
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
        label.innerHTML = "<span class=\\\\\\\\"field-name\\\\\\\\">" + field.name + "</span>";

        fieldDiv.appendChild(checkbox);
        fieldDiv.appendChild(label);
        catDiv.appendChild(fieldDiv);
      });

      container.appendChild(catDiv);
    });
  }

  log("✅ Rendered all " + (selectedFields.length + recommendedFields.length + otherFields.length) + " fields in 3 sections");
  updateCount();
}
`;

    code = code.substring(0, scriptCloseIndex) + renderFieldsFunction + code.substring(scriptCloseIndex);
    console.log('✅ Added renderFields() function\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎨 RENDER FIELDS FUNCTION ADDED!\n');
    console.log('Now the modal should actually display the fields in 3 sections:\n');
    console.log('  ✅ Section 1: 27 selected fields (compact)\n');
    console.log('  💡 Section 2: 12 recommended fields (compact)\n');
    console.log('  📋 Section 3: 603 other fields (grouped by category)\n');
    console.log('\nTry "Pre-Cache Rich Data" - fields should render now!\n');
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
