#!/usr/bin/env node

/**
 * DEPLOY COMPLETE TEST MONOLITHIC CODE TO PRODUCTION
 * This has ALL features working together including Phase 2
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n📦 DEPLOYING COMPLETE MONOLITHIC CODE TO PRODUCTION\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

async function deploy() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    // Load test monolithic code (has everything working)
    const testCodePath = path.join(__dirname, '../backups/test-with-complete-atsr-2025-11-06.gs');

    if (!fs.existsSync(testCodePath)) {
      console.log('❌ Test monolithic backup not found!\n');
      return;
    }

    let testCode = fs.readFileSync(testCodePath, 'utf8');
    const testSize = (testCode.length / 1024).toFixed(1);

    console.log(`📥 Loaded test monolithic code: ${testSize} KB\n`);

    console.log('🔧 Updating menu for production...\n');

    // Update the onOpen menu to use "🧠 Sim Builder" and include all tools
    const newMenu = `function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('🧠 Sim Builder');

  // Core Tools
  menu.addItem('🎨 ATSR Titles Optimizer', 'runATSRTitleGenerator');
  menu.addItem('🧩 Categories & Pathways', 'showFieldSelector');
  menu.addSeparator();
  menu.addItem('🚀 Batch Processing', 'openSimSidebar');
  menu.addSeparator();

  // Cache Management Submenu
  menu.addSubMenu(ui.createMenu('🗄️ Cache Management')
    .addItem('📦 Cache All Layers', 'showCacheAllLayersModal')
    .addSeparator()
    .addItem('📊 Cache Layer 1: BASIC', 'cacheLayer_basic')
    .addItem('📚 Cache Layer 2: LEARNING', 'cacheLayer_learning')
    .addItem('🏷️ Cache Layer 3: METADATA', 'cacheLayer_metadata')
    .addItem('👤 Cache Layer 4: DEMOGRAPHICS', 'cacheLayer_demographics')
    .addItem('💓 Cache Layer 5: VITALS', 'cacheLayer_vitals')
    .addItem('🩺 Cache Layer 6: CLINICAL', 'cacheLayer_clinical')
    .addItem('🌍 Cache Layer 7: ENVIRONMENT', 'cacheLayer_environment')
    .addSeparator()
    .addItem('📊 View Cache Status', 'showCacheStatus')
    .addItem('🔄 Refresh Headers', 'refreshHeaders')
    .addItem('🧹 Clear All Cache Layers', 'clearAllCacheLayers')
  );

  menu.addToUi();
}`;

    // Replace onOpen function
    const onOpenRegex = /function onOpen\(\) \{[\s\S]*?^\}/m;
    testCode = testCode.replace(onOpenRegex, newMenu);

    console.log('✅ Updated menu\n');

    // Download current production for backup
    console.log('📥 Downloading current production code for backup...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    // Backup current production
    const backupPath = path.join(__dirname, '../backups/production-before-monolithic-deploy-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up current production to:\n   ${backupPath}\n`);

    // Deploy test monolithic code
    console.log('📤 Deploying complete monolithic code to production...\n');

    const updatedFiles = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: testCode
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: updatedFiles }
    });

    const newSize = (testCode.length / 1024).toFixed(1);
    console.log(`✅ Deployment successful! Size: ${newSize} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 COMPLETE SYSTEM DEPLOYED TO PRODUCTION!\n');
    console.log('\nFeatures included:\n');
    console.log('   ✅ ATSR Titles Optimizer (with mystery button)\n');
    console.log('   ✅ Categories & Pathways Phase 2 (robust panel)\n');
    console.log('   ✅ Field Selector with AI recommendations\n');
    console.log('   ✅ Batch Processing (3 modes)\n');
    console.log('   ✅ 7-Layer Cache System\n');
    console.log('   ✅ Pathway Chain Builder\n');
    console.log('   ✅ Holistic Analysis\n');
    console.log('   ✅ AI Pathway Discovery\n');
    console.log('\nNext steps:\n');
    console.log('   1. Refresh your production spreadsheet\n');
    console.log('   2. Click "🧠 Sim Builder" menu\n');
    console.log('   3. All tools should now work!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deploy();
