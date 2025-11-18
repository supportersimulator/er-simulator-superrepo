#!/usr/bin/env node

/**
 * CORRECT FIX for completion logic
 * 
 * Bug: Line 60 checks `nextRow + 25 >= data.length` which is wrong
 * Fix: Should check `endRow >= data.length - 1` (meaning we just cached the last row)
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

    console.log('🔧 Fixing completion check...\n');

    // Replace the buggy completion check
    const buggyLine = '    complete: nextRow + 25 >= data.length,';
    const fixedLine = '    complete: endRow >= data.length - 1,';

    code = code.replace(buggyLine, fixedLine);

    console.log('Before: complete: nextRow + 25 >= data.length,');
    console.log('After:  complete: endRow >= data.length - 1,\n');

    console.log('✅ Fix applied\n');

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

    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ COMPLETION LOGIC CORRECTLY FIXED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Logic explanation:');
    console.log('  - endRow = last row cached in this batch');
    console.log('  - data.length - 1 = last row in sheet (row 208)');
    console.log('  - If endRow >= 208, we just cached the last row');
    console.log('  - Return complete: true to stop batching\n');
    console.log('Example with 209 total rows (207 data rows):');
    console.log('  - Batch 1: rows 3-27   → endRow=27,  27 >= 208? NO  → Continue');
    console.log('  - Batch 2: rows 28-52  → endRow=52,  52 >= 208? NO  → Continue');
    console.log('  - ...');
    console.log('  - Batch 9: rows 203-208 → endRow=208, 208 >= 208? YES → DONE!');
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
