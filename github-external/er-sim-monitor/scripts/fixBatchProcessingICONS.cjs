#!/usr/bin/env node

/**
 * FIX BATCH PROCESSING ICONS ERROR
 * The sidebar HTML references ICONS object that doesn't exist
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 FIXING BATCH PROCESSING ICONS ERROR\n');
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

async function fixICONS() {
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

    // Check if ICONS is defined
    const hasICONS = code.includes('const ICONS = {') || code.includes('var ICONS = {');

    console.log(`🔍 ICONS object defined: ${hasICONS ? '✅ YES' : '❌ NO'}\n`);

    if (hasICONS) {
      console.log('✅ ICONS object already exists - error must be elsewhere.\n');

      // Check if it's in the openSimSidebar function scope
      const openSimSidebarMatch = code.match(/function openSimSidebar\(\) \{[\s\S]*?\n\}/);
      if (openSimSidebarMatch) {
        const funcBody = openSimSidebarMatch[0];
        const hasLocalICONS = funcBody.includes('const ICONS =') || funcBody.includes('var ICONS =');
        console.log(`   ICONS defined inside openSimSidebar: ${hasLocalICONS ? '✅ YES' : '❌ NO'}\n`);
      }

      return;
    }

    console.log('🔧 Adding ICONS object to code...\n');

    // Define ICONS object
    const ICONS_definition = `
// ═══════════════════════════════════════════════════════════════
// BATCH PROCESSING ICONS
// ═══════════════════════════════════════════════════════════════

const ICONS = {
  BATCH: '🚀',
  NEXT: '⏭️',
  ALL: '📋',
  SPECIFIC: '🎯',
  PLAY: '▶️',
  STOP: '⏹️',
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  PROCESSING: '⏳',
  COMPLETE: '🎉'
};
`;

    // Find a good place to insert ICONS (after other constants, before functions)
    // Look for the first function definition
    const firstFunctionMatch = code.match(/^function /m);

    if (firstFunctionMatch) {
      const insertPos = firstFunctionMatch.index;
      code = code.slice(0, insertPos) + ICONS_definition + '\n' + code.slice(insertPos);
      console.log('✅ Inserted ICONS object before first function\n');
    } else {
      // If no functions found, prepend to beginning
      code = ICONS_definition + '\n' + code;
      console.log('✅ Prepended ICONS object to code\n');
    }

    // Backup current version
    const backupPath = path.join(__dirname, '../backups/production-before-icons-fix-2025-11-06.gs');
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
    console.log('🎉 ICONS ERROR FIXED!\n');
    console.log('Next steps:\n');
    console.log('   1. Refresh your production spreadsheet\n');
    console.log('   2. Click "🧠 Sim Builder" → "🚀 Batch Processing"\n');
    console.log('   3. The sidebar should now load without errors!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fixICONS();
