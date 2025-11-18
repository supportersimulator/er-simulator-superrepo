#!/usr/bin/env node

/**
 * FIX PRODUCTION SHEET PROPERTY
 * Set LAST_OUTPUT_SHEET to "Master Scenario Convert"
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔧 FIXING PRODUCTION SHEET PROPERTY\n');
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

async function fix() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔍 Diagnosis:\n');
    console.log('   Issue 1: refreshHeaders() looks for LAST_OUTPUT_SHEET property');
    console.log('   Issue 2: Property defaults to "Output" but actual sheet is "Master Scenario Convert"');
    console.log('   Issue 3: pickMasterSheet_() already has fallback logic but refreshHeaders() doesn\'t\n');

    console.log('🔧 Fixing refreshHeaders() to use pickMasterSheet_()...\n');

    // Find and replace refreshHeaders function
    const oldRefreshHeaders = `function refreshHeaders() {
  const ui = getSafeUi_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const outputSheet = ss.getSheetByName(getProp('LAST_OUTPUT_SHEET') || 'Output');
  if (!outputSheet) {
    if (ui) { ui.alert('❌ Output sheet not found.'); }
    return;
  }`;

    const newRefreshHeaders = `function refreshHeaders() {
  const ui = getSafeUi_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Use pickMasterSheet_() instead of hardcoded fallback
  const outputSheet = pickMasterSheet_();
  if (!outputSheet) {
    if (ui) { ui.alert('❌ Master sheet not found.'); }
    return;
  }`;

    if (code.includes(oldRefreshHeaders)) {
      code = code.replace(oldRefreshHeaders, newRefreshHeaders);
      console.log('✅ Fixed refreshHeaders() to use pickMasterSheet_()\n');
    } else {
      console.log('⚠️  refreshHeaders() pattern not found (may have been already fixed)\n');
    }

    // Also fix retrainPromptStructure
    const oldRetrainPrompt = `function retrainPromptStructure() {
  const ui = getSafeUi_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const outputSheet = ss.getSheetByName(getProp('LAST_OUTPUT_SHEET') || 'Output');
  if (!outputSheet) {
    if (ui) { ui.alert('❌ Output sheet not found.'); }
    return;
  }`;

    const newRetrainPrompt = `function retrainPromptStructure() {
  const ui = getSafeUi_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Use pickMasterSheet_() instead of hardcoded fallback
  const outputSheet = pickMasterSheet_();
  if (!outputSheet) {
    if (ui) { ui.alert('❌ Master sheet not found.'); }
    return;
  }`;

    if (code.includes(oldRetrainPrompt)) {
      code = code.replace(oldRetrainPrompt, newRetrainPrompt);
      console.log('✅ Fixed retrainPromptStructure() to use pickMasterSheet_()\n');
    }

    // Now fix the category.toUpperCase() issue - add null safety
    console.log('🔧 Adding null safety to category.toUpperCase() calls...\n');

    // Fix in extractPrimarySystem_
    const oldExtractSystem = `function extractPrimarySystem_(category) {
  const systems = ['CARD', 'RESP', 'NEUR', 'GI', 'ENDO', 'RENAL', 'ORTHO', 'PSYCH', 'SKIN'];
  const catUpper = category.toUpperCase();`;

    const newExtractSystem = `function extractPrimarySystem_(category) {
  const systems = ['CARD', 'RESP', 'NEUR', 'GI', 'ENDO', 'RENAL', 'ORTHO', 'PSYCH', 'SKIN'];
  if (!category || typeof category !== 'string') return '';
  const catUpper = category.toUpperCase();`;

    if (code.includes(oldExtractSystem)) {
      code = code.replace(oldExtractSystem, newExtractSystem);
      console.log('✅ Added null safety to extractPrimarySystem_()\n');
    }

    // Fix inline category.toUpperCase() calls - make them safe
    code = code.replace(
      /c\.category\.toUpperCase\(\)/g,
      '(c.category || \'\').toUpperCase()'
    );
    console.log('✅ Added null safety to inline category.toUpperCase() calls\n');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-sheet-property-fix-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up to: ${backupPath}\n`);

    // Deploy
    console.log('📤 Deploying fixes to production...\n');

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

    console.log(`✅ Deployment successful! Size: ${newSize} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 FIXES APPLIED!\n');
    console.log('What was fixed:\n');
    console.log('   ✅ refreshHeaders() now uses pickMasterSheet_()');
    console.log('   ✅ retrainPromptStructure() now uses pickMasterSheet_()');
    console.log('   ✅ category.toUpperCase() calls now have null safety\n');
    console.log('Next steps:\n');
    console.log('   1. Refresh your production spreadsheet\n');
    console.log('   2. Click "🧠 Sim Builder" → "🧩 Categories & Pathways"\n');
    console.log('   3. Should open without errors!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
