#!/usr/bin/env node

/**
 * Deploy Categories & Pathways Panel to Google Apps Script
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SCRIPT_ID = '1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6';
const CATEGORIES_PANEL_PATH = path.join(__dirname, 'CategoriesPathwaysPanel_Light.gs');

async function deployCategories() {
  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log('   📂 DEPLOYING CATEGORIES & PATHWAYS PANEL');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  // Read categories panel code
  console.log('📖 Reading Categories panel code...');
  const categoriesCode = fs.readFileSync(CATEGORIES_PANEL_PATH, 'utf8');
  console.log(`   ✅ Loaded ${categoriesCode.length} characters`);
  console.log('');

  // Authenticate
  console.log('🔐 Authenticating...');
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);
  console.log('   ✅ Authenticated');
  console.log('');

  const script = google.script({version: 'v1', auth: oAuth2Client});

  // Get current project
  console.log('📥 Fetching current Apps Script project...');
  const project = await script.projects.getContent({scriptId: SCRIPT_ID});
  console.log(`   ✅ Found ${project.data.files.length} files`);
  console.log('');

  // Read current Code.gs
  const codeFile = project.data.files.find(f => f.name === 'Code');
  let currentCode = codeFile.source;

  // Append categories panel code (it's designed to be standalone)
  const updatedCode = currentCode + '\n\n' + categoriesCode;

  // Also need to add menu item to onOpen function
  const lines = updatedCode.split('\n');
  const atsrIdx = lines.findIndex(line => line.includes("addItem(`${ICONS.wand} ATSR"));

  if (atsrIdx !== -1) {
    const menuItem = "    .addItem('📂 Categories & Pathways', 'openCategoriesPathwaysPanel')";
    lines.splice(atsrIdx + 1, 0, menuItem);
    console.log('✅ Added menu item to Google Sheets menu');
  }

  const finalCode = lines.join('\n');

  // Update files
  const updatedFiles = project.data.files.map(file => {
    if (file.name === 'Code') {
      return {
        name: file.name,
        type: file.type,
        source: finalCode
      };
    }
    return file;
  });

  // Push update
  console.log('⬆️  Pushing changes to Google Apps Script...');
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: {
      files: updatedFiles
    }
  });

  console.log('   ✅ Categories panel deployed!');
  console.log('');

  console.log('════════════════════════════════════════════════════');
  console.log('✅ DEPLOYMENT COMPLETE');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  console.log('📋 Your Google Sheets menu now has:');
  console.log('   ✅ ATSR — Titles & Summary (light grey, no Case_ID)');
  console.log('   ✅ Categories & Pathways (light grey, full featured)');
  console.log('');

  console.log('🧪 Test it now:');
  console.log('   1. Open your Google Sheet');
  console.log('   2. Refresh the page (Cmd+R)');
  console.log('   3. Click: 🧠 Sim Builder → 📂 Categories & Pathways');
  console.log('   4. Explore the interactive panel!');
  console.log('');
}

deployCategories().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
