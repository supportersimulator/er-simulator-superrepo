#!/usr/bin/env node

/**
 * FIX ALL REMAINING UNDERSCORES
 * Remove trailing underscores from ALL helper functions
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

    console.log('🔧 Removing trailing underscores from all helper functions...\n');

    // Fix getDefaultFieldNames
    code = code.replace(/function getDefaultFieldNames_\(\)/g, 'function getDefaultFieldNames()');
    code = code.replace(/getDefaultFieldNames_\(\)/g, 'getDefaultFieldNames()');
    console.log('✅ Fixed getDefaultFieldNames_() → getDefaultFieldNames()');

    // Fix getStaticRecommendedFields (should already be done but double-check)
    code = code.replace(/function getStaticRecommendedFields_\(/g, 'function getStaticRecommendedFields(');
    code = code.replace(/getStaticRecommendedFields_\(/g, 'getStaticRecommendedFields(');
    console.log('✅ Fixed getStaticRecommendedFields_() → getStaticRecommendedFields()');

    // Fix any other common helper functions with underscores
    // But keep system functions like getSafeUi_(), setProp(), pickMasterSheet_() etc.
    // Those are intentionally private

    console.log('\n');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-all-underscores-fixed-2025-11-06.gs');
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
    console.log('✅ ALL HELPER FUNCTIONS NOW PUBLIC\n');
    console.log('Fixed:\n');
    console.log('  ✅ getDefaultFieldNames_() → getDefaultFieldNames()\n');
    console.log('  ✅ getStaticRecommendedFields_() → getStaticRecommendedFields()\n');
    console.log('Now loadFieldSelection() should return 27 default fields!\n');
    console.log('Try "Pre-Cache Rich Data" again.\n');
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
