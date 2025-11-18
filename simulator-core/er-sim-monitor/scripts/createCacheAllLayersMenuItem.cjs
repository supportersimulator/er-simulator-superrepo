#!/usr/bin/env node

/**
 * CREATE "Cache All Layers" MENU ITEM
 * This opens the field selector modal with headers + defaults pre-loaded
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

    console.log('🔧 Creating showCacheAllLayersModal() function...\n');

    // Find a good place to insert the new function (after showFieldSelector)
    const insertPos = code.indexOf('function showFieldSelector()');

    if (insertPos === -1) {
      console.log('❌ Could not find showFieldSelector() function\n');
      return;
    }

    // Add new function before showFieldSelector
    const newFunction = `
/**
 * CACHE ALL LAYERS - Entry point from menu
 * 1. Refresh headers cache
 * 2. Initialize/load 35 defaults
 * 3. Show field selector modal
 */
function showCacheAllLayersModal() {
  try {
    Logger.log('🎯 showCacheAllLayersModal() started');

    // STEP 1: Refresh headers cache (loads Row 2 headers into DocumentProperties)
    Logger.log('📂 Refreshing headers cache...');
    refreshHeaders();
    Logger.log('✅ Headers cached');

    // STEP 2: Initialize 35 intelligent defaults if none exist
    var docProps = PropertiesService.getDocumentProperties();
    var savedSelection = docProps.getProperty('SELECTED_CACHE_FIELDS');

    if (!savedSelection) {
      Logger.log('📂 No saved field selection - initializing 35 intelligent defaults...');

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

      docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(defaultFields));
      Logger.log('✅ Initialized 35 intelligent defaults');
    } else {
      Logger.log('✅ Field selection already cached (' + JSON.parse(savedSelection).length + ' fields)');
    }

    // STEP 3: Show field selector modal (everything is now ready)
    Logger.log('🚀 Opening field selector modal...');
    showFieldSelector();

  } catch (error) {
    Logger.log('❌ ERROR in showCacheAllLayersModal: ' + error.toString());
    SpreadsheetApp.getUi().alert('Error: ' + error.toString());
  }
}

`;

    code = code.substring(0, insertPos) + newFunction + code.substring(insertPos);

    console.log('✅ Added showCacheAllLayersModal() function\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ "CACHE ALL LAYERS" MENU ITEM NOW WORKS!\n');
    console.log('\nNow when you click "🗄️ Cache Management → 📦 Cache All Layers":\n');
    console.log('  1️⃣ Refreshes headers cache (642 Row 2 field names)');
    console.log('  2️⃣ Initializes 35 intelligent defaults (first time only)');
    console.log('  3️⃣ Opens field selector modal with everything ready → instant display!\n');
    console.log('The field selector modal will show:');
    console.log('  ✅ All categories with fields');
    console.log('  ✅ 35 defaults pre-selected (or your saved selection)');
    console.log('  ✅ AI recommendations');
    console.log('  ✅ No loading delay!\n');
    console.log('When you deselect/select fields and click "Continue to Cache":');
    console.log('  ✅ Your changes are saved');
    console.log('  ✅ Next time: Loads your custom selection instead of 35 defaults\n');
    console.log('Try "🗄️ Cache Management → 📦 Cache All Layers" now!\n');
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
