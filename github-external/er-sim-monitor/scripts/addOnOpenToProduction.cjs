#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 ADDING onOpen FUNCTION TO PRODUCTION\n');
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

async function addOnOpen() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('📝 Adding onOpen function...\n');

    const onOpenFunction = `// ═══════════════════════════════════════════════════════════════
// MENU INITIALIZATION
// ═══════════════════════════════════════════════════════════════

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('🧠 Sim Builder');

  // Core Tools
  menu.addItem('🎨 ATSR Titles Optimizer', 'runATSRTitleGenerator');
  menu.addItem('🧩 Categories & Pathways', 'runPathwayChainBuilder');
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
}

`;

    // Prepend to code
    code = onOpenFunction + '\n' + code;

    console.log('✅ Added onOpen function\n');

    // Deploy
    console.log('📤 Deploying...\n');

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
    console.log('🎉 onOpen FUNCTION ADDED!\n');
    console.log('\nNext steps:\n');
    console.log('   1. Refresh your spreadsheet (Cmd+Shift+R)\n');
    console.log('   2. Wait 10-15 seconds\n');
    console.log('   3. Look for "🧠 Sim Builder" menu\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

addOnOpen();
