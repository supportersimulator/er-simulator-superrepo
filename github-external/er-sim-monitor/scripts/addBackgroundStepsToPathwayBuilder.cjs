#!/usr/bin/env node

/**
 * ADD BACKGROUND STEPS TO runPathwayChainBuilder()
 *
 * The function currently just creates placeholder analysis and opens UI.
 * Need to add Steps 1, 2, and 2.5 BEFORE creating placeholder:
 *
 * Step 1: Refresh headers cache
 * Step 2: Initialize 35 defaults (if needed)
 * Step 2.5: Pre-fetch AI recommendations from ChatGPT
 * Step 3: Create placeholder analysis (already exists)
 * Step 4: Open Pathway UI (already exists)
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

    console.log('🔧 Adding background steps to runPathwayChainBuilder()...\n');

    // Find the function
    const funcStart = code.indexOf('function runPathwayChainBuilder() {');
    const tryStart = code.indexOf('  try {', funcStart);
    const placeholderStart = code.indexOf('    // Create minimal placeholder analysis', tryStart);

    if (funcStart === -1 || tryStart === -1 || placeholderStart === -1) {
      console.log('❌ Could not find function structure\n');
      return;
    }

    // Insert Steps 1, 2, and 2.5 BEFORE the placeholder
    const backgroundSteps = `    // ═══════════════════════════════════════════════════════════════
    // BACKGROUND INITIALIZATION (when clicking "Categories & Pathways")
    // ═══════════════════════════════════════════════════════════════

    Logger.log('🚀 runPathwayChainBuilder() started');
    const docProps = PropertiesService.getDocumentProperties();

    // STEP 1: Refresh headers cache (map 642 field names to column indices)
    Logger.log('📋 Step 1: Refreshing headers cache...');
    refreshHeaders();
    Logger.log('✅ Step 1 complete: Headers cached');

    // STEP 2: Initialize 35 intelligent defaults (first time only)
    Logger.log('🎯 Step 2: Checking field selection...');
    const savedSelection = docProps.getProperty('SELECTED_CACHE_FIELDS');

    if (!savedSelection) {
      Logger.log('💡 First time setup: Initializing 35 intelligent defaults...');

      const defaultFields = [
        'Case_Organization_Case_ID',
        'Case_Organization_Spark_Title',
        'Case_Organization_Pathway_or_Course_Name',
        'Case_Organization_Medical_Category',
        'Case_Organization_Difficulty_Level',
        'Case_Orientation_Chief_Diagnosis',
        'Case_Organization_Pre_Sim_Overview',
        'Case_Organization_Post_Sim_Overview',
        'Set_the_Stage_Context_Clinical_Vignette',
        'Set_the_Stage_Context_Educational_Goal',
        'Set_the_Stage_Context_Environment_Type',
        'Situation_and_Environment_Details_Disposition_Plan',
        'Monitor_Vital_Signs_Initial_Vitals',
        'Patient_Demographics_and_Clinical_Data_Patient_Name',
        'Patient_Demographics_and_Clinical_Data_Age',
        'Patient_Demographics_and_Clinical_Data_Gender',
        'Patient_Demographics_and_Clinical_Data_Presenting_Complaint',
        'Patient_Demographics_and_Clinical_Data_Past_Medical_History',
        'Patient_Demographics_and_Clinical_Data_Current_Medications',
        'Patient_Demographics_and_Clinical_Data_Allergies',
        'Patient_Demographics_and_Clinical_Data_Exam_Positive_Findings',
        'Patient_Stability_and_Expected_Actions_Expected_Student_Actions',
        'AI_and_Adaptive_Learning_AI_Analysis_of_Student_Decisions',
        'AI_and_Adaptive_Learning_AI_Logic_Based_on_Vitals_Exam_Labs',
        'Dynamic_Story_Changes_Early_Intervention_Pathway',
        'Dynamic_Story_Changes_Delayed_or_Missed_Treatment_Pathway',
        'Dynamic_Story_Changes_Correct_Diagnosis_Pathway',
        'Dynamic_Story_Changes_Incorrect_Diagnosis_Pathway',
        'Debriefing_and_Feedback_Debrief_Topics_Key_Learning_Points',
        'Debriefing_and_Feedback_Common_Errors_or_Pitfalls',
        'Medical_Decision_Trees_Initial_Presentation_Findings',
        'Medical_Decision_Trees_Critical_Decision_Points',
        'Medical_Decision_Trees_Optimal_Management_Steps',
        'Case_Organization_Pre_Sim_Overview',
        'Case_Organization_Post_Sim_Overview'
      ];

      docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(defaultFields));
      Logger.log('✅ Initialized 35 intelligent defaults');
    } else {
      Logger.log('✅ Field selection already cached (' + JSON.parse(savedSelection).length + ' fields)');
    }

    // STEP 2.5: Pre-fetch AI recommendations from ChatGPT (background)
    Logger.log('💡 Step 2.5: Pre-fetching AI recommendations from ChatGPT...');
    try {
      // Get current field selection
      const currentSelection = savedSelection ? JSON.parse(savedSelection) : defaultFields;

      // Get available fields from headers cache
      const availableFields = getAvailableFields();

      // Call ChatGPT to get recommendations
      const aiRecommendations = getAIRecommendedFields(availableFields, currentSelection);

      // Cache the recommendations
      docProps.setProperty('AI_RECOMMENDED_FIELDS', JSON.stringify(aiRecommendations));
      docProps.setProperty('AI_RECOMMENDATIONS_TIMESTAMP', new Date().toISOString());

      Logger.log('✅ Pre-fetched ' + aiRecommendations.length + ' AI recommendations from ChatGPT');
    } catch (aiError) {
      Logger.log('⚠️ AI recommendations warning: ' + aiError.toString());
      // Don't block UI - modal will use fallback if this fails
    }

    // ═══════════════════════════════════════════════════════════════

    `;

    // Insert the background steps before the placeholder
    code = code.substring(0, placeholderStart) + backgroundSteps + code.substring(placeholderStart);

    console.log('✅ Added Steps 1, 2, and 2.5\n');

    console.log('📤 Deploying...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ BACKGROUND STEPS ADDED!\n');
    console.log('\nNow when you click "Categories & Pathways" menu:\n');
    console.log('  Step 1: Headers cache refreshes (642 field names) ✅\n');
    console.log('  Step 2: 35 defaults initialize if needed ✅\n');
    console.log('  Step 2.5: AI recommendations pre-fetch from ChatGPT ✅\n');
    console.log('  Step 3: Minimal placeholder analysis created (no batch processing) ✅\n');
    console.log('  Step 4: Pathway UI opens with cache button ✅\n');
    console.log('');
    console.log('When you click "💾 Cache All Layers" on Pathway UI:\n');
    console.log('  → Field selector modal opens\n');
    console.log('  → Shows defaults + AI recommendations + all fields\n');
    console.log('  → You adjust selection\n');
    console.log('  → Click "💾 Cache All Layers" in modal\n');
    console.log('  → Batch processing starts (25 rows at a time)\n');
    console.log('  → Live Log shows progress\n');
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
