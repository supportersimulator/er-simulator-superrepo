#!/usr/bin/env node

/**
 * Deploy Ultimate Categorization Tool - COMPLETE VERSION
 * Deploys all phases: 2A-2G (Categorize, Browse, Settings, AI Suggestions)
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/script.projects'];
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');
const CODE_FILE = path.join(__dirname, '..', 'apps-script-deployable', 'Ultimate_Categorization_Tool_Complete.gs');

// Get Script ID from .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function deployCompleteVersion() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 DEPLOYING ULTIMATE CATEGORIZATION TOOL - COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (!SCRIPT_ID) {
    console.error('❌ ERROR: APPS_SCRIPT_ID not found in .env');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log('   Script ID: ' + SCRIPT_ID);
  console.log('   File: Ultimate_Categorization_Tool_Complete.gs');
  console.log('');

  // Read complete file
  console.log('📖 Reading complete tool file...');
  const code = fs.readFileSync(CODE_FILE, 'utf8');
  const lineCount = code.split('\n').length;
  console.log('   ✅ Loaded: ' + lineCount + ' lines');
  console.log('');

  // Load credentials
  console.log('🔑 Loading credentials...');
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  console.log('   ✅ Credentials loaded');
  console.log('');

  const script = google.script({ version: 'v1', auth: oAuth2Client });

  // Get current project
  console.log('🔍 Fetching current project...');
  const currentProject = await script.projects.get({ scriptId: SCRIPT_ID });
  console.log('   ✅ Project: ' + currentProject.data.title);
  console.log('');

  // Get existing content to preserve ALL files
  console.log('📋 Reading current project content...');
  const currentContent = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const existingFiles = currentContent.data.files;

  console.log('   ✅ Found ' + existingFiles.length + ' existing files:');
  existingFiles.forEach(f => {
    console.log('      - ' + f.name + (f.type === 'JSON' ? ' (manifest)' : '.gs'));
  });
  console.log('');

  // Filter out the file we're replacing, keep all others
  const preservedFiles = existingFiles.filter(f =>
    f.name !== 'Ultimate_Categorization_Tool'
  );

  console.log('📝 Preparing deployment...');
  console.log('   Preserving ' + preservedFiles.length + ' existing files');
  console.log('   Updating: Ultimate_Categorization_Tool.gs (' + lineCount + ' lines)');

  // Include new file + all preserved files
  const newContent = {
    scriptId: SCRIPT_ID,
    resource: {
      files: [
        {
          name: 'Ultimate_Categorization_Tool',
          type: 'SERVER_JS',
          source: code
        },
        ...preservedFiles  // Preserve ALL other existing files
      ]
    }
  };

  console.log('');

  // Deploy
  console.log('🚀 Deploying to Apps Script...');
  await script.projects.updateContent(newContent);
  console.log('   ✅ Deployment successful!');
  console.log('');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 DEPLOYMENT COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('✅ All Phases Deployed:');
  console.log('   Phase 2A-2D: AI Categorization, Apply, Export, Clear');
  console.log('   Phase 2E: Browse by Symptom/System');
  console.log('   Phase 2F: Settings & Category Management');
  console.log('   Phase 2G: AI-Powered Category Suggestions');
  console.log('');

  console.log('📋 Next Steps:');
  console.log('   1. Open your Google Sheet');
  console.log('   2. Refresh the page (F5)');
  console.log('   3. Go to: Sim Builder > 🤖 Ultimate Categorization Tool');
  console.log('   4. Test all 4 tabs:');
  console.log('      - Tab 1: Categorize (verify existing functionality)');
  console.log('      - Tab 2: Browse by Symptom (NEW)');
  console.log('      - Tab 3: Browse by System (NEW)');
  console.log('      - Tab 4: Settings (NEW - Category Management & AI Suggestions)');
  console.log('');

  console.log('📖 Documentation:');
  console.log('   - COMPLETE_TOOL_DEPLOYMENT_GUIDE.md');
  console.log('   - TESTING_GUIDE_COMPLETE.md');
  console.log('');
}

deployCompleteVersion().catch(console.error);
