#!/usr/bin/env node

/**
 * DEPLOY CLEAN ATSR CODE TO GPT FORMATTER PROJECT
 * This is the project actually bound to the test spreadsheet
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';
const IMPROVED_ATSR_PATH = path.join(__dirname, '../backups/ATSR_Title_Generator_Feature_IMPROVED.gs');

console.log('\n🚀 DEPLOYING CLEAN ATSR TO GPT FORMATTER\n');
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

    console.log(`🎯 Target: GPT Formatter (${GPT_FORMATTER_ID})\n`);

    // Download current code
    console.log('📥 Downloading current GPT Formatter code...\n');
    const currentProject = await script.projects.getContent({
      scriptId: GPT_FORMATTER_ID
    });

    // Backup current code
    const currentCodeFile = currentProject.data.files.find(f => f.name === 'Code');
    if (currentCodeFile) {
      const backupPath = path.join(__dirname, '../backups/gpt-formatter-before-atsr-deploy-2025-11-06.gs');
      fs.writeFileSync(backupPath, currentCodeFile.source, 'utf8');
      console.log(`💾 Backed up current code: ${backupPath}\n`);
      console.log(`   Current size: ${(currentCodeFile.source.length / 1024).toFixed(1)} KB\n`);
    }

    // Load improved ATSR code
    console.log('📖 Loading improved ATSR code...\n');
    const improvedATSR = fs.readFileSync(IMPROVED_ATSR_PATH, 'utf8');
    console.log(`   Improved ATSR size: ${(improvedATSR.length / 1024).toFixed(1)} KB\n`);

    // Replace Code.gs with improved ATSR
    const updatedFiles = currentProject.data.files.map(file => {
      if (file.name === 'Code') {
        return {
          name: 'Code',
          type: 'SERVER_JS',
          source: improvedATSR
        };
      }
      return file;
    });

    // Update the project
    console.log('🚀 Deploying to GPT Formatter...\n');
    await script.projects.updateContent({
      scriptId: GPT_FORMATTER_ID,
      requestBody: {
        files: updatedFiles
      }
    });

    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 DEPLOYMENT SUMMARY:\n');
    console.log(`   Project: GPT Formatter\n`);
    console.log(`   ID: ${GPT_FORMATTER_ID}\n`);
    console.log(`   New size: ${(improvedATSR.length / 1024).toFixed(1)} KB\n`);
    console.log('   Code: Complete ATSR with mystery button\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎯 NEXT STEPS:\n');
    console.log('1. Refresh test spreadsheet in browser\n');
    console.log('2. Click "🧠 Sim Builder" → "ATSR Titles Optimizer"\n');
    console.log('3. Mystery button should now appear and work! 🎭\n');
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
