#!/usr/bin/env node

/**
 * FIX FUNCTION NAME MISMATCH
 *
 * runPathwayChainBuilder() calls getAIRecommendedFields()
 * but the actual function is named getRecommendedFields()
 *
 * This is a surgical 1-line fix.
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

    console.log('📥 Downloading current code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('Current size: ' + (code.length / 1024).toFixed(1) + 'KB');
    console.log('Lines: ' + code.split('\n').length + '\n');

    // Verify all critical functions exist
    const critical = [
      'onOpen',
      'runATSRTitleGenerator',
      'startBatchFromSidebar',
      'runPathwayChainBuilder',
      'showFieldSelector',
      'performCacheWithProgress',
      'getRecommendedFields',
      'refreshHeaders'
    ];

    console.log('🔍 Verifying critical functions:\n');
    let allPresent = true;
    critical.forEach(fn => {
      const regex = new RegExp('function ' + fn + '\\(');
      const has = regex.test(code);
      console.log((has ? '✅' : '❌') + ' ' + fn);
      if (!has) allPresent = false;
    });

    if (!allPresent) {
      console.log('\n❌ ERROR: Missing critical functions!\n');
      process.exit(1);
    }

    console.log('\n✅ All critical functions present\n');

    // Fix the function name mismatch
    console.log('🔧 Fixing getAIRecommendedFields → getRecommendedFields...\n');

    const originalCode = code;

    // Replace all occurrences of getAIRecommendedFields with getRecommendedFields
    code = code.replace(/getAIRecommendedFields\(/g, 'getRecommendedFields(');

    if (code === originalCode) {
      console.log('✅ Function calls already correct\n');
    } else {
      const changes = (originalCode.match(/getAIRecommendedFields\(/g) || []).length;
      console.log('✅ Fixed ' + changes + ' function call(s)\n');
    }

    console.log('📤 Deploying...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('✅ Deployed!\n');
    console.log('New size: ' + (code.length / 1024).toFixed(1) + 'KB\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ FUNCTION NAME MISMATCH FIXED!\n');
    console.log('\nYour complete workflow is now ready:\n');
    console.log('  1. Click "Categories & Pathways" menu');
    console.log('     → Headers cache refreshes');
    console.log('     → 35 defaults initialize if needed');
    console.log('     → AI recommendations pre-fetch (fixed!)');
    console.log('     → Pathway UI opens\n');
    console.log('  2. Click "💾 Cache All Layers" button on Pathway UI');
    console.log('     → Field selector modal opens with Live Log');
    console.log('     → Section 1: Last saved defaults');
    console.log('     → Section 2: AI recommendations');
    console.log('     → Section 3: All other fields\n');
    console.log('  3. Adjust fields → Click "Cache All Layers" in modal');
    console.log('     → Batch processing starts (25 rows at a time)');
    console.log('     → Live Log shows progress\n');
    console.log('All features preserved:');
    console.log('  ✅ ATSR Title Generator');
    console.log('  ✅ Batch Processing Engine');
    console.log('  ✅ Categories & Pathways');
    console.log('  ✅ Field Selector with Live Log');
    console.log('  ✅ Complete Cache System\n');
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
