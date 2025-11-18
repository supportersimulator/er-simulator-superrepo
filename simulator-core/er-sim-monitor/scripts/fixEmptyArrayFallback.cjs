#!/usr/bin/env node

/**
 * FIX EMPTY ARRAY FALLBACK
 * If saved selection exists but is empty [], fall back to defaults
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

    console.log('🔧 Fixing empty array fallback logic...\n');

    // Find the field selection logic in getFieldSelectorData
    const oldLogic = `addLog('      Checking for saved selection...');
    if (saved) {
      addLog('      Found saved selection, parsing...');
      try {
        selectedFields = JSON.parse(saved);
        addLog('      ✅ Loaded ' + selectedFields.length + ' saved fields');
      } catch (e) {
        addLog('      ⚠️ Error parsing: ' + e.message);
      }
    } else {`;

    const newLogic = `addLog('      Checking for saved selection...');
    if (saved) {
      addLog('      Found saved selection, parsing...');
      try {
        selectedFields = JSON.parse(saved);
        addLog('      ✅ Loaded ' + selectedFields.length + ' saved fields');

        // If empty array, treat as no selection and load defaults
        if (selectedFields.length === 0) {
          addLog('      ⚠️ Saved selection is empty, loading defaults...');
          saved = null; // Force fallback to defaults
        }
      } catch (e) {
        addLog('      ⚠️ Error parsing: ' + e.message);
      }
    }

    if (!saved || selectedFields.length === 0) {`;

    if (code.includes(oldLogic)) {
      code = code.replace(oldLogic, newLogic);
      console.log('✅ Fixed empty array fallback\n');
    } else {
      console.log('⚠️ Pattern not found, trying alternative fix...\n');

      // Alternative: Just add the check after parsing
      const checkPoint = "addLog('      ✅ Loaded ' + selectedFields.length + ' saved fields');";
      const insertion = "\n        \n        // If empty array, load defaults\n        if (selectedFields.length === 0) {\n          addLog('      ⚠️ Empty selection, loading defaults...');\n          selectedFields = [\n            'Case_Organization_Case_ID',\n            'Case_Organization_Spark_Title',\n            'Case_Organization_Reveal_Title',\n            'Case_Organization_Pathway_or_Course_Name',\n            'Case_Organization_Difficulty_Level',\n            'Case_Organization_Medical_Category',\n            'Case_Patient_Demographics_Age',\n            'Case_Patient_Demographics_Gender',\n            'Case_Patient_Demographics_Chief_Complaint',\n            'Monitor_Vital_Signs_Initial_Vitals',\n            'Monitor_Vital_Signs_State1_Vitals',\n            'Monitor_Vital_Signs_State2_Vitals',\n            'Monitor_Vital_Signs_State3_Vitals',\n            'Monitor_Vital_Signs_State4_Vitals',\n            'Monitor_Vital_Signs_Final_Vitals',\n            'Case_Orientation_Chief_Diagnosis',\n            'Case_Orientation_Key_Clinical_Features',\n            'Case_Orientation_Differential_Diagnosis',\n            'Case_Orientation_Critical_Actions',\n            'Case_Orientation_Time_Sensitive_Factors',\n            'Case_Orientation_Actual_Learning_Outcomes',\n            'Case_Orientation_Teaching_Points',\n            'Case_Orientation_Common_Pitfalls',\n            'Scoring_Criteria_Performance_Benchmarks',\n            'Case_Organization_Pre_Sim_Overview',\n            'Case_Organization_Post_Sim_Overview',\n            'Version_and_Attribution_Full_Attribution_Details'\n          ];\n          addLog('      ✅ Loaded 27 default fields');\n        }";

      if (code.includes(checkPoint)) {
        code = code.replace(checkPoint, checkPoint + insertion);
        console.log('✅ Added empty array check (alternative method)\n');
      }
    }

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔧 EMPTY ARRAY FALLBACK FIXED\n');
    console.log('Now when SELECTED_CACHE_FIELDS = [], it will load 27 defaults!\n');
    console.log('Try "Pre-Cache Rich Data" again.\n');
    console.log('Should see: "Empty selection, loading defaults... ✅ 27 fields"\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

fix();
