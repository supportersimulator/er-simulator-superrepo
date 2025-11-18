#!/usr/bin/env node

/**
 * FIX MONOLITHIC PROJECT - ADD onOpen() FUNCTION
 * The de-duplication removed onOpen(), now we add it back
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PROJECT_ID = '1lU89yFCJkREq_5CIjEVgpPWQ0H6nU_HxoMgaPDb5KxA_f-JztUp1oLUS';

console.log('\n🔧 FIXING MONOLITHIC PROJECT - ADDING onOpen() FUNCTION\n');
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

async function fixProject() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`🎯 Project ID: ${PROJECT_ID}\n`);
    console.log('📥 Reading current project code...\n');

    const project = await script.projects.getContent({
      scriptId: PROJECT_ID
    });

    const codeFile = project.data.files.find(f => f.name === 'Code');
    const manifestFile = project.data.files.find(f => f.name === 'appsscript');

    if (!codeFile) {
      throw new Error('Could not find Code.gs file');
    }

    console.log(`✅ Current code size: ${(codeFile.source.length / 1024).toFixed(1)} KB\n`);

    // Prepend the custom onOpen() function at the very beginning
    const onOpenFunction = `/**
 * MONOLITHIC TEST ENVIRONMENT
 *
 * Combined from:
 * - Production GPT Formatter (all core batch processing)
 * - Title Optimizer (ATSR features)
 * - Categories/Pathways Phase 2 (27 default headers, Field Selector)
 * - Advanced Cache System (Pathway Chain Builder, 7-layer cache)
 *
 * Generated: ${new Date().toISOString()}
 *
 * De-duplicated: Removed duplicate function and const declarations
 * This is a COMPLETE test environment with ALL features working together.
 */

// ==================== CUSTOM TEST MENU ====================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🧪 TEST Tools')
    .addItem('🎨 ATSR Titles Optimizer', 'runATSRTitleGenerator')
    .addItem('🧩 Categories & Pathways (Phase 2)', 'showFieldSelector')
    .addItem('🔗 Pathway Chain Builder', 'runPathwayChainBuilder')
    .addToUi();
}

// ==================== MONOLITHIC CODE STARTS HERE ====================

`;

    // Remove the existing header comment if it exists
    let updatedCode = codeFile.source;
    if (updatedCode.startsWith('/**\n * MONOLITHIC TEST ENVIRONMENT')) {
      // Find the end of the comment block
      const commentEnd = updatedCode.indexOf('*/') + 2;
      // Remove everything from start until after the comment
      updatedCode = updatedCode.substring(commentEnd).trim();
    }

    // Prepend the new onOpen() function
    const finalCode = onOpenFunction + updatedCode;

    console.log(`📊 New code size: ${(finalCode.length / 1024).toFixed(1)} KB\n`);

    console.log('💾 Uploading fixed code...\n');

    const files = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: finalCode
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: PROJECT_ID,
      requestBody: { files }
    });

    console.log('✅ Successfully added onOpen() function!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ FIX COMPLETE!\n');
    console.log('📝 NEXT STEPS:\n');
    console.log('   1. Open your test spreadsheet:\n');
    console.log('      https://docs.google.com/spreadsheets/d/1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI\n');
    console.log('   2. Press Cmd+R (or F5) to refresh\n');
    console.log('   3. Wait 5-10 seconds for scripts to load\n');
    console.log('   4. Look for "🧪 TEST Tools" menu\n');
    console.log('   5. The menu should appear with three options:\n');
    console.log('      • 🎨 ATSR Titles Optimizer\n');
    console.log('      • 🧩 Categories & Pathways (Phase 2)\n');
    console.log('      • 🔗 Pathway Chain Builder\n');

    // Save local backup
    const localBackupPath = path.join(__dirname, '../backups/monolithic-with-onOpen-2025-11-06.gs');
    fs.writeFileSync(localBackupPath, finalCode, 'utf8');
    console.log(`💾 Local backup saved: ${localBackupPath}\n`);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fixProject();
