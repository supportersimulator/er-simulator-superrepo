#!/usr/bin/env node

/**
 * UPDATE TEST SPREADSHEET WITH NEW ATSR (Mystery Button Version)
 * The test spreadsheet needs the mystery button feature added
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_PROJECT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

console.log('\n🔄 UPDATING TEST SPREADSHEET WITH NEW ATSR\n');
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

async function updateTestSpreadsheet() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`🎯 Test Project ID: ${TEST_PROJECT_ID}\n`);

    // First, download and check current test code
    console.log('📥 Reading current test project code...\n');
    const currentProject = await script.projects.getContent({
      scriptId: TEST_PROJECT_ID
    });

    const currentCodeFile = currentProject.data.files.find(f => f.name === 'Code');
    const manifestFile = currentProject.data.files.find(f => f.name === 'appsscript');

    if (!currentCodeFile) {
      throw new Error('Could not find Code.gs file in test project');
    }

    const currentCode = currentCodeFile.source;
    console.log(`✅ Current test code size: ${(currentCode.length / 1024).toFixed(1)} KB\n`);

    // Check if mystery button already exists
    const hasMysteryButton = currentCode.includes('Make More Mysterious');
    const hasATSR = currentCode.includes('function runATSRTitleGenerator');

    console.log(`${hasATSR ? '✅' : '❌'} ATSR function: ${hasATSR ? 'FOUND' : 'MISSING'}`);
    console.log(`${hasMysteryButton ? '✅' : '❌'} Mystery button: ${hasMysteryButton ? 'FOUND' : 'MISSING'}\n`);

    if (hasMysteryButton) {
      console.log('✅ Test spreadsheet ALREADY HAS mystery button feature!\n');
      console.log('   The code is up to date. If you can\'t see it:\n');
      console.log('   1. Hard refresh: Cmd+Shift+R\n');
      console.log('   2. Close and reopen spreadsheet\n');
      console.log('   3. Clear browser cache\n');
      console.log('═══════════════════════════════════════════════════════════════\n');
      return;
    }

    // Read the new ATSR implementation
    const newATSRPath = path.join(__dirname, '../backups/all-projects-2025-11-06/test1-1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf/ATSR_Title_Generator_Feature.gs');
    console.log('📥 Reading new ATSR implementation...\n');
    const newATSRCode = fs.readFileSync(newATSRPath, 'utf8');
    console.log(`✅ New ATSR code size: ${(newATSRCode.length / 1024).toFixed(1)} KB\n`);

    // Extract ATSR section from new code
    const atsrStartMarker = '// ========== 6) ATSR — Titles & Summary (Keep & Regenerate, Deselect, Memory) ==========';
    const atsrStart = newATSRCode.indexOf(atsrStartMarker);

    if (atsrStart === -1) {
      throw new Error('Could not find ATSR section marker in new code');
    }

    let newATSRImplementation = newATSRCode.substring(atsrStart);
    console.log(`✅ Extracted new ATSR: ${(newATSRImplementation.length / 1024).toFixed(1)} KB\n`);

    let updatedCode;

    if (hasATSR) {
      // Replace existing ATSR with new version
      console.log('🔄 Replacing old ATSR with new version...\n');

      const oldATSRStart = currentCode.indexOf('function runATSRTitleGenerator');
      const onOpenStart = currentCode.indexOf('function onOpen', oldATSRStart);

      if (oldATSRStart === -1 || onOpenStart === -1) {
        throw new Error('Could not find ATSR section boundaries in current code');
      }

      const beforeATSR = currentCode.substring(0, oldATSRStart);
      const afterATSR = currentCode.substring(onOpenStart);

      updatedCode = beforeATSR +
        '// ==================== ATSR TITLE OPTIMIZER (v2) ====================\n' +
        '// Mystery Button Feature - Progressive Title Obscuration\n' +
        '// Updated: ' + new Date().toISOString() + '\n\n' +
        newATSRImplementation +
        '\n\n// ==================== END OF ATSR IMPLEMENTATION ====================\n\n' +
        afterATSR;

    } else {
      // Add ATSR to test code (before onOpen)
      console.log('➕ Adding ATSR to test code...\n');

      const onOpenStart = currentCode.indexOf('function onOpen');

      if (onOpenStart === -1) {
        throw new Error('Could not find onOpen function in test code');
      }

      const beforeOnOpen = currentCode.substring(0, onOpenStart);
      const fromOnOpen = currentCode.substring(onOpenStart);

      updatedCode = beforeOnOpen +
        '// ==================== ATSR TITLE OPTIMIZER (v2) ====================\n' +
        '// Mystery Button Feature - Progressive Title Obscuration\n' +
        '// Updated: ' + new Date().toISOString() + '\n\n' +
        newATSRImplementation +
        '\n\n// ==================== END OF ATSR IMPLEMENTATION ====================\n\n' +
        fromOnOpen;
    }

    console.log(`📊 Updated test code size: ${(updatedCode.length / 1024).toFixed(1)} KB\n`);

    // Create backup before uploading
    const backupPath = path.join(__dirname, '../backups/test-before-atsr-update-2025-11-06.gs');
    fs.writeFileSync(backupPath, currentCode, 'utf8');
    console.log(`💾 Backup saved: ${backupPath}\n`);

    console.log('💾 Uploading updated code to test spreadsheet...\n');

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

    console.log('✅ Successfully updated test spreadsheet with mystery button!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ UPDATE COMPLETE!\n');
    console.log('📝 WHAT WAS ADDED:\n');
    console.log('   ✅ Mystery button feature (🎭 Make More Mysterious)');
    console.log('   ✅ Progressive title obscuration (3 levels)');
    console.log('   ✅ generateMysteriousSparkTitles() function');
    console.log('   ✅ regenerateMoreMysterious() JS handler\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📝 NEXT STEPS:\n');
    console.log('   1. Close your test spreadsheet tab completely\n');
    console.log('   2. Wait 5-10 seconds\n');
    console.log('   3. Reopen: https://docs.google.com/spreadsheets/d/1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI\n');
    console.log('   4. Click "ATSR Titles Optimizer" menu\n');
    console.log('   5. Look for the mystery button under Spark Titles!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Save updated code locally
    const localBackupPath = path.join(__dirname, '../backups/test-with-mystery-button-2025-11-06.gs');
    fs.writeFileSync(localBackupPath, updatedCode, 'utf8');
    console.log(`💾 Local backup saved: ${localBackupPath}\n`);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

updateTestSpreadsheet();
