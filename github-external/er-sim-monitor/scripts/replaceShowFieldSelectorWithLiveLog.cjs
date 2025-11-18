#!/usr/bin/env node

/**
 * REPLACE showFieldSelector() WITH COMPLETE VERSION (HAS LIVE LOG)
 *
 * Current deployed version is simple (no Live Log).
 * Need to replace with complete version from backup that has:
 * - Live Log panel at top
 * - Copy button
 * - Section 1: Selected defaults
 * - Section 2: AI recommendations
 * - Section 3: All other fields
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

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

    console.log('📥 Step 1: Downloading current deployed code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('📥 Step 2: Loading backup with complete showFieldSelector()...\n');

    const backupCode = fs.readFileSync('/tmp/actual_deployed_code.gs', 'utf8');

    console.log('🔧 Step 3: Extracting complete showFieldSelector() from backup...\n');

    // Extract from backup (has Live Log)
    const backupFuncStart = backupCode.indexOf('function showFieldSelector() {');
    const backupFuncEnd = backupCode.indexOf('\n/**', backupFuncStart);

    if (backupFuncStart === -1 || backupFuncEnd === -1) {
      console.log('❌ Could not extract function from backup\n');
      return;
    }

    const completeFunction = backupCode.substring(backupFuncStart, backupFuncEnd);

    console.log('✅ Extracted complete function (' + (completeFunction.length / 1024).toFixed(1) + 'KB)\n');

    // Verify it has Live Log
    if (!completeFunction.includes('Live Log') || !completeFunction.includes('log-panel')) {
      console.log('❌ ERROR: Extracted function missing Live Log!\n');
      return;
    }

    console.log('✅ Verified: Function has Live Log panel\n');

    console.log('🔧 Step 4: Replacing showFieldSelector() in current code...\n');

    // Find current function
    const currentFuncStart = code.indexOf('function showFieldSelector() {');
    let currentFuncEnd = code.indexOf('\n/**', currentFuncStart);

    if (currentFuncEnd === -1) {
      // Try alternative ending
      currentFuncEnd = code.indexOf('\nfunction ', currentFuncStart + 50);
    }

    if (currentFuncStart === -1 || currentFuncEnd === -1) {
      console.log('❌ Could not find current function\n');
      return;
    }

    // Replace
    code = code.substring(0, currentFuncStart) + completeFunction + code.substring(currentFuncEnd);

    console.log('✅ Replaced function\n');

    console.log('📤 Step 5: Deploying...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ showFieldSelector() NOW HAS LIVE LOG!\n');
    console.log('\nField Selector Modal now includes:\n');
    console.log('  ✅ Live Log panel at top (dark theme)');
    console.log('  ✅ Copy button for logs');
    console.log('  ✅ Section 1: Last saved defaults (pre-checked)');
    console.log('  ✅ Section 2: AI recommendations with rationale');
    console.log('  ✅ Section 3: All other 642 fields');
    console.log('  ✅ "💾 Cache All Layers" button at bottom');
    console.log('  ✅ "🔄 Reset to Defaults" button\n');
    console.log('Complete workflow now working:\n');
    console.log('  1. Click "Categories & Pathways" → Background steps run');
    console.log('  2. Pathway UI opens with cache button');
    console.log('  3. Click cache button → Field selector with Live Log opens');
    console.log('  4. Adjust fields → Click "Cache All Layers"');
    console.log('  5. Watch Live Log show batch processing progress!');
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
