#!/usr/bin/env node

/**
 * Add EKG Tool Submenu to Sim Builder Menu
 * Consolidates waveform mapping functions under single menu item
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function addEKGToolMenu() {
  console.log('🫀 Adding EKG Tool submenu to Sim Builder\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const projectResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = projectResponse.data.files;

    // Find Code.gs
    const codeIndex = files.findIndex(f => f.name === 'Code');
    if (codeIndex === -1) {
      throw new Error('Code.gs not found!');
    }

    let codeContent = files[codeIndex].source;
    const lines = codeContent.split('\n');

    // Find the onOpen function
    let menuStartLine = -1;
    let menuEndLine = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('function onOpen()')) {
        menuStartLine = i;
      }
      if (menuStartLine > -1 && lines[i].includes('menu.addToUi()')) {
        menuEndLine = i;
        break;
      }
    }

    if (menuStartLine === -1 || menuEndLine === -1) {
      throw new Error('Could not find onOpen() menu structure');
    }

    console.log('📍 Found menu structure:');
    console.log(`   Lines ${menuStartLine + 1}-${menuEndLine + 1}\n`);

    // Find the line before menu.addToUi()
    const insertLine = menuEndLine;

    // Build the new submenu code
    const ekgSubmenu = `
  // EKG Waveform Tools
  menu.addSubMenu(ui.createMenu('🫀 EKG Tool')
    .addItem('💡 Suggest Waveform Mapping', 'suggestWaveformMapping')
    .addItem('🔄 Auto-Map All Waveforms', 'autoMapAllWaveforms')
    .addSeparator()
    .addItem('📊 Analyze Current Mappings', 'analyzeCurrentMappings')
    .addItem('❌ Clear All Waveforms', 'clearAllWaveforms')
  );
`;

    // Insert before menu.addToUi()
    lines.splice(insertLine, 0, ekgSubmenu);

    // Update the file
    files[codeIndex].source = lines.join('\n');

    console.log('✅ Adding EKG Tool submenu with items:');
    console.log('   💡 Suggest Waveform Mapping');
    console.log('   🔄 Auto-Map All Waveforms');
    console.log('   📊 Analyze Current Mappings');
    console.log('   ❌ Clear All Waveforms\n');

    // Deploy
    console.log('🚀 Deploying to Apps Script...\n');

    await script.projects.updateContent({
      scriptId: SCRIPT_ID,
      requestBody: {
        files: files
      }
    });

    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('📋 Updated Menu Structure:\n');
    console.log('🧠 Sim Builder');
    console.log('  ├─ 🎨 ATSR Titles Optimizer');
    console.log('  ├─ 🧩 Categories & Pathways');
    console.log('  ├─ 🤖 Ultimate Categorization Tool');
    console.log('  ├─ ─────────────────────');
    console.log('  ├─ 🚀 Batch Processing');
    console.log('  ├─ ─────────────────────');
    console.log('  ├─ 🗄️ Cache Management (submenu)');
    console.log('  └─ 🫀 EKG Tool (submenu) ⬅️ NEW!');
    console.log('      ├─ 💡 Suggest Waveform Mapping');
    console.log('      ├─ 🔄 Auto-Map All Waveforms');
    console.log('      ├─ ─────────────────────');
    console.log('      ├─ 📊 Analyze Current Mappings');
    console.log('      └─ ❌ Clear All Waveforms\n');
    console.log('🧪 TESTING INSTRUCTIONS:\n');
    console.log('  1. Open your Google Sheet');
    console.log('  2. Refresh the page (F5)');
    console.log('  3. Click: Sim Builder > 🫀 EKG Tool');
    console.log('  4. Verify all 4 menu items appear');
    console.log('  5. Test each function\n');
    console.log('══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Deployment Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

addEKGToolMenu();
