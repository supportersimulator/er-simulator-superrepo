#!/usr/bin/env node

/**
 * FIX: 3 SIMPLE SECTIONS (NO CATEGORY GROUPING)
 *
 * User wants 3 FLAT lists, not grouped by category:
 * 1. Default (selected fields)
 * 2. Recommended to consider (AI suggestions)
 * 3. Other (all remaining fields)
 *
 * Remove all category grouping logic.
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

    console.log('🔧 Simplifying to 3 flat sections (no categories)...\n');

    // Replace getFieldSelectorData() with simple version
    const funcStart = code.indexOf('function getFieldSelectorData() {');
    const funcEnd = code.indexOf('\nfunction ', funcStart + 10);

    if (funcStart === -1 || funcEnd === -1) {
      console.log('❌ Could not find getFieldSelectorData()\n');
      process.exit(1);
    }

    const simpleFunction = `function getFieldSelectorData() {
  var logs = [];
  function addLog(msg) {
    logs.push(msg);
    Logger.log(msg);
  }

  try {
    addLog('🔍 getFieldSelectorData() START');

    var docProps = PropertiesService.getDocumentProperties();

    // STEP 1: Get all available fields from cached headers
    addLog('   Step 1: Getting cached headers...');
    var cachedHeader2 = docProps.getProperty('CACHED_HEADER2');

    if (!cachedHeader2) {
      addLog('   ⚠️ Headers not cached - refreshing...');
      refreshHeaders();
      cachedHeader2 = docProps.getProperty('CACHED_HEADER2');
    }

    var header2Data = JSON.parse(cachedHeader2);
    var allFields = Object.keys(header2Data);
    addLog('   ✅ Got ' + allFields.length + ' total fields');

    // STEP 2: Get selected/default fields
    addLog('   Step 2: Getting default selection...');
    var savedSelection = docProps.getProperty('SELECTED_CACHE_FIELDS');
    var selectedFields;

    if (savedSelection) {
      selectedFields = JSON.parse(savedSelection);
      addLog('   ✅ Got ' + selectedFields.length + ' saved defaults');
    } else {
      addLog('   ⚠️ Initializing 35 intelligent defaults...');
      selectedFields = [
        'Case_Organization_Case_ID', 'Case_Organization_Spark_Title', 'Case_Organization_Reveal_Title',
        'Case_Organization_Pathway_or_Course_Name', 'Case_Organization_Difficulty_Level', 'Case_Organization_Medical_Category',
        'Patient_Demographics_and_Clinical_Data_Age', 'Patient_Demographics_and_Clinical_Data_Gender',
        'Patient_Demographics_and_Clinical_Data_Presenting_Complaint', 'Patient_Demographics_and_Clinical_Data_Past_Medical_History',
        'Patient_Demographics_and_Clinical_Data_Exam_Positive_Findings', 'Monitor_Vital_Signs_Initial_Vitals',
        'Scenario_Progression_States_Decision_Nodes_JSON', 'Set_the_Stage_Context_Case_Summary_Concise',
        'CME_and_Educational_Content_CME_Learning_Objective', 'Set_the_Stage_Context_Educational_Goal',
        'Set_the_Stage_Context_Why_It_Matters', 'Developer_and_QA_Metadata_Simulation_Quality_Score',
        'Case_Organization_Original_Title', 'Set_the_Stage_Context_Environment_Type',
        'Set_the_Stage_Context_Environment_Description_for_AI_Image', 'Situation_and_Environment_Details_Triage_or_SBAR_Note',
        'Situation_and_Environment_Details_Disposition_Plan', 'Scenario_Progression_States_Branching_Notes',
        'Staff_and_AI_Interaction_Config_Patient_Script', 'Monitor_Vital_Signs_State1_Vitals',
        'Monitor_Vital_Signs_State2_Vitals', 'Monitor_Vital_Signs_State3_Vitals',
        'Monitor_Vital_Signs_State4_Vitals', 'Monitor_Vital_Signs_State5_Vitals',
        'Monitor_Vital_Signs_Vitals_Format', 'Developer_and_QA_Metadata_AI_Reflection_and_Suggestions',
        'Version_and_Attribution_Full_Attribution_Details', 'Case_Organization_Pre_Sim_Overview',
        'Case_Organization_Post_Sim_Overview'
      ];
      docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(selectedFields));
      addLog('   ✅ Initialized 35 defaults');
    }

    // STEP 3: Get AI recommendations (exclude already selected)
    addLog('   Step 3: Getting AI recommendations...');
    var cachedRecs = docProps.getProperty('AI_RECOMMENDED_FIELDS');
    var recommendedFields = [];

    if (cachedRecs) {
      try {
        var parsed = JSON.parse(cachedRecs);
        recommendedFields = parsed.filter(function(item) {
          var fieldName = typeof item === 'string' ? item : item.name;
          return selectedFields.indexOf(fieldName) === -1;
        });
        addLog('   ✅ Got ' + recommendedFields.length + ' AI recommendations');
      } catch (e) {
        addLog('   ⚠️ Could not parse recommendations');
      }
    } else {
      addLog('   ⚠️ No AI recommendations cached');
    }

    // STEP 4: Get "Other" fields (exclude selected and recommended)
    addLog('   Step 4: Calculating other fields...');
    var recommendedNames = recommendedFields.map(function(item) {
      return typeof item === 'string' ? item : item.name;
    });

    var otherFields = allFields.filter(function(field) {
      return selectedFields.indexOf(field) === -1 &&
             recommendedNames.indexOf(field) === -1;
    });

    addLog('   ✅ Got ' + otherFields.length + ' other fields');
    addLog('✅ COMPLETE! 3 sections ready');

    return {
      selected: selectedFields,
      recommended: recommendedFields,
      other: otherFields,
      logs: logs
    };

  } catch (error) {
    addLog('❌ ERROR: ' + error.toString());
    return {
      error: error.toString(),
      logs: logs,
      selected: [],
      recommended: [],
      other: []
    };
  }
}`;

    code = code.substring(0, funcStart) + simpleFunction + code.substring(funcEnd);

    console.log('✅ Replaced with 3-section version\n');

    // Also update Step 2.75 to store data in same format
    console.log('🔧 Updating Step 2.75 to match...\n');

    const step275 = code.indexOf('// STEP 2.75: Pre-populate field selector data structure');
    if (step275 !== -1) {
      const step275End = code.indexOf('} catch (prePopErr)', step275);

      const newStep275 = `// STEP 2.75: Pre-populate field selector data (3 sections)
    Logger.log('📋 Step 2.75: Pre-populating 3 sections...');
    try {
      var cachedHeader2 = docProps.getProperty('CACHED_HEADER2');
      if (cachedHeader2) {
        var header2Data = JSON.parse(cachedHeader2);
        var allFields = Object.keys(header2Data);
        var currentSelection = savedSelection ? JSON.parse(savedSelection) : defaultFields;

        // Get AI recommendations
        var cachedAIRecs = docProps.getProperty('AI_RECOMMENDED_FIELDS');
        var aiRecommendations = [];
        if (cachedAIRecs) {
          try {
            var parsed = JSON.parse(cachedAIRecs);
            aiRecommendations = parsed.filter(function(item) {
              var fn = typeof item === 'string' ? item : item.name;
              return currentSelection.indexOf(fn) === -1;
            });
          } catch(e) {}
        }

        // Get other fields
        var recommendedNames = aiRecommendations.map(function(item) {
          return typeof item === 'string' ? item : item.name;
        });
        var otherFields = allFields.filter(function(field) {
          return currentSelection.indexOf(field) === -1 &&
                 recommendedNames.indexOf(field) === -1;
        });

        var fieldSelectorData = {
          selected: currentSelection,
          recommended: aiRecommendations,
          other: otherFields,
          timestamp: new Date().toISOString()
        };

        docProps.setProperty('FIELD_SELECTOR_DATA', JSON.stringify(fieldSelectorData));
        Logger.log('✅ Step 2.75: Pre-populated 3 sections (' + currentSelection.length + ' selected, ' +
                   aiRecommendations.length + ' recommended, ' + otherFields.length + ' other)');
      }
    `;

      code = code.substring(0, step275) + newStep275 + code.substring(step275End);
      console.log('✅ Updated Step 2.75\n');
    }

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
    console.log('✅ 3 SIMPLE FLAT SECTIONS (NO CATEGORIES)!\n');
    console.log('\nThe field selector now shows:\n');
    console.log('  📌 Section 1: Default (35 or last saved) - pre-checked');
    console.log('  💡 Section 2: Recommended to consider (AI suggestions)');
    console.log('  📋 Section 3: Other (all remaining fields)\n');
    console.log('NO category grouping - just 3 flat lists!\n');
    console.log('Try it now:\n');
    console.log('  1. Refresh Sheet (F5)');
    console.log('  2. Click 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('  3. Click cache button → Should show 3 sections!\n');
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
