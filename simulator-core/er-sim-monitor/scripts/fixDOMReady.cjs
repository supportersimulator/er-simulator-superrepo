#!/usr/bin/env node

/**
 * FIX DOM READY ISSUE
 * Wrap JavaScript in a small delay to ensure DOM is loaded
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

    console.log('🔧 Wrapping JavaScript in setTimeout for DOM ready...\n');

    // Find the part where we start executing
    const oldStart = `'log("🎯 Client JavaScript started");' +
      'log("📞 Calling server getFieldSelectorData()...");' +
      'google.script.run'`;

    const newStart = `'setTimeout(function() {' +
      '  log("🎯 Client JavaScript started");' +
      '  log("📞 Calling server getFieldSelectorData()...");' +
      '  google.script.run'`;

    if (!code.includes(oldStart)) {
      console.error('❌ Could not find start pattern');
      process.exit(1);
    }

    code = code.replace(oldStart, newStart);

    // Find where getFieldSelectorData() is called and close the setTimeout
    const oldCall = `  }).saveFieldSelectionAndStartCache(selected);' +
      '}' +
      '<\\/script>'`;

    const newCall = `  }).saveFieldSelectionAndStartCache(selected);' +
      '}' +
      '}, 100);' +
      '<\\/script>'`;

    if (!code.includes(oldCall)) {
      console.error('❌ Could not find call pattern');
      process.exit(1);
    }

    code = code.replace(oldCall, newCall);

    console.log('✅ Wrapped main execution in setTimeout(100ms)\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔧 DOM READY FIX APPLIED\n');
    console.log('JavaScript will now wait 100ms for DOM to be fully loaded\n');
    console.log('Try "Pre-Cache Rich Data" - logs should appear!\n');
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
