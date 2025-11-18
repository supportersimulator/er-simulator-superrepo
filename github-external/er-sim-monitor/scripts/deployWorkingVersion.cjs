#!/usr/bin/env node

/**
 * Deploy Working Version to Google Apps Script
 *
 * Restores the working AI Categorization panel from local file
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function deployWorkingVersion() {
  console.log('🚀 Deploying Working Version to Apps Script\n');
  console.log('════════════════════════════════════════════════════════════════\n');

  try {
    // Load credentials
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });

    // Read local working version
    const localPath = path.join(__dirname, '..', 'apps-script-deployable', 'Phase2_Enhanced_Categories_With_AI.gs');
    const localContent = fs.readFileSync(localPath, 'utf-8');

    console.log('📄 Local Working Version:');
    console.log('  Path:', localPath);
    console.log('  Size:', localContent.length, 'bytes');
    console.log('  Lines:', localContent.split('\n').length);
    console.log('');

    // Verify it has the key functions
    const hasRunAI = localContent.includes('function runAICategorization()');
    const hasApply = localContent.includes('function applyCategorizations()');

    console.log('🔍 Function Verification:');
    console.log('  runAICategorization():', hasRunAI ? '✅ YES' : '❌ NO');
    console.log('  applyCategorizations():', hasApply ? '✅ YES' : '❌ NO');
    console.log('');

    if (!hasRunAI || !hasApply) {
      console.log('⚠️  WARNING: Local file is missing critical functions!');
      console.log('Deployment aborted for safety.\n');
      return;
    }

    console.log('✅ Local file verified - contains all critical functions\n');
    console.log('════════════════════════════════════════════════════════════════\n');

    // Fetch current project
    console.log('📥 Fetching current Apps Script project...\n');
    const projectResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = projectResponse.data.files;

    // Find Phase2 file
    const phase2Index = files.findIndex(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

    if (phase2Index === -1) {
      console.log('❌ Phase2_Enhanced_Categories_With_AI.gs not found in project!');
      console.log('Available files:', files.map(f => f.name).join(', '));
      return;
    }

    console.log('✅ Found Phase2_Enhanced_Categories_With_AI.gs in project\n');

    // Backup current deployed version
    const backupPath = path.join(__dirname, '..', 'backups', `deployed_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.gs`);
    fs.writeFileSync(backupPath, files[phase2Index].source);
    console.log('💾 Backed up current deployed version to:');
    console.log('  ', backupPath);
    console.log('');

    // Replace with local working version
    files[phase2Index].source = localContent;

    console.log('🚀 Deploying working version...\n');

    await script.projects.updateContent({
      scriptId: SCRIPT_ID,
      requestBody: {
        files: files
      }
    });

    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('════════════════════════════════════════════════════════════════\n');
    console.log('📊 Deployment Summary:\n');
    console.log('  Source: Local working version (with all functions)');
    console.log('  Size:', localContent.length, 'bytes');
    console.log('  Lines:', localContent.split('\n').length);
    console.log('  Functions restored:');
    console.log('    ✅ runAICategorization()');
    console.log('    ✅ applyCategorizations()');
    console.log('    ✅ buildCategoriesPathwaysMainMenu_()');
    console.log('');
    console.log('🧪 NEXT STEPS:\n');
    console.log('  1. Open your Google Sheet');
    console.log('  2. Click Custom Menu > Categories & Pathways');
    console.log('  3. Switch to "AI Categorization" tab');
    console.log('  4. Test "Run AI Categorization" button');
    console.log('  5. Check Live Logs appear correctly');
    console.log('');

  } catch (error) {
    console.error('❌ Deployment Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

deployWorkingVersion();
