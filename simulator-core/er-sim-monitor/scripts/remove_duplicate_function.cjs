#!/usr/bin/env node

/**
 * Remove duplicate buildAIDiscoveryTabHTML_() from Phase2_Modal_Integration.gs
 *
 * Problem: Two versions exist - one in Code.gs (WITH inline handlers) and
 * one in Phase2_Modal_Integration.gs (WITHOUT inline handlers).
 * Apps Script is calling the wrong one.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function removeDuplicateFunction() {
  try {
    console.log('🔧 REMOVING DUPLICATE buildAIDiscoveryTabHTML_() FUNCTION\n');
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

    console.log(`📋 Script ID: ${scriptId}\n`);

    const content = await script.projects.getContent({ scriptId });
    const modalFile = content.data.files.find(f => f.name === 'Phase2_Modal_Integration');

    if (!modalFile) {
      throw new Error('Phase2_Modal_Integration.gs not found');
    }

    let source = modalFile.source;
    const originalSize = (source.length / 1024).toFixed(1);

    console.log(`   Original size: ${originalSize} KB\n`);

    // Remove buildAIDiscoveryTabHTML_ function
    const funcStart = source.indexOf('function buildAIDiscoveryTabHTML_() {');

    if (funcStart === -1) {
      console.log('   ℹ️  Function not found in Phase2_Modal_Integration.gs (already removed?)\n');
      return;
    }

    const funcEnd = source.indexOf('\n}\n', funcStart) + 3;

    console.log('   🗑️  Removing buildAIDiscoveryTabHTML_() function...\n');

    source = source.substring(0, funcStart) + source.substring(funcEnd);

    const newSize = (source.length / 1024).toFixed(1);
    console.log(`   New size: ${newSize} KB\n`);
    console.log(`   Removed: ${(originalSize - newSize).toFixed(1)} KB\n`);

    // Upload
    console.log('💾 Uploading...\n');

    const updatedFiles = content.data.files.map(f => {
      if (f.name === 'Phase2_Modal_Integration') {
        return { ...f, source };
      }
      return f;
    });

    await script.projects.updateContent({
      scriptId: scriptId,
      requestBody: { files: updatedFiles }
    });

    console.log('   ✅ Upload complete!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ DUPLICATE FUNCTION REMOVED!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 WHAT CHANGED:\n');
    console.log('   ❌ Removed buildAIDiscoveryTabHTML_() from Phase2_Modal_Integration.gs');
    console.log('   ✅ Now only Code.gs version (with inline handlers) will be used\n');
    console.log('🧪 TEST:\n');
    console.log('1. Refresh Google Sheet (F5)');
    console.log('2. Open: 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('3. Click AI Discovery tab');
    console.log('4. Select logic type - button should NOW become clickable!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

removeDuplicateFunction();
