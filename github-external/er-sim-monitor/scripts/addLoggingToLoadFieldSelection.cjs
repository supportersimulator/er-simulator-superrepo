#!/usr/bin/env node

/**
 * ADD LOGGING TO LOAD FIELD SELECTION
 * See exactly what's happening when loading defaults
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

    console.log('🔧 Adding detailed logging to loadFieldSelection...\n');

    // Find and replace loadFieldSelection
    const funcStart = code.indexOf('function loadFieldSelection()');
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

    const newFunction = `function loadFieldSelection() {
  Logger.log('📋 loadFieldSelection() called');

  const docProps = PropertiesService.getDocumentProperties();
  const saved = docProps.getProperty('SELECTED_CACHE_FIELDS');

  Logger.log('   Checking for saved selection: ' + (saved ? 'FOUND' : 'NOT FOUND'));

  if (saved) {
    try {
      var parsed = JSON.parse(saved);
      Logger.log('   ✅ Loaded ' + parsed.length + ' saved fields');
      return parsed;
    } catch (e) {
      Logger.log('   ⚠️ Error parsing saved field selection: ' + e.message);
    }
  }

  // Return default 27 fields
  Logger.log('   Loading defaults via getDefaultFieldNames()');

  try {
    var defaults = getDefaultFieldNames();
    Logger.log('   ✅ getDefaultFieldNames() returned ' + (defaults ? defaults.length : 0) + ' fields');
    return defaults;
  } catch (e) {
    Logger.log('   ❌ ERROR calling getDefaultFieldNames(): ' + e.message);
    return [];
  }
}`;

    code = code.substring(0, funcStart) + newFunction + code.substring(funcEnd);

    console.log('✅ Added logging to loadFieldSelection()\n');

    // Also add logging to getDefaultFieldNames
    const defaultsStart = code.indexOf('function getDefaultFieldNames()');
    if (defaultsStart !== -1) {
      braceCount = 0;
      inFunction = false;
      let defaultsEnd = defaultsStart;

      for (let i = defaultsStart; i < code.length; i++) {
        if (code[i] === '{') {
          braceCount++;
          inFunction = true;
        } else if (code[i] === '}') {
          braceCount--;
          if (inFunction && braceCount === 0) {
            defaultsEnd = i + 1;
            break;
          }
        }
      }

      const newDefaults = `function getDefaultFieldNames() {
  Logger.log('📝 getDefaultFieldNames() called');

  var fields = [
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

  Logger.log('   ✅ Returning ' + fields.length + ' default fields');
  return fields;
}`;

      code = code.substring(0, defaultsStart) + newDefaults + code.substring(defaultsEnd);
      console.log('✅ Added logging to getDefaultFieldNames()\n');
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
    console.log('🔍 DETAILED LOGGING ADDED\n');
    console.log('The live logs will now show:\n');
    console.log('  • When loadFieldSelection() is called\n');
    console.log('  • Whether saved selection exists\n');
    console.log('  • When getDefaultFieldNames() is called\n');
    console.log('  • How many fields it returns\n');
    console.log('Try "Pre-Cache Rich Data" to see what is happening!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

fix();
