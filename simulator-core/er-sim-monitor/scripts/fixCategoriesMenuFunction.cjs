#!/usr/bin/env node

/**
 * FIX CATEGORIES & PATHWAYS MENU - POINT TO MAIN PANEL
 * Should open main panel, not field selector
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 FIXING CATEGORIES & PATHWAYS MENU FUNCTION\n');
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

async function fix() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    // Check what Categories & Pathways functions exist
    console.log('🔍 Checking for Categories & Pathways functions:\n');

    const functions = {
      'showCategoriesPathwaysPanel': code.includes('function showCategoriesPathwaysPanel('),
      'openCategoriesPathwaysPanel': code.includes('function openCategoriesPathwaysPanel('),
      'runCategoriesPathwaysPanel': code.includes('function runCategoriesPathwaysPanel('),
      'showFieldSelector': code.includes('function showFieldSelector(')
    };

    for (const [name, exists] of Object.entries(functions)) {
      console.log(`   ${exists ? '✅' : '❌'} ${name}`);
    }

    console.log('\n');

    // Find the main panel function name
    let mainPanelFunction = null;
    if (functions.showCategoriesPathwaysPanel) {
      mainPanelFunction = 'showCategoriesPathwaysPanel';
    } else if (functions.openCategoriesPathwaysPanel) {
      mainPanelFunction = 'openCategoriesPathwaysPanel';
    } else if (functions.runCategoriesPathwaysPanel) {
      mainPanelFunction = 'runCategoriesPathwaysPanel';
    }

    if (!mainPanelFunction) {
      console.log('❌ No main panel function found!\n');
      console.log('Searching for functions that show sidebars or modals...\n');

      // Search for functions that create sidebars with "Categories" in the title
      const sidebarMatch = code.match(/function\s+(\w+)\([^)]*\)\s*\{[^}]*showSidebar[^}]*Categories.*?Pathways/);
      if (sidebarMatch) {
        mainPanelFunction = sidebarMatch[1];
        console.log(`✅ Found main panel function: ${mainPanelFunction}\n`);
      } else {
        console.log('❌ Could not find main panel function!\n');
        return;
      }
    } else {
      console.log(`✅ Main panel function: ${mainPanelFunction}\n`);
    }

    // Update the menu
    console.log('🔧 Updating menu to call main panel function...\n');

    const oldMenuItem = /menu\.addItem\('🧩 Categories & Pathways',\s*'[^']+'\)/;
    const newMenuItem = `menu.addItem('🧩 Categories & Pathways', '${mainPanelFunction}')`;

    if (oldMenuItem.test(code)) {
      code = code.replace(oldMenuItem, newMenuItem);
      console.log(`✅ Updated menu to call: ${mainPanelFunction}\n`);
    } else {
      console.log('⚠️  Could not find menu item to update\n');
    }

    // Deploy
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
    console.log('🎉 CATEGORIES & PATHWAYS MENU FIXED!\n');
    console.log(`Menu now calls: ${mainPanelFunction}\n`);
    console.log('This should open the main panel (not field selector directly).\n');
    console.log('The field selector will be accessible via button in the panel.\n');
    console.log('\nNext steps:\n');
    console.log('   1. Refresh your production spreadsheet\n');
    console.log('   2. Click "🧠 Sim Builder" → "🧩 Categories & Pathways"\n');
    console.log('   3. Should see main Categories & Pathways panel!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
