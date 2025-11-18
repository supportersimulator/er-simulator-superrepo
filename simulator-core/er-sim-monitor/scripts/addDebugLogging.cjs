#!/usr/bin/env node

/**
 * ADD DEBUG LOGGING
 * Log which selected fields are being found vs not found
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

async function add() {
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

    console.log('🔧 Adding debug logging to field separation...\n');

    // Add logging before the field separation
    const beforeLoop = `'  var selectedFields = [];' +
      '  var recommendedFields = [];' +
      '  var otherFields = [];' +
      '  '`;

    const withLogging = `'  var selectedFields = [];' +
      '  var recommendedFields = [];' +
      '  var otherFields = [];' +
      '  ' +
      '  log("   📊 Server sent " + data.selected.length + " selected field names");' +
      '  log("   📊 data.selected = " + JSON.stringify(data.selected.slice(0, 5)) + "...");' +
      '  '`;

    code = code.replace(beforeLoop, withLogging);

    console.log('✅ Added debug logging\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('Try "Pre-Cache Rich Data" to see debug info!\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

add();
