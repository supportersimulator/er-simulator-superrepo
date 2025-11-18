#!/usr/bin/env node

/**
 * Deploy ATSR (No Case_ID) to Google Apps Script
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SCRIPT_ID = '1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6';
const CODE_PATH = path.join(__dirname, 'Code_ATSR_NO_CASE_ID.gs');

async function deploy() {
  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log('   🚀 DEPLOYING ATSR (NO CASE_ID)');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  // Read code
  console.log('📖 Reading Code_ATSR_NO_CASE_ID.gs...');
  const code = fs.readFileSync(CODE_PATH, 'utf8');
  console.log(`   ✅ Loaded ${code.length} characters`);
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

  // Update Code.gs
  const updatedFiles = project.data.files.map(file => {
    if (file.name === 'Code') {
      return {
        name: file.name,
        type: file.type,
        source: code
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

  console.log('   ✅ Deployment complete!');
  console.log('');

  console.log('════════════════════════════════════════════════════');
  console.log('✅ ATSR RESTORED (NO CASE_ID)');
  console.log('════════════════════════════════════════════════════');
  console.log('');

  console.log('📋 Your ATSR now has:');
  console.log('   ✅ Rich Sim Mastery prompt');
  console.log('   ✅ Spark Titles (5 variations)');
  console.log('   ✅ Reveal Titles (5 variations)');
  console.log('   ✅ Case Summary (Patient Summary, Key Intervention, Core Takeaway, Defining Characteristics)');
  console.log('   ❌ NO Case_ID dropdown (removed as requested)');
  console.log('');

  console.log('🧪 Test it now:');
  console.log('   1. Open your Google Sheet');
  console.log('   2. Refresh the page (Cmd+R)');
  console.log('   3. Click: 🧠 Sim Builder → ATSR — Titles & Summary');
  console.log('   4. Enter a row number');
  console.log('   5. Verify Case_ID dropdown is gone!');
  console.log('');
}

deploy().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
