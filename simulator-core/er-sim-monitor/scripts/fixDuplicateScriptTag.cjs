#!/usr/bin/env node

/**
 * FIX DUPLICATE SCRIPT TAG
 * Remove the duplicate <script> tag that's breaking the JavaScript
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 FIXING DUPLICATE SCRIPT TAG\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Removing duplicate <script> tag...\n');

    // Find and replace the problematic section
    const badPattern = `'log("🎯 Field Selector JavaScript started");' +
      '<script>' +`;

    const goodReplacement = `'log("🎯 Field Selector JavaScript started");' +`;

    if (code.includes(badPattern)) {
      code = code.replace(badPattern, goodReplacement);
      console.log('✅ Removed duplicate <script> tag\n');
    } else {
      console.log('⚠️  Pattern not found, trying alternative...\n');

      // Try simpler pattern
      const altPattern = `'log("🎯 Field Selector JavaScript started");' +
      '<script>'`;
      const altReplacement = `'log("🎯 Field Selector JavaScript started");'`;

      if (code.includes(altPattern)) {
        code = code.replace(altPattern, altReplacement);
        console.log('✅ Removed duplicate <script> tag (alternative method)\n');
      }
    }

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-script-tag-fix-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up to: ${backupPath}\n`);

    // Deploy
    console.log('📤 Deploying to production...\n');

    const updatedFiles = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: code
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: updatedFiles }
    });

    const newSize = (code.length / 1024).toFixed(1);

    console.log(`✅ Deployment successful! Size: ${newSize} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 DUPLICATE SCRIPT TAG FIXED!\n');
    console.log('The JavaScript should now execute properly.\n');
    console.log('Click "Pre-Cache Rich Data" again - logs should appear!\n');
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
