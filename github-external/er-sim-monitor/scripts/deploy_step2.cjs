#!/usr/bin/env node

/**
 * BABY STEP 2: Add Phase2_Pathway_Discovery_UI.gs
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function deployStep2() {
  try {
    console.log('🚀 BABY STEP 2: Deploy Phase2_Pathway_Discovery_UI.gs\n');
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
    const scriptId = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

    console.log(`📋 Script ID: ${scriptId}\n`);

    // Step 1: Get current project content
    console.log('📥 Step 1: Downloading current project...\n');
    const currentProject = await script.projects.getContent({
      scriptId: scriptId
    });

    console.log(`   Current files (${currentProject.data.files.length}):`);
    currentProject.data.files.forEach(f => {
      const size = f.source ? `${(f.source.length / 1024).toFixed(1)} KB` : 'N/A';
      console.log(`      - ${f.name} (${f.type}) - ${size}`);
    });

    // Step 2: Read new file
    console.log('\n📄 Step 2: Reading Phase2_Pathway_Discovery_UI.gs...\n');
    const newFilePath = path.join(__dirname, '../apps-script-deployable/Phase2_Pathway_Discovery_UI.gs');
    const newFileContent = fs.readFileSync(newFilePath, 'utf8');
    const newFileSize = (newFileContent.length / 1024).toFixed(1);

    console.log(`   ✅ Loaded: ${newFileSize} KB\n`);

    // Step 3: Add new file to project
    console.log('📤 Step 3: Adding Phase2_Pathway_Discovery_UI to project...\n');

    const updatedFiles = [
      ...currentProject.data.files,
      {
        name: 'Phase2_Pathway_Discovery_UI',
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
      const isNew = f.name === 'Phase2_Pathway_Discovery_UI' ? '✨ NEW' : '';
      const isPhase2Scoring = f.name === 'Phase2_AI_Scoring_Pathways' ? '(Step 1)' : '';
      console.log(`      - ${f.name} (${f.type}) - ${size} ${isNew}${isPhase2Scoring}`);
    });

    const hasPhase2DiscoveryFile = verifyProject.data.files.some(f => f.name === 'Phase2_Pathway_Discovery_UI');

    console.log('\n═══════════════════════════════════════════════════════════════');
    if (hasPhase2DiscoveryFile) {
      console.log('✅ BABY STEP 2 COMPLETE!');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('Phase2_Pathway_Discovery_UI.gs successfully added.\n');
      console.log('📦 THIS FILE CONTAINS:\n');
      console.log('   ✅ Logic type dropdown population (sorted by usage)');
      console.log('   ✅ Pathway discovery execution');
      console.log('   ✅ Field_Cache_Incremental data loading');
      console.log('   ✅ Pathways_Master sheet integration');
      console.log('   ✅ Usage tracking and increment\n');
      console.log('🧪 TEST INSTRUCTIONS:\n');
      console.log('1. Refresh Google Sheet (F5)');
      console.log('2. Check that existing functionality still works');
      console.log('3. Open Extensions → Apps Script');
      console.log('4. Verify you see Phase2_Pathway_Discovery_UI in left sidebar');
      console.log('5. Click on it and verify code is there\n');
      console.log('Note: UI buttons will appear in baby step 3.\n');
      console.log('If everything looks good, let me know and we\'ll proceed to step 3!\n');
    } else {
      console.log('❌ DEPLOYMENT FAILED');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('Phase2_Pathway_Discovery_UI file not found after upload.\n');
    }

  } catch (error) {
    console.error('\n❌ Deployment Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deployStep2();
