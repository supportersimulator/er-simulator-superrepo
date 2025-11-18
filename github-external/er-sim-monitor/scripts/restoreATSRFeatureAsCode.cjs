#!/usr/bin/env node

/**
 * RESTORE ATSR_Title_Generator_Feature.gs as Code.gs
 * This has the correct TEST Tools menu with:
 * - ATSR Titles Optimizer (v2)
 * - Pathway Chain Builder
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

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

async function restore() {
  console.log('\n🔄 RESTORING ATSR_Title_Generator_Feature.gs AS Code.gs\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Load ATSR feature file
    const atsrPath = path.join(__dirname, '../backups/lost-and-found-20251105-203821/ATSR_Title_Generator_Feature.gs');
    const code = fs.readFileSync(atsrPath, 'utf8');

    console.log(`✅ Loaded ATSR_Title_Generator_Feature.gs: ${Math.round(code.length / 1024)} KB\n`);
    console.log('📋 This file contains:\n');
    console.log('   • TEST Tools menu');
    console.log('   • 🎨 ATSR Titles Optimizer (v2)');
    console.log('   • 🧩 Pathway Chain Builder\n');

    // Pull current project
    console.log('📥 Pulling current TEST project...\n');
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');
    const manifestFile = project.data.files.find(f => f.name === 'appsscript');

    // Deploy
    console.log('🚀 Deploying ATSR feature as Code.gs to TEST...\n');

    const files = [
      manifestFile,
      { name: 'Code', type: 'SERVER_JS', source: code },
      phase2File
    ];

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: { files }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ ATSR FEATURE RESTORED AS Code.gs!\n');
    console.log('📋 TEST Tools menu now has:\n');
    console.log('   • 🎨 ATSR Titles Optimizer (v2)');
    console.log('   • 🧩 Pathway Chain Builder\n');
    console.log('🔄 Refresh TEST spreadsheet to see the TEST Tools menu!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) console.log(e.stack);
  }
}

restore().catch(console.error);
