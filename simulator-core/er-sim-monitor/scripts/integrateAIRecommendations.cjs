#!/usr/bin/env node

/**
 * INTEGRATE AI RECOMMENDATIONS
 * Copy getRecommendedFields() from Phase2 file and integrate it
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

async function integrate() {
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

    console.log('🔧 Adding AI recommendation function...\n');

    // Add the AI recommendation function right before getFieldSelectorData
    const aiFunction = `
/**
 * Get AI-recommended fields based on pathway discovery potential
 * Falls back to static recommendations if API unavailable
 */
function getRecommendedFields(availableFields, selectedFields) {
  try {
    const apiKey = readApiKey_();
    if (!apiKey) {
      Logger.log('⚠️ No API key - using static recommendations');
      return getStaticRecommendedFields(availableFields, selectedFields);
    }

    // Get currently selected field names
    const currentlySelected = selectedFields;

    // Get unselected fields with their examples
    const unselectedFields = availableFields.filter(function(field) {
      return currentlySelected.indexOf(field.name) === -1;
    });

    const fieldDescriptions = unselectedFields.slice(0, 100).map(function(field) {
      return {
        name: field.name,
        category: field.tier1,
        example: field.example || 'N/A'
      };
    });

    const prompt = 'You are a medical education expert analyzing which data fields would be most valuable for AI pathway discovery in emergency medicine simulation cases.\\n\\n' +
      'CURRENTLY SELECTED FIELDS (already chosen, DO NOT recommend these):\\n' +
      JSON.stringify(currentlySelected, null, 2) + '\\n\\n' +
      'AVAILABLE UNSELECTED FIELDS (choose from these ONLY):\\n' +
      JSON.stringify(fieldDescriptions, null, 2) + '\\n\\n' +
      'Goal: Recommend 8-12 fields that would:\\n' +
      '- Group similar cases effectively\\n' +
      '- Support differential diagnosis patterns\\n' +
      '- Track treatment progressions\\n' +
      '- Reveal clinical reasoning patterns\\n' +
      '- Identify time-critical cases\\n' +
      '- Show patient complexity\\n\\n' +
      'IMPORTANT: Only recommend from UNSELECTED fields. Do NOT include any currently selected fields.\\n\\n' +
      'Return ONLY a JSON array of field names: ["fieldName1", "fieldName2", ...]';

    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in medical education and clinical reasoning. Respond ONLY with valid JSON. NEVER recommend fields that are already selected.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    };

    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      Logger.log('⚠️ OpenAI API error: ' + responseCode + ' - using static recommendations');
      return getStaticRecommendedFields(availableFields, selectedFields);
    }

    const data = JSON.parse(response.getContentText());
    const aiResponse = data.choices[0].message.content;

    const jsonMatch = aiResponse.match(/\\[[\\s\\S]*?\\]/);
    if (!jsonMatch) {
      Logger.log('⚠️ Could not parse AI response - using static recommendations');
      return getStaticRecommendedFields(availableFields, selectedFields);
    }

    const recommendedFields = JSON.parse(jsonMatch[0]);

    // Extra safety: Filter out any selected fields AI might have included
    const filteredRecommendations = recommendedFields.filter(function(field) {
      return currentlySelected.indexOf(field) === -1;
    });

    Logger.log('✅ AI recommended ' + filteredRecommendations.length + ' fields');
    return filteredRecommendations;

  } catch (e) {
    Logger.log('⚠️ Error getting AI recommendations: ' + e.message);
    return getStaticRecommendedFields(availableFields, selectedFields);
  }
}

`;

    // Insert before getFieldSelectorData
    const insertPoint = code.indexOf('function getFieldSelectorData()');
    if (insertPoint !== -1) {
      code = code.substring(0, insertPoint) + aiFunction + '\n' + code.substring(insertPoint);
      console.log('✅ Added getRecommendedFields() function\n');
    }

    // Now update getFieldSelectorData to call it
    console.log('🔧 Updating Step 4 to call AI recommendations...\n');

    const oldStep4 = "addLog('   Step 4: Calling getStaticRecommendedFields()');";
    const newStep4 = "addLog('   Step 4: Calling getRecommendedFields() (AI + fallback)');";

    code = code.replace(oldStep4, newStep4);

    const oldCall = "var recommendedFields = getStaticRecommendedFields(availableFields, selectedFields);";
    const newCall = "var recommendedFields = getRecommendedFields(availableFields, selectedFields);";

    code = code.replace(oldCall, newCall);

    console.log('✅ Updated to use AI recommendations\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🤖 AI RECOMMENDATIONS INTEGRATED!\n');
    console.log('System will now:\n');
    console.log('  1. Try ChatGPT API for intelligent recommendations\n');
    console.log('  2. Fall back to static if API unavailable\n');
    console.log('  3. Show 8-12 recommended fields in modal\n');
    console.log('Try "Pre-Cache Rich Data" - should show recommended fields!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

integrate();
