#!/usr/bin/env node

/**
 * SAVE 35 INTELLIGENT DEFAULTS TO DOCUMENT PROPERTIES
 * Initialize the cache with the 35 strategic defaults
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

    console.log('🔧 Adding function to initialize defaults in DocumentProperties...\n');

    // Find where to add the new function (after getFieldSelectorData)
    const insertPos = code.indexOf('function getFieldSelectorData()');

    if (insertPos === -1) {
      console.log('❌ Could not find getFieldSelectorData() function\n');
      return;
    }

    // Add a new function to initialize defaults
    const newFunction = `
/**
 * Initialize 35 intelligent defaults in DocumentProperties
 * Call this once to set up the default field selection
 */
function initialize35Defaults() {
  var selectedFields = [
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

  // Save to DocumentProperties
  var docProps = PropertiesService.getDocumentProperties();
  docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(selectedFields));

  Logger.log('✅ Saved 35 intelligent defaults to DocumentProperties');
  Logger.log('📋 Fields: ' + selectedFields.join(', '));

  return {
    success: true,
    count: selectedFields.length,
    fields: selectedFields
  };
}

`;

    code = code.substring(0, insertPos) + newFunction + code.substring(insertPos);

    console.log('✅ Added initialize35Defaults() function\n');

    // Now modify getFieldSelectorData to call this if no saved selection exists
    const loadSelectionStart = code.indexOf('// Load saved field selection', insertPos);

    if (loadSelectionStart === -1) {
      console.log('⚠️ Could not find saved selection loading code, but function was added\n');
    } else {
      const oldLoadCode = `// Load saved field selection
    var docProps = PropertiesService.getDocumentProperties();
    var savedSelection = docProps.getProperty('SELECTED_CACHE_FIELDS');
    var selectedFields = savedSelection ? JSON.parse(savedSelection) : [];`;

      const newLoadCode = `// Load saved field selection (or initialize defaults if none exist)
    var docProps = PropertiesService.getDocumentProperties();
    var savedSelection = docProps.getProperty('SELECTED_CACHE_FIELDS');

    if (!savedSelection) {
      addLog('      ℹ️ No saved selection found - initializing 35 intelligent defaults');
      var initResult = initialize35Defaults();
      savedSelection = docProps.getProperty('SELECTED_CACHE_FIELDS');
    }

    var selectedFields = savedSelection ? JSON.parse(savedSelection) : [];`;

      code = code.replace(oldLoadCode, newLoadCode);
      console.log('✅ Modified getFieldSelectorData() to auto-initialize defaults\n');
    }

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ 35 INTELLIGENT DEFAULTS INITIALIZATION ADDED!\n');
    console.log('\nHow it works:\n');
    console.log('  1. New function: initialize35Defaults() - saves 35 fields to cache');
    console.log('  2. Auto-initialization: getFieldSelectorData() calls it if no saved selection');
    console.log('  3. User override: When user saves changes, those override the defaults\n');
    console.log('Now when you click "Categories & Pathways":\n');
    console.log('  • First time: Auto-loads 35 intelligent defaults');
    console.log('  • After that: Loads whatever user last saved');
    console.log('  • User can always reset back to 35 via "Reset to Defaults" button\n');
    console.log('Try "Categories & Pathways" now!\n');
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
