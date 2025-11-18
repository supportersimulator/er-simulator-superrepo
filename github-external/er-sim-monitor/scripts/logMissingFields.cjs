#!/usr/bin/env node

/**
 * LOG MISSING FIELDS
 * Show which of the 27 defaults are not found in data.grouped
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

    console.log('🔧 Adding logging to track missing fields...\n');

    // Add logging after the field loop to show what was found vs not found
    const afterLoop = `'  });' +
      '  ' +
      '  log("   ✅ Section 1: " + selectedFields.length + " selected");`;

    const withMissingCheck = `'  });' +
      '  ' +
      '  var foundNames = selectedFields.map(function(f) { return f.name; });' +
      '  var missingFields = data.selected.filter(function(name) { return foundNames.indexOf(name) === -1; });' +
      '  if (missingFields.length > 0) {' +
      '    log("   ⚠️ Missing " + missingFields.length + " fields from grouped data:");' +
      '    log("      " + missingFields.join(", "));' +
      '  }' +
      '  log("   ✅ Section 1: " + selectedFields.length + " selected");`;

    code = code.replace(afterLoop, withMissingCheck);

    console.log('✅ Added missing field tracking\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 MISSING FIELD LOGGING ADDED!\n');
    console.log('Now the logs will show which of the 27 defaults are missing\n');
    console.log('Try "Pre-Cache Rich Data" to see which fields dont exist!\n');
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
