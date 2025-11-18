#!/usr/bin/env node

/**
 * DEPLOY ALL TOOLS TO GPT FORMATTER
 * - ATSR Titles Optimizer
 * - Categories & Pathways Phase2 (includes field selector)
 * - Unified "🧠 Sim Builder" menu
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n🚀 DEPLOYING ALL TOOLS TO GPT FORMATTER\n');
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

    // Load all feature files
    console.log('📖 Loading feature files...\n');
    
    const atsrCode = fs.readFileSync(
      path.join(__dirname, '../backups/ATSR_Title_Generator_Feature_IMPROVED.gs'),
      'utf8'
    );
    
    const categoriesCode = fs.readFileSync(
      path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs'),
      'utf8'
    );

    console.log(`   ✅ ATSR: ${(atsrCode.length / 1024).toFixed(1)} KB`);
    console.log(`   ✅ Categories & Pathways: ${(categoriesCode.length / 1024).toFixed(1)} KB\n`);

    // Combine the code files
    console.log('🔨 Building combined code...\n');
    
    const combinedCode = `
${atsrCode}

// ==================== CATEGORIES & PATHWAYS FEATURE ====================

${categoriesCode}
`;

    console.log(`   📦 Combined size: ${(combinedCode.length / 1024).toFixed(1)} KB\n`);

    // Download current project
    const currentProject = await script.projects.getContent({
      scriptId: GPT_FORMATTER_ID
    });

    // Update Code.gs with combined code
    const updatedFiles = currentProject.data.files.map(file => {
      if (file.name === 'Code') {
        return {
          name: 'Code',
          type: 'SERVER_JS',
          source: combinedCode
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
    console.log('📋 UNIFIED MENU: 🧠 Sim Builder\n');
    console.log('   Tools Available:\n');
    console.log('   1. 🎨 ATSR Titles Optimizer (with mystery button 🎭)\n');
    console.log('   2. 🧩 Categories & Pathways (includes field selector)\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎯 NEXT STEPS:\n');
    console.log('1. Hard refresh test spreadsheet (Cmd+Shift+R)\n');
    console.log('2. Click "🧠 Sim Builder" menu\n');
    console.log('3. Try both tools!\n');
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
