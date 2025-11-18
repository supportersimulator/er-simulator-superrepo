#!/usr/bin/env node

/**
 * ADD ALERT TEST
 * Add simple alert at start of script to confirm it's executing
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

async function addAlert() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    // Add alert right after <script> tag
    const oldPattern = `'<script>' +
      'const logEl = document.getElementById("log");'`;

    const newPattern = `'<script>' +
      'alert("🎯 JavaScript is executing!");' +
      'const logEl = document.getElementById("log");'`;

    if (code.includes(oldPattern)) {
      code = code.replace(oldPattern, newPattern);
      console.log('✅ Added alert test\\n');
    }

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\\n');
    console.log('Click "Pre-Cache Rich Data" - you should see an alert popup.\\n');
    console.log('If alert appears: JavaScript is running, issue is in our code\\n');
    console.log('If NO alert: JavaScript not executing at all\\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

addAlert();
