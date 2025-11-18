#!/usr/bin/env node

/**
 * REMOVE ALL DUPLICATE ATSR CODE FROM TEST
 * Keep only the latest version with mystery button
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_PROJECT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

console.log('\n🧹 REMOVING ALL DUPLICATE ATSR CODE\n');
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

async function removeDuplicates() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`🎯 TEST Project ID: ${TEST_PROJECT_ID}\n`);

    // Download current code
    console.log('📥 Downloading current test code...\n');
    const project = await script.projects.getContent({
      scriptId: TEST_PROJECT_ID
    });

    const codeFile = project.data.files.find(f => f.name === 'Code');
    const manifestFile = project.data.files.find(f => f.name === 'appsscript');

    if (!codeFile) {
      throw new Error('Could not find Code.gs in test project');
    }

    const currentCode = codeFile.source;
    console.log(`✅ Current code: ${(currentCode.length / 1024).toFixed(1)} KB\n`);

    // Create backup
    const backupPath = path.join(__dirname, '../backups/test-before-dedup-2025-11-06.gs');
    fs.writeFileSync(backupPath, currentCode, 'utf8');
    console.log(`💾 Backup created: ${backupPath}\n`);

    // Strategy: Remove ALL ATSR code, then add back ONLY the clean improved version
    console.log('🔍 Finding all ATSR sections...\n');

    // Find the FIRST occurrence of runATSRTitleGenerator (this might be old)
    const firstATSRStart = currentCode.indexOf('function runATSRTitleGenerator');

    // Find the LAST occurrence to get the complete ATSR section
    const lastATSRStart = currentCode.lastIndexOf('function runATSRTitleGenerator');

    console.log(`   First ATSR at line ~${currentCode.substring(0, firstATSRStart).split('\n').length}`);
    console.log(`   Last ATSR at line ~${currentCode.substring(0, lastATSRStart).split('\n').length}\n`);

    // Remove EVERYTHING between first ATSR and onOpen function
    const onOpenStart = currentCode.lastIndexOf('// ==================== MENU SYSTEM ====================');

    if (onOpenStart === -1) {
      throw new Error('Could not find MENU SYSTEM marker');
    }

    console.log(`   Menu starts at line ~${currentCode.substring(0, onOpenStart).split('\n').length}\n`);

    // Build clean code: everything BEFORE first ATSR + improved ATSR + menu + end
    const beforeATSR = currentCode.substring(0, firstATSRStart);
    const afterATSR = currentCode.substring(onOpenStart);

    // Load the improved ATSR version
    console.log('📥 Loading improved ATSR version...\n');
    const improvedATSRPath = path.join(__dirname, '../backups/ATSR_Title_Generator_Feature_IMPROVED.gs');
    const improvedATSRFile = fs.readFileSync(improvedATSRPath, 'utf8');

    // Extract ONLY the ATSR section
    const atsrMarker = '// ========== 6) ATSR — Titles & Summary';
    const atsrStart = improvedATSRFile.indexOf(atsrMarker);
    const improvedATSR = improvedATSRFile.substring(atsrStart);

    console.log(`✅ Improved ATSR: ${(improvedATSR.length / 1024).toFixed(1)} KB\n`);

    // Build final code
    const updatedCode = beforeATSR +
      '// ══════════════════════════════════════════════════════════════════════════════\n' +
      '// ATSR TITLE OPTIMIZER v2 - SINGLE CLEAN IMPLEMENTATION\n' +
      '// Mystery Button Feature + Progressive Title Obscuration\n' +
      '// Updated: ' + new Date().toISOString() + '\n' +
      '// ALL DUPLICATES REMOVED - This is the ONLY ATSR implementation\n' +
      '// ══════════════════════════════════════════════════════════════════════════════\n\n' +
      improvedATSR +
      '\n\n' +
      afterATSR;

    console.log(`📊 Updated code size: ${(updatedCode.length / 1024).toFixed(1)} KB\n`);
    console.log(`   Before: ${(currentCode.length / 1024).toFixed(1)} KB\n`);
    console.log(`   Removed: ${((currentCode.length - updatedCode.length) / 1024).toFixed(1)} KB of duplicates\n`);

    // Upload
    console.log('💾 Uploading clean code to test environment...\n');

    const files = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: updatedCode
      },
      manifestFile
    ];

    await script.projects.updateContent({
      scriptId: TEST_PROJECT_ID,
      requestBody: { files }
    });

    console.log('✅ Successfully removed all duplicates!\n');

    // Save clean code
    const cleanBackupPath = path.join(__dirname, '../backups/test-clean-single-atsr-2025-11-06.gs');
    fs.writeFileSync(cleanBackupPath, updatedCode, 'utf8');
    console.log(`💾 Clean code saved: ${cleanBackupPath}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ CLEANUP COMPLETE!\n');
    console.log('📝 WHAT WAS DONE:\n');
    console.log('   ❌ Removed all OLD ATSR implementations\n');
    console.log('   ❌ Removed all duplicate functions\n');
    console.log('   ✅ Kept ONLY the improved ATSR with mystery button\n');
    console.log('   ✅ Kept the menu function\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📝 NEXT STEPS:\n');
    console.log('   1. Close test spreadsheet completely\n');
    console.log('   2. Wait 10 seconds\n');
    console.log('   3. Reopen and test!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

removeDuplicates();
