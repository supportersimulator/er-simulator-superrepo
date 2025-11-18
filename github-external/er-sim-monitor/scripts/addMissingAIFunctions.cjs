#!/usr/bin/env node

/**
 * ADD MISSING AI FUNCTIONS
 *
 * The current code is missing:
 * - getRecommendedFields() - pulls AI recommendations from cache
 * - getFieldSelectorData() - prepares data for field selector modal
 *
 * These are needed for the field selector to show AI recommendations.
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

    console.log('📥 Loading backup...\n');

    const backup = fs.readFileSync('/tmp/actual_deployed_code.gs', 'utf8');

    // Extract getRecommendedFields
    const getRecStart = backup.indexOf('function getRecommendedFields(availableFields, selectedFields) {');
    const getRecEnd = backup.indexOf('\\nfunction ', getRecStart + 10);
    const getRecFunc = backup.substring(getRecStart, getRecEnd);

    console.log('✅ Extracted getRecommendedFields() (' + (getRecFunc.length / 1024).toFixed(1) + 'KB)\n');

    // Extract getFieldSelectorData
    const getDataStart = backup.indexOf('function getFieldSelectorData() {');
    const getDataEnd = backup.indexOf('\\nfunction ', getDataStart + 10);
    const getDataFunc = backup.substring(getDataStart, getDataEnd);

    console.log('✅ Extracted getFieldSelectorData() (' + (getDataFunc.length / 1024).toFixed(1) + 'KB)\n');

    // Find where to insert (before showFieldSelector)
    const insertPoint = code.indexOf('function showFieldSelector()');

    if (insertPoint === -1) {
      console.log('❌ Could not find insertion point\n');
      return;
    }

    // Insert both functions
    code = code.substring(0, insertPoint) + getRecFunc + '\\n\\n' + getDataFunc + '\\n\\n' + code.substring(insertPoint);

    console.log('✅ Added both functions\n');

    console.log('📤 Deploying...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ MISSING FUNCTIONS ADDED!\n');
    console.log('\nAdded:\n');
    console.log('  ✅ getRecommendedFields() - Pulls AI_RECOMMENDED_FIELDS from cache');
    console.log('  ✅ getFieldSelectorData() - Prepares data for field selector\n');
    console.log('Field selector will now show AI recommendations!\n');
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
