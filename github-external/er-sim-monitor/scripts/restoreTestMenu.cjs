#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const PROD_SCRIPT_ID = '1Bkbm2MNA-YmXQEoMsIlC-VgEgHiQHO2EuMXR-yyxy9lYWl3eNcEHk_S-';

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

async function restoreMenu() {
  console.log('\n🔧 RESTORING TEST MENU\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const project = await script.projects.getContent({ scriptId: PROD_SCRIPT_ID });
    const codeFile = project.data.files.find(f => f.name === 'Code');

    if (!codeFile) {
      console.log('❌ Code file not found\n');
      return;
    }

    let code = codeFile.source;

    // Replace the onOpen function to add TEST menu
    const onOpenMatch = code.match(/(function onOpen\(\) \{[\s\S]*?\n\})/);
    
    if (onOpenMatch) {
      const newOnOpen = `function onOpen() {
  const ui = getSafeUi_();
  
  // Sim Builder Menu (existing)
  ui.createMenu('🧠 Sim Builder')
    .addItem(\`\${ICONS.rocket} Launch Batch / Single (Sidebar)\`, 'openSimSidebar')
    .addSeparator()
    .addItem(\`\${ICONS.wand} ATSR — Titles & Summary\`, 'runATSRTitleGenerator')
    .addItem('📂 Categories & Pathways', 'openCategoriesPathwaysPanel')
    .addItem(\`\${ICONS.frame} Image Sync Defaults\`, 'openImageSyncDefaults')
    .addItem(\`\${ICONS.puzzle} Memory Tracker\`, 'openMemoryTracker')
    .addItem('🧪 Run Quality Audit (All / Specific Rows)', 'runQualityAudit_AllOrRows')
    .addItem('🧹 Clean Up Low-Value Rows', 'cleanUpLowValueRows')
    .addSeparator()
    .addItem('🔁 Refresh Headers', 'refreshHeaders')
    .addItem('🧠 Retrain Prompt Structure', 'retrainPromptStructure')
    .addSeparator()
    .addItem(\`\${ICONS.shield} Check API Status\`, 'checkApiStatus')
    .addItem(\`\${ICONS.gear} Settings\`, 'openSettingsPanel')
    .addToUi();
  
  // TEST Tools Menu (restored)
  ui.createMenu('🧪 TEST')
    .addItem('🎨 Titles Optimizer', 'runATSRTitleGenerator')
    .addItem('📂 Categories & Pathways', 'openCategoriesPathwaysPanel')
    .addToUi();
  
  SpreadsheetApp.getActive().toast('✅ Sim Builder + TEST menus loaded');
}`;

      code = code.replace(onOpenMatch[0], newOnOpen);
      
      console.log('✅ Updated onOpen() function with TEST menu\n');
      
      // Update the file
      codeFile.source = code;

      console.log('🚀 Deploying changes...\n');

      await script.projects.updateContent({
        scriptId: PROD_SCRIPT_ID,
        requestBody: {
          files: project.data.files
        }
      });

      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅ TEST MENU RESTORED!\n');
      console.log('📋 Menu Structure:\n');
      console.log('   🧪 TEST');
      console.log('      • 🎨 Titles Optimizer → runATSRTitleGenerator()');
      console.log('      • 📂 Categories & Pathways → openCategoriesPathwaysPanel()\n');
      console.log('🔄 NEXT STEPS:\n');
      console.log('   1. Refresh your Google Sheet');
      console.log('   2. You should now see both menus:');
      console.log('      • 🧠 Sim Builder (existing)');
      console.log('      • 🧪 TEST (restored)\n');
      console.log('═══════════════════════════════════════════════════════════════\n');

    } else {
      console.log('⚠️  Could not find onOpen() function\n');
    }

  } catch (e) {
    console.log('\n❌ Failed: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

restoreMenu().catch(console.error);
