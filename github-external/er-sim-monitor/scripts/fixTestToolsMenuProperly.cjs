#!/usr/bin/env node

/**
 * PROPERLY fix TEST Tools menu to include all three test functions
 * The functions exist but aren't in the menu
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

async function fixMenu() {
  console.log('\n🔧 FIXING TEST TOOLS MENU (ALL 3 TEST FUNCTIONS)\n');
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

    // Verify all three test functions exist
    const hasTestBatch = code.includes('function testBatchProcessRow3');
    const hasTestLive = code.includes('function testLiveLogging');
    const hasTestMode = code.includes('function testBatchModeFlag');

    console.log('📋 Checking test functions:\n');
    console.log(`   ${hasTestBatch ? '✅' : '❌'} testBatchProcessRow3()`);
    console.log(`   ${hasTestLive ? '✅' : '❌'} testLiveLogging()`);
    console.log(`   ${hasTestMode ? '✅' : '❌'} testBatchModeFlag()`);
    console.log('');

    if (!hasTestBatch || !hasTestLive || !hasTestMode) {
      console.log('❌ Some test functions are missing from code!\n');
      return;
    }

    // Find the exact section to replace
    console.log('🔧 Replacing TEST Tools menu in IIFE...\n');

    const oldTestToolsMenu = `  // TEST Tools menu (for cache diagnostics)
  ui.createMenu('TEST Tools')
    .addItem('🧪 Run Cache Test (TEST ONLY)', 'runCacheTestWithLogs')
    .addToUi();`;

    const newTestToolsMenu = `  // TEST Tools menu (for batch processing diagnostics)
  ui.createMenu('TEST Tools')
    .addItem('🧪 Test Batch Process Row 3', 'testBatchProcessRow3')
    .addItem('📊 Test Live Logging', 'testLiveLogging')
    .addItem('🔍 Test Batch Mode Flag', 'testBatchModeFlag')
    .addSeparator()
    .addItem('🧪 Run Cache Test (TEST ONLY)', 'runCacheTestWithLogs')
    .addToUi();`;

    if (!code.includes(oldTestToolsMenu)) {
      console.log('❌ Could not find exact TEST Tools menu code!\n');
      console.log('Searching for it...\n');

      // Try to find it with regex
      const testToolsRegex = /\/\/ TEST Tools menu.*?\n\s*ui\.createMenu\('TEST Tools'\)[\s\S]*?\.addToUi\(\);/;
      const match = code.match(testToolsRegex);

      if (match) {
        console.log('Found TEST Tools menu:\n');
        console.log(match[0]);
        console.log('\nReplacing...\n');
        code = code.replace(testToolsRegex, newTestToolsMenu);
      } else {
        console.log('❌ Cannot find TEST Tools menu at all!\n');
        return;
      }
    } else {
      code = code.replace(oldTestToolsMenu, newTestToolsMenu);
    }

    console.log('✅ Menu code updated\n');

    // Deploy
    console.log('🚀 Deploying updated Code.gs to TEST...\n');

    const files = [manifestFile, { name: 'Code', type: 'SERVER_JS', source: code }, phase2File];

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: { files }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ TEST TOOLS MENU FIXED!\n');
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

fixMenu().catch(console.error);
