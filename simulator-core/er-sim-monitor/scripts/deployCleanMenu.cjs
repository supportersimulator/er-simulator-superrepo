#!/usr/bin/env node

/**
 * DEPLOY CLEANED-UP MENU TO GPT FORMATTER
 * Single consolidated menu with only working features
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';
const CLEAN_ATSR_PATH = path.join(__dirname, '../backups/ATSR_Title_Generator_Feature_IMPROVED.gs');

console.log('\n🧹 DEPLOYING CLEAN CONSOLIDATED MENU\n');
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

    console.log(`🎯 Target: GPT Formatter\n`);

    // Load clean code
    const cleanCode = fs.readFileSync(CLEAN_ATSR_PATH, 'utf8');
    
    console.log('📋 New Menu Structure:\n');
    console.log('   Menu: ✨ ATSR Tools\n');
    console.log('   Items:\n');
    console.log('   - 🎨 ATSR Titles Optimizer → runATSRTitleGenerator()\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Download current project
    const currentProject = await script.projects.getContent({
      scriptId: GPT_FORMATTER_ID
    });

    // Replace Code.gs
    const updatedFiles = currentProject.data.files.map(file => {
      if (file.name === 'Code') {
        return {
          name: 'Code',
          type: 'SERVER_JS',
          source: cleanCode
        };
      }
      return file;
    });

    // Deploy
    console.log('🚀 Deploying...\n');
    await script.projects.updateContent({
      scriptId: GPT_FORMATTER_ID,
      requestBody: {
        files: updatedFiles
      }
    });

    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 CHANGES:\n');
    console.log('   ✅ Removed broken "Pathway Chain Builder" menu item\n');
    console.log('   ✅ Renamed menu to "✨ ATSR Tools" (cleaner)\n');
    console.log('   ✅ Kept only working feature: ATSR Titles Optimizer\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎯 NEXT STEPS:\n');
    console.log('1. Refresh test spreadsheet (Cmd+Shift+R or Ctrl+Shift+R)\n');
    console.log('2. You should see ONLY ONE menu: "✨ ATSR Tools"\n');
    console.log('3. Click "✨ ATSR Tools" → "🎨 ATSR Titles Optimizer"\n');
    console.log('4. Mystery button should work! 🎭\n');
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
