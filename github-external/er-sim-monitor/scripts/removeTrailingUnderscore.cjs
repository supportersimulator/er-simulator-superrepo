#!/usr/bin/env node

/**
 * REMOVE TRAILING UNDERSCORE
 * Functions with trailing _ are private in Apps Script!
 * Rename getFieldSelectorData_() to getFieldSelectorData()
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

    console.log('🔧 Removing trailing underscore from function name...\n');

    // Rename function definition
    code = code.replace(/function getFieldSelectorData_\(\)/g, 'function getFieldSelectorData()');

    // Rename all calls to it (but keep other _() functions intact)
    code = code.replace(/\.getFieldSelectorData_\(\)/g, '.getFieldSelectorData()');

    console.log('✅ Renamed getFieldSelectorData_() → getFieldSelectorData()\n');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-underscore-removal-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up\n`);

    // Deploy
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
    console.log('🔓 MADE FUNCTION PUBLIC (removed trailing underscore)\n');
    console.log('Functions with trailing _ are PRIVATE in Apps Script!\n');
    console.log('They cannot be called from google.script.run!\n');
    console.log('Now the function is PUBLIC and callable from client.\n');
    console.log('Try "Pre-Cache Rich Data" - it should finally work!\n');
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
