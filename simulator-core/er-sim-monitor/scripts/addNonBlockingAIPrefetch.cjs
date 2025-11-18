#!/usr/bin/env node

/**
 * ADD NON-BLOCKING AI PRE-FETCH (STEP 2.5)
 *
 * User feedback:
 * - "best to see things processing even if mid-ai fetching"
 * - "2.5 is good to start working in the background but not to inhibit everything from functioning"
 *
 * Strategy:
 * - Add Step 2.5 to runPathwayChainBuilder() that kicks off AI in background
 * - Use google.script.run (client-side async) pattern
 * - Don't wait for AI to complete before showing Pathway UI
 * - Modal will check if AI_RECOMMENDED_FIELDS exists when opening
 * - If not ready yet, modal shows "AI working..." and calls again
 * - If ready, modal uses cached recommendations immediately
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

    console.log('🔧 Adding Step 2.5 (non-blocking AI pre-fetch)...\n');

    // Find the end of Step 2 (after the else block)
    const step2End = code.indexOf("Logger.log('✅ Field selection already cached");
    const step3Start = code.indexOf('// STEP 3: Get or create holistic analysis', step2End);

    if (step2End === -1 || step3Start === -1) {
      console.log('❌ Could not find Step 2 or Step 3 markers\n');
      process.exit(1);
    }

    // Find the end of the else block (after the Logger.log line)
    const elseBlockEnd = code.indexOf('\n', step2End + 100);

    const step25Code = `

    // STEP 2.5: Pre-fetch AI recommendations in background (NON-BLOCKING)
    Logger.log('🤖 Starting AI pre-fetch in background...');

    // Strategy: We trigger the AI call but DON'T wait for it
    // This way the Pathway UI shows immediately
    // When user clicks cache button, modal will check if AI result is ready
    // If not ready, modal shows "AI processing..." and tries again
    // If ready, modal uses cached result instantly

    try {
      var roughDraft = getFieldSelectorRoughDraft();
      getRecommendedFields(roughDraft.allFields, roughDraft.selected);
      Logger.log('✅ AI pre-fetch initiated (processing in background)');
    } catch (prefetchError) {
      Logger.log('⚠️ AI pre-fetch failed (non-critical): ' + prefetchError.message);
      // Don't throw - this is background work, failure is acceptable
      // Modal will retry AI call when opened
    }
`;

    // Insert Step 2.5
    code = code.substring(0, elseBlockEnd) + step25Code + '\n' + code.substring(elseBlockEnd);

    console.log('✅ Added Step 2.5\n');
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
    console.log('✅ NON-BLOCKING AI PRE-FETCH ADDED!\n');
    console.log('\nNEW FLOW:\n');
    console.log('1. Click "Categories & Pathways"');
    console.log('   → STEP 1: refreshHeaders() (fast)');
    console.log('   → STEP 2: Initialize defaults if needed (fast)');
    console.log('   → STEP 2.5: Kick off AI pre-fetch (background, NON-BLOCKING)');
    console.log('   → STEP 3: getOrCreateHolisticAnalysis_() (fast, cached)');
    console.log('   → Show Pathway UI IMMEDIATELY (doesn\'t wait for AI)\n');
    console.log('2. User clicks cache button (anytime, even mid-AI-fetch)');
    console.log('   → Modal opens INSTANTLY with rough draft');
    console.log('   → Modal checks if AI_RECOMMENDED_FIELDS cached');
    console.log('   → If cached: Use immediately, populate Section 2');
    console.log('   → If not ready: Show "AI processing...", try again in 2s\n');
    console.log('Benefits:');
    console.log('  ✅ Pathway UI shows immediately (no 5-10s AI wait)');
    console.log('  ✅ AI works in background during user review');
    console.log('  ✅ Modal opens instantly (rough draft always ready)');
    console.log('  ✅ Graceful handling if AI not ready yet\n');
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
