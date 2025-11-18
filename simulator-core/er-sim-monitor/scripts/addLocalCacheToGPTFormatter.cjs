#!/usr/bin/env node

/**
 * ADD LOCAL CACHE SYSTEM FILES TO GPT FORMATTER
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n🗄️  ADDING CACHE SYSTEM TO GPT FORMATTER\n');
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

async function integrate() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📖 Loading local cache system files...\n');

    const cacheEnrichmentPath = path.join(__dirname, '../apps-script-deployable/Multi_Step_Cache_Enrichment.gs');
    const cacheUIPath = path.join(__dirname, '../apps-script-deployable/Multi_Step_Cache_UI.gs');

    const cacheEnrichment = fs.readFileSync(cacheEnrichmentPath, 'utf8');
    const cacheUI = fs.readFileSync(cacheUIPath, 'utf8');

    console.log(`   ✅ Cache Enrichment: ${(cacheEnrichment.length / 1024).toFixed(1)} KB`);
    console.log(`   ✅ Cache UI: ${(cacheUI.length / 1024).toFixed(1)} KB\n`);

    // Download current GPT Formatter
    console.log('📥 Downloading current GPT Formatter code...\n');

    const gptProject = await script.projects.getContent({
      scriptId: GPT_FORMATTER_ID
    });

    const gptCodeFile = gptProject.data.files.find(f => f.name === 'Code');
    const currentCode = gptCodeFile.source;

    console.log(`   Current: ${(currentCode.length / 1024).toFixed(1)} KB\n`);

    // Update menu
    console.log('🔨 Updating menu...\n');

    const updatedMenu = `// Custom menu - unified Sim Builder
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('🧠 Sim Builder');

  // Core Tools
  menu.addItem('🎨 ATSR Titles Optimizer', 'runATSRTitleGenerator');
  menu.addItem('🧩 Categories & Pathways', 'runCategoriesPathwaysPanel');
  
  menu.addSeparator();

  // Cache Management submenu
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
    .addItem('🧹 Clear All Cache', 'clearAllCacheLayers')
  );

  menu.addToUi();
}`;

    // Replace menu
    const newCode = currentCode.replace(
      /\/\/ Custom menu.*?function onOpen\(\).*?\n\}/ms,
      updatedMenu
    );

    // Combine all code
    const combinedCode = `${newCode}

// ==================== CACHE ENRICHMENT SYSTEM ====================

${cacheEnrichment}

// ==================== CACHE UI SYSTEM ====================

${cacheUI}
`;

    console.log(`   📦 New size: ${(combinedCode.length / 1024).toFixed(1)} KB\n`);

    // Deploy
    const updatedFiles = gptProject.data.files.map(file => {
      if (file.name === 'Code') {
        return {
          name: 'Code',
          type: 'SERVER_JS',
          source: combinedCode
        };
      }
      return file;
    });

    console.log('🚀 Deploying...\n');

    await script.projects.updateContent({
      scriptId: GPT_FORMATTER_ID,
      requestBody: {
        files: updatedFiles
      }
    });

    console.log('✅ SUCCESS!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📋 COMPLETE UNIFIED MENU:\n');
    console.log('🧠 Sim Builder\n');
    console.log('├─ 🎨 ATSR Titles Optimizer\n');
    console.log('├─ 🧩 Categories & Pathways\n');
    console.log('└─ 🗄️ Cache Management\n');
    console.log('   ├─ 📦 Cache All Layers\n');
    console.log('   ├─ 📊-🌍 Cache Layers 1-7\n');
    console.log('   ├─ 📊 View Cache Status\n');
    console.log('   ├─ 🔄 Refresh Headers\n');
    console.log('   └─ 🧹 Clear All Cache\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

integrate();
