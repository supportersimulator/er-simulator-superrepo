#!/usr/bin/env node

/**
 * ADD BATCH PROCESSING TO SIM BUILDER MENU
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🚀 ADDING BATCH PROCESSING TO SIM BUILDER MENU\n');
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

async function addBatchProcessing() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`📦 Production Project: ${PRODUCTION_PROJECT_ID}\n`);

    // Download code
    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    if (!codeFile) {
      console.log('❌ No Code file found!\n');
      return;
    }

    let code = codeFile.source;

    // Find the onOpen function
    const onOpenRegex = /function onOpen\(\) \{[\s\S]*?\n\}/;
    const onOpenMatch = code.match(onOpenRegex);

    if (!onOpenMatch) {
      console.log('❌ Could not find onOpen() function!\n');
      return;
    }

    console.log('✅ Found onOpen() function\n');

    // Updated menu with batch processing
    const newOnOpen = `function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('🧠 Sim Builder');

  // Core Tools
  menu.addItem('🎨 ATSR Titles Optimizer', 'runATSRTitleGenerator');
  menu.addItem('🧩 Categories & Pathways', 'runCategoriesPathwaysPanel');
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
    console.log('🔄 Updating onOpen() function...\n');

    code = code.replace(onOpenRegex, newOnOpen);

    // Backup current version
    const backupPath = path.join(__dirname, '../backups/production-before-batch-menu-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up current version to:\n   ${backupPath}\n`);

    // Deploy updated code
    console.log('📤 Deploying updated code...\n');

    const updatedFiles = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: code
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: updatedFiles }
    });

    console.log('✅ Deployment successful!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 BATCH PROCESSING ADDED TO MENU!\n');
    console.log('New menu structure:\n');
    console.log('   🧠 Sim Builder\n');
    console.log('   ├─ 🎨 ATSR Titles Optimizer\n');
    console.log('   ├─ 🧩 Categories & Pathways\n');
    console.log('   ├─ 🚀 Batch Processing (NEW!)\n');
    console.log('   └─ 🗄️ Cache Management (submenu)\n');
    console.log('\nNext steps:\n');
    console.log('   1. Refresh your production spreadsheet\n');
    console.log('   2. Click "🧠 Sim Builder" → "🚀 Batch Processing"\n');
    console.log('   3. The batch processing sidebar should appear!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

addBatchProcessing();
