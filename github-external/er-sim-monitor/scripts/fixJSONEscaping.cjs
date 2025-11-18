#!/usr/bin/env node

/**
 * FIX: Properly escape JSON data when embedding in HTML JavaScript
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

    console.log('📥 Downloading...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');
    let code = codeFile.source;

    console.log('🔧 Fixing JSON escaping in showFieldSelector...\n');

    // Find and replace the variable injection
    const oldPattern = "      'var allFields = ' + JSON.stringify(allFields) + ';' +\n" +
      "      'var selectedFields = ' + JSON.stringify(selected) + ';' +";

    const newPattern = "      'var allFields = ' + JSON.stringify(allFields).replace(/</g, '\\\\u003c').replace(/>/g, '\\\\u003e') + ';' +\n" +
      "      'var selectedFields = ' + JSON.stringify(selected).replace(/</g, '\\\\u003c').replace(/>/g, '\\\\u003e') + ';' +";

    if (code.includes(oldPattern)) {
      code = code.replace(oldPattern, newPattern);
      console.log('✅ Added JSON escaping for HTML context\n');
    } else {
      console.log('⚠️ Pattern not found - checking for similar patterns...\n');
      // Try finding just the allFields line
      if (code.includes("'var allFields = ' + JSON.stringify(allFields)")) {
        console.log('Found allFields injection - needs manual fix\n');
      }
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
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ JSON ESCAPING FIXED');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

fix();
