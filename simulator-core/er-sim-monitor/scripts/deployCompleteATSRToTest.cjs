#!/usr/bin/env node

/**
 * DEPLOY COMPLETE ATSR TO TEST ENVIRONMENT
 * Replaces incomplete ATSR with full 42.4 KB version (11/11 features including mystery button)
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_PROJECT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

console.log('\n🚀 DEPLOYING COMPLETE ATSR TO TEST ENVIRONMENT\n');
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

async function deployATSR() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`🎯 TEST Project ID: ${TEST_PROJECT_ID}\n`);

    // Step 1: Download current test code
    console.log('📥 Step 1: Downloading current test code...\n');
    const currentProject = await script.projects.getContent({
      scriptId: TEST_PROJECT_ID
    });

    const currentCodeFile = currentProject.data.files.find(f => f.name === 'Code');
    const manifestFile = currentProject.data.files.find(f => f.name === 'appsscript');

    if (!currentCodeFile) {
      throw new Error('Could not find Code.gs in test project');
    }

    const currentCode = currentCodeFile.source;
    console.log(`✅ Current test code: ${(currentCode.length / 1024).toFixed(1)} KB\n`);

    // Create backup BEFORE any modifications
    const backupPath = path.join(__dirname, '../backups/test-before-complete-atsr-2025-11-06.gs');
    fs.writeFileSync(backupPath, currentCode, 'utf8');
    console.log(`💾 Backup created: ${backupPath}\n`);

    // Step 2: Load IMPROVED ATSR version with enhanced UI
    console.log('📥 Step 2: Loading improved ATSR version (enhanced UI + mystery button)...\n');
    const bestATSRPath = path.join(__dirname, '../backups/ATSR_Title_Generator_Feature_IMPROVED.gs');

    if (!fs.existsSync(bestATSRPath)) {
      throw new Error(`Best ATSR file not found at: ${bestATSRPath}`);
    }

    const fullATSRFile = fs.readFileSync(bestATSRPath, 'utf8');
    console.log(`✅ Complete file loaded: ${(fullATSRFile.length / 1024).toFixed(1)} KB\n`);

    // Extract ONLY the ATSR section (skip duplicate declarations and utility functions)
    const atsrMarker = '// ========== 6) ATSR — Titles & Summary';
    const atsrSectionStart = fullATSRFile.indexOf(atsrMarker);

    if (atsrSectionStart === -1) {
      throw new Error('Could not find ATSR section marker in best file');
    }

    const completeATSR = fullATSRFile.substring(atsrSectionStart);
    console.log(`✅ ATSR section extracted: ${(completeATSR.length / 1024).toFixed(1)} KB (skipped duplicate declarations)\n`);

    // Verify complete ATSR has all required features
    console.log('🔍 Step 3: Verifying complete ATSR has mystery button features...\n');
    const hasShowParam = completeATSR.includes('showMysteryButton');
    const hasRegenFunc = completeATSR.includes('function regenerateMoreMysterious');
    const hasMysteriousFunc = completeATSR.includes('function generateMysteriousSparkTitles');
    const hasBuildUI = completeATSR.includes('function buildATSRUltimateUI_');

    console.log(`${hasShowParam ? '✅' : '❌'} showMysteryButton parameter: ${hasShowParam}`);
    console.log(`${hasRegenFunc ? '✅' : '❌'} regenerateMoreMysterious() function: ${hasRegenFunc}`);
    console.log(`${hasMysteriousFunc ? '✅' : '❌'} generateMysteriousSparkTitles() function: ${hasMysteriousFunc}`);
    console.log(`${hasBuildUI ? '✅' : '❌'} buildATSRUltimateUI_() function: ${hasBuildUI}`);

    if (!hasShowParam || !hasRegenFunc || !hasMysteriousFunc || !hasBuildUI) {
      throw new Error('Complete ATSR is missing required mystery button features!');
    }

    console.log('\n✅ All mystery button features verified!\n');

    // Step 4: Find and replace ATSR section in test code
    console.log('🔄 Step 4: Replacing ATSR section in test code...\n');

    // Find the start of ATSR section
    const atsrStartMarker = 'function runATSRTitleGenerator';
    const atsrStart = currentCode.indexOf(atsrStartMarker);

    if (atsrStart === -1) {
      throw new Error('Could not find ATSR section in current test code');
    }

    // Find the end of ATSR section (next major function after ATSR)
    // Look for pickMasterSheet_ function which comes after ATSR
    const nextFunctionStart = currentCode.indexOf('function pickMasterSheet_', atsrStart);

    if (nextFunctionStart === -1) {
      throw new Error('Could not find pickMasterSheet_ function (ATSR section boundary)');
    }

    console.log(`✅ Found ATSR section: char ${atsrStart} to ${nextFunctionStart}\n`);

    // Build new code with complete ATSR
    const beforeATSR = currentCode.substring(0, atsrStart);
    const afterATSR = currentCode.substring(nextFunctionStart);

    const updatedCode = beforeATSR +
      '// ══════════════════════════════════════════════════════════════════════════════\n' +
      '// ATSR TITLE OPTIMIZER v2 - COMPLETE IMPLEMENTATION\n' +
      '// Mystery Button Feature + Progressive Title Obscuration\n' +
      '// Updated: ' + new Date().toISOString() + '\n' +
      '// Features: 11/11 (Memory Anchors, Mystery Button, Sim Mastery, Quality Criteria)\n' +
      '// ══════════════════════════════════════════════════════════════════════════════\n\n' +
      completeATSR +
      '\n\n// ══════════════════════════════════════════════════════════════════════════════\n' +
      '// END OF ATSR IMPLEMENTATION\n' +
      '// ══════════════════════════════════════════════════════════════════════════════\n\n' +
      afterATSR;

    console.log(`📊 Updated test code size: ${(updatedCode.length / 1024).toFixed(1)} KB\n`);
    console.log(`   Before: ${(currentCode.length / 1024).toFixed(1)} KB\n`);
    console.log(`   Change: ${((updatedCode.length - currentCode.length) / 1024).toFixed(1)} KB\n`);

    // Step 5: Deploy to test environment
    console.log('💾 Step 5: Deploying to test environment...\n');

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

    console.log('✅ Successfully deployed complete ATSR to test!\n');

    // Save updated code locally
    const updatedBackupPath = path.join(__dirname, '../backups/test-with-complete-atsr-2025-11-06.gs');
    fs.writeFileSync(updatedBackupPath, updatedCode, 'utf8');
    console.log(`💾 Updated code saved: ${updatedBackupPath}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ DEPLOYMENT COMPLETE!\n');
    console.log('📝 WHAT WAS ADDED TO TEST ENVIRONMENT:\n');
    console.log('   ✅ showMysteryButton parameter (enables button visibility)');
    console.log('   ✅ regenerateMoreMysterious() JavaScript function (button click handler)');
    console.log('   ✅ generateMysteriousSparkTitles() backend function (3-level obscuration)');
    console.log('   ✅ Complete mystery button UI with onclick handler');
    console.log('   ✅ Progressive title obscuration (Levels 1, 2, 3)');
    console.log('   ✅ Memory Anchors system integration');
    console.log('   ✅ Sim Mastery philosophy prompts\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📝 NEXT STEPS:\n');
    console.log('   1. Close test spreadsheet tab completely\n');
    console.log('   2. Wait 5-10 seconds for script to reload\n');
    console.log('   3. Reopen: https://docs.google.com/spreadsheets/d/1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI\n');
    console.log('   4. Click "ATSR Titles Optimizer" menu\n');
    console.log('   5. Look for 🎭 "Make More Mysterious" button under Spark Titles!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deployATSR();
