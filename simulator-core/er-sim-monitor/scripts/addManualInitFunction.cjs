#!/usr/bin/env node

/**
 * ADD MANUAL INIT FUNCTION FOR 35 DEFAULTS
 * Adds a function you can run once from Apps Script editor to pre-populate cache
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

    console.log('🔧 Adding MANUAL_INIT_35_DEFAULTS() function...\n');

    // Find a good place to insert (end of file before any closing markers)
    const insertPos = code.lastIndexOf('\n');

    const newFunction = `

// ═══════════════════════════════════════════════════════════════
// MANUAL INITIALIZATION - RUN ONCE TO PRE-POPULATE CACHE
// ═══════════════════════════════════════════════════════════════

/**
 * RUN THIS ONCE from Apps Script Editor to pre-populate 35 intelligent defaults
 * After running, the cache will be ready on first use (not empty)
 */
function MANUAL_INIT_35_DEFAULTS() {
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

  // Clear any existing selection first
  docProps.deleteProperty('SELECTED_CACHE_FIELDS');

  // Set the 35 defaults
  docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(defaultFields));

  Logger.log('✅ PRE-POPULATED 35 INTELLIGENT DEFAULTS');
  Logger.log('📋 Total fields: ' + defaultFields.length);
  Logger.log('🎯 Cache is now ready for first use!');

  SpreadsheetApp.getUi().alert(
    'Success!\\n\\n' +
    '✅ Pre-populated 35 intelligent defaults\\n\\n' +
    'The field selector cache is now ready.\\n' +
    'When you click "Categories & Pathways", it will load these 35 defaults instantly.'
  );

  return {
    success: true,
    count: defaultFields.length
  };
}
`;

    code = code.substring(0, insertPos) + newFunction + code.substring(insertPos);

    console.log('✅ Added MANUAL_INIT_35_DEFAULTS() function\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ MANUAL INIT FUNCTION ADDED!\n');
    console.log('\n📋 INSTRUCTIONS TO PRE-POPULATE:\n');
    console.log('  1. Open Google Sheets spreadsheet');
    console.log('  2. Go to: Extensions → Apps Script');
    console.log('  3. Find function: MANUAL_INIT_35_DEFAULTS');
    console.log('  4. Click Run (▶️) button');
    console.log('  5. Wait for success alert\n');
    console.log('After running:\n');
    console.log('  ✅ Cache pre-populated with 35 intelligent defaults');
    console.log('  ✅ "Categories & Pathways" will load them on first use');
    console.log('  ✅ No more empty cache on first open!\n');
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
