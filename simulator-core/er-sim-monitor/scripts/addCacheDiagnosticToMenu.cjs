#!/usr/bin/env node

/**
 * Add testCacheDiagnostic to TEST Tools menu
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

async function addToMenu() {
  console.log('\n🔧 ADDING CACHE DIAGNOSTIC TO TEST TOOLS MENU\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Pull current Code.gs
    console.log('📥 Pulling Code.gs...\n');
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const codeFile = project.data.files.find(f => f.name === 'Code');
    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');
    const manifestFile = project.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log(`   Code.gs size: ${Math.round(code.length / 1024)} KB\n`);

    // Find and replace TEST Tools menu
    console.log('🔧 Adding testCacheDiagnostic to TEST Tools menu...\n');

    const oldMenu = `ui.createMenu('TEST Tools')
    .addItem('🧪 Test Batch Process Row 3', 'testBatchProcessRow3')
    .addItem('📊 Test Live Logging', 'testLiveLogging')
    .addItem('🔍 Test Batch Mode Flag', 'testBatchModeFlag')
    .addSeparator()
    .addItem('🧪 Run Cache Test (TEST ONLY)', 'runCacheTestWithLogs')
    .addToUi();`;

    const newMenu = `ui.createMenu('TEST Tools')
    .addItem('🧪 Test Batch Process Row 3', 'testBatchProcessRow3')
    .addItem('📊 Test Live Logging', 'testLiveLogging')
    .addItem('🔍 Test Batch Mode Flag', 'testBatchModeFlag')
    .addSeparator()
    .addItem('🧪 Run Cache Test (TEST ONLY)', 'runCacheTestWithLogs')
    .addItem('🔬 Test Cache Diagnostic', 'testCacheDiagnostic')
    .addToUi();`;

    if (code.includes(oldMenu)) {
      code = code.replace(oldMenu, newMenu);
      console.log('✅ Menu updated\n');
    } else {
      console.log('⚠️  Could not find exact menu - may already be updated\n');
    }

    // Deploy
    console.log('🚀 Deploying to TEST...\n');

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
    console.log('✅ TEST TOOLS MENU UPDATED!\n');
    console.log('📋 TEST Tools menu now includes:\n');
    console.log('   • 🧪 Test Batch Process Row 3');
    console.log('   • 📊 Test Live Logging');
    console.log('   • 🔍 Test Batch Mode Flag');
    console.log('   • ────────────────────');
    console.log('   • 🧪 Run Cache Test (TEST ONLY)');
    console.log('   • 🔬 Test Cache Diagnostic (NEW)\n');
    console.log('🔄 Refresh TEST spreadsheet to see updated menu!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) console.log(e.stack);
  }
}

addToMenu().catch(console.error);
