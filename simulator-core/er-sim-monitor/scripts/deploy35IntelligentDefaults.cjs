#!/usr/bin/env node

/**
 * DEPLOY 35 INTELLIGENT DEFAULTS
 * Strategic field selection for AI pathway discovery
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

async function deploy() {
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

    console.log('🧠 Deploying 35 intelligent defaults for AI pathway discovery...\n');

    // Strategic 35-field selection optimized for pathway diversity
    const INTELLIGENT_DEFAULTS = [
      // TIER 1: Identity & Navigation (6 fields)
      'Case_Organization_Case_ID',
      'Case_Organization_Spark_Title',
      'Case_Organization_Reveal_Title',
      'Case_Organization_Pathway_or_Course_Name',
      'Case_Organization_Difficulty_Level',
      'Case_Organization_Medical_Category',

      // TIER 2: Clinical Indexing (8 fields)
      'Patient_Demographics_and_Clinical_Data_Age',
      'Patient_Demographics_and_Clinical_Data_Gender',
      'Patient_Demographics_and_Clinical_Data_Presenting_Complaint',
      'Patient_Demographics_and_Clinical_Data_Past_Medical_History',
      'Patient_Demographics_and_Clinical_Data_Exam_Positive_Findings',
      'Monitor_Vital_Signs_Initial_Vitals',
      'Scenario_Progression_States_Decision_Nodes_JSON',
      'Set_the_Stage_Context_Case_Summary_Concise',

      // TIER 3: Pedagogical Dimensions (5 fields)
      'CME_and_Educational_Content_CME_Learning_Objective',
      'Set_the_Stage_Context_Educational_Goal',
      'Set_the_Stage_Context_Why_It_Matters',
      'Developer_and_QA_Metadata_Simulation_Quality_Score',
      'Case_Organization_Original_Title',

      // TIER 4: Contextual Variance (6 fields)
      'Set_the_Stage_Context_Environment_Type',
      'Set_the_Stage_Context_Environment_Description_for_AI_Image',
      'Situation_and_Environment_Details_Triage_or_SBAR_Note',
      'Situation_and_Environment_Details_Disposition_Plan',
      'Scenario_Progression_States_Branching_Notes',
      'Staff_and_AI_Interaction_Config_Patient_Script',

      // TIER 5: State Progression (6 fields)
      'Monitor_Vital_Signs_State1_Vitals',
      'Monitor_Vital_Signs_State2_Vitals',
      'Monitor_Vital_Signs_State3_Vitals',
      'Monitor_Vital_Signs_State4_Vitals',
      'Monitor_Vital_Signs_State5_Vitals',
      'Monitor_Vital_Signs_Vitals_Format',

      // TIER 6: Metacognitive Enrichment (4 fields)
      'Developer_and_QA_Metadata_AI_Reflection_and_Suggestions',
      'Version_and_Attribution_Full_Attribution_Details',
      'Case_Organization_Pre_Sim_Overview',
      'Case_Organization_Post_Sim_Overview'
    ];

    console.log(`✅ Selected ${INTELLIGENT_DEFAULTS.length} fields across 6 strategic tiers\n`);

    // Find the selectedFields array assignment
    const arrayStart = code.indexOf('// Use exact Row 2');

    if (arrayStart === -1) {
      console.log('❌ Could not find defaults section\n');
      return;
    }

    const arrayAssignStart = code.indexOf('selectedFields = [', arrayStart);
    const arrayEnd = code.indexOf('];', arrayAssignStart) + 2;

    // Format the array with proper indentation and tier comments
    const formattedDefaults = `// TIER 1: Identity & Navigation (6)
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
        'Case_Organization_Post_Sim_Overview'`;

    const newCode = `// Strategic 35-field selection optimized for AI pathway discovery
      // Enables: Clinical, Pedagogical, Contextual, Temporal, and Metacognitive pathways
      selectedFields = [
        ${formattedDefaults}
      ];

      addLog('      ✅ Loaded ' + selectedFields.length + ' intelligent defaults (6 tiers)');

      `;

    code = code.substring(0, arrayAssignStart) + newCode + code.substring(arrayEnd);

    console.log('✅ Replaced with intelligent 35-field defaults\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🧠 INTELLIGENT DEFAULTS DEPLOYED!\n');
    console.log('\n35 fields strategically selected for pathway diversity:\n');
    console.log('  📍 TIER 1: Identity & Navigation (6 fields)');
    console.log('  🏥 TIER 2: Clinical Indexing (8 fields)');
    console.log('  📚 TIER 3: Pedagogical Dimensions (5 fields)');
    console.log('  🌍 TIER 4: Contextual Variance (6 fields)');
    console.log('  📈 TIER 5: State Progression (6 fields)');
    console.log('  🧩 TIER 6: Metacognitive Enrichment (4 fields)\n');
    console.log('This enables AI to discover pathways like:\n');
    console.log('  ✅ Traditional: Cardiology → Chest Pain → STEMI');
    console.log('  🆕 High-Stakes Cognitive Load');
    console.log('  🆕 Longitudinal Teaching Arcs');
    console.log('  🆕 Environment-Specific Training');
    console.log('  🆕 Differential Diagnostic Mastery');
    console.log('  🆕 Communication Skills Practice');
    console.log('  🆕 Time-Pressure Simulation\n');
    console.log('Try "Categories & Pathways" to see the new defaults!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deploy();
