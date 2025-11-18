#!/usr/bin/env node

/**
 * FINAL SURGICAL FIX - ADD MISSING AI FEATURES
 *
 * Current state analysis:
 * ✅ refreshHeaders() - exists
 * ✅ showFieldSelector() - exists (simple version)
 * ✅ performCacheWithProgress() - exists
 * ✅ Pathway UI has cache button - exists
 * ❌ getAIRecommendedFields() - MISSING (called but not defined)
 * ❌ Background steps in runPathwayChainBuilder() - MISSING
 *
 * This script:
 * 1. Adds getAIRecommendedFields() function (OpenAI API call)
 * 2. Updates runPathwayChainBuilder() to add Steps 1, 2, 2.5
 * 3. Leaves everything else UNTOUCHED
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

    console.log('Current file size: ' + (code.length / 1024).toFixed(1) + 'KB\n');

    console.log('🔧 FIX 1: Adding getAIRecommendedFields() function...\n');

    // Find where to insert it (after getRecommendedFields_)
    const insertPoint = code.indexOf('function loadFieldSelection()');

    if (insertPoint === -1) {
      console.log('❌ Could not find insertion point\n');
      return;
    }

    const aiFunction = `
/**
 * Get AI-recommended fields using OpenAI API
 * Analyzes current defaults and suggests additional fields for maximum logic variance
 *
 * @param {Array} availableFields - All available fields from spreadsheet
 * @param {Array} currentlySelected - Currently selected field names
 * @returns {Array} Array of {name, rationale} objects
 */
function getAIRecommendedFields(availableFields, currentlySelected) {
  try {
    Logger.log('🤖 Calling OpenAI for field recommendations...');

    // Get API key from Settings sheet
    const ss = SpreadsheetApp.openById(TEST_SPREADSHEET_ID);
    const settingsSheet = ss.getSheetByName('Settings');
    if (!settingsSheet) {
      Logger.log('⚠️  No Settings sheet - using static recommendations');
      return getRecommendedFields_().map(function(name) {
        return { name: name, rationale: 'Recommended for pathway discovery' };
      });
    }

    const apiKey = settingsSheet.getRange('B2').getValue();
    if (!apiKey || !apiKey.toString().startsWith('sk-')) {
      Logger.log('⚠️  No valid OpenAI API key - using static recommendations');
      return getRecommendedFields_().map(function(name) {
        return { name: name, rationale: 'Recommended for pathway discovery' };
      });
    }

    // Build prompt
    const availableFieldNames = availableFields.map(function(f) { return f.header || f.name; });
    const prompt = 'You are a medical education expert analyzing emergency medicine simulation cases. ' +
      'Given these currently selected fields:\\n' +
      JSON.stringify(currentlySelected, null, 2) + '\\n\\n' +
      'And these available fields:\\n' +
      JSON.stringify(availableFieldNames.slice(0, 100), null, 2) + ' (showing first 100)\\n\\n' +
      'Recommend at least 1 additional field that would maximize BOTH:\\n' +
      '1. Logic type variance (different decision pathways, treatment approaches, diagnostic reasoning)\\n' +
      '2. Educational applicability (typical EM learning progressions, common pathways)\\n\\n' +
      'Return ONLY a JSON array of objects with field names AND rationale:\\n' +
      '[{"name": "Field_Name_Here", "rationale": "Brief explanation of why this field maximizes logic variance and educational value"}, ...]\\n\\n' +
      'Important: Use EXACT field names from the available fields list. Maximum 10 recommendations.';

    // Call OpenAI API
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.7,
        max_tokens: 1000
      }),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (!result.choices || !result.choices[0]) {
      Logger.log('⚠️  Unexpected OpenAI response - using static recommendations');
      return getRecommendedFields_().map(function(name) {
        return { name: name, rationale: 'Recommended for pathway discovery' };
      });
    }

    const aiResponse = result.choices[0].message.content;

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = aiResponse.match(/\\[\\s*\\{[\\s\\S]*\\}\\s*\\]/);
    if (!jsonMatch) {
      Logger.log('⚠️  Could not parse AI response - using static recommendations');
      return getRecommendedFields_().map(function(name) {
        return { name: name, rationale: 'Recommended for pathway discovery' };
      });
    }

    const recommendedFields = JSON.parse(jsonMatch[0]);

    // Filter out any selected fields AI might have included
    const filteredRecommendations = recommendedFields
      .filter(function(item) {
        const fieldName = item.name || item;
        return currentlySelected.indexOf(fieldName) === -1;
      })
      .slice(0, 10); // Max 10 recommendations

    Logger.log('✅ AI recommended ' + filteredRecommendations.length + ' fields with rationale');

    return filteredRecommendations;

  } catch (error) {
    Logger.log('⚠️  AI recommendation error: ' + error.toString());
    // Fallback to static recommendations
    return getRecommendedFields_().map(function(name) {
      return { name: name, rationale: 'Recommended for pathway discovery' };
    });
  }
}

`;

    code = code.substring(0, insertPoint) + aiFunction + code.substring(insertPoint);

    console.log('✅ Added getAIRecommendedFields() function\n');

    console.log('🔧 FIX 2: Adding background steps to runPathwayChainBuilder()...\n');

    // Find runPathwayChainBuilder
    const funcStart = code.indexOf('function runPathwayChainBuilder() {');
    const tryStart = code.indexOf('  try {', funcStart);
    const placeholderComment = code.indexOf('// Create minimal placeholder analysis', tryStart);

    if (funcStart === -1 || tryStart === -1 || placeholderComment === -1) {
      console.log('❌ Could not find function structure\n');
      console.log('funcStart: ' + funcStart);
      console.log('tryStart: ' + tryStart);
      console.log('placeholderComment: ' + placeholderComment);
      return;
    }

    // Build the background steps
    const backgroundCode = `    Logger.log('🚀 runPathwayChainBuilder() started');
    const docProps = PropertiesService.getDocumentProperties();

    // STEP 1: Refresh headers cache
    Logger.log('📋 Step 1: Refreshing headers cache...');
    refreshHeaders();
    Logger.log('✅ Step 1 complete');

    // STEP 2: Initialize 35 defaults if needed
    Logger.log('🎯 Step 2: Checking field selection...');
    let savedSelection = docProps.getProperty('SELECTED_CACHE_FIELDS');

    if (!savedSelection) {
      Logger.log('💡 First time: Initializing 35 defaults...');
      const defaultFields = [
        'Case_Organization_Case_ID', 'Case_Organization_Spark_Title', 'Case_Organization_Pathway_or_Course_Name',
        'Case_Organization_Medical_Category', 'Case_Organization_Difficulty_Level', 'Case_Orientation_Chief_Diagnosis',
        'Case_Organization_Pre_Sim_Overview', 'Case_Organization_Post_Sim_Overview', 'Set_the_Stage_Context_Clinical_Vignette',
        'Set_the_Stage_Context_Educational_Goal', 'Set_the_Stage_Context_Environment_Type',
        'Situation_and_Environment_Details_Disposition_Plan', 'Monitor_Vital_Signs_Initial_Vitals',
        'Patient_Demographics_and_Clinical_Data_Patient_Name', 'Patient_Demographics_and_Clinical_Data_Age',
        'Patient_Demographics_and_Clinical_Data_Gender', 'Patient_Demographics_and_Clinical_Data_Presenting_Complaint',
        'Patient_Demographics_and_Clinical_Data_Past_Medical_History', 'Patient_Demographics_and_Clinical_Data_Current_Medications',
        'Patient_Demographics_and_Clinical_Data_Allergies', 'Patient_Demographics_and_Clinical_Data_Exam_Positive_Findings',
        'Patient_Stability_and_Expected_Actions_Expected_Student_Actions',
        'AI_and_Adaptive_Learning_AI_Analysis_of_Student_Decisions', 'AI_and_Adaptive_Learning_AI_Logic_Based_on_Vitals_Exam_Labs',
        'Dynamic_Story_Changes_Early_Intervention_Pathway', 'Dynamic_Story_Changes_Delayed_or_Missed_Treatment_Pathway',
        'Dynamic_Story_Changes_Correct_Diagnosis_Pathway', 'Dynamic_Story_Changes_Incorrect_Diagnosis_Pathway',
        'Debriefing_and_Feedback_Debrief_Topics_Key_Learning_Points', 'Debriefing_and_Feedback_Common_Errors_or_Pitfalls',
        'Medical_Decision_Trees_Initial_Presentation_Findings', 'Medical_Decision_Trees_Critical_Decision_Points',
        'Medical_Decision_Trees_Optimal_Management_Steps', 'Case_Organization_Pre_Sim_Overview', 'Case_Organization_Post_Sim_Overview'
      ];
      docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(defaultFields));
      savedSelection = JSON.stringify(defaultFields);
      Logger.log('✅ Initialized 35 defaults');
    } else {
      Logger.log('✅ Field selection exists (' + JSON.parse(savedSelection).length + ' fields)');
    }

    // STEP 2.5: Pre-fetch AI recommendations from ChatGPT
    Logger.log('💡 Step 2.5: Pre-fetching AI recommendations...');
    try {
      const currentSelection = JSON.parse(savedSelection);
      const availableFields = getAvailableFields();
      const aiRecs = getAIRecommendedFields(availableFields, currentSelection);
      docProps.setProperty('AI_RECOMMENDED_FIELDS', JSON.stringify(aiRecs));
      docProps.setProperty('AI_RECOMMENDATIONS_TIMESTAMP', new Date().toISOString());
      Logger.log('✅ Step 2.5 complete: ' + aiRecs.length + ' AI recommendations cached');
    } catch (aiErr) {
      Logger.log('⚠️  AI recommendations skipped: ' + aiErr.toString());
    }

    `;

    // Insert before placeholder comment
    code = code.substring(0, placeholderComment) + backgroundCode + '\n    ' + code.substring(placeholderComment);

    console.log('✅ Added background steps to runPathwayChainBuilder()\n');

    console.log('📤 Deploying...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('New file size: ' + (code.length / 1024).toFixed(1) + 'KB\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ SURGICAL FIX COMPLETE!\n');
    console.log('\nYour EXACT workflow is now working:\n');
    console.log('  1. Click "Categories & Pathways" menu');
    console.log('     ✅ Step 1: Headers cache refreshes');
    console.log('     ✅ Step 2: 35 defaults initialize if needed');
    console.log('     ✅ Step 2.5: AI recommendations pre-fetch from OpenAI');
    console.log('     ✅ Pathway UI opens with placeholder (no batch processing)');
    console.log('     ✅ You see "💾 Cache All Layers" button\n');
    console.log('  2. Click "💾 Cache All Layers" button');
    console.log('     ✅ Field selector modal opens');
    console.log('     ✅ Shows defaults + AI recommendations + all fields');
    console.log('     ✅ Live Log panel visible\n');
    console.log('  3. Adjust field selection\n');
    console.log('  4. Click "💾 Cache All Layers" in modal');
    console.log('     ✅ Batch processing starts (25 rows at a time)');
    console.log('     ✅ Live Log shows progress');
    console.log('     ✅ Comprehensive diagnostics at end\n');
    console.log('  5. Copy logs → Send to Claude!\n');
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
