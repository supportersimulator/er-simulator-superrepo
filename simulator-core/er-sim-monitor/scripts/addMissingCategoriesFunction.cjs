#!/usr/bin/env node

/**
 * ADD MISSING runCategoriesPathwaysPanel FUNCTION
 * Creates wrapper function to call showFieldSelector
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 ADDING MISSING runCategoriesPathwaysPanel FUNCTION\n');
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

async function addFunction() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`📦 Production Project: ${PRODUCTION_PROJECT_ID}\n`);

    // Download code
    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    if (!codeFile) {
      console.log('❌ No Code file found!\n');
      return;
    }

    let code = codeFile.source;

    // Check if showFieldSelector exists
    const hasShowFieldSelector = code.includes('function showFieldSelector(');
    console.log(`🔍 showFieldSelector function: ${hasShowFieldSelector ? '✅ EXISTS' : '❌ MISSING'}\n`);

    // Check if runCategoriesPathwaysPanel exists
    const hasRunCategoriesPathwaysPanel = code.includes('function runCategoriesPathwaysPanel(');
    console.log(`🔍 runCategoriesPathwaysPanel function: ${hasRunCategoriesPathwaysPanel ? '✅ EXISTS' : '❌ MISSING'}\n`);

    if (hasRunCategoriesPathwaysPanel) {
      console.log('✅ Function already exists - no action needed!\n');
      return;
    }

    if (!hasShowFieldSelector) {
      console.log('❌ showFieldSelector function is also missing!\n');
      console.log('Need to add the entire Categories & Pathways Phase2 code.\n');
      return;
    }

    console.log('🔧 Adding runCategoriesPathwaysPanel wrapper function...\n');

    // Create wrapper function
    const wrapperFunction = `

// ═══════════════════════════════════════════════════════════════
// CATEGORIES & PATHWAYS PANEL - ENTRY POINT
// ═══════════════════════════════════════════════════════════════

/**
 * Main entry point for Categories & Pathways panel
 * Called from menu: 🧠 Sim Builder → 🧩 Categories & Pathways
 */
function runCategoriesPathwaysPanel() {
  showFieldSelector();
}
`;

    // Find a good place to insert (right before showFieldSelector function)
    const showFieldSelectorMatch = code.match(/function showFieldSelector\(/);

    if (showFieldSelectorMatch) {
      const insertPos = showFieldSelectorMatch.index;
      code = code.slice(0, insertPos) + wrapperFunction + '\n' + code.slice(insertPos);
      console.log('✅ Inserted runCategoriesPathwaysPanel before showFieldSelector\n');
    } else {
      // Fallback: insert before first function
      const firstFunctionMatch = code.match(/^function /m);
      if (firstFunctionMatch) {
        const insertPos = firstFunctionMatch.index;
        code = code.slice(0, insertPos) + wrapperFunction + '\n' + code.slice(insertPos);
        console.log('✅ Inserted runCategoriesPathwaysPanel before first function\n');
      }
    }

    // Backup current version
    const backupPath = path.join(__dirname, '../backups/production-before-categories-fix-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up current version to:\n   ${backupPath}\n`);

    // Deploy updated code
    console.log('📤 Deploying updated code...\n');

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

    console.log('✅ Deployment successful!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 CATEGORIES & PATHWAYS FUNCTION ADDED!\n');
    console.log('Next steps:\n');
    console.log('   1. Refresh your production spreadsheet\n');
    console.log('   2. Click "🧠 Sim Builder" → "🧩 Categories & Pathways"\n');
    console.log('   3. The field selector panel should now appear!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

addFunction();
