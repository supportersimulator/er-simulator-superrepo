#!/usr/bin/env node

/**
 * FIX FIELD SELECTOR TO INITIALIZE 35 DEFAULTS
 *
 * Problem: Step 2 returns empty array [] if no saved selection exists
 * Solution: Initialize 35 intelligent defaults if SELECTED_CACHE_FIELDS is missing
 *
 * This ensures the field selector ALWAYS shows the 35 defaults pre-selected
 * on first use, and AI gets those 35 fields to work with for recommendations.
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

    console.log('🔧 Fixing Step 2 to initialize 35 defaults...\n');

    // Find Step 2
    const step2Start = code.indexOf("addLog('   Step 2: Getting saved field selection...');");
    const step2Line = code.indexOf("var selectedFields = savedSelection ? JSON.parse(savedSelection) : [];", step2Start);

    if (step2Start === -1 || step2Line === -1) {
      console.log('❌ Could not find Step 2 location\n');
      process.exit(1);
    }

    // Find the end of that line
    const lineEnd = code.indexOf('\n', step2Line);

    // Replace with proper initialization
    const replacement = `var selectedFields;
    if (savedSelection) {
      selectedFields = JSON.parse(savedSelection);
      addLog('   ✅ Got ' + selectedFields.length + ' saved fields');
    } else {
      addLog('   ⚠️ No saved selection - initializing 35 intelligent defaults...');

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

      // Save for next time
      docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(selectedFields));
      addLog('   ✅ Initialized and saved 35 defaults');
    }`;

    code = code.substring(0, step2Line) + replacement + code.substring(lineEnd);

    // Remove the duplicate log line that comes after
    code = code.replace(/addLog\('   ✅ Got ' \+ selectedFields\.length \+ ' selected fields'\);[\r\n]*/, '');

    console.log('✅ Fixed Step 2\n');

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
    console.log('✅ FIELD SELECTOR NOW INITIALIZES 35 DEFAULTS!\n');
    console.log('\nHow it works now:\n');
    console.log('  1. User opens field selector (any way)');
    console.log('  2. Step 1: Headers cache loads/initializes (642 fields)');
    console.log('  3. Step 2: Checks for saved selection');
    console.log('     → If found: Load saved fields');
    console.log('     → If NOT found: Initialize 35 intelligent defaults');
    console.log('  4. Step 3: Get AI recommendations (using the 35 defaults)');
    console.log('  5. Modal shows: 35 selected + AI recommendations + all other fields\n');
    console.log('Try it now:\n');
    console.log('  1. Refresh Google Sheet (F5)');
    console.log('  2. Click 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('  3. Click cache button');
    console.log('  4. Should see 35 fields pre-selected!\n');
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
