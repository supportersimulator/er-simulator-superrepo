#!/usr/bin/env node

/**
 * DEPLOY WORKING TEST MONOLITHIC
 * The complete version that was working in test
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🚀 DEPLOYING WORKING TEST MONOLITHIC\n');
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

async function deploy() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    // Load test monolithic
    const testPath = path.join(__dirname, '../backups/test-with-complete-atsr-2025-11-06.gs');

    if (!fs.existsSync(testPath)) {
      console.log('❌ Test monolithic not found!\n');
      return;
    }

    let testCode = fs.readFileSync(testPath, 'utf8');
    const testSize = (testCode.length / 1024).toFixed(1);

    console.log(`📥 Loaded test monolithic: ${testSize} KB\n`);

    // Update menu to "Sim Builder"
    console.log('🔧 Updating menu name to "Sim Builder"...\n');

    testCode = testCode.replace(/createMenu\('ER Simulator'\)/g, "createMenu('🧠 Sim Builder')");

    // Also make Categories & Pathways the first menu item by finding and rearranging
    // First, let's just deploy it and see if it works

    // Download production
    console.log('📥 Downloading production for comparison...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-working-monolithic-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up production to: ${backupPath}\n`);

    // Deploy
    console.log('📤 Deploying working test monolithic to production...\n');

    const updatedFiles = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: testCode
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: updatedFiles }
    });

    const newSize = (testCode.length / 1024).toFixed(1);

    console.log(`✅ Deployment successful! Size: ${newSize} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 WORKING TEST MONOLITHIC DEPLOYED!\n');
    console.log('\nThis version was working in test environment.\n');
    console.log('Menu: "🧠 Sim Builder" with Categories & Pathways\n');
    console.log('\nNext steps:\n');
    console.log('   1. Refresh your production spreadsheet\n');
    console.log('   2. Look for "🧠 Sim Builder" menu\n');
    console.log('   3. Try "Categories & Pathways" - it should work!\n');
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
