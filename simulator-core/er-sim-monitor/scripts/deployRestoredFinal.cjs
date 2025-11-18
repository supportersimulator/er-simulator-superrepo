#!/usr/bin/env node

/**
 * Deploy Code_RESTORED_FINAL.gs
 * (Enhanced prompt + light theme + no Case_ID + Categories panel)
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SCRIPT_ID = '1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6';
const CODE_PATH = path.join(__dirname, 'Code_RESTORED_FINAL.gs');

async function deploy() {
  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log('   🚀 DEPLOYING ENHANCED ATSR (RESTORED FINAL)');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  console.log('📖 Reading Code_RESTORED_FINAL.gs...');
  const code = fs.readFileSync(CODE_PATH, 'utf8');
  console.log(`   ✅ Loaded ${code.length} characters`);

  console.log('🔐 Authenticating...');
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);
  console.log('   ✅ Authenticated');

  const script = google.script({version: 'v1', auth: oAuth2Client});

  console.log('📥 Fetching current project...');
  const project = await script.projects.getContent({scriptId: SCRIPT_ID});
  console.log(`   ✅ Found ${project.data.files.length} files`);

  const updatedFiles = project.data.files.map(file => {
    if (file.name === 'Code') {
      return { name: file.name, type: file.type, source: code };
    }
    return file;
  });

  console.log('⬆️  Pushing changes...');
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: updatedFiles }
  });

  console.log('   ✅ Deployment complete!');
  console.log('');

  console.log('════════════════════════════════════════════════════');
  console.log('✅ ENHANCED ATSR DEPLOYED');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  console.log('📋 Your ATSR now has:');
  console.log('   ✅ Rich 334-line Sim Mastery prompt');
  console.log('   ✅ Light grey theme');
  console.log('   ❌ NO Case_ID section');
  console.log('   ✅ Categories & Pathways panel');
  console.log('   ✅ Dropdown selection UI');
  console.log('');

  console.log('🧪 Test it now:');
  console.log('   1. Open Google Sheet');
  console.log('   2. Refresh page (Cmd+R)');
  console.log('   3. Click: 🧠 Sim Builder → ATSR');
  console.log('   4. Output should be high quality!');
  console.log('');
}

deploy().catch(err => {
  console.error('❌ Deploy error:', err.message);
  process.exit(1);
});
