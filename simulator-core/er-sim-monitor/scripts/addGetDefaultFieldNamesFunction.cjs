#!/usr/bin/env node

/**
 * ADD MISSING getDefaultFieldNames_() FUNCTION
 * Returns the default 27 fields for cache system
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 ADDING getDefaultFieldNames_() FUNCTION\n');
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

async function addFunction() {
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

    console.log('🔍 Issue: loadFieldSelection() calls getDefaultFieldNames_() but it\'s missing\n');

    if (code.includes('function getDefaultFieldNames_')) {
      console.log('✅ Function already exists\n');
      return;
    }

    console.log('🔧 Adding getDefaultFieldNames_() with 27 default cache fields...\n');

    const getDefaultFieldNamesFunction = `
/**
 * Get default 27 field names for cache system
 * These are the core fields needed for pathway analysis
 */
function getDefaultFieldNames_() {
  return [
    // Core Identification (3)
    'Case_Organization_Case_ID',
    'Case_Organization_Spark_Title',
    'Case_Organization_Reveal_Title',

    // Pathway & Metadata (4)
    'Case_Organization_Pathway_or_Course_Name',
    'Case_Organization_Difficulty_Level',
    'Case_Organization_Category',
    'Case_Orientation_Chief_Diagnosis',

    // Patient Demographics (5)
    'Case_Patient_Demographics_Age',
    'Case_Patient_Demographics_Gender',
    'Case_Patient_Demographics_Chief_Complaint',
    'Case_Patient_Demographics_Presenting_Symptoms',
    'Case_Patient_Demographics_Medical_History',

    // Vitals (6)
    'Monitor_Vital_Signs_Initial_Vitals',
    'Monitor_Vital_Signs_State1_Vitals',
    'Monitor_Vital_Signs_State2_Vitals',
    'Monitor_Vital_Signs_State3_Vitals',
    'Monitor_Vital_Signs_State4_Vitals',
    'Monitor_Vital_Signs_Final_Vitals',

    // Clinical Assessment (4)
    'Case_Orientation_Key_Clinical_Features',
    'Case_Orientation_Differential_Diagnosis',
    'Case_Orientation_Critical_Actions',
    'Case_Orientation_Time_Sensitive_Factors',

    // Learning Objectives (3)
    'Case_Orientation_Actual_Learning_Outcomes',
    'Case_Orientation_Teaching_Points',
    'Case_Orientation_Common_Pitfalls',

    // Scoring (2)
    'Scoring_Criteria_Performance_Benchmarks',
    'Scoring_Criteria_Debrief_Focus_Areas'
  ];
}
`;

    // Find loadFieldSelection and insert before it
    const loadFieldSelectionMatch = code.match(/\/\*\*\n \* Load saved field selection/);
    if (loadFieldSelectionMatch) {
      const insertPos = loadFieldSelectionMatch.index;
      code = code.slice(0, insertPos) + getDefaultFieldNamesFunction + '\n' + code.slice(insertPos);
      console.log('✅ Added getDefaultFieldNames_() before loadFieldSelection()\n');
    } else {
      // Fallback: insert before showFieldSelector
      const showFieldSelectorMatch = code.match(/\/\*\*\n \* Show dynamic field selector modal/);
      if (showFieldSelectorMatch) {
        const insertPos = showFieldSelectorMatch.index;
        code = code.slice(0, insertPos) + getDefaultFieldNamesFunction + '\n' + code.slice(insertPos);
        console.log('✅ Added getDefaultFieldNames_() before showFieldSelector()\n');
      }
    }

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-default-fields-2025-11-06.gs');
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
    console.log('🎉 DEFAULT FIELDS FUNCTION ADDED!\n');
    console.log('Returns 27 core fields:\n');
    console.log('   ✅ 3 Core Identification fields');
    console.log('   ✅ 4 Pathway & Metadata fields');
    console.log('   ✅ 5 Patient Demographics fields');
    console.log('   ✅ 6 Vitals fields (Initial → Final)');
    console.log('   ✅ 4 Clinical Assessment fields');
    console.log('   ✅ 3 Learning Objectives fields');
    console.log('   ✅ 2 Scoring fields\n');
    console.log('Now when you click "Pre-Cache Rich Data":\n');
    console.log('   1. refreshHeaders() caches Row 2 headers');
    console.log('   2. getAvailableFields() reads cached headers');
    console.log('   3. loadFieldSelection() loads saved OR returns these 27 defaults');
    console.log('   4. getRecommendedFields_() calls ChatGPT for suggestions');
    console.log('   5. Field selector modal opens with 3 sections!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

addFunction();
