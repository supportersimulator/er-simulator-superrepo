#!/usr/bin/env node

/**
 * IMPLEMENT ROUGH DRAFT → LIVE UPDATE WORKFLOW
 *
 * 1. Modal opens INSTANTLY with "rough draft":
 *    - Section 1: Last saved defaults (pre-checked)
 *    - Section 2: Empty
 *    - Section 3: All other fields
 *
 * 2. Live Log shows: "Calling OpenAI API..."
 *
 * 3. After AI responds, UPDATE the modal:
 *    - Section 1: Add ✓✓ where AI agrees
 *    - Section 2: Fill with AI recommendations
 *    - Section 3: No change
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

    console.log('🔧 Implementing rough draft → live update workflow...\n');

    // Find the showFieldSelector function and replace the modal JavaScript
    const scriptStart = code.indexOf("'<script>' +");
    const scriptEnd = code.indexOf("'</script>' +", scriptStart);

    if (scriptStart === -1 || scriptEnd === -1) {
      console.log('❌ Could not find script section\n');
      process.exit(1);
    }

    const newScript = `'<script>' +
    'let allFields = [];' +
    'let selectedFields = [];' +
    'let recommendedFields = [];' +
    'let aiAgreedFields = [];' +
    '' +
    'function log(msg) {' +
    '  const logEl = document.getElementById("log");' +
    '  const t = new Date().toISOString().substr(11, 8);' +
    '  const line = "[" + t + "] " + msg;' +
    '  logEl.textContent += line + "\\\\n";' +
    '  logEl.scrollTop = logEl.scrollHeight;' +
    '}' +
    '' +
    'function renderRoughDraft(data) {' +
    '  log("📋 Rendering rough draft...");' +
    '  allFields = data.allFields;' +
    '  selectedFields = data.selected;' +
    '  recommendedFields = []; // Empty initially' +
    '  render3Sections();' +
    '  log("✅ Rough draft ready - calling AI for recommendations...");' +
    '}' +
    '' +
    'function updateWithAIRecommendations(aiRecs) {' +
    '  log("🤖 AI responded with " + aiRecs.length + " recommendations");' +
    '  ' +
    '  // Find which defaults AI also recommends (double checkmark)' +
    '  aiAgreedFields = aiRecs.filter(function(rec) {' +
    '    const fieldName = typeof rec === "string" ? rec : rec.name;' +
    '    return selectedFields.indexOf(fieldName) !== -1;' +
    '  }).map(function(rec) {' +
    '    return typeof rec === "string" ? rec : rec.name;' +
    '  });' +
    '  ' +
    '  // Recommendations are AI suggestions NOT in defaults' +
    '  recommendedFields = aiRecs.filter(function(rec) {' +
    '    const fieldName = typeof rec === "string" ? rec : rec.name;' +
    '    return selectedFields.indexOf(fieldName) === -1;' +
    '  });' +
    '  ' +
    '  log("✅ " + aiAgreedFields.length + " fields confirmed by AI (✓✓)");' +
    '  log("💡 " + recommendedFields.length + " new recommendations");' +
    '  ' +
    '  // Re-render with AI data' +
    '  render3Sections();' +
    '}' +
    '' +
    'function render3Sections() {' +
    '  const container = document.getElementById("categories");' +
    '  container.innerHTML = "";' +
    '  ' +
    '  // Section 1: Default/Selected fields' +
    '  const section1 = document.createElement("div");' +
    '  section1.className = "section";' +
    '  section1.innerHTML = "<div class=\\"section-header default\\">✅ DEFAULT (" + selectedFields.length + ")</div>";' +
    '  selectedFields.forEach(function(fieldName) {' +
    '    const hasAIAgreement = aiAgreedFields.indexOf(fieldName) !== -1;' +
    '    const checkbox = createCheckbox(fieldName, true, hasAIAgreement);' +
    '    section1.appendChild(checkbox);' +
    '  });' +
    '  container.appendChild(section1);' +
    '  ' +
    '  // Section 2: Recommended to consider (AI suggestions)' +
    '  if (recommendedFields.length > 0) {' +
    '    const section2 = document.createElement("div");' +
    '    section2.className = "section";' +
    '    section2.innerHTML = "<div class=\\"section-header recommended\\">💡 RECOMMENDED TO CONSIDER (" + recommendedFields.length + ")</div>";' +
    '    recommendedFields.forEach(function(rec) {' +
    '      const fieldName = typeof rec === "string" ? rec : rec.name;' +
    '      const rationale = typeof rec === "object" ? rec.rationale : "";' +
    '      const checkbox = createCheckbox(fieldName, false, false, rationale);' +
    '      section2.appendChild(checkbox);' +
    '    });' +
    '    container.appendChild(section2);' +
    '  }' +
    '  ' +
    '  // Section 3: Other fields' +
    '  const otherFields = allFields.filter(function(f) {' +
    '    const recNames = recommendedFields.map(function(r) { return typeof r === "string" ? r : r.name; });' +
    '    return selectedFields.indexOf(f) === -1 && recNames.indexOf(f) === -1;' +
    '  });' +
    '  ' +
    '  const section3 = document.createElement("div");' +
    '  section3.className = "section";' +
    '  section3.innerHTML = "<div class=\\"section-header other\\">📋 OTHER (" + otherFields.length + ")</div>";' +
    '  otherFields.forEach(function(fieldName) {' +
    '    const checkbox = createCheckbox(fieldName, false, false);' +
    '    section3.appendChild(checkbox);' +
    '  });' +
    '  container.appendChild(section3);' +
    '  ' +
    '  updateCount();' +
    '}' +
    '' +
    'function createCheckbox(fieldName, isChecked, hasAIAgreement, rationale) {' +
    '  const div = document.createElement("div");' +
    '  div.className = "field-item";' +
    '  ' +
    '  const checkbox = document.createElement("input");' +
    '  checkbox.type = "checkbox";' +
    '  checkbox.id = fieldName;' +
    '  checkbox.checked = isChecked;' +
    '  checkbox.onchange = updateCount;' +
    '  ' +
    '  const label = document.createElement("label");' +
    '  label.htmlFor = fieldName;' +
    '  ' +
    '  let labelHTML = "<span class=\\"field-name\\">" + fieldName + "</span>";' +
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
    '  let count = 0;' +
    '  allFields.forEach(function(f) {' +
    '    const cb = document.getElementById(f);' +
    '    if (cb && cb.checked) count++;' +
    '  });' +
    '  document.getElementById("count").textContent = "Selected: " + count + "/" + allFields.length;' +
    '}' +
    '' +
    'function continueToCache() {' +
    '  const selected = [];' +
    '  allFields.forEach(function(f) {' +
    '    const cb = document.getElementById(f);' +
    '    if (cb && cb.checked) selected.push(f);' +
    '  });' +
    '  google.script.run' +
    '    .withSuccessHandler(function() { google.script.host.close(); })' +
    '    .withFailureHandler(function(e) { alert("Error: " + e.message); })' +
    '    .saveFieldSelectionAndStartCache(selected);' +
    '}' +
    '' +
    'function copyLogs() {' +
    '  const logEl = document.getElementById("log");' +
    '  navigator.clipboard.writeText(logEl.textContent).then(function() { alert("✅ Copied!"); });' +
    '}' +
    '' +
    '// STEP 1: Load rough draft immediately' +
    'log("🚀 Loading field selector...");' +
    'google.script.run' +
    '  .withSuccessHandler(function(data) {' +
    '    log("✅ Got data: " + data.allFields.length + " fields, " + data.selected.length + " defaults");' +
    '    renderRoughDraft(data);' +
    '    ' +
    '    // STEP 2: Call AI for recommendations (async)' +
    '    log("📞 Calling OpenAI API for recommendations...");' +
    '    google.script.run' +
    '      .withSuccessHandler(function(aiRecs) {' +
    '        updateWithAIRecommendations(aiRecs);' +
    '      })' +
    '      .withFailureHandler(function(err) {' +
    '        log("⚠️ AI call failed: " + err.message);' +
    '        log("✅ Continuing with rough draft");' +
    '      })' +
    '      .getAIRecommendations(data.selected, data.allFields);' +
    '  })' +
    '  .withFailureHandler(function(err) {' +
    '    log("❌ ERROR: " + err.message);' +
    '  })' +
    '  .getFieldSelectorRoughDraft();' +
    '</script>' +`;

    code = code.substring(0, scriptStart) + newScript + code.substring(scriptEnd + 14);

    console.log('✅ Updated modal JavaScript\n');

    console.log('🔧 Adding server-side functions...\n');

    // Add getFieldSelectorRoughDraft function
    const insertPoint = code.indexOf('function showFieldSelector()');

    const newFunctions = `
/**
 * Get rough draft data (immediate, no AI call)
 */
function getFieldSelectorRoughDraft() {
  Logger.log('🎯 getFieldSelectorRoughDraft() START');

  var docProps = PropertiesService.getDocumentProperties();

  // Get all fields from cached headers
  var cachedHeader2 = docProps.getProperty('CACHED_HEADER2');
  if (!cachedHeader2) {
    Logger.log('⚠️ Headers not cached - refreshing...');
    refreshHeaders();
    cachedHeader2 = docProps.getProperty('CACHED_HEADER2');
  }

  var header2Data = JSON.parse(cachedHeader2);
  var allFields = Object.keys(header2Data);

  Logger.log('✅ Got ' + allFields.length + ' fields');

  // Get selected fields (last saved or 35 defaults)
  var savedSelection = docProps.getProperty('SELECTED_CACHE_FIELDS');
  var selected;

  if (savedSelection) {
    selected = JSON.parse(savedSelection);
    Logger.log('✅ Using ' + selected.length + ' last saved defaults');
  } else {
    Logger.log('⚠️ No saved selection - using 35 intelligent defaults');
    selected = [
      'Case_Organization_Case_ID', 'Case_Organization_Spark_Title', 'Case_Organization_Reveal_Title',
      'Case_Organization_Pathway_or_Course_Name', 'Case_Organization_Difficulty_Level', 'Case_Organization_Medical_Category',
      'Patient_Demographics_and_Clinical_Data_Age', 'Patient_Demographics_and_Clinical_Data_Gender',
      'Patient_Demographics_and_Clinical_Data_Presenting_Complaint', 'Patient_Demographics_and_Clinical_Data_Past_Medical_History',
      'Patient_Demographics_and_Clinical_Data_Exam_Positive_Findings', 'Monitor_Vital_Signs_Initial_Vitals',
      'Scenario_Progression_States_Decision_Nodes_JSON', 'Set_the_Stage_Context_Case_Summary_Concise',
      'CME_and_Educational_Content_CME_Learning_Objective', 'Set_the_Stage_Context_Educational_Goal',
      'Set_the_Stage_Context_Why_It_Matters', 'Developer_and_QA_Metadata_Simulation_Quality_Score',
      'Case_Organization_Original_Title', 'Set_the_Stage_Context_Environment_Type',
      'Set_the_Stage_Context_Environment_Description_for_AI_Image', 'Situation_and_Environment_Details_Triage_or_SBAR_Note',
      'Situation_and_Environment_Details_Disposition_Plan', 'Scenario_Progression_States_Branching_Notes',
      'Staff_and_AI_Interaction_Config_Patient_Script', 'Monitor_Vital_Signs_State1_Vitals',
      'Monitor_Vital_Signs_State2_Vitals', 'Monitor_Vital_Signs_State3_Vitals',
      'Monitor_Vital_Signs_State4_Vitals', 'Monitor_Vital_Signs_State5_Vitals',
      'Monitor_Vital_Signs_Vitals_Format', 'Developer_and_QA_Metadata_AI_Reflection_and_Suggestions',
      'Version_and_Attribution_Full_Attribution_Details', 'Case_Organization_Pre_Sim_Overview',
      'Case_Organization_Post_Sim_Overview'
    ];
    docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(selected));
    Logger.log('✅ Saved 35 defaults');
  }

  Logger.log('✅ getFieldSelectorRoughDraft() COMPLETE');

  return {
    allFields: allFields,
    selected: selected
  };
}

/**
 * Get AI recommendations (async, called after rough draft loads)
 */
function getAIRecommendations(currentlySelected, availableFields) {
  Logger.log('🤖 getAIRecommendations() START');
  Logger.log('   Current selection: ' + currentlySelected.length + ' fields');
  Logger.log('   Available fields: ' + availableFields.length);

  try {
    // Check for cached recommendations first
    var docProps = PropertiesService.getDocumentProperties();
    var cachedRecs = docProps.getProperty('AI_RECOMMENDED_FIELDS');
    var cachedTime = docProps.getProperty('AI_RECOMMENDATIONS_TIMESTAMP');

    if (cachedRecs && cachedTime) {
      var age = (new Date() - new Date(cachedTime)) / 1000;
      if (age < 3600) { // 1 hour cache
        Logger.log('✅ Using cached AI recommendations (age: ' + Math.round(age) + 's)');
        return JSON.parse(cachedRecs);
      }
    }

    // Call getRecommendedFields (which calls OpenAI)
    Logger.log('📞 Calling OpenAI API...');
    var availableFieldObjects = availableFields.map(function(name) {
      return { name: name };
    });

    var recommendations = getRecommendedFields(availableFieldObjects, currentlySelected);

    // Cache for next time
    docProps.setProperty('AI_RECOMMENDED_FIELDS', JSON.stringify(recommendations));
    docProps.setProperty('AI_RECOMMENDATIONS_TIMESTAMP', new Date().toISOString());

    Logger.log('✅ Got ' + recommendations.length + ' AI recommendations');

    return recommendations;

  } catch (error) {
    Logger.log('⚠️ AI recommendation error: ' + error.toString());
    return []; // Return empty array on error
  }
}

`;

    code = code.substring(0, insertPoint) + newFunctions + code.substring(insertPoint);

    console.log('✅ Added server functions\n');

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
    console.log('✅ ROUGH DRAFT → LIVE UPDATE WORKFLOW READY!\n');
    console.log('\nHow it works:\n');
    console.log('  1. Modal opens INSTANTLY with rough draft:');
    console.log('     ✅ Section 1: Defaults (last saved or 35) - pre-checked');
    console.log('     💡 Section 2: Empty (will fill after AI)');
    console.log('     📋 Section 3: All other fields\n');
    console.log('  2. Live Log shows: "Calling OpenAI API..."');
    console.log('     (User can already see and adjust defaults)\n');
    console.log('  3. After AI responds, modal UPDATES:');
    console.log('     ✅ Section 1: Adds ✓✓ where AI agrees with defaults');
    console.log('     💡 Section 2: Fills with AI recommendations + rationale');
    console.log('     📋 Section 3: No change\n');
    console.log('Try it now:\n');
    console.log('  1. Refresh Sheet (F5)');
    console.log('  2. Click 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('  3. Click cache button → Opens INSTANTLY!');
    console.log('  4. Watch Live Log as AI updates the fields\n');
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
