#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function addCacheBuster() {
  try {
    console.log('🔧 ADDING CACHE BUSTER TO FORCE BROWSER RELOAD\n');
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
    const codeFile = content.data.files.find(f => f.name === 'Code');

    let code = codeFile.source;
    const originalSize = (code.length / 1024).toFixed(1);

    console.log(`   Current Code.gs: ${originalSize} KB\n`);

    // Find buildBirdEyeViewUI_ and add a cache-busting timestamp comment at the top of HTML
    const htmlStartMarker = "return '<!DOCTYPE html>' +";
    const htmlStartIdx = code.indexOf(htmlStartMarker);
    
    if (htmlStartIdx === -1) {
      throw new Error('Could not find HTML start in buildBirdEyeViewUI_');
    }

    const timestamp = new Date().toISOString();
    const cacheBuster = `return '<!DOCTYPE html>' +\n'<!-- Cache Buster: ${timestamp} -->' +`;

    code = code.replace(htmlStartMarker, cacheBuster);
    console.log(`   ✅ Added cache buster comment: ${timestamp}\n`);

    const modifiedSize = (code.length / 1024).toFixed(1);
    console.log(`   Code.gs size: ${originalSize} KB → ${modifiedSize} KB\n`);

    // Upload
    console.log('💾 Uploading with cache buster...\n');

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
    console.log('✅ CACHE BUSTER ADDED!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🧪 TEST INSTRUCTIONS:\n');
    console.log('1. Close the modal (X button)');
    console.log('2. Refresh Google Sheet (F5)');
    console.log('3. Open: 🧠 Sim Builder → 🧩 Categories & Pathways');
    console.log('4. Click AI Discovery tab');
    console.log('5. Open console (F12)');
    console.log('6. Select logic type - should work now!\n');
    console.log('📊 CACHE BUSTER:\n');
    console.log(`   HTML now has: <!-- Cache Buster: ${timestamp} -->`);
    console.log('   This forces browser to reload fresh HTML\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

addCacheBuster();
