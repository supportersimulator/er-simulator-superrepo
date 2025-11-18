#!/usr/bin/env node

/**
 * Add missing test functions to TEST Tools menu
 * The functions exist but aren't in the menu
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';
const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

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

async function addTestFunctions() {
  console.log('\n🔧 ADDING TEST FUNCTIONS TO MENU\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Pull current TEST project
    console.log('📥 Pulling current TEST Code.gs...\n');
    const testProject = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const codeFile = testProject.data.files.find(f => f.name === 'Code');
    const phase2File = testProject.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');
    const manifestFile = testProject.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log(`   Current size: ${Math.round(code.length / 1024)} KB\n`);

    // Check if test functions exist
    const hasTestBatch = code.includes('function testBatchProcessRow3');
    const hasTestLive = code.includes('function testLiveLogging');
    const hasTestMode = code.includes('function testBatchModeFlag');

    console.log('📋 Test functions found:\n');
    console.log(`   ${hasTestBatch ? '✅' : '❌'} testBatchProcessRow3()`);
    console.log(`   ${hasTestLive ? '✅' : '❌'} testLiveLogging()`);
    console.log(`   ${hasTestMode ? '✅' : '❌'} testBatchModeFlag()`);
    console.log('');

    if (!hasTestBatch || !hasTestLive || !hasTestMode) {
      console.log('❌ Some test functions are missing from code!\n');
      console.log('   Cannot add to menu without functions.\n');
      return;
    }

    // Replace TEST Tools menu
    console.log('🔧 Updating TEST Tools menu...\n');

    const newTestToolsMenu = `  ui.createMenu('TEST Tools')
    .addItem('🧪 Test Batch Process Row 3', 'testBatchProcessRow3')
    .addItem('📊 Test Live Logging', 'testLiveLogging')
    .addItem('🔍 Test Batch Mode Flag', 'testBatchModeFlag')
    .addSeparator()
    .addItem('🧪 Run Cache Test (TEST ONLY)', 'runCacheTestWithLogs')
    .addToUi();`;

    // Find and replace existing TEST Tools menu
    const testToolsRegex = /ui\.createMenu\('TEST Tools'\)[\s\S]*?\.addToUi\(\);/;

    if (!testToolsRegex.test(code)) {
      console.log('❌ Could not find TEST Tools menu in code!\n');
      return;
    }

    code = code.replace(testToolsRegex, newTestToolsMenu);

    console.log('✅ Menu updated with all test functions\n');

    // Deploy
    console.log('🚀 Deploying updated Code.gs to TEST...\n');

    const files = [manifestFile, { name: 'Code', type: 'SERVER_JS', source: code }, phase2File];

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
    console.log('   • 🧪 Run Cache Test (TEST ONLY)\n');
    console.log('🔄 Refresh TEST spreadsheet to see updated menu!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) console.log(e.stack);
  }
}

addTestFunctions().catch(console.error);
