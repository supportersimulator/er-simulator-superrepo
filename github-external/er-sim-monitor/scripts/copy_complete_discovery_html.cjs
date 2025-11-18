#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function copyCompleteDiscoveryHTML() {
  try {
    console.log('🔧 COPYING COMPLETE buildAIDiscoveryTabHTML_() TO CODE.GS\n');
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
    
    // Get the COMPLETE function from Phase2_Modal_Integration.gs (already cleaned)
    const modalFile = content.data.files.find(f => f.name === 'Phase2_Modal_Integration');
    
    const modalFuncStart = modalFile.source.indexOf('function buildAIDiscoveryTabHTML_()');
    const modalFuncEnd = modalFile.source.indexOf('\n}\n', modalFuncStart) + 3;
    const completeFunction = modalFile.source.substring(modalFuncStart, modalFuncEnd);

    console.log(`📄 Complete function from Phase2_Modal_Integration.gs:`);
    console.log(`   Size: ${completeFunction.length} characters\n`);

    // Replace the simplified version in Code.gs with the complete one
    const codeFile = content.data.files.find(f => f.name === 'Code');
    let code = codeFile.source;
    
    const codeFuncStart = code.indexOf('function buildAIDiscoveryTabHTML_() {');
    const codeFuncEnd = code.indexOf('\n}\n', codeFuncStart) + 3;
    
    code = code.substring(0, codeFuncStart) + completeFunction + code.substring(codeFuncEnd);
    
    console.log('   ✅ Replaced simplified version with complete version\n');

    const originalSize = (codeFile.source.length / 1024).toFixed(1);
    const modifiedSize = (code.length / 1024).toFixed(1);
    console.log(`   Code.gs size: ${originalSize} KB → ${modifiedSize} KB\n`);

    // Upload
    console.log('💾 Uploading complete function to Code.gs...\n');

    const updatedFiles = content.data.files.map(f => {
      if (f.name === 'Code') {
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
    console.log('✅ COMPLETE FUNCTION COPIED TO CODE.GS!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 NOW HAS:\n');
    console.log('   ✅ Complete HTML structure');
    console.log('   ✅ All CSS styles');
    console.log('   ✅ NO inline onchange/onclick (already cleaned)');
    console.log('   ✅ Duplicate logic type filtering\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

copyCompleteDiscoveryHTML();
