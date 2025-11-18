#!/usr/bin/env node

/**
 * ENSURE PROPER DEFAULT FORMATTING
 *
 * Guarantees:
 * 1. Defaults use LAST SAVED selection if exists
 * 2. Otherwise use 35 intelligent defaults
 * 3. Both are validated against CACHED_MERGED_KEYS (exact Row 2 format)
 * 4. Duplicates removed
 * 5. Invalid field names filtered out (in case CSV evolved)
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

    console.log('🔧 Updating getFieldSelectorRoughDraft() with proper validation...\n');

    // Find the function
    const funcStart = code.indexOf('function getFieldSelectorRoughDraft() {');
    if (funcStart === -1) {
      console.log('❌ Could not find getFieldSelectorRoughDraft()\n');
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

    // New version with validation and duplicate removal
    const newFunction = `function getFieldSelectorRoughDraft() {
  Logger.log('🎯 getFieldSelectorRoughDraft() START');

  var docProps = PropertiesService.getDocumentProperties();

  // STEP 1: Get all valid field names from cached headers (Row 2)
  var cachedMergedKeys = docProps.getProperty('CACHED_MERGED_KEYS');
  if (!cachedMergedKeys) {
    Logger.log('⚠️ Headers not cached - refreshing...');
    refreshHeaders();
    cachedMergedKeys = docProps.getProperty('CACHED_MERGED_KEYS');
  }

  var allFields = JSON.parse(cachedMergedKeys);
  Logger.log('✅ Got ' + allFields.length + ' valid fields from Row 2');

  // STEP 2: Get selected fields (PREFERENCE: last saved, FALLBACK: 35 defaults)
  var savedSelection = docProps.getProperty('SELECTED_CACHE_FIELDS');
  var selected;

  if (savedSelection) {
    // Use last saved selection
    var savedFields = JSON.parse(savedSelection);
    Logger.log('📂 Found last saved selection: ' + savedFields.length + ' fields');

    // VALIDATE: Remove duplicates
    var uniqueFields = [];
    var seen = {};
    for (var i = 0; i < savedFields.length; i++) {
      var fieldName = savedFields[i];
      if (!seen[fieldName]) {
        uniqueFields.push(fieldName);
        seen[fieldName] = true;
      }
    }

    if (uniqueFields.length < savedFields.length) {
      Logger.log('⚠️ Removed ' + (savedFields.length - uniqueFields.length) + ' duplicates from saved selection');
    }

    // VALIDATE: Ensure all fields still exist in current headers
    var validFields = [];
    for (var i = 0; i < uniqueFields.length; i++) {
      if (allFields.indexOf(uniqueFields[i]) !== -1) {
        validFields.push(uniqueFields[i]);
      } else {
        Logger.log('⚠️ Removed invalid field (no longer in CSV): ' + uniqueFields[i]);
      }
    }

    selected = validFields;
    Logger.log('✅ Using ' + selected.length + ' validated fields from last saved selection');

    // Save cleaned version back
    if (selected.length !== savedFields.length) {
      docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(selected));
      Logger.log('✅ Saved cleaned selection (removed ' + (savedFields.length - selected.length) + ' invalid entries)');
    }

  } else {
    // No saved selection - use 35 intelligent defaults
    Logger.log('⚠️ No saved selection - initializing 35 intelligent defaults');

    var defaultFields = [
      // TIER 1: Identity & Navigation (6)
      'Case_Organization_Case_ID',
      'Case_Organization_Spark_Title',
      'Case_Organization_Reveal_Title',
      'Case_Organization_Pathway_or_Course_Name',
      'Case_Organization_Difficulty_Level',
      'Case_Organization_Medical_Category',

      // TIER 2: Clinical Indexing (8)
      'Patient_Demographics_and_Clinical_Data_Age',
      'Patient_Demographics_and_Clinical_Data_Gender',
      'Patient_Demographics_and_Clinical_Data_Presenting_Complaint',
      'Patient_Demographics_and_Clinical_Data_Past_Medical_History',
      'Patient_Demographics_and_Clinical_Data_Exam_Positive_Findings',
      'Monitor_Vital_Signs_Initial_Vitals',
      'Scenario_Progression_States_Decision_Nodes_JSON',
      'Set_the_Stage_Context_Case_Summary_Concise',

      // TIER 3: Pedagogical Dimensions (5)
      'CME_and_Educational_Content_CME_Learning_Objective',
      'Set_the_Stage_Context_Educational_Goal',
      'Set_the_Stage_Context_Why_It_Matters',
      'Developer_and_QA_Metadata_Simulation_Quality_Score',
      'Case_Organization_Original_Title',

      // TIER 4: Contextual Variance (6)
      'Set_the_Stage_Context_Environment_Type',
      'Set_the_Stage_Context_Environment_Description_for_AI_Image',
      'Situation_and_Environment_Details_Triage_or_SBAR_Note',
      'Situation_and_Environment_Details_Disposition_Plan',
      'Scenario_Progression_States_Branching_Notes',
      'Staff_and_AI_Interaction_Config_Patient_Script',

      // TIER 5: State Progression (6)
      'Monitor_Vital_Signs_State1_Vitals',
      'Monitor_Vital_Signs_State2_Vitals',
      'Monitor_Vital_Signs_State3_Vitals',
      'Monitor_Vital_Signs_State4_Vitals',
      'Monitor_Vital_Signs_State5_Vitals',
      'Monitor_Vital_Signs_Vitals_Format',

      // TIER 6: Metacognitive Enrichment (4)
      'Developer_and_QA_Metadata_AI_Reflection_and_Suggestions',
      'Version_and_Attribution_Full_Attribution_Details',
      'Case_Organization_Pre_Sim_Overview',
      'Case_Organization_Post_Sim_Overview'
    ];

    // VALIDATE: Ensure defaults exist in current headers
    var validDefaults = [];
    for (var i = 0; i < defaultFields.length; i++) {
      if (allFields.indexOf(defaultFields[i]) !== -1) {
        validDefaults.push(defaultFields[i]);
      } else {
        Logger.log('⚠️ Default field not in current CSV: ' + defaultFields[i]);
      }
    }

    selected = validDefaults;
    Logger.log('✅ Using ' + selected.length + ' validated defaults (from 35 originals)');

    // Save validated defaults
    docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(selected));
    Logger.log('✅ Saved validated defaults');
  }

  Logger.log('✅ getFieldSelectorRoughDraft() COMPLETE');
  Logger.log('   → ' + allFields.length + ' total fields available');
  Logger.log('   → ' + selected.length + ' fields selected (DEFAULT section)');
  Logger.log('   → ' + (allFields.length - selected.length) + ' fields unselected (OTHER section)');

  return {
    allFields: allFields,
    selected: selected
  };
}`;

    // Replace the function
    code = code.substring(0, funcStart) + newFunction + code.substring(funcEnd);

    console.log('✅ Function updated with validation\n');
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
    console.log('✅ PROPER DEFAULT FORMATTING GUARANTEED!\n');
    console.log('\nValidation guarantees:\n');
    console.log('1. ✅ Uses LAST SAVED selection if exists');
    console.log('2. ✅ Falls back to 35 intelligent defaults if not');
    console.log('3. ✅ Removes duplicates from saved selection');
    console.log('4. ✅ Validates all fields against CACHED_MERGED_KEYS');
    console.log('5. ✅ Filters out fields that no longer exist (CSV evolved)');
    console.log('6. ✅ Uses exact Row 2 header format throughout');
    console.log('7. ✅ Saves cleaned selection back to cache\n');
    console.log('Format guarantee:\n');
    console.log('  - ALL field names come from Row 2 via CACHED_MERGED_KEYS');
    console.log('  - Example: "Case_Organization_Case_ID" (full format)');
    console.log('  - NO short names like "Case_ID"');
    console.log('  - NO tier2-only names like "Age"\n');
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
