#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function fixPhase2ModalIntegration() {
  try {
    console.log('🔧 FIX: Remove inline handlers from Phase2_Modal_Integration.gs\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');

    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const scriptId = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

    const content = await script.projects.getContent({ scriptId });
    const modalFile = content.data.files.find(f => f.name === 'Phase2_Modal_Integration');

    if (!modalFile) {
      console.log('❌ Phase2_Modal_Integration.gs not found\n');
      return;
    }

    let code = modalFile.source;
    const originalSize = (code.length / 1024).toFixed(1);

    console.log(`   Current file: ${originalSize} KB\n`);

    // Remove onchange from select
    code = code.replace(
      'onchange="handleLogicTypeChange()"',
      ''
    );

    // Remove onclick from button  
    code = code.replace(
      'onclick="discoverPathways()"',
      ''
    );

    // Remove onclick from clear button
    code = code.replace(
      'onclick="clearDiscoveryResults()"',
      ''
    );

    // Remove onclick from footer buttons
    code = code.replace(
      /onclick="viewLogicTypeLibrary\(\)"/g,
      ''
    );

    code = code.replace(
      /onclick="viewPathwaysMaster\(\)"/g,
      ''
    );

    const modifiedSize = (code.length / 1024).toFixed(1);
    console.log(`   File size: ${originalSize} KB → ${modifiedSize} KB\n`);

    // Upload
    console.log('💾 Uploading fixed Phase2_Modal_Integration.gs...\n');

    const updatedFiles = content.data.files.map(f => {
      if (f.name === 'Phase2_Modal_Integration') {
        return { ...f, source: code };
      }
      return f;
    });

    await script.projects.updateContent({
      scriptId: scriptId,
      requestBody: { files: updatedFiles }
    });

    console.log('   ✅ Upload complete!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Phase2_Modal_Integration.gs CLEANED!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Note: This file is NOT actually used (Code.gs has buildAIDiscoveryTabHTML_)');
    console.log('But cleaning it anyway to avoid confusion.\n');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

fixPhase2ModalIntegration();
