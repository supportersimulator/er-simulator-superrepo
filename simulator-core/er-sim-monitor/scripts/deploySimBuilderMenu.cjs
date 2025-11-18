#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';
const CLEAN_ATSR_PATH = path.join(__dirname, '../backups/ATSR_Title_Generator_Feature_IMPROVED.gs');

console.log('\n🧠 DEPLOYING SIM BUILDER MENU\n');
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

    const cleanCode = fs.readFileSync(CLEAN_ATSR_PATH, 'utf8');
    
    console.log('📋 Unified Menu:\n');
    console.log('   🧠 Sim Builder\n');
    console.log('      └─ 🎨 ATSR Titles Optimizer\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const currentProject = await script.projects.getContent({
      scriptId: GPT_FORMATTER_ID
    });

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

    console.log('🚀 Deploying to GPT Formatter...\n');
    await script.projects.updateContent({
      scriptId: GPT_FORMATTER_ID,
      requestBody: {
        files: updatedFiles
      }
    });

    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎯 NEXT STEPS:\n');
    console.log('1. Hard refresh test spreadsheet (Cmd+Shift+R)\n');
    console.log('2. Click "🧠 Sim Builder" → "🎨 ATSR Titles Optimizer"\n');
    console.log('3. Mystery button should appear! 🎭\n');
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
