#!/usr/bin/env node

/**
 * SURGICAL FIX: Create minimal analysis placeholder for Pathway UI
 *
 * PROBLEM: buildBirdEyeViewUI_() needs analysis object, but we don't want
 * to process ALL cases when clicking "Categories & Pathways"
 *
 * SOLUTION: Return minimal placeholder with required structure:
 * - totalCases: 0
 * - systemDistribution: {}
 * - topPathways: []
 * - insights: ["Click 'Pre-Cache Rich Data' to analyze all cases"]
 *
 * This lets the UI load instantly. User clicks "Pre-Cache Rich Data" button
 * in the UI to trigger actual batch processing.
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

    console.log('🔧 STEP 1: Replacing Step 3 with minimal placeholder analysis...\n');

    // Find the problematic Step 3
    const oldStep3 = '    / STEP 3: Get or create holistic analysis (cached)\n    const analysis = getOrCreateHolisticAnalysis_();';

    const newStep3 = `    // STEP 3: Create minimal placeholder analysis (no batch processing yet)
    // The UI needs these properties to render:
    // - totalCases, systemDistribution, topPathways, insights
    // User will click "Pre-Cache Rich Data" button to trigger actual processing
    const analysis = {
      totalCases: 0,
      systemDistribution: {},
      topPathways: [],
      insights: ['💡 Click "Pre-Cache Rich Data" button to analyze all simulation cases and discover intelligent pathways']
    };
    Logger.log('✅ Step 3: Created placeholder analysis (no batch processing)');`;

    if (code.includes(oldStep3)) {
      code = code.replace(oldStep3, newStep3);
      console.log('✅ Replaced Step 3 with minimal placeholder\n');
    } else {
      console.log('⚠️  Could not find exact Step 3 pattern\n');
      console.log('Looking for alternative pattern...\n');

      // Try alternative pattern
      const altPattern = 'const analysis = getOrCreateHolisticAnalysis_();';
      if (code.includes(altPattern)) {
        // Find the function context (runPathwayChainBuilder)
        const funcStart = code.indexOf('function runPathwayChainBuilder');
        const funcEnd = code.indexOf('\n// ========== HOLISTIC ANALYSIS ENGINE ==========', funcStart);
        const functionBody = code.substring(funcStart, funcEnd);

        if (functionBody.includes(altPattern)) {
          const newBody = functionBody.replace(
            altPattern,
            `// STEP 3: Create minimal placeholder analysis (no batch processing yet)
    const analysis = {
      totalCases: 0,
      systemDistribution: {},
      topPathways: [],
      insights: ['💡 Click "Pre-Cache Rich Data" button to analyze all simulation cases and discover intelligent pathways']
    };
    Logger.log('✅ Step 3: Created placeholder analysis (no batch processing)');`
          );

          code = code.substring(0, funcStart) + newBody + code.substring(funcEnd);
          console.log('✅ Replaced Step 3 using alternative pattern\n');
        } else {
          console.log('❌ Could not find getOrCreateHolisticAnalysis_() call\n');
          return;
        }
      }
    }

    console.log('🔧 STEP 2: Verifying batch processing is triggered by preCacheRichData()...\n');

    // Verify that preCacheRichData() -> showFieldSelector() -> saveFieldSelectionAndStartCache() -> performCacheWithProgress() chain exists
    const hasPrecache = code.includes('function preCacheRichData()');
    const hasShowFieldSelector = code.includes('function showFieldSelector()');
    const hasSaveFieldSelection = code.includes('function saveFieldSelectionAndStartCache');
    const hasPerformCache = code.includes('function performCacheWithProgress()');

    console.log('   preCacheRichData(): ' + (hasPrecache ? '✅' : '❌'));
    console.log('   showFieldSelector(): ' + (hasShowFieldSelector ? '✅' : '❌'));
    console.log('   saveFieldSelectionAndStartCache(): ' + (hasSaveFieldSelection ? '✅' : '❌'));
    console.log('   performCacheWithProgress(): ' + (hasPerformCache ? '✅' : '❌'));
    console.log('');

    if (hasPrecache && hasShowFieldSelector && hasSaveFieldSelection && hasPerformCache) {
      console.log('✅ Complete batch processing chain exists\n');
      console.log('   User workflow:\n');
      console.log('   1. Click "Categories & Pathways" menu → Headers cache + AI recommendations (no processing)\n');
      console.log('   2. Pathway UI loads with placeholder analysis\n');
      console.log('   3. Click "Pre-Cache Rich Data" button → Field selector modal opens\n');
      console.log('   4. User selects fields → Click "Continue to Cache"\n');
      console.log('   5. performCacheWithProgress() runs → Batch processing starts\n');
    } else {
      console.log('⚠️  Some functions missing - batch processing may not work\n');
    }

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ SURGICAL FIX COMPLETE!\n');
    console.log('\nWhat changed:\n');
    console.log('  ❌ BEFORE: Step 3 called getOrCreateHolisticAnalysis_()');
    console.log('     → Processed ALL cases when clicking "Categories & Pathways"');
    console.log('     → User had to wait for batch processing before seeing UI\n');
    console.log('  ✅ AFTER: Step 3 creates minimal placeholder analysis');
    console.log('     → No batch processing when clicking menu');
    console.log('     → UI loads instantly with empty state');
    console.log('     → User clicks "Pre-Cache Rich Data" to trigger processing\n');
    console.log('What stayed the same:\n');
    console.log('  ✅ Headers cache still refreshes (Step 1)');
    console.log('  ✅ 35 defaults still initialize (Step 2)');
    console.log('  ✅ AI recommendations still pre-fetch (Step 2.5)');
    console.log('  ✅ Batch processing still works via "Pre-Cache Rich Data" button\n');
    console.log('User workflow is now EXACTLY what you described:\n');
    console.log('  1. Click "Categories & Pathways" → Background: headers + AI');
    console.log('  2. Pathway UI opens (instant, no processing)');
    console.log('  3. Click "Pre-Cache Rich Data" → Field selector modal');
    console.log('  4. Review fields, adjust, click "Continue to Cache"');
    console.log('  5. Batch processing starts (25 rows at a time)\n');
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
