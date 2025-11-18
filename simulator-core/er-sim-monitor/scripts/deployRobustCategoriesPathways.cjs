#!/usr/bin/env node

/**
 * DEPLOY ROBUST CATEGORIES & PATHWAYS (PHASE 1)
 * The 1920x1000 modal dialog version with AI-powered grouping
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🚀 DEPLOYING ROBUST CATEGORIES & PATHWAYS\n');
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

    // Load Phase 1 Categories & Pathways (robust version)
    const phase1Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature.gs');

    if (!fs.existsSync(phase1Path)) {
      console.log('❌ Categories_Pathways_Feature.gs not found!\n');
      return;
    }

    const phase1Code = fs.readFileSync(phase1Path, 'utf8');
    const phase1Size = (phase1Code.length / 1024).toFixed(1);

    console.log(`📥 Loaded robust Categories & Pathways: ${phase1Size} KB\n`);
    console.log('Features:\n');
    console.log('   ✅ 1920x1000 modal dialog (wide, robust)\n');
    console.log('   ✅ AI-powered pathway grouping\n');
    console.log('   ✅ 6 built-in logic types\n');
    console.log('   ✅ Accordion UI\n\n');

    // Download production code
    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    // Remove old Categories & Pathways functions
    console.log('🗑️  Removing old Categories & Pathways code...\n');

    const oldFunctions = [
      'openCategoriesPathwaysPanel',
      'buildCategoriesPathwaysMainMenu_',
      'viewCategory',
      'viewPathway',
      'runCategoriesPathwaysPanel'
    ];

    for (const funcName of oldFunctions) {
      // Remove function declarations (handle multi-line)
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
          funcRegex.lastIndex = 0; // Reset regex
        }
      }
    }

    console.log('\n📦 Adding robust Categories & Pathways code...\n');

    // Add Phase 1 code
    const categoriesSection = `

// ═══════════════════════════════════════════════════════════════
// CATEGORIES & PATHWAYS - ROBUST PANEL (1920x1000)
// AI-Powered Pathway Grouping with 6 Logic Types
// ═══════════════════════════════════════════════════════════════

${phase1Code}
`;

    // Insert before first function
    const firstFunctionMatch = code.match(/^function /m);
    if (firstFunctionMatch) {
      const insertPos = firstFunctionMatch.index;
      code = code.slice(0, insertPos) + categoriesSection + '\n' + code.slice(insertPos);
    } else {
      code = categoriesSection + '\n' + code;
    }

    console.log('✅ Added robust Categories & Pathways\n');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-robust-categories-2025-11-06.gs');
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
    console.log('🎉 ROBUST CATEGORIES & PATHWAYS DEPLOYED!\n');
    console.log('\nNext steps:\n');
    console.log('   1. Refresh your production spreadsheet\n');
    console.log('   2. Click "🧠 Sim Builder" → "🧩 Categories & Pathways"\n');
    console.log('   3. You should see the LARGE 1920x1000 modal panel!\n');
    console.log('   4. Not the narrow 320px sidebar\n');
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
