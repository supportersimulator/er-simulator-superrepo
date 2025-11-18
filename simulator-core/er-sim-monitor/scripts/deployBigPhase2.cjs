#!/usr/bin/env node

/**
 * DEPLOY BIG PHASE 2 (120KB) - THE ROBUST TABBED PANEL
 * From lost-and-found - Interactive Pathway Chain Builder
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🚀 DEPLOYING BIG PHASE 2 (120KB)\n');
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

    // Load BIG Phase2 from lost-and-found
    const bigPhase2Path = path.join(__dirname, '../backups/lost-and-found-20251105-203821/Categories_Pathways_Feature_Phase2.gs');

    if (!fs.existsSync(bigPhase2Path)) {
      console.log('❌ Big Phase2 file not found!\n');
      return;
    }

    const bigPhase2Code = fs.readFileSync(bigPhase2Path, 'utf8');
    const bigPhase2Size = (bigPhase2Code.length / 1024).toFixed(1);

    console.log(`📥 Loaded BIG Phase 2: ${bigPhase2Size} KB\n`);
    console.log('Features:\n');
    console.log('   ✅ Interactive Pathway Chain Builder\n');
    console.log('   ✅ Bird\'s eye view of entire case library\n');
    console.log('   ✅ Horizontal chain builder UI\n');
    console.log('   ✅ Tabbed interface (Categories | Pathways)\n');
    console.log('   ✅ Cache integration with field editing\n');
    console.log('   ✅ Drag-and-drop reordering\n');
    console.log('   ✅ AI rationale generation\n\n');

    // Download production code
    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    // Remove ALL old Categories & Pathways code
    console.log('🗑️  Removing ALL old Categories & Pathways code...\n');

    // Remove sections
    const sectionsToRemove = [
      /\/\/ ═+\s*\n\/\/ CATEGORIES & PATHWAYS.*?\n\/\/ ═+[\s\S]*?(?=\/\/ ═+(?!.*CATEGORIES & PATHWAYS)|$)/g
    ];

    for (const regex of sectionsToRemove) {
      code = code.replace(regex, '');
    }

    // Remove all Categories/Pathways functions
    const functionsToRemove = [
      'showFieldSelector',
      'getRecommendedFields_',
      'getStaticRecommendedFields_',
      'loadFieldSelection',
      'saveFieldSelectionAndStartCache',
      'preCacheRichData',
      'performCacheWithProgress',
      'getCacheStatus',
      'showAIDiscoveryWithStreamingLogs_',
      'startAIDiscovery',
      'getAIDiscoveryStatus',
      'analyzeCatalog_',
      'extractVital_',
      'discoverPathwaysSync_',
      'showAIPathwayResults',
      'tryParseVitals_',
      'truncateField_',
      'openCategoriesPathwaysPanel',
      'runCategoriesPathwaysPanel',
      'buildCategoriesPathwaysMainMenu_',
      'runPathwayChainBuilder',
      'buildBirdEyeViewUI_',
      'buildCategoriesTabHTML_',
      'buildPathwaysTabHTML_'
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
          console.log(`   🗑️  Removed ${funcName}`);
          code = code.slice(0, startIdx) + code.slice(endIdx);
          funcRegex.lastIndex = 0;
        }
      }
    }

    console.log('\n📦 Adding BIG Phase 2 (120KB)...\n');

    // Add BIG Phase 2
    const phase2System = `

// ═══════════════════════════════════════════════════════════════
// CATEGORIES & PATHWAYS PHASE 2 - COMPLETE (120KB)
// Interactive Pathway Chain Builder with Tabs
// ═══════════════════════════════════════════════════════════════

${bigPhase2Code}

// Menu entry points
function openCategoriesPathwaysPanel() {
  runPathwayChainBuilder();
}

function runCategoriesPathwaysPanel() {
  runPathwayChainBuilder();
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

    console.log('✅ Added BIG Phase 2 (120KB)\n');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-big-phase2-2025-11-06.gs');
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
    console.log('🎉 BIG PHASE 2 DEPLOYED!\n');
    console.log(`\nDeployed: ${bigPhase2Size} KB\n`);
    console.log('This is the ROBUST tabbed panel with:\n');
    console.log('   ✅ Categories tab\n');
    console.log('   ✅ Pathways tab\n');
    console.log('   ✅ Cache button with field editing\n');
    console.log('   ✅ Bird\'s eye view\n');
    console.log('   ✅ Chain builder\n');
    console.log('\nNext steps:\n');
    console.log('   1. Refresh your production spreadsheet\n');
    console.log('   2. Click "🧠 Sim Builder" → "🧩 Categories & Pathways"\n');
    console.log('   3. Should see the BIG tabbed panel (1920x1000)!\n');
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
