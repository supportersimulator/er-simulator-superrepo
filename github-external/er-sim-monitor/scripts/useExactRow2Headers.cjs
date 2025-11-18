#!/usr/bin/env node

/**
 * USE EXACT ROW 2 HEADERS
 * Use the exact 27 field names from the actual Row 2 headers
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

    console.log('🔧 Replacing with exact Row 2 header names...\n');

    // These are the exact 27 most important fields from the actual Row 2 headers
    const exact27Defaults = [
      'Case_Organization_Case_ID',
      'Case_Organization_Spark_Title',
      'Case_Organization_Reveal_Title',
      'Case_Organization_Pathway_or_Course_Name',
      'Case_Organization_Difficulty_Level',
      'Case_Organization_Medical_Category',
      'Patient_Demographics_and_Clinical_Data_Age',
      'Patient_Demographics_and_Clinical_Data_Gender',
      'Patient_Demographics_and_Clinical_Data_Presenting_Complaint',
      'Monitor_Vital_Signs_Initial_Vitals',
      'Monitor_Vital_Signs_State1_Vitals',
      'Monitor_Vital_Signs_State2_Vitals',
      'Monitor_Vital_Signs_State3_Vitals',
      'Monitor_Vital_Signs_State4_Vitals',
      'Monitor_Vital_Signs_State5_Vitals',
      'Clinical_Assessment_Primary_Diagnosis',
      'Clinical_Assessment_Key_Clinical_Features',
      'Clinical_Assessment_Differential_Diagnosis',
      'Scoring_Criteria_Critical_Action_Checklist',
      'Case_Debrief_Time_Sensitive_Factors',
      'CME_and_Educational_Content_CME_Learning_Objective',
      'Case_Debrief_Key_Teaching_Points',
      'Case_Debrief_Common_Pitfalls_Discussion',
      'Scoring_Criteria_Performance_Benchmarks',
      'Case_Organization_Pre_Sim_Overview',
      'Case_Organization_Post_Sim_Overview',
      'Version_and_Attribution_Full_Attribution_Details'
    ];

    // Find the selectedFields array assignment
    const arrayStart = code.indexOf('// Use');

    if (arrayStart === -1) {
      console.log('❌ Could not find defaults section\n');
      return;
    }

    const arrayAssignStart = code.indexOf('selectedFields = [', arrayStart);
    const arrayEnd = code.indexOf('];', arrayAssignStart) + 2;

    // Format the array with proper indentation
    const formattedDefaults = exact27Defaults.map(name => `        '${name}'`).join(',\n');

    const newCode = `// Use exact Row 2 header field names (27 most important fields)
      selectedFields = [
${formattedDefaults}
      ];

      addLog('      ✅ Loaded ' + selectedFields.length + ' default fields');

      `;

    code = code.substring(0, arrayAssignStart) + newCode + code.substring(arrayEnd);

    console.log('✅ Replaced with exact Row 2 header names\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ USING EXACT ROW 2 HEADER NAMES!\n');
    console.log('\nDefaults now match exact field names from spreadsheet:\n');
    exact27Defaults.slice(0, 10).forEach(name => console.log(`  • ${name}`));
    console.log(`  ... and ${exact27Defaults.length - 10} more\n`);
    console.log('Try "Categories & Pathways" - all 27 fields should display!\n');
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
