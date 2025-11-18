#!/usr/bin/env node

/**
 * DEPLOY COMPLETE PHASE 2 CATEGORIES & PATHWAYS TO PRODUCTION
 * Replaces old version with new field selector version
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔄 DEPLOYING COMPLETE PHASE 2 CATEGORIES & PATHWAYS\n');
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

    // Load Phase 2 code
    const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

    if (!fs.existsSync(phase2Path)) {
      console.log('❌ Categories_Pathways_Feature_Phase2.gs not found!\n');
      return;
    }

    const phase2Code = fs.readFileSync(phase2Path, 'utf8');
    const phase2Size = (phase2Code.length / 1024).toFixed(1);

    console.log(`📥 Loaded Phase 2 code: ${phase2Size} KB\n`);

    // Download production code
    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    if (!codeFile) {
      console.log('❌ No Code file found in production!\n');
      return;
    }

    let prodCode = codeFile.source;

    console.log('🔍 Checking for old Categories & Pathways code...\n');

    // Remove old Categories & Pathways section if it exists
    const oldSectionRegex = /\/\/ ═+\s*\n\/\/ CATEGORIES & PATHWAYS.*?\n\/\/ ═+[\s\S]*?(?=\/\/ ═+|$)/;

    if (oldSectionRegex.test(prodCode)) {
      console.log('🗑️  Removing old Categories & Pathways section...\n');
      prodCode = prodCode.replace(oldSectionRegex, '');
    }

    // Also remove individual old functions if they exist
    const oldFunctions = [
      'openCategoriesPathwaysPanel',
      'buildCategoriesPathwaysMainMenu_',
      'viewCategory',
      'viewPathway',
      'runCategoriesPathwaysPanel'
    ];

    for (const funcName of oldFunctions) {
      const funcRegex = new RegExp(`function ${funcName}\\s*\\([^)]*\\)\\s*\\{[^}]*\\}`, 'g');
      if (funcRegex.test(prodCode)) {
        console.log(`   🗑️  Removing old ${funcName}`);
        prodCode = prodCode.replace(funcRegex, '');
      }
    }

    console.log('\n📦 Adding complete Phase 2 code...\n');

    // Add Phase 2 code as a section
    const phase2Section = `

// ═══════════════════════════════════════════════════════════════
// CATEGORIES & PATHWAYS PHASE 2 - FIELD SELECTOR & CACHE SYSTEM
// ═══════════════════════════════════════════════════════════════

${phase2Code}

// Menu wrapper for backward compatibility
function runCategoriesPathwaysPanel() {
  showFieldSelector();
}
`;

    // Insert at the end of the file
    prodCode = prodCode + '\n' + phase2Section;

    console.log('✅ Added Phase 2 section\n');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-phase2-deploy-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up to: ${backupPath}\n`);

    // Deploy
    console.log('📤 Deploying to production...\n');

    const updatedFiles = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: prodCode
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: updatedFiles }
    });

    const newSize = (prodCode.length / 1024).toFixed(1);
    console.log(`✅ Deployment successful! New size: ${newSize} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 PHASE 2 CATEGORIES & PATHWAYS DEPLOYED!\n');
    console.log('Features included:\n');
    console.log('   ✅ Field Selector UI\n');
    console.log('   ✅ AI-powered field recommendations\n');
    console.log('   ✅ Dynamic field selection\n');
    console.log('   ✅ Cache system integration\n');
    console.log('   ✅ AI pathway discovery\n');
    console.log('\nNext steps:\n');
    console.log('   1. Refresh your production spreadsheet\n');
    console.log('   2. Click "🧠 Sim Builder" → "🧩 Categories & Pathways"\n');
    console.log('   3. You should see the NEW Field Selector interface!\n');
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
