#!/usr/bin/env node

/**
 * EMERGENCY RESTORE - Restore original code from start of session
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

async function restore() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('🚨 EMERGENCY RESTORE\n');
    console.log('Restoring original code from /tmp/actual_deployed_code.gs\n');

    const originalCode = fs.readFileSync('/tmp/actual_deployed_code.gs', 'utf8');

    console.log('Original size: ' + (originalCode.length / 1024).toFixed(1) + 'KB\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    console.log('Deploying original code...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: originalCode },
        manifestFile
      ]}
    });

    console.log('✅ RESTORED!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Code restored to state from beginning of session.\n');
    console.log('This had:\n');
    console.log('  ✅ onOpen() menu');
    console.log('  ✅ Categories & Pathways');
    console.log('  ✅ AI Pathway Discovery');
    console.log('  ✅ Field Selector (complex version)');
    console.log('  ✅ All Phase 2 features\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

restore();
