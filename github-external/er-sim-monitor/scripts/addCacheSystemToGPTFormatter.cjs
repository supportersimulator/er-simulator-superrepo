#!/usr/bin/env node

/**
 * ADD ADVANCED CACHE SYSTEM TO GPT FORMATTER
 * Integrate cache management into unified Sim Builder menu
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';
const CACHE_SYSTEM_ID = 'AKfycbwMAP8iJY8KongJhcHYS2mQyq8dauFu3O-33kAFArxpCt7txJE_lF1s7mS3kpniWOwq';

console.log('\n🗄️  ADDING ADVANCED CACHE SYSTEM TO GPT FORMATTER\n');
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

    console.log('📥 Downloading Advanced Cache System code...\n');

    // Download cache system code
    const cacheProject = await script.projects.getContent({
      scriptId: CACHE_SYSTEM_ID
    });

    const cacheCodeFile = cacheProject.data.files.find(f => f.name === 'Code');
    
    if (!cacheCodeFile) {
      console.log('❌ No Code.gs found in Cache System project\n');
      return;
    }

    const cacheCode = cacheCodeFile.source;
    console.log(`   ✅ Cache System: ${(cacheCode.length / 1024).toFixed(1)} KB\n`);

    // Download current GPT Formatter code
    console.log('📥 Downloading current GPT Formatter code...\n');

    const gptProject = await script.projects.getContent({
      scriptId: GPT_FORMATTER_ID
    });

    const gptCodeFile = gptProject.data.files.find(f => f.name === 'Code');
    const currentCode = gptCodeFile.source;

    console.log(`   Current GPT Formatter: ${(currentCode.length / 1024).toFixed(1)} KB\n`);

    // Update the onOpen function to include cache management
    console.log('🔨 Updating menu to include Cache Management...\n');

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

    // Replace old onOpen with new one
    const newCode = currentCode.replace(
      /\/\/ Custom menu.*?^}/ms,
      updatedMenu
    );

    // Add cache system code at the end
    const combinedCode = `${newCode}

// ==================== ADVANCED CACHE SYSTEM ====================

${cacheCode}
`;

    console.log(`   📦 New combined size: ${(combinedCode.length / 1024).toFixed(1)} KB\n`);

    // Update GPT Formatter
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

    console.log('🚀 Deploying to GPT Formatter...\n');

    await script.projects.updateContent({
      scriptId: GPT_FORMATTER_ID,
      requestBody: {
        files: updatedFiles
      }
    });

    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📋 UNIFIED MENU: 🧠 Sim Builder\n');
    console.log('   1. 🎨 ATSR Titles Optimizer\n');
    console.log('   2. 🧩 Categories & Pathways\n');
    console.log('   3. 🗄️ Cache Management (submenu)\n');
    console.log('      ├─ 📦 Cache All Layers\n');
    console.log('      ├─ 📊 Cache Layers 1-7\n');
    console.log('      ├─ 📊 View Cache Status\n');
    console.log('      ├─ 🔄 Refresh Headers\n');
    console.log('      └─ 🧹 Clear All Cache\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎯 NEXT STEPS:\n');
    console.log('1. Delete the separate "Advanced Cache System" project\n');
    console.log('2. Refresh test spreadsheet (Cmd+Shift+R)\n');
    console.log('3. All tools now under single "🧠 Sim Builder" menu!\n');
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
