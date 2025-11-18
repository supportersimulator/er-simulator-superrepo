#!/usr/bin/env node

/**
 * FIX LOAD SAVED SELECTION IN getFieldSelectorData()
 * Ensure it loads from DocumentProperties first, falls back to 35 defaults if empty
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

    console.log('🔧 Fixing field selection loading in getFieldSelectorData()...\n');

    // Find the Step 3 section where selectedFields is currently hardcoded
    const step3Start = code.indexOf("addLog('   Step 3: Loading field selection (inlined)');");

    if (step3Start === -1) {
      console.log('❌ Could not find Step 3 in getFieldSelectorData()\n');
      return;
    }

    // Find the end of the 35-field array (after the last comment and closing bracket)
    const arrayStart = code.indexOf('selectedFields = [', step3Start);
    const arrayEnd = code.indexOf('];', arrayStart);

    // Find where the graceful filtering starts
    const filterStart = code.indexOf("// Filter defaults to only include fields that actually exist", arrayEnd);

    if (filterStart === -1) {
      console.log('❌ Could not find filter section\n');
      return;
    }

    // Replace the hardcoded array with dynamic loading logic
    const oldCode = code.substring(arrayStart, filterStart);

    const newCode = `selectedFields = [];

      // Try to load saved selection from DocumentProperties
      var docProps = PropertiesService.getDocumentProperties();
      var savedSelection = docProps.getProperty('SELECTED_CACHE_FIELDS');

      if (savedSelection) {
        addLog('      📂 Loading saved field selection...');
        selectedFields = JSON.parse(savedSelection);
        addLog('      ✅ Loaded ' + selectedFields.length + ' saved fields');
      } else {
        addLog('      ℹ️ No saved selection - initializing 35 intelligent defaults...');

        // Initialize with 35 intelligent defaults
        selectedFields = [
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

        // Save these defaults for next time
        docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(selectedFields));
        addLog('      ✅ Initialized and saved 35 intelligent defaults');
      }

      `;

    code = code.substring(0, arrayStart) + newCode + code.substring(filterStart);

    console.log('✅ Replaced hardcoded array with dynamic loading logic\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ LOAD SAVED SELECTION FIXED!\n');
    console.log('\nHow it works now:\n');
    console.log('  1️⃣ First time: Loads 35 intelligent defaults → saves to cache');
    console.log('  2️⃣ User edits: Deselects/selects fields → saves changes via "Continue to Cache"');
    console.log('  3️⃣ Next time: Loads whatever user last saved (their custom selection)');
    console.log('  4️⃣ Reset button: Can restore back to 35 defaults anytime\n');
    console.log('User selections are now fully preserved!\n');
    console.log('Try "Categories & Pathways" now - should load immediately!\n');
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
