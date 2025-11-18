#!/usr/bin/env node

/**
 * PRE-POPULATE FIELD SELECTOR IN BACKGROUND
 *
 * Problem: Field selector tries to load data AFTER modal opens (stuck on "Loading...")
 * Solution: Pre-compute ALL field selector data during runPathwayChainBuilder()
 * so the modal can open INSTANTLY with all 3 sections already prepared.
 *
 * This moves ALL the heavy processing to the background initialization.
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

    console.log('🔧 Adding field selector pre-population to Step 2.5...\n');

    // Find Step 2.5 in runPathwayChainBuilder
    const step25Start = code.indexOf("Logger.log('💡 Step 2.5: Pre-fetching AI recommendations...');");

    if (step25Start === -1) {
      console.log('❌ Could not find Step 2.5\n');
      process.exit(1);
    }

    // Find the end of Step 2.5 (before Step 3)
    const step3Start = code.indexOf('const analysis = getOrCreateHolisticAnalysis_();', step25Start);

    if (step3Start === -1) {
      console.log('❌ Could not find Step 3 start\n');
      process.exit(1);
    }

    // Insert new Step 2.75: Pre-populate field selector data
    const newStep = `

    // STEP 2.75: Pre-populate field selector data structure
    Logger.log('📋 Step 2.75: Pre-populating field selector data...');
    try {
      // Get all available fields from cached headers
      var cachedHeader2 = docProps.getProperty('CACHED_HEADER2');
      if (cachedHeader2) {
        var header2Data = JSON.parse(cachedHeader2);
        var availableFields = [];

        for (var fieldName in header2Data) {
          if (header2Data.hasOwnProperty(fieldName)) {
            availableFields.push({
              name: fieldName,
              index: header2Data[fieldName]
            });
          }
        }

        // Get selected fields (either saved or 35 defaults)
        var currentSelection = savedSelection ? JSON.parse(savedSelection) : defaultFields;

        // Get AI recommendations if cached
        var cachedAIRecs = docProps.getProperty('AI_RECOMMENDED_FIELDS');
        var aiRecommendations = [];
        if (cachedAIRecs) {
          try {
            var parsed = JSON.parse(cachedAIRecs);
            aiRecommendations = parsed.filter(function(item) {
              var fieldName = typeof item === 'string' ? item : item.name;
              return currentSelection.indexOf(fieldName) === -1;
            });
          } catch (e) {
            Logger.log('⚠️ Could not parse AI recommendations');
          }
        }

        // Group ALL fields by category
        var groupedFields = {};
        availableFields.forEach(function(field) {
          var parts = field.name.split('_');
          var category = parts.length > 1 ? parts.slice(0, -1).join('_').replace(/_/g, ' ') : 'Other';

          if (!groupedFields[category]) {
            groupedFields[category] = [];
          }

          groupedFields[category].push(field.name);
        });

        // Cache the complete field selector data structure
        var fieldSelectorData = {
          grouped: groupedFields,
          selected: currentSelection,
          recommended: aiRecommendations,
          totalFields: availableFields.length,
          timestamp: new Date().toISOString()
        };

        docProps.setProperty('FIELD_SELECTOR_DATA', JSON.stringify(fieldSelectorData));

        Logger.log('✅ Step 2.75 complete: Pre-populated field selector data');
        Logger.log('   - ' + Object.keys(groupedFields).length + ' categories');
        Logger.log('   - ' + currentSelection.length + ' selected fields');
        Logger.log('   - ' + aiRecommendations.length + ' AI recommendations');
        Logger.log('   - ' + availableFields.length + ' total fields');
      } else {
        Logger.log('⚠️ Headers not cached yet - field selector data will load on demand');
      }
    } catch (prePopErr) {
      Logger.log('⚠️ Field selector pre-population failed: ' + prePopErr.toString());
    }

`;

    // Insert before Step 3
    code = code.substring(0, step3Start) + newStep + '    ' + code.substring(step3Start);

    console.log('✅ Added Step 2.75\n');

    console.log('🔧 Updating getFieldSelectorData() to use pre-populated data...\n');

    // Now make getFieldSelectorData() super simple - just read the cache
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
    addLog('   Reading PRE-POPULATED data from Step 2.75');

    var docProps = PropertiesService.getDocumentProperties();

    // Try to get pre-populated data first
    var prePopulated = docProps.getProperty('FIELD_SELECTOR_DATA');

    if (prePopulated) {
      addLog('   ✅ Using pre-populated data from background');
      var data = JSON.parse(prePopulated);
      data.logs = logs;
      addLog('   ✅ Complete! (' + data.totalFields + ' fields, ' + Object.keys(data.grouped).length + ' categories)');
      return data;
    }

    // Fallback: If no pre-populated data, generate it now
    addLog('   ⚠️ No pre-populated data - generating now...');
    addLog('   Step 1: Getting cached headers...');

    var cachedHeader2 = docProps.getProperty('CACHED_HEADER2');
    if (!cachedHeader2) {
      addLog('   ⚠️ Headers not cached - initializing...');
      refreshHeaders();
      cachedHeader2 = docProps.getProperty('CACHED_HEADER2');
    }

    var header2Data = JSON.parse(cachedHeader2);
    var availableFields = [];

    for (var fieldName in header2Data) {
      if (header2Data.hasOwnProperty(fieldName)) {
        availableFields.push({ name: fieldName, index: header2Data[fieldName] });
      }
    }

    addLog('   ✅ Got ' + availableFields.length + ' fields');

    // Get selected fields
    var savedSelection = docProps.getProperty('SELECTED_CACHE_FIELDS');
    var selectedFields;

    if (savedSelection) {
      selectedFields = JSON.parse(savedSelection);
      addLog('   ✅ Got ' + selectedFields.length + ' saved fields');
    } else {
      addLog('   ⚠️ Initializing 35 defaults...');
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

    // Get AI recommendations
    var recommendedFields = [];
    var cachedRecs = docProps.getProperty('AI_RECOMMENDED_FIELDS');
    if (cachedRecs) {
      try {
        var parsed = JSON.parse(cachedRecs);
        recommendedFields = parsed.filter(function(item) {
          var fn = typeof item === 'string' ? item : item.name;
          return selectedFields.indexOf(fn) === -1;
        });
      } catch(e) {}
    }

    // Group fields by category
    var grouped = {};
    availableFields.forEach(function(field) {
      var parts = field.name.split('_');
      var category = parts.length > 1 ? parts.slice(0, -1).join('_').replace(/_/g, ' ') : 'Other';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(field.name);
    });

    addLog('   ✅ Grouped into ' + Object.keys(grouped).length + ' categories');

    return {
      grouped: grouped,
      selected: selectedFields,
      recommended: recommendedFields,
      logs: logs
    };

  } catch (error) {
    addLog('❌ ERROR: ' + error.toString());
    return {
      error: error.toString(),
      logs: logs,
      grouped: {},
      selected: [],
      recommended: []
    };
  }
}`;

    code = code.substring(0, funcStart) + simpleFunction + code.substring(funcEnd);

    console.log('✅ Simplified getFieldSelectorData()\n');

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
    console.log('✅ FIELD SELECTOR NOW PRE-POPULATES IN BACKGROUND!\n');
    console.log('\nHow it works now:\n');
    console.log('  1. Click "Categories & Pathways" menu');
    console.log('     → Step 1: Headers cache (642 fields)');
    console.log('     → Step 2: 35 defaults initialize');
    console.log('     → Step 2.5: AI recommendations pre-fetch');
    console.log('     → Step 2.75: Field selector data structure pre-built ✨');
    console.log('     → Pathway UI opens\n');
    console.log('  2. Click cache button');
    console.log('     → Modal opens INSTANTLY');
    console.log('     → Reads pre-built data from cache');
    console.log('     → Shows 3 sections immediately:\n');
    console.log('       ✅ Section 1: 35 selected defaults (pre-checked)');
    console.log('       ✅ Section 2: AI recommendations');
    console.log('       ✅ Section 3: All other fields by category\n');
    console.log('Try it now:\n');
    console.log('  1. Refresh Google Sheet (F5)');
    console.log('  2. Click 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('  3. Wait 2-3 seconds (background pre-population)');
    console.log('  4. Click cache button → Should load INSTANTLY!\n');
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
