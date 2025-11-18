#!/usr/bin/env node

/**
 * BABY STEP 1: Add Phase2_AI_Scoring_Pathways.gs only
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function deployStep1() {
  try {
    console.log('🚀 BABY STEP 1: Deploy Phase2_AI_Scoring_Pathways.gs\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Initialize auth
    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');

    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const scriptId = process.env.APPS_SCRIPT_ID;

    console.log(`📋 Script ID: ${scriptId}\n`);

    // Step 1: Get current project content
    console.log('📥 Step 1: Downloading current project...\n');
    const currentProject = await script.projects.getContent({
      scriptId: scriptId
    });

    console.log(`   Current files (${currentProject.data.files.length}):`);
    currentProject.data.files.forEach(f => {
      console.log(`      - ${f.name} (${f.type})`);
    });

    // Step 2: Read new file
    console.log('\n📄 Step 2: Reading Phase2_AI_Scoring_Pathways.gs...\n');
    const newFilePath = path.join(__dirname, '../apps-script-deployable/Phase2_AI_Scoring_Pathways.gs');
    const newFileContent = fs.readFileSync(newFilePath, 'utf8');
    const newFileSize = (newFileContent.length / 1024).toFixed(1);

    console.log(`   ✅ Loaded: ${newFileSize} KB\n`);

    // Step 3: Add new file to project
    console.log('📤 Step 3: Adding Phase2_AI_Scoring_Pathways to project...\n');

    const updatedFiles = [
      ...currentProject.data.files,
      {
        name: 'Phase2_AI_Scoring_Pathways',
        type: 'SERVER_JS',
        source: newFileContent
      }
    ];

    // Step 4: Update project
    console.log('💾 Step 4: Uploading to Apps Script...\n');

    await script.projects.updateContent({
      scriptId: scriptId,
      requestBody: {
        files: updatedFiles
      }
    });

    console.log('   ✅ Upload complete!\n');

    // Step 5: Verify
    console.log('🔍 Step 5: Verifying deployment...\n');
    const verifyProject = await script.projects.getContent({
      scriptId: scriptId
    });

    console.log(`   Files in project now (${verifyProject.data.files.length}):`);
    verifyProject.data.files.forEach(f => {
      const size = f.source ? `${(f.source.length / 1024).toFixed(1)} KB` : 'N/A';
      const isNew = f.name === 'Phase2_AI_Scoring_Pathways' ? '✨ NEW' : '';
      console.log(`      - ${f.name} (${f.type}) - ${size} ${isNew}`);
    });

    const hasPhase2File = verifyProject.data.files.some(f => f.name === 'Phase2_AI_Scoring_Pathways');

    console.log('\n═══════════════════════════════════════════════════════════════');
    if (hasPhase2File) {
      console.log('✅ BABY STEP 1 COMPLETE!');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('Phase2_AI_Scoring_Pathways.gs successfully added.\n');
      console.log('🧪 TEST INSTRUCTIONS:\n');
      console.log('1. Open your Google Sheet');
      console.log('2. Refresh the browser (F5)');
      console.log('3. Check that existing functionality still works');
      console.log('4. Open Extensions → Apps Script');
      console.log('5. Verify you see Phase2_AI_Scoring_Pathways file in left sidebar');
      console.log('6. Click on it and verify code is there');
      console.log('7. Try running function: testScoringEngine (if you want)');
      console.log('\nIf everything looks good, let me know and we\'ll proceed to step 2!\n');
    } else {
      console.log('❌ DEPLOYMENT FAILED');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('Phase2 file not found after upload. Something went wrong.\n');
    }

  } catch (error) {
    console.error('\n❌ Deployment Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deployStep1();
