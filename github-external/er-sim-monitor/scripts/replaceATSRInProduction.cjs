#!/usr/bin/env node

/**
 * REPLACE ATSR IMPLEMENTATION IN PRODUCTION
 * Replaces the old ATSR code with the new "Titles Optimizer" version
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw'; // GPT Formatter (production)

console.log('\n🔄 REPLACING ATSR IMPLEMENTATION IN PRODUCTION\n');
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

async function replaceATSR() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`🎯 Production Project ID: ${PRODUCTION_PROJECT_ID}\n`);

    // Read the new ATSR implementation from test project backup
    const newATSRPath = path.join(__dirname, '../backups/all-projects-2025-11-06/test1-1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf/ATSR_Title_Generator_Feature.gs');
    console.log('📥 Reading new ATSR implementation from test project backup...\n');
    const newATSRCode = fs.readFileSync(newATSRPath, 'utf8');
    console.log(`✅ New ATSR code size: ${(newATSRCode.length / 1024).toFixed(1)} KB\n`);

    // Extract the ATSR code section (exclude the onOpen() function AND duplicate constants/functions)
    // The new ATSR file starts with comments and onOpen(), but we only want the ATSR-specific code
    // Skip ALL helper constants and functions that already exist in production

    // Find the start of the main ATSR function - this is unique to ATSR
    const atsrMainFunctionStart = newATSRCode.indexOf('// ========== 6) ATSR — Titles & Summary (Keep & Regenerate, Deselect, Memory) ==========');

    if (atsrMainFunctionStart === -1) {
      throw new Error('Could not find ATSR main section marker in new implementation');
    }

    // Extract everything from the ATSR main section onwards (skips all duplicate helpers)
    let newATSRImplementation = newATSRCode.substring(atsrMainFunctionStart);

    console.log(`✅ Extracted new ATSR implementation: ${(newATSRImplementation.length / 1024).toFixed(1)} KB\n`);

    // Read production code
    console.log('📥 Reading current production code...\n');
    const project = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = project.data.files.find(f => f.name === 'Code');
    const manifestFile = project.data.files.find(f => f.name === 'appsscript');

    if (!codeFile) {
      throw new Error('Could not find Code.gs file in production');
    }

    console.log(`✅ Current production code size: ${(codeFile.source.length / 1024).toFixed(1)} KB\n`);

    let productionCode = codeFile.source;

    // Find the old ATSR implementation in production
    // The old ATSR section starts around line 2017 with function runATSRTitleGenerator
    // We need to remove everything from the old ATSR section

    console.log('🔍 Finding old ATSR implementation in production code...\n');

    // Find the start of the old ATSR section (the function runATSRTitleGenerator)
    const oldATSRStart = productionCode.indexOf('function runATSRTitleGenerator(continueRow, keepSelections) {');

    if (oldATSRStart === -1) {
      throw new Error('Could not find old ATSR implementation start in production code');
    }

    // Find the end of the old ATSR section by finding the next major section
    // Look for the saveATSRData function and the onOpen function
    const saveATSRDataStart = productionCode.indexOf('function saveATSRData(row, data) {', oldATSRStart);
    const onOpenStart = productionCode.indexOf('function onOpen() {', oldATSRStart);

    // The old ATSR section ends right before onOpen()
    const oldATSREnd = onOpenStart;

    if (oldATSREnd === -1 || oldATSREnd <= oldATSRStart) {
      throw new Error('Could not find old ATSR implementation end in production code');
    }

    console.log(`📍 Old ATSR section found:`);
    console.log(`   Start: Character ${oldATSRStart} (approximately line ${productionCode.substring(0, oldATSRStart).split('\n').length})`);
    console.log(`   End: Character ${oldATSREnd} (approximately line ${productionCode.substring(0, oldATSREnd).split('\n').length})`);
    console.log(`   Size: ${((oldATSREnd - oldATSRStart) / 1024).toFixed(1)} KB\n`);

    // Replace the old ATSR section with the new implementation
    console.log('🔄 Replacing old ATSR implementation with new version...\n');

    const beforeATSR = productionCode.substring(0, oldATSRStart);
    const afterATSR = productionCode.substring(oldATSREnd);

    // Add section markers and the new ATSR code
    const updatedCode = beforeATSR +
      '// ==================== ATSR TITLE OPTIMIZER (v2) ====================\n' +
      '// Complete ATSR system with enhanced prompts and mystery regeneration\n' +
      '// Updated: ' + new Date().toISOString() + '\n\n' +
      newATSRImplementation +
      '\n\n// ==================== END OF ATSR IMPLEMENTATION ====================\n\n' +
      afterATSR;

    console.log(`📊 Updated production code size: ${(updatedCode.length / 1024).toFixed(1)} KB\n`);
    console.log(`📊 Size change: ${((updatedCode.length - productionCode.length) / 1024).toFixed(1)} KB\n`);

    // Create a backup before uploading
    const backupPath = path.join(__dirname, '../backups/production-before-atsr-replacement-2025-11-06.gs');
    fs.writeFileSync(backupPath, productionCode, 'utf8');
    console.log(`💾 Backup of old production code saved: ${backupPath}\n`);

    console.log('💾 Uploading updated code to production...\n');

    const files = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: updatedCode
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files }
    });

    console.log('✅ Successfully replaced ATSR implementation in production!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ REPLACEMENT COMPLETE!\n');
    console.log('📝 CHANGES MADE:\n');
    console.log('   REMOVED:');
    console.log('   - ❌ Old ATSR implementation (basic version)');
    console.log('   - ❌ Old ATSR prompts\n');
    console.log('   ADDED:');
    console.log('   - ✅ New ATSR Titles Optimizer (v2)');
    console.log('   - ✅ Enhanced Sim Mastery prompts');
    console.log('   - ✅ Memory Anchors system');
    console.log('   - ✅ Mystery title regeneration');
    console.log('   - ✅ Improved UI with visual polish\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📝 NEXT STEPS:\n');
    console.log('   1. Open your production spreadsheet\n');
    console.log('   2. Test the "ATSR Titles Optimizer" menu item\n');
    console.log('   3. Verify the new UI appears with:');
    console.log('      • Spark Titles (Pre-Sim Mystery)');
    console.log('      • Reveal Titles (Post-Sim Learning)');
    console.log('      • Memory Anchors (Unforgettable Patient Details)');
    console.log('      • Mystery regeneration button\n');
    console.log('   4. Generate titles for a test row to verify functionality\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Save the updated code locally
    const localBackupPath = path.join(__dirname, '../backups/production-with-new-atsr-2025-11-06.gs');
    fs.writeFileSync(localBackupPath, updatedCode, 'utf8');
    console.log(`💾 Local backup of new production code saved: ${localBackupPath}\n`);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

replaceATSR();
