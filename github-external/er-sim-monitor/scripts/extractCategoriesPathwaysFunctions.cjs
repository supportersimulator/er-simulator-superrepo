#!/usr/bin/env node

/**
 * EXTRACT ALL CATEGORIES & PATHWAYS FUNCTIONS FROM TEST
 * And add them to production
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n📦 EXTRACTING CATEGORIES & PATHWAYS FUNCTIONS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

function extractFunctionBody(code, functionName, startIdx) {
  let braceCount = 0;
  let inFunction = false;
  let functionBody = '';

  for (let i = startIdx; i < code.length; i++) {
    const char = code[i];
    functionBody += char;

    if (char === '{') {
      braceCount++;
      inFunction = true;
    } else if (char === '}') {
      braceCount--;
      if (inFunction && braceCount === 0) {
        return functionBody;
      }
    }
  }

  return functionBody;
}

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

async function extractAndAdd() {
  try {
    // Load test code
    const testCodePath = path.join(__dirname, '../backups/test-with-complete-atsr-2025-11-06.gs');

    if (!fs.existsSync(testCodePath)) {
      console.log('❌ Test code backup not found!\n');
      return;
    }

    const testCode = fs.readFileSync(testCodePath, 'utf8');
    console.log('📥 Loaded test code backup\n');

    // Find all Categories & Pathways related functions
    const categoriPathwaysFunctions = [
      'openCategoriesPathwaysPanel',
      'buildCategoriesPathwaysMainMenu_',
      'viewCategory',
      'viewPathway',
      'buildCategoryDetailView_',
      'buildPathwayDetailView_',
      'launchHolisticAnalysis',
      'buildPathwayChain',
      'buildBirdsEyeView',
      'analyzeHolistically'
    ];

    console.log('🔍 Searching for Categories & Pathways functions...\n');

    const extractedFunctions = [];

    for (const funcName of categoriPathwaysFunctions) {
      const regex = new RegExp(`function ${funcName}\\s*\\(`);
      const match = testCode.match(regex);

      if (match) {
        const functionBody = extractFunctionBody(testCode, funcName, match.index);
        extractedFunctions.push({ name: funcName, code: functionBody });
        console.log(`   ✅ Found ${funcName} (${(functionBody.length / 1024).toFixed(1)} KB)`);
      } else {
        console.log(`   ⏭️  Skipped ${funcName} (not found)`);
      }
    }

    console.log(`\n📊 Extracted ${extractedFunctions.length} functions\n`);

    if (extractedFunctions.length === 0) {
      console.log('❌ No functions extracted!\n');
      return;
    }

    // Download production code
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

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

    // Build the Categories & Pathways section
    const categoriesSection = `

// ═══════════════════════════════════════════════════════════════
// CATEGORIES & PATHWAYS PANEL - COMPLETE SYSTEM
// ═══════════════════════════════════════════════════════════════

${extractedFunctions.map(f => f.code).join('\n\n')}

// Add wrapper for menu compatibility
function runCategoriesPathwaysPanel() {
  openCategoriesPathwaysPanel();
}
`;

    // Insert before the first function
    const firstFunctionMatch = prodCode.match(/^function /m);

    if (firstFunctionMatch) {
      const insertPos = firstFunctionMatch.index;
      prodCode = prodCode.slice(0, insertPos) + categoriesSection + '\n' + prodCode.slice(insertPos);
      console.log('✅ Inserted Categories & Pathways section\n');
    } else {
      prodCode = categoriesSection + '\n' + prodCode;
      console.log('✅ Prepended Categories & Pathways section\n');
    }

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-full-categories-2025-11-06.gs');
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
    console.log('🎉 CATEGORIES & PATHWAYS COMPLETE!\n');
    console.log('Next steps:\n');
    console.log('   1. Refresh your production spreadsheet\n');
    console.log('   2. Click "🧠 Sim Builder" → "🧩 Categories & Pathways"\n');
    console.log('   3. The full panel should now appear with all features!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

extractAndAdd();
