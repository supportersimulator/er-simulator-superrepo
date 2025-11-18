#!/usr/bin/env node

/**
 * INLINE LOAD FIELD SELECTION
 * Put the logic directly in getFieldSelectorData() so we can see the logs
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

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Inlining field selection logic with detailed logging...\n');

    // Replace getFieldSelectorData
    const funcStart = code.indexOf('function getFieldSelectorData()');
    let braceCount = 0;
    let inFunction = false;
    let funcEnd = funcStart;

    for (let i = funcStart; i < code.length; i++) {
      if (code[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (code[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          funcEnd = i + 1;
          break;
        }
      }
    }

    const newFunction = `function getFieldSelectorData() {
  var logs = [];
  function addLog(msg) {
    logs.push(msg);
    Logger.log(msg);
  }

  try {
    addLog('🔍 getFieldSelectorData() START');

    addLog('   Step 1: Calling refreshHeaders()');
    refreshHeaders();
    addLog('   ✅ Step 1 complete');

    addLog('   Step 2: Calling getAvailableFields()');
    var availableFields = getAvailableFields();
    addLog('   ✅ Step 2 complete: ' + availableFields.length + ' fields');

    addLog('   Step 3: Loading field selection (inlined)');
    var selectedFields = [];

    var docProps = PropertiesService.getDocumentProperties();
    var saved = docProps.getProperty('SELECTED_CACHE_FIELDS');

    addLog('      Checking for saved selection...');
    if (saved) {
      addLog('      Found saved selection, parsing...');
      try {
        selectedFields = JSON.parse(saved);
        addLog('      ✅ Loaded ' + selectedFields.length + ' saved fields');
      } catch (e) {
        addLog('      ⚠️ Error parsing: ' + e.message);
      }
    } else {
      addLog('      No saved selection, loading defaults...');

      // Inline the 27 default fields
      selectedFields = [
        'Case_Organization_Case_ID',
        'Case_Organization_Spark_Title',
        'Case_Organization_Reveal_Title',
        'Case_Organization_Pathway_or_Course_Name',
        'Case_Organization_Difficulty_Level',
        'Case_Organization_Medical_Category',
        'Case_Patient_Demographics_Age',
        'Case_Patient_Demographics_Gender',
        'Case_Patient_Demographics_Chief_Complaint',
        'Monitor_Vital_Signs_Initial_Vitals',
        'Monitor_Vital_Signs_State1_Vitals',
        'Monitor_Vital_Signs_State2_Vitals',
        'Monitor_Vital_Signs_State3_Vitals',
        'Monitor_Vital_Signs_State4_Vitals',
        'Monitor_Vital_Signs_Final_Vitals',
        'Case_Orientation_Chief_Diagnosis',
        'Case_Orientation_Key_Clinical_Features',
        'Case_Orientation_Differential_Diagnosis',
        'Case_Orientation_Critical_Actions',
        'Case_Orientation_Time_Sensitive_Factors',
        'Case_Orientation_Actual_Learning_Outcomes',
        'Case_Orientation_Teaching_Points',
        'Case_Orientation_Common_Pitfalls',
        'Scoring_Criteria_Performance_Benchmarks',
        'Case_Organization_Pre_Sim_Overview',
        'Case_Organization_Post_Sim_Overview',
        'Version_and_Attribution_Full_Attribution_Details'
      ];

      addLog('      ✅ Loaded ' + selectedFields.length + ' default fields');
    }

    addLog('   ✅ Step 3 complete: ' + selectedFields.length + ' selected');

    addLog('   Step 4: Calling getStaticRecommendedFields()');
    var recommendedFields = getStaticRecommendedFields(availableFields, selectedFields);
    addLog('   ✅ Step 4 complete: ' + recommendedFields.length + ' recommended');

    addLog('   Step 5: Grouping by category');
    var grouped = {};
    for (var i = 0; i < availableFields.length; i++) {
      var field = availableFields[i];
      var category = field.tier1;
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(field);
    }
    addLog('   ✅ Step 5 complete: ' + Object.keys(grouped).length + ' categories');

    addLog('   Step 6: Building return object');
    var result = {
      grouped: grouped,
      selected: selectedFields,
      recommended: recommendedFields,
      logs: logs
    };
    addLog('   ✅ Step 6 complete');

    addLog('🎉 getFieldSelectorData() RETURNING SUCCESSFULLY');
    return result;

  } catch (error) {
    addLog('❌ ERROR: ' + error.toString());
    addLog('   Stack: ' + error.stack);
    return {
      grouped: {},
      selected: [],
      recommended: [],
      logs: logs,
      error: error.toString()
    };
  }
}`;

    code = code.substring(0, funcStart) + newFunction + code.substring(funcEnd);

    console.log('✅ Inlined field selection logic\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 INLINED FIELD SELECTION WITH LOGGING\n');
    console.log('Now the 27 default fields are hardcoded directly in the function.\n');
    console.log('The logs will show exactly what is happening!\n');
    console.log('Try "Pre-Cache Rich Data" - should show 27 selected fields!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

fix();
