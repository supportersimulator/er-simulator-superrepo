#!/usr/bin/env node

/**
 * MAKE DYNAMIC DEFAULTS (FIXED)
 * Replace the hardcoded field array with pattern-based selection
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

async function makeDynamic() {
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

    console.log('🔧 Replacing hardcoded defaults with dynamic selection...\n');

    // Find the specific hardcoded array we want to replace
    // Look for the comment before it
    const beforeMarker = "addLog('      No saved selection, loading defaults...');";
    const markerIndex = code.indexOf(beforeMarker);

    if (markerIndex === -1) {
      console.log('❌ Could not find marker for defaults section\n');
      return;
    }

    // Find the start of the array assignment after this marker
    const arrayStart = code.indexOf("// Inline the 27 default fields", markerIndex);
    const arrayAssignStart = code.indexOf("selectedFields = [", arrayStart);

    // Find the end of this array (look for the closing bracket and semicolon)
    const arrayEnd = code.indexOf("'Scoring_Criteria_Performance_Benchmarks'", arrayAssignStart);
    const arrayClosing = code.indexOf("];", arrayEnd) + 2;

    console.log('Found hardcoded array at position:', arrayAssignStart);
    console.log('Array ends at position:', arrayClosing);

    // The new dynamic code that replaces the hardcoded array
    // Based on the original 27 default field names
    const newDynamicCode = `// Dynamically select ~27 most important fields from available fields
      var priorityPatterns = [
        'Case_ID',
        'Spark_Title',
        'Reveal_Title',
        'Pathway',
        'Difficulty',
        'Medical_Category',
        'Age',
        'Gender',
        'Chief_Complaint',
        'Initial_Vitals',
        'State1_Vitals',
        'State2_Vitals',
        'State3_Vitals',
        'State4_Vitals',
        'Final_Vitals',
        'Diagnosis',
        'Clinical_Features',
        'Differential',
        'Critical_Actions',
        'Time_Sensitive',
        'Learning_Outcomes',
        'Teaching_Points',
        'Pitfalls',
        'Performance_Benchmarks',
        'Pre_Sim_Overview',
        'Post_Sim_Overview',
        'Attribution'
      ];

      addLog('      🎯 Selecting defaults from ' + availableFields.length + ' available fields...');

      selectedFields = [];
      for (var i = 0; i < priorityPatterns.length && selectedFields.length < 27; i++) {
        var pattern = priorityPatterns[i];
        for (var j = 0; j < availableFields.length; j++) {
          if (availableFields[j].name.indexOf(pattern) !== -1 && selectedFields.indexOf(availableFields[j].name) === -1) {
            selectedFields.push(availableFields[j].name);
            break; // Take first match for each pattern
          }
        }
      }`;

    // Replace the hardcoded array with dynamic code
    code = code.substring(0, arrayAssignStart) + newDynamicCode + code.substring(arrayClosing);

    console.log('✅ Replaced hardcoded defaults with dynamic pattern matching\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎯 DYNAMIC DEFAULTS IMPLEMENTED!\n');
    console.log('No more hardcoded field names!\n');
    console.log('\nSystem now:\n');
    console.log('  ✅ Reads fresh header cache from Row 2\n');
    console.log('  ✅ Searches for fields matching priority patterns\n');
    console.log('  ✅ Selects ~27 most important fields that ACTUALLY exist\n');
    console.log('  ✅ Adapts automatically to spreadsheet changes\n');
    console.log('\nTry "Pre-Cache Rich Data" - should show ~27 fields now!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

makeDynamic();
