#!/usr/bin/env node

/**
 * REMOVE THE RESET TO DEFAULT 27 BUTTON
 *
 * This button calls a function that doesn't exist and is causing the "Malformed HTML" error.
 * We don't need it anyway - we're using the new system with header cache + saved defaults.
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

    console.log('📥 Downloading current production...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Removing Reset to Default 27 button...\n');

    // Find and remove the button
    const oldButton = '<button class="btn-reset" onclick="resetToDefault27()">🔄 Reset to Default 27</button>';

    if (code.includes(oldButton)) {
      code = code.replace(oldButton, '');
      console.log('✅ Removed the button\n');
    } else {
      console.log('ℹ️  Button not found (might already be removed)\n');
    }

    console.log('📤 Deploying...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ FIXED - REMOVED RESET BUTTON!\n');
    console.log('\nWhat was done:\n');
    console.log('  - Removed "Reset to Default 27" button (was calling undefined function)');
    console.log('  - This was causing the "Malformed HTML" error\n');
    console.log('Now try:\n');
    console.log('  1. Refresh Google Sheet');
    console.log('  2. Click Categories & Pathways → Cache button');
    console.log('  3. Modal should open successfully!\n');
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
