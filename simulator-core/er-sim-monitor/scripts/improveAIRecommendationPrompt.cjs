#!/usr/bin/env node

/**
 * IMPROVE AI RECOMMENDATION PROMPT
 * Update prompt to exclude already-selected fields and allow flexible count
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

async function improve() {
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

    console.log('🔧 Updating AI recommendation prompt...\n');

    // Find the getRecommendedFields function and update the prompt
    // Look for the part that builds the prompt
    const oldPromptStart = "const prompt = 'You are a medical education expert";

    if (!code.includes(oldPromptStart)) {
      console.error('❌ Could not find AI recommendation prompt');
      return;
    }

    // Find the entire prompt section
    const promptStart = code.indexOf(oldPromptStart);
    const promptEnd = code.indexOf('Response format:', promptStart) + 500;

    const oldPromptSection = code.substring(promptStart, promptEnd);

    console.log('📋 Current prompt section found\n');

    // New improved prompt
    const newPromptSection = `const prompt = 'You are a medical education expert analyzing which data fields would be most valuable for AI pathway discovery in emergency medicine simulation cases.\\n\\n' +
      'ALREADY SELECTED FIELDS (user has chosen these - DO NOT recommend these again):\\n' +
      JSON.stringify(currentlySelected, null, 2) + '\\n\\n' +
      'AVAILABLE UNSELECTED FIELDS (recommend from these ONLY):\\n' +
      JSON.stringify(fieldDescriptions, null, 2) + '\\n\\n' +
      'Goal: Recommend ADDITIONAL fields beyond those already selected that would:\\n' +
      '- Maximize pathway discovery potential\\n' +
      '- Reveal clinical reasoning patterns not captured by selected fields\\n' +
      '- Support differential diagnosis across different patient presentations\\n' +
      '- Track treatment progressions and outcomes\\n' +
      '- Identify time-critical decision points\\n' +
      '- Show patient complexity and risk factors\\n\\n' +
      'Requirements:\\n' +
      '- Recommend at least 1 additional field, but as many as you think add value (no maximum)\\n' +
      '- Only recommend fields from the AVAILABLE UNSELECTED list\\n' +
      '- Do NOT recommend any fields from the ALREADY SELECTED list\\n' +
      '- Provide brief rationale for each recommendation\\n\\n' +
      'Response format: JSON array of objects with "field" (exact field name) and "rationale" (brief reason)';

    addLog('   📤 Built AI prompt (excluding already selected fields)');`;

    // Replace the old prompt section
    code = code.replace(oldPromptSection, newPromptSection);

    console.log('✅ Updated AI prompt to exclude selected fields\n');

    // Also update the static fallback to exclude selected fields
    console.log('🔧 Updating static fallback recommendations...\n');

    const oldFallback = 'function getStaticRecommendedFields(availableFields, selectedFields) {';

    if (code.includes(oldFallback)) {
      // Find the return statement in static fallback
      const fallbackStart = code.indexOf(oldFallback);
      const fallbackReturn = code.indexOf('return [', fallbackStart);
      const fallbackEnd = code.indexOf('];', fallbackReturn) + 2;

      const newFallback = `return availableFields
    .filter(function(f) {
      // Exclude already selected fields
      return selectedFields.indexOf(f.name) === -1;
    })
    .filter(function(f) {
      // Static recommendations for pathway discovery
      return f.name === 'Case_Orientation_Chief_Diagnosis' ||
        f.name === 'Case_Orientation_Differential_Diagnosis' ||
        f.name === 'Case_Orientation_Critical_Actions' ||
        f.name === 'Case_Orientation_Time_Sensitive_Factors' ||
        f.name === 'Patient_Demographics_Age' ||
        f.name === 'Patient_Demographics_Gender' ||
        f.name === 'Patient_Demographics_Chief_Complaint' ||
        f.name === 'Case_Orientation_Key_Clinical_Features' ||
        f.name === 'Scoring_Criteria_Performance_Benchmarks' ||
        f.name === 'Case_Organization_Medical_Category';
    })
    .map(function(f) { return f.name; })];`;

      const beforeFallback = code.substring(0, fallbackReturn);
      const afterFallback = code.substring(fallbackEnd);

      code = beforeFallback + newFallback + afterFallback;

      console.log('✅ Updated static fallback to exclude selected fields\n');
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
    console.log('🤖 AI RECOMMENDATION PROMPT IMPROVED!\n');
    console.log('Changes:\n');
    console.log('  ✅ AI now sees your 27 selected fields upfront\n');
    console.log('  ✅ AI only recommends ADDITIONAL fields (no duplicates)\n');
    console.log('  ✅ No forced count - AI suggests as many as add value (min 1)\n');
    console.log('  ✅ Static fallback also excludes selected fields\n');
    console.log('\nTry "Pre-Cache Rich Data" - should see better recommendations!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

improve();
