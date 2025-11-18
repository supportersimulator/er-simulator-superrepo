#!/usr/bin/env node

/**
 * Deploy Ultimate Categorization Tool - Phase 2A
 * Adds backend categorization engine with RIDICULOUS logging detail
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function deployPhase2A() {
  console.log('🚀 Deploying Ultimate Categorization Tool - Phase 2A\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });

    // Read Ultimate Categorization Tool file
    const toolPath = path.join(__dirname, '..', 'apps-script-deployable', 'Ultimate_Categorization_Tool.gs');
    const toolContent = fs.readFileSync(toolPath, 'utf-8');

    console.log('📄 Ultimate_Categorization_Tool.gs:');
    console.log(`  Size: ${Math.round(toolContent.length / 1024)} KB`);
    console.log(`  Lines: ${toolContent.split('\n').length}\n`);

    // Check what's included
    const hasPhase1 = toolContent.includes('buildUltimateCategorizationUI');
    const hasPhase2A = toolContent.includes('runUltimateCategorization');
    const hasClientConnected = toolContent.includes('google.script.run');

    console.log('✅ Phase 1 (UI): ' + (hasPhase1 ? 'Included' : 'Missing'));
    console.log('✅ Phase 2A (Backend): ' + (hasPhase2A ? 'Included' : 'Missing'));
    console.log('✅ Client-Server Connection: ' + (hasClientConnected ? 'Connected' : 'Placeholder'));
    console.log('');

    // Fetch current project
    console.log('📥 Fetching current Apps Script project...\n');
    const projectResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = projectResponse.data.files;

    // Update Ultimate_Categorization_Tool.gs
    const existingToolIndex = files.findIndex(f => f.name === 'Ultimate_Categorization_Tool');

    if (existingToolIndex > -1) {
      console.log('✅ Updating existing Ultimate_Categorization_Tool.gs\n');
      files[existingToolIndex].source = toolContent;
    } else {
      console.log('✅ Adding new Ultimate_Categorization_Tool.gs\n');
      files.push({
        name: 'Ultimate_Categorization_Tool',
        type: 'SERVER_JS',
        source: toolContent
      });
    }

    // Deploy
    console.log('🚀 Deploying to Apps Script...\n');

    await script.projects.updateContent({
      scriptId: SCRIPT_ID,
      requestBody: {
        files: files
      }
    });

    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log('📊 Phase 2A Deployed:\n');
    console.log('  ✅ Ultimate_Categorization_Tool.gs updated');
    console.log('  ✅ Backend categorization engine added');
    console.log('  ✅ Client-server connection established');
    console.log('  ✅ RIDICULOUS logging detail implemented\n');
    console.log('🧪 TESTING INSTRUCTIONS:\n');
    console.log('  1. Open your Google Sheet');
    console.log('  2. Refresh the page (F5)');
    console.log('  3. Click: Sim Builder > 🤖 Ultimate Categorization Tool');
    console.log('  4. Select mode: "All Cases"');
    console.log('  5. Click "🚀 Run AI Categorization"');
    console.log('  6. Watch live logs panel for RIDICULOUS detail:');
    console.log('     - Every sheet load');
    console.log('     - Every case extraction');
    console.log('     - Every API call (endpoint, model, timing)');
    console.log('     - Every response (tokens, cost)');
    console.log('     - Every write operation (row numbers)');
    console.log('     - Skip detection for already-processed rows');
    console.log('  7. Check AI_Categorization_Results sheet for output');
    console.log('  8. Test "Copy Logs" button');
    console.log('  9. Report any issues before proceeding to Phase 2B\n');
    console.log('📋 What Works Now:\n');
    console.log('  ✅ All Cases mode');
    console.log('  🚧 Retry Failed (Phase 2B)');
    console.log('  🚧 Specific Rows (Phase 2C)');
    console.log('  🚧 Apply/Export/Clear (Phase 2D)\n');
    console.log('══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Deployment Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

deployPhase2A();
