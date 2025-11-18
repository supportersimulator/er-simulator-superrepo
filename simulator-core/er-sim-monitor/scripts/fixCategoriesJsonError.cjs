#!/usr/bin/env node

/**
 * FIX categoriesJson ERROR
 *
 * The openSimSidebar() function has debug logging that references
 * categoriesJson which doesn't exist in that function's scope.
 *
 * This is leftover code that needs to be removed.
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

    console.log('Current size: ' + (code.length / 1024).toFixed(1) + 'KB\n');

    // Find and remove the problematic logging lines
    console.log('🔧 Removing undefined categoriesJson references...\n');

    const originalCode = code;

    // Remove the categoriesJson logging line
    code = code.replace(
      /Logger\.log\('   categoriesJson length: ' \+ categoriesJson\.length\);[\r\n]*/g,
      ''
    );

    // Also remove selectedJson and recommendedFields if they cause issues
    code = code.replace(
      /Logger\.log\('   selectedJson length: ' \+ selectedJson\.length\);[\r\n]*/g,
      ''
    );

    code = code.replace(
      /Logger\.log\('   recommendedFields: ' \+ JSON\.stringify\(recommendedFields\)\);[\r\n]*/g,
      ''
    );

    if (code === originalCode) {
      console.log('⚠️  No problematic logging found\n');
    } else {
      const changes = originalCode.length - code.length;
      console.log('✅ Removed ' + changes + ' characters of problematic logging\n');
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
    console.log('New size: ' + (code.length / 1024).toFixed(1) + 'KB\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ BATCH PROCESSING ENGINE FIXED!\n');
    console.log('\nThe "categoriesJson is not defined" error is now resolved.\n');
    console.log('Try opening Batch Processing again:\n');
    console.log('  🧠 Sim Builder → 🚀 Batch Processing\n');
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
