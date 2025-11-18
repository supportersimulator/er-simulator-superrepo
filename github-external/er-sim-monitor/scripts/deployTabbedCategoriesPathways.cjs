#!/usr/bin/env node

/**
 * DEPLOY TABBED CATEGORIES & PATHWAYS FROM PHASE2
 * Extract the complete tab-based UI system
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🚀 DEPLOYING TABBED CATEGORIES & PATHWAYS\n');
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

    // Load phase2 backup with tabs
    const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');

    if (!fs.existsSync(phase2Path)) {
      console.log('❌ Phase2 file not found!\n');
      return;
    }

    const phase2Code = fs.readFileSync(phase2Path, 'utf8');
    const phase2Size = (phase2Code.length / 1024).toFixed(1);

    console.log(`📥 Loaded Phase 2 Categories & Pathways: ${phase2Size} KB\n`);

    // Download production code
    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    // Remove ALL old Categories & Pathways code completely
    console.log('🗑️  Removing ALL old Categories & Pathways code...\n');

    // Remove sections
    const sectionsToRemove = [
      /\/\/ ═+\s*\n\/\/ CATEGORIES & PATHWAYS.*?\n\/\/ ═+[\s\S]*?(?=\/\/ ═+|function [a-zA-Z_]|$)/g,
      /\/\/ ═+\s*\n\/\/ PATHWAY CHAIN BUILDER.*?\n\/\/ ═+[\s\S]*?(?=\/\/ ═+|function [a-zA-Z_]|$)/g
    ];

    for (const regex of sectionsToRemove) {
      let match;
      while ((match = regex.exec(code)) !== null) {
        console.log(`   🗑️  Removed section (${(match[0].length / 1024).toFixed(1)} KB)`);
        code = code.replace(match[0], '');
        regex.lastIndex = 0;
      }
    }

    // Remove all Categories/Pathways related functions
    const functionsToRemove = [
      'openCategoriesPathwaysPanel',
      'runCategoriesPathwaysPanel',
      'buildCategoriesPathwaysMainMenu_',
      'buildPathwayGroupingUI_',
      'runPathwayChainBuilder',
      'buildBirdEyeViewUI_',
      'buildCategoriesTabHTML_',
      'buildPathwaysTabHTML_',
      'buildChainBuilderUI',
      'getOrCreateHolisticAnalysis_',
      'viewCategory',
      'viewPathway'
    ];

    for (const funcName of functionsToRemove) {
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
          console.log(`   🗑️  Removed function: ${funcName}`);
          code = code.slice(0, startIdx) + code.slice(endIdx);
          funcRegex.lastIndex = 0;
        }
      }
    }

    console.log('\n📦 Adding Phase 2 tabbed Categories & Pathways...\n');

    // Add Phase 2 system with wrapper
    const phase2System = `

// ═══════════════════════════════════════════════════════════════
// CATEGORIES & PATHWAYS PHASE 2 - COMPLETE TABBED SYSTEM
// Field Selector + Cache Integration + AI Discovery
// ═══════════════════════════════════════════════════════════════

${phase2Code}

// Menu entry points
function openCategoriesPathwaysPanel() {
  showFieldSelector();
}

function runCategoriesPathwaysPanel() {
  showFieldSelector();
}
`;

    // Insert before first function
    const firstFunctionMatch = code.match(/^function /m);
    if (firstFunctionMatch) {
      const insertPos = firstFunctionMatch.index;
      code = code.slice(0, insertPos) + phase2System + '\n' + code.slice(insertPos);
    } else {
      code = phase2System + '\n' + code;
    }

    console.log('✅ Added Phase 2 system\n');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-tabbed-categories-2025-11-06.gs');
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
    const categoriesSize = (phase2Code.length / 1024).toFixed(1);

    console.log(`✅ Deployment successful! New size: ${newSize} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 PHASE 2 TABBED CATEGORIES & PATHWAYS DEPLOYED!\n');
    console.log(`\nDeployed: ${categoriesSize} KB of Phase 2 code\n`);
    console.log('Features:\n');
    console.log('   ✅ Field Selector modal dialog\n');
    console.log('   ✅ AI-powered field recommendations\n');
    console.log('   ✅ Dynamic field selection\n');
    console.log('   ✅ Cache system integration\n');
    console.log('   ✅ AI pathway discovery\n');
    console.log('\nNext steps:\n');
    console.log('   1. Refresh your production spreadsheet\n');
    console.log('   2. Click "🧠 Sim Builder" → "🧩 Categories & Pathways"\n');
    console.log('   3. Should open the Field Selector modal!\n');
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
