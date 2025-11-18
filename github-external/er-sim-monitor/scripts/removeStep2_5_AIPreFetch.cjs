#!/usr/bin/env node

/**
 * REMOVE STEP 2.5 - AI PRE-FETCH
 *
 * User wants to see rough draft modal FIRST, THEN AI recommendations
 * populate asynchronously with live logs visible.
 *
 * Current (WRONG):
 * 1. Click Categories & Pathways
 * 2. Step 2.5: Pre-fetch AI (blocks UI for 5-10 seconds)
 * 3. Show Pathway UI
 * 4. Click cache button → Modal opens with pre-cached AI
 *
 * Desired (CORRECT):
 * 1. Click Categories & Pathways
 * 2. Refresh headers + init defaults only (instant)
 * 3. Show Pathway UI
 * 4. Click cache button → Modal opens INSTANTLY with rough draft
 * 5. AI called from modal HTML → User sees live logs → Section 2 updates
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

    console.log('📥 Downloading current production...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Removing Step 2.5 (AI pre-fetch) from runPathwayChainBuilder()...\n');

    // Find Step 2.5 section
    const step25Start = code.indexOf('// STEP 2.5: Pre-fetch AI recommendations in background');
    if (step25Start === -1) {
      console.log('❌ Could not find Step 2.5 section\n');
      console.log('It may have already been removed.\n');
      return;
    }

    // Find end of Step 2.5 (before STEP 3)
    const step3Start = code.indexOf('// STEP 3: Get or create holistic analysis', step25Start);
    if (step3Start === -1) {
      console.log('❌ Could not find Step 3 marker\n');
      process.exit(1);
    }

    // Remove Step 2.5 entirely
    code = code.substring(0, step25Start) + code.substring(step3Start);

    console.log('✅ Removed Step 2.5\n');
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
    console.log('New size:', (code.length / 1024).toFixed(1), 'KB\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ REMOVED STEP 2.5 - AI PRE-FETCH!\n');
    console.log('\nNEW FLOW:\n');
    console.log('1. Click "Categories & Pathways"');
    console.log('   → refreshHeaders() (instant)');
    console.log('   → Initialize 35 defaults if not saved (instant)');
    console.log('   → getOrCreateHolisticAnalysis_() (fast, cached)');
    console.log('   → Show Pathway UI\n');
    console.log('2. Click cache button from Pathway UI');
    console.log('   → showFieldSelector() opens INSTANTLY');
    console.log('   → Rough draft displays (3 sections):');
    console.log('     • DEFAULT: 35 fields (checked)');
    console.log('     • RECOMMENDED: Empty initially');
    console.log('     • OTHER: All remaining fields\n');
    console.log('3. Modal calls getRecommendedFields() asynchronously');
    console.log('   → User sees live logs in console');
    console.log('   → AI processes request (5-10 seconds)');
    console.log('   → Section 2 updates with recommendations');
    console.log('   → ✓✓ badges appear where AI agrees with defaults\n');
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
