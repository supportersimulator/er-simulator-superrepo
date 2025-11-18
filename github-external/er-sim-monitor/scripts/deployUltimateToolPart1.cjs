#!/usr/bin/env node

/**
 * Deploy Ultimate Categorization Tool - Part 1 (UI Only)
 * Tests the UI framework before building backend
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');
const SCRIPT_ID = process.env.APPS_SCRIPT_ID;

async function deployPart1() {
  console.log('🚀 Deploying Ultimate Categorization Tool - Part 1 (UI)\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });

    // Read new Ultimate Categorization Tool file
    const toolPath = path.join(__dirname, '..', 'apps-script-deployable', 'Ultimate_Categorization_Tool.gs');
    const toolContent = fs.readFileSync(toolPath, 'utf-8');

    console.log('📄 Ultimate_Categorization_Tool.gs:');
    console.log(`  Size: ${Math.round(toolContent.length / 1024)} KB`);
    console.log(`  Lines: ${toolContent.split('\n').length}\n`);

    // Fetch current project
    console.log('📥 Fetching current Apps Script project...\n');
    const projectResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = projectResponse.data.files;

    // Add Ultimate_Categorization_Tool.gs
    const existingToolIndex = files.findIndex(f => f.name === 'Ultimate_Categorization_Tool');

    if (existingToolIndex > -1) {
      console.log('✅ Found existing Ultimate_Categorization_Tool.gs - replacing\n');
      files[existingToolIndex].source = toolContent;
    } else {
      console.log('✅ Adding new Ultimate_Categorization_Tool.gs\n');
      files.push({
        name: 'Ultimate_Categorization_Tool',
        type: 'SERVER_JS',
        source: toolContent
      });
    }

    // Update Code.gs menu
    const codeIndex = files.findIndex(f => f.name === 'Code');
    if (codeIndex > -1) {
      let codeContent = files[codeIndex].source;

      // Check if menu already has Ultimate Categorization
      if (!codeContent.includes('Ultimate Categorization')) {
        console.log('📝 Updating menu in Code.gs...\n');

        // Find the menu section and add new item
        const menuPattern = /(menu\.addItem\('✨ Enhanced Categories'[^;]+;)/;
        const replacement = "menu.addItem('🤖 Ultimate Categorization Tool', 'openUltimateCategorization');";

        if (codeContent.match(menuPattern)) {
          codeContent = codeContent.replace(menuPattern, replacement);
          files[codeIndex].source = codeContent;
          console.log('  ✅ Replaced "Enhanced Categories" with "Ultimate Categorization Tool"\n');
        } else {
          console.log('  ⚠️  Could not find menu pattern - please add manually\n');
        }
      } else {
        console.log('✅ Menu already has Ultimate Categorization Tool\n');
      }
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
    console.log('📊 Part 1 Deployed:\n');
    console.log('  ✅ Ultimate_Categorization_Tool.gs added');
    console.log('  ✅ Menu updated (if pattern found)');
    console.log('  ✅ UI framework ready\n');
    console.log('🧪 TESTING INSTRUCTIONS:\n');
    console.log('  1. Open your Google Sheet');
    console.log('  2. Refresh the page (F5)');
    console.log('  3. Click: Sim Builder > 🤖 Ultimate Categorization Tool');
    console.log('  4. Check:');
    console.log('     - Modal opens (1920x1080)');
    console.log('     - Controls panel on left');
    console.log('     - Live logs panel top right (Matrix style)');
    console.log('     - Results panel bottom right');
    console.log('     - Mode selector works');
    console.log('     - Specific Rows input shows/hides');
    console.log('     - Copy/Clear/Refresh logs buttons work');
    console.log('     - Auto-refresh logs every 2 seconds');
    console.log('  5. Report any UI issues before Part 2\n');
    console.log('══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Deployment Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

deployPart1();
