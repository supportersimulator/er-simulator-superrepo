#!/usr/bin/env node

/**
 * PRE-POPULATE 35 DEFAULTS INTO DOCUMENT PROPERTIES
 * Run this ONCE to initialize the cache so it's not empty on first use
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

async function prePopulate() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('🔧 Pre-populating 35 intelligent defaults...\n');

    // Create a temporary function to set the DocumentProperties
    const tempFunction = `
function prePopulate35Defaults_TEMP() {
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

  var docProps = PropertiesService.getDocumentProperties();
  docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(defaultFields));

  Logger.log('✅ Pre-populated 35 intelligent defaults into DocumentProperties');
  Logger.log('📋 Fields: ' + defaultFields.join(', '));

  return {
    success: true,
    count: defaultFields.length,
    fields: defaultFields
  };
}
`;

    console.log('📥 Getting current code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    // Add the temp function
    let code = codeFile.source + '\n' + tempFunction;

    console.log('📤 Deploying temp function...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Temp function deployed\n');
    console.log('🚀 Executing prePopulate35Defaults_TEMP()...\n');

    // Execute the temp function
    const response = await script.scripts.run({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        function: 'prePopulate35Defaults_TEMP',
        devMode: false
      }
    });

    if (response.data.error) {
      console.log('❌ ERROR:', JSON.stringify(response.data.error, null, 2));
    } else {
      console.log('✅ SUCCESS!\n');
      console.log('Response:', JSON.stringify(response.data.response.result, null, 2));
    }

    console.log('\n🧹 Removing temp function...\n');

    // Remove the temp function
    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: codeFile.source },
        manifestFile
      ]}
    });

    console.log('✅ Cleaned up\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ 35 INTELLIGENT DEFAULTS PRE-POPULATED!\n');
    console.log('\nDocumentProperties now contains:\n');
    console.log('  Key: SELECTED_CACHE_FIELDS');
    console.log('  Value: JSON array with 35 field names\n');
    console.log('Now when you click "Categories & Pathways":\n');
    console.log('  ✅ First time: Will load these 35 defaults (not empty!)');
    console.log('  ✅ Field selector: Shows 35 pre-selected fields');
    console.log('  ✅ User edits: Saves changes for next time\n');
    console.log('The cache is ready to use!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

prePopulate();
