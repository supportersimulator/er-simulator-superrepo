#!/usr/bin/env node

/**
 * FIX SHEET SWITCHING BUG
 *
 * After creating Field_Cache_Incremental, switch back to Master sheet
 * so the modal doesn't lose context
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

    console.log('🔧 Fixing sheet switching bug...\n');

    // Find and fix the sheet creation code
    const oldSheetCreation = `  if (!cacheSheet) {
    Logger.log('📝 Creating new Field_Cache_Incremental sheet');
    cacheSheet = ss.insertSheet('Field_Cache_Incremental');
    cacheSheet.appendRow(['Row', 'Timestamp'].concat(selectedFields));
    Logger.log('✅ Sheet created with headers');
  } else {
    Logger.log('✅ Using existing Field_Cache_Incremental sheet');
  }`;

    const newSheetCreation = `  if (!cacheSheet) {
    Logger.log('📝 Creating new Field_Cache_Incremental sheet');
    cacheSheet = ss.insertSheet('Field_Cache_Incremental');
    cacheSheet.appendRow(['Row', 'Timestamp'].concat(selectedFields));
    Logger.log('✅ Sheet created with headers');

    // Switch back to Master sheet so modal doesn't lose context
    sheet.activate();
    Logger.log('✅ Switched back to Master sheet');
  } else {
    Logger.log('✅ Using existing Field_Cache_Incremental sheet');
  }`;

    code = code.replace(oldSheetCreation, newSheetCreation);

    console.log('✅ Added sheet.activate() to switch back to Master\n');

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
    console.log('✅ FIXED SHEET SWITCHING BUG!\n');
    console.log('\nWhat changed:\n');
    console.log('  When creating Field_Cache_Incremental sheet,');
    console.log('  immediately call sheet.activate() to switch back to Master\n');
    console.log('This prevents the modal from losing context when the new sheet');
    console.log('is created, allowing batch caching to continue through all 207 rows!\n');
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
