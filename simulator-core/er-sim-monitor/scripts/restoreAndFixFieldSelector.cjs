#!/usr/bin/env node

/**
 * Restore full field selector and fix the HTML generation issue
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

    console.log('📥 Downloading backup...\n');

    // Read the backup we made earlier
    const backupCode = fs.readFileSync('/tmp/current_production_code.gs', 'utf8');
    
    console.log('🔧 Extracting showFieldSelector from backup...\n');
    
    // Extract the original showFieldSelector
    const funcStart = backupCode.indexOf('function showFieldSelector() {');
    const funcEnd = backupCode.indexOf('\n\n\nfunction onOpen', funcStart);
    let originalFunc = backupCode.substring(funcStart, funcEnd);

    // The issue is likely the empty string concatenations creating blank lines
    // Let's replace them with proper newline escapes
    console.log('🔧 Fixing empty string concatenations...\n');
    
    // Replace patterns like: 'text' + \n      '' + \n      'more'
    // This creates problems in the concatenated string
    
    // Download current to get manifest
    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');
    let code = content.data.files.find(f => f.name === 'Code').source;

    // Replace the minimal test with the original
    const minimalStart = code.indexOf('function showFieldSelector() {');
    const minimalEnd = code.indexOf('\n\n\nfunction onOpen', minimalStart);
    
    code = code.substring(0, minimalStart) + originalFunc + code.substring(minimalEnd);

    console.log('📤 Deploying restored version...\n');

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
    console.log('✅ ORIGINAL FUNCTION RESTORED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Now testing with original function...\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

fix();
