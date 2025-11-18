#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function addScriptStartTest() {
  try {
    console.log('🔧 ADDING TEST MESSAGE AT SCRIPT START\n');
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
    const codeFile = content.data.files.find(f => f.name === 'Code');

    let code = codeFile.source;
    const originalSize = (code.length / 1024).toFixed(1);

    // Add console.log at the very start of the <script> tag
    const scriptStartMarker = "'  <script>' +\n'    function showCategories";
    
    if (code.indexOf(scriptStartMarker) === -1) {
      throw new Error('Could not find script start marker');
    }

    const newScriptStart = "'  <script>' +\n'    console.log(\"🧪 SCRIPT TAG LOADED - buildBirdEyeViewUI_\");' +\n'    function showCategories";

    code = code.replace(scriptStartMarker, newScriptStart);
    console.log('   ✅ Added test console.log at script start\n');

    const modifiedSize = (code.length / 1024).toFixed(1);
    console.log(`   Code.gs size: ${originalSize} KB → ${modifiedSize} KB\n`);

    // Upload
    console.log('💾 Uploading...\n');

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
    console.log('✅ TEST MESSAGE ADDED!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🧪 TEST:\n');
    console.log('1. Refresh Google Sheet (F5)');
    console.log('2. Open modal');
    console.log('3. Open console (F12)');
    console.log('4. You should immediately see: "🧪 SCRIPT TAG LOADED - buildBirdEyeViewUI_"');
    console.log('5. If you DON\'T see it, the <script> tag isn\'t running at all');
    console.log('6. If you DO see it, but not the Discovery messages, timing issue\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

addScriptStartTest();
