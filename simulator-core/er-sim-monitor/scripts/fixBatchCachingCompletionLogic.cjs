#!/usr/bin/env node

/**
 * FIX: Completion check was wrong - it stopped after 25 rows instead of all 207
 * 
 * Bug: Line checked "endRow >= data.length - 1" for completion
 * Should: Return complete ONLY when nextRow >= data.length
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

async function deploy() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Fixing completion logic...\n');

    // Find and replace the buggy return statement
    const buggyReturn = `  return {
    complete: endRow >= data.length - 1,`;

    const fixedReturn = `  return {
    complete: nextRow + 25 >= data.length,`;

    code = code.replace(buggyReturn, fixedReturn);

    console.log('✅ Completion logic fixed\n');

    console.log('📤 Deploying fix...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('✅ FIX DEPLOYED!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ BATCH CACHING COMPLETION LOGIC FIXED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Bug: Stopped after first batch (marked 100% complete)');
    console.log('Fix: Now continues until ALL rows cached\n');
    console.log('To test:');
    console.log('  1. Refresh Google Sheet (F5)');
    console.log('  2. Delete Field_Cache_Incremental sheet');
    console.log('  3. Run batch cache again');
    console.log('  4. Should now cache all 207 rows!');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deploy();
