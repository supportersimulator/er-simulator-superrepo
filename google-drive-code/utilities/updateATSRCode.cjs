#!/usr/bin/env node

/**
 * Update ATSR Code - Push Model Upgrade to Google Apps Script
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { google } = require('googleapis');
require('dotenv').config();

const SCRIPT_ID = '1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6';
const FIXED_CODE_PATH = path.join(__dirname, 'Code_FIXED.gs');

async function updateScript() {
  console.log('🚀 Updating ATSR Tool in Google Apps Script\n');
  console.log('════════════════════════════════════════════════════\n');

  // Read the fixed code
  console.log('📖 Reading fixed code...');
  const fixedCode = fs.readFileSync(FIXED_CODE_PATH, 'utf8');
  console.log(`   ✅ Loaded ${fixedCode.length} characters\n`);

  // Read OAuth credentials
  console.log('🔐 Loading credentials...');
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  console.log('   ✅ Credentials loaded\n');

  // Authenticate
  console.log('🔑 Authenticating...');
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Load token
  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);
  console.log('   ✅ Authenticated\n');

  // Create Apps Script API client
  const script = google.script({version: 'v1', auth: oAuth2Client});

  // Get current project content
  console.log('📥 Fetching current project...');
  const project = await script.projects.getContent({scriptId: SCRIPT_ID});
  console.log(`   ✅ Found ${project.data.files.length} files\n`);

  // Update the Code.gs file
  console.log('📝 Updating Code.gs with model upgrade...');
  const updatedFiles = project.data.files.map(file => {
    if (file.name === 'Code') {
      return {
        name: file.name,
        type: file.type,
        source: fixedCode
      };
    }
    return file;
  });

  // Push the update
  console.log('⬆️  Pushing changes to Google Apps Script...');
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: {
      files: updatedFiles
    }
  });

  console.log('   ✅ Code updated successfully!\n');

  console.log('════════════════════════════════════════════════════');
  console.log('✅ UPGRADE COMPLETE');
  console.log('════════════════════════════════════════════════════\n');

  console.log('🎯 What changed:');
  console.log('   ❌ OLD: gpt-4o-mini (weak model)');
  console.log('   ✅ NEW: gpt-4o (powerful model)');
  console.log('   ✅ Max tokens: 3000 → 4000\n');

  console.log('🧪 Test it now:');
  console.log('   1. Open your Google Sheet');
  console.log('   2. Refresh the page (Cmd+R)');
  console.log('   3. Click: ER Simulator → ATSR — Titles & Summary');
  console.log('   4. Enter row number (e.g., 10)');
  console.log('   5. Enjoy the MUCH better output! 🎉\n');

  console.log('════════════════════════════════════════════════════\n');
}

updateScript().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
