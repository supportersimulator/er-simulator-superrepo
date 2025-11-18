#!/usr/bin/env node

/**
 * DEPLOY COMPLETE PATHWAY SYSTEM
 * CategoriesPathwaysPanel.gs (15 KB UI) + Phase2 Backend (120 KB)
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n📦 DEPLOYING COMPLETE PATHWAY SYSTEM\n');
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

    // Load the pathway system files
    const panelPath = path.join(__dirname, '../scripts/CategoriesPathwaysPanel.gs');
    const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

    if (!fs.existsSync(panelPath)) {
      console.log('❌ CategoriesPathwaysPanel.gs not found!\n');
      return;
    }

    if (!fs.existsSync(phase2Path)) {
      console.log('❌ Categories_Pathways_Feature_Phase2.gs not found!\n');
      return;
    }

    const panelCode = fs.readFileSync(panelPath, 'utf8');
    const phase2Code = fs.readFileSync(phase2Path, 'utf8');

    const panelSize = (panelCode.length / 1024).toFixed(1);
    const phase2Size = (phase2Code.length / 1024).toFixed(1);

    console.log(`📥 Loaded CategoriesPathwaysPanel.gs: ${panelSize} KB (UI)\n`);
    console.log(`📥 Loaded Categories_Pathways_Feature_Phase2.gs: ${phase2Size} KB (Backend)\n`);

    // Download production code
    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    // Remove ALL old Categories & Pathways code
    console.log('🗑️  Removing all old Categories & Pathways code...\n');

    // Remove old sections
    const oldSections = [
      /\/\/ ═+\s*\n\/\/ CATEGORIES & PATHWAYS.*?\n\/\/ ═+[\s\S]*?(?=\/\/ ═+|$)/g
    ];

    for (const regex of oldSections) {
      if (regex.test(code)) {
        code = code.replace(regex, '');
        console.log('   🗑️  Removed old section');
      }
    }

    // Remove individual old functions
    const oldFunctions = [
      'openCategoriesPathwaysPanel',
      'buildCategoriesPathwaysMainMenu_',
      'runCategoriesPathwaysPanel',
      'buildPathwayGroupingUI_',
      'viewCategory',
      'viewPathway'
    ];

    for (const funcName of oldFunctions) {
      const funcRegex = new RegExp(`function ${funcName}\\s*\\([^)]*\\)\\s*\\{`, 'g');
      let match;
      while ((match = funcRegex.exec(code)) !== null) {
        const startIdx = match.index;
        let braceCount = 0;
        let inFunction = false;
        let endIdx = startIdx;

        for (let i = startIdx; i < code.length; i++) {
          if (code[i] === '{') {
            braceCount++;
            inFunction = true;
          } else if (code[i] === '}') {
            braceCount--;
            if (inFunction && braceCount === 0) {
              endIdx = i + 1;
              break;
            }
          }
        }

        if (endIdx > startIdx) {
          console.log(`   🗑️  Removed old ${funcName}`);
          code = code.slice(0, startIdx) + code.slice(endIdx);
          funcRegex.lastIndex = 0;
        }
      }
    }

    console.log('\n📦 Adding complete pathway system...\n');

    // Add complete pathway system
    const pathwaySystem = `

// ═══════════════════════════════════════════════════════════════
// CATEGORIES & PATHWAYS SYSTEM - COMPLETE
// Panel UI (15 KB) + Phase 2 Backend (120 KB)
// ═══════════════════════════════════════════════════════════════

// ========== CATEGORIES & PATHWAYS PANEL UI ==========

${panelCode}

// ========== PHASE 2 BACKEND (Field Selector, Cache, AI Discovery) ==========

${phase2Code}
`;

    // Insert before first function
    const firstFunctionMatch = code.match(/^function /m);
    if (firstFunctionMatch) {
      const insertPos = firstFunctionMatch.index;
      code = code.slice(0, insertPos) + pathwaySystem + '\n' + code.slice(insertPos);
    } else {
      code = pathwaySystem + '\n' + code;
    }

    console.log('✅ Added CategoriesPathwaysPanel.gs (15 KB)\n');
    console.log('✅ Added Categories_Pathways_Feature_Phase2.gs (120 KB)\n');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-complete-pathway-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up to: ${backupPath}\n`);

    // Deploy
    console.log('📤 Deploying to production...\n');

    const updatedFiles = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: code
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: updatedFiles }
    });

    const newSize = (code.length / 1024).toFixed(1);
    console.log(`✅ Deployment successful! New size: ${newSize} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 COMPLETE PATHWAY SYSTEM DEPLOYED!\n');
    console.log('\nComponents:\n');
    console.log(`   ✅ CategoriesPathwaysPanel.gs (${panelSize} KB) - Full UI\n`);
    console.log(`   ✅ Categories_Pathways_Feature_Phase2.gs (${phase2Size} KB) - Backend\n`);
    console.log('\nMenu function: openCategoriesPathwaysPanel()\n');
    console.log('\nNext steps:\n');
    console.log('   1. Refresh your production spreadsheet\n');
    console.log('   2. Click "🧠 Sim Builder" → "🧩 Categories & Pathways"\n');
    console.log('   3. Should see the robust Categories & Pathways panel!\n');
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
