#!/usr/bin/env node

/**
 * REMOVE OLD 27-FIELD ASSIGNMENT
 * Keep only the 35 intelligent defaults
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

    console.log('🔧 Removing old 27-field assignment that overrides 35 defaults...\n');

    // Find the second assignment (the old 27-field one)
    const secondAssignment = code.indexOf('// Dynamically select ~27 most important fields from available fields');

    if (secondAssignment === -1) {
      console.log('❌ Could not find old 27-field assignment\n');
      return;
    }

    // Find where this section ends (look for the next major comment or function)
    const sectionStart = code.indexOf('selectedFields = [', secondAssignment);
    const sectionEnd = code.indexOf('addLog(', sectionStart);

    if (sectionStart === -1 || sectionEnd === -1) {
      console.log('❌ Could not find bounds of old assignment\n');
      return;
    }

    console.log(`Found old 27-field assignment at position ${sectionStart}`);
    console.log(`Removing section from ${sectionStart} to ${sectionEnd}\n`);

    // Remove this entire section - the 35-field assignment earlier is all we need
    code = code.substring(0, secondAssignment) + code.substring(sectionEnd);

    console.log('✅ Removed old 27-field assignment\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ OLD 27-FIELD ASSIGNMENT REMOVED!\n');
    console.log('\nNow only the 35 intelligent defaults will be used\n');
    console.log('No more override issue\n');
    console.log('Try "Categories & Pathways" - should show 35 defaults!\n');
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
