#!/usr/bin/env node

/**
 * LOG AI RECOMMENDED FORMAT
 * Show exactly what field names the AI is returning
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

async function log() {
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

    console.log('🔧 Adding logging for AI recommended field names...\n');

    // Add logging right after we log the data.recommended array
    const afterRecommendedLog = `'    📊 data.selected = " + JSON.stringify(data.selected.slice(0, 5)) + "...";' +
      '  '`;

    const withRecommendedLog = `'    📊 data.selected = " + JSON.stringify(data.selected.slice(0, 5)) + "...";' +
      '  log("   📊 data.recommended = " + JSON.stringify(data.recommended.slice(0, 5)) + "...");' +
      '  '`;

    code = code.replace(afterRecommendedLog, withRecommendedLog);

    console.log('✅ Added AI recommended field name logging\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 AI FIELD NAME LOGGING ADDED!\n');
    console.log('Now we can see what format AI is returning field names in\n');
    console.log('Try "Pre-Cache Rich Data" and copy the logs!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

log();
