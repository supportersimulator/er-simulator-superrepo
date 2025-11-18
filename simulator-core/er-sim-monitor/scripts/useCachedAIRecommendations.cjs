#!/usr/bin/env node

/**
 * USE CACHED AI RECOMMENDATIONS IN getRecommendedFields()
 * Modify to check DocumentProperties cache first before calling OpenAI API
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

    console.log('🔧 Modifying getRecommendedFields() to use cache...\n');

    // Find the function
    const funcStart = code.indexOf('function getRecommendedFields(availableFields, selectedFields) {');

    if (funcStart === -1) {
      console.log('❌ Could not find getRecommendedFields()\n');
      return;
    }

    // Find where it checks for API key
    const apiKeyCheck = code.indexOf('  try {\n    const apiKey = readApiKey_();', funcStart);

    if (apiKeyCheck === -1) {
      console.log('❌ Could not find API key check\n');
      return;
    }

    // Insert cache check right after "try {"
    const insertPos = code.indexOf('try {', funcStart) + 6; // After "try {\n"

    const cacheCheckCode = `
    // FIRST: Check if we have cached recommendations from Step 2.5
    const docProps = PropertiesService.getDocumentProperties();
    const cachedRecommendations = docProps.getProperty('AI_RECOMMENDED_FIELDS');
    const cachedTimestamp = docProps.getProperty('AI_RECOMMENDATIONS_TIMESTAMP');

    if (cachedRecommendations && cachedTimestamp) {
      const cacheAge = (new Date() - new Date(cachedTimestamp)) / 1000; // seconds
      if (cacheAge < 3600) { // Cache valid for 1 hour
        Logger.log('✅ Using cached AI recommendations (age: ' + Math.round(cacheAge) + 's)');
        try {
          const cached = JSON.parse(cachedRecommendations);
          // Filter out any that might now be selected
          const filtered = cached.filter(function(field) {
            return selectedFields.indexOf(field) === -1;
          });
          return filtered;
        } catch (parseError) {
          Logger.log('⚠️ Failed to parse cached recommendations, fetching fresh...');
          // Fall through to API call
        }
      } else {
        Logger.log('⚠️ Cached recommendations expired (' + Math.round(cacheAge) + 's old), fetching fresh...');
      }
    }

    `;

    code = code.substring(0, insertPos) + cacheCheckCode + code.substring(insertPos);

    console.log('✅ Added cache check to getRecommendedFields()\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ AI RECOMMENDATIONS NOW USE CACHE!\n');
    console.log('\nHow it works:\n');
    console.log('  1. Step 2.5 pre-fetches AI recommendations (when clicking menu)');
    console.log('  2. Saves to DocumentProperties with timestamp');
    console.log('  3. When field selector opens, checks cache first');
    console.log('  4. If cache < 1 hour old, uses it (instant!)');
    console.log('  5. If cache expired or missing, fetches fresh from OpenAI\n');
    console.log('Benefits:');
    console.log('  ✅ Field selector modal opens instantly');
    console.log('  ✅ AI recommendations pre-loaded');
    console.log('  ✅ No duplicate API calls');
    console.log('  ✅ Cache refreshes automatically after 1 hour\n');
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
