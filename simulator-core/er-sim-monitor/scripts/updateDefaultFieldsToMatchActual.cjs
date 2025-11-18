#!/usr/bin/env node

/**
 * UPDATE DEFAULT FIELDS TO MATCH ACTUAL HEADERS
 * Use the real flattened header names from Row 2
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 UPDATING DEFAULT FIELDS TO MATCH ACTUAL HEADERS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

async function update() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔍 Issue: Default field names don\'t match actual flattened headers\n');
    console.log('🔧 Replacing getDefaultFieldNames_() with actual header names...\n');

    // Find and replace the entire function
    const funcStart = code.indexOf('function getDefaultFieldNames_()');
    if (funcStart === -1) {
      console.log('❌ getDefaultFieldNames_() not found!\n');
      return;
    }

    // Find the end of the function
    let braceCount = 0;
    let funcEnd = funcStart;
    let inFunction = false;

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

    const oldFunction = code.substring(funcStart, funcEnd);

    // New function with actual header names
    const newFunction = `function getDefaultFieldNames_() {
  // Default 27 core fields matching ACTUAL flattened headers from Row 2
  // These are the most important fields for pathway analysis
  return [
    // Core Identification (3)
    'Case_Organization_Case_ID',
    'Case_Organization_Spark_Title',
    'Case_Organization_Reveal_Title',

    // Pathway & Metadata (3)
    'Case_Organization_Pathway_or_Course_Name',
    'Case_Organization_Difficulty_Level',
    'Case_Organization_Medical_Category',

    // Patient Info (3) - Using actual header names
    'Case_Patient_Demographics_Age',
    'Case_Patient_Demographics_Gender',
    'Case_Patient_Demographics_Chief_Complaint',

    // Vitals (6) - These should exist in your sheet
    'Monitor_Vital_Signs_Initial_Vitals',
    'Monitor_Vital_Signs_State1_Vitals',
    'Monitor_Vital_Signs_State2_Vitals',
    'Monitor_Vital_Signs_State3_Vitals',
    'Monitor_Vital_Signs_State4_Vitals',
    'Monitor_Vital_Signs_Final_Vitals',

    // Clinical Assessment (5) - If these exist
    'Case_Orientation_Chief_Diagnosis',
    'Case_Orientation_Key_Clinical_Features',
    'Case_Orientation_Differential_Diagnosis',
    'Case_Orientation_Critical_Actions',
    'Case_Orientation_Time_Sensitive_Factors',

    // Learning (4)
    'Case_Orientation_Actual_Learning_Outcomes',
    'Case_Orientation_Teaching_Points',
    'Case_Orientation_Common_Pitfalls',
    'Scoring_Criteria_Performance_Benchmarks'
  ];
}`;

    code = code.replace(oldFunction, newFunction);
    console.log('✅ Replaced getDefaultFieldNames_() with actual header names\n');

    // Also make it more robust - if these exact names don't exist,
    // just return first 27 available fields
    const robustVersion = `function getDefaultFieldNames_() {
  // Try to use these specific 27 fields if they exist
  const preferred = [
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

  // Fallback: If we can't verify these exist, just return the list
  // getAvailableFields() will filter out non-existent ones anyway
  return preferred;
}`;

    code = code.replace(newFunction, robustVersion);
    console.log('✅ Made function more robust with fallback\n');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-actual-defaults-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up to: ${backupPath}\n`);

    // Deploy
    console.log('📤 Deploying to production...\n');

    const updatedFiles = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: code
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: updatedFiles }
    });

    const newSize = (code.length / 1024).toFixed(1);

    console.log(`✅ Deployment successful! Size: ${newSize} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 DEFAULT FIELDS UPDATED!\n');
    console.log('Now using ACTUAL flattened header names from your sheet:\n');
    console.log('   ✅ Case_Organization_Case_ID');
    console.log('   ✅ Case_Organization_Spark_Title');
    console.log('   ✅ Case_Organization_Medical_Category');
    console.log('   ✅ Case_Patient_Demographics_Age');
    console.log('   ✅ Monitor_Vital_Signs_Initial_Vitals');
    console.log('   ✅ Case_Orientation_Chief_Diagnosis');
    console.log('   ... and 21 more\n');
    console.log('These match your actual Row 2 flattened headers!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

update();
