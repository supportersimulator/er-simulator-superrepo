#!/usr/bin/env node

/**
 * SURGICAL FIX: Add Step 2.5 AI Recommendations + Remove Step 3 Auto-Analysis
 *
 * Changes to runPathwayChainBuilder():
 * - Add Step 2.5: Pre-fetch AI recommendations in background
 * - Remove Step 3: getOrCreateHolisticAnalysis_() (will run manually via cache button)
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

    console.log('🔧 Step 1: Adding Step 2.5 (AI Recommendations)...\n');

    // Find location after Step 2 (after defaultFields initialization)
    const step2End = code.indexOf("      Logger.log('✅ Field selection already cached (' + JSON.parse(savedSelection).length + ' fields)');\n    }");

    if (step2End === -1) {
      console.log('❌ Could not find Step 2 end\n');
      return;
    }

    // Find where Step 3 starts
    const step3Start = code.indexOf('\n\n    // STEP 3: Get or create holistic analysis (cached)', step2End);

    if (step3Start === -1) {
      console.log('❌ Could not find Step 3 marker\n');
      return;
    }

    // Add Step 2.5 code
    const step25Code = `

    // STEP 2.5: Pre-fetch AI recommendations in background
    Logger.log('💡 Step 2.5: Pre-fetching AI recommendations...');
    try {
      // Get current field selection
      var currentSelection = savedSelection ? JSON.parse(savedSelection) : defaultFields;

      // Get available fields from headers cache
      var availableFields = getAvailableFields();

      // Get AI recommendations (this calls OpenAI API)
      var aiRecommendations = getAIRecommendedFields(availableFields, currentSelection);

      // Cache the recommendations so modal loads instantly
      docProps.setProperty('AI_RECOMMENDED_FIELDS', JSON.stringify(aiRecommendations));
      docProps.setProperty('AI_RECOMMENDATIONS_TIMESTAMP', new Date().toISOString());

      Logger.log('✅ Pre-fetched ' + aiRecommendations.length + ' AI recommendations');
    } catch (aiError) {
      Logger.log('⚠️ AI recommendations warning: ' + aiError.toString());
      // Don't block UI - modal will use static recommendations if this fails
    }`;

    code = code.substring(0, step3Start) + step25Code + code.substring(step3Start);

    console.log('✅ Added Step 2.5\n');

    console.log('🔧 Step 2: Removing Step 3 (getOrCreateHolisticAnalysis)...\n');

    // Now find and remove Step 3 section
    const newStep3Start = code.indexOf('\n\n    // STEP 3: Get or create holistic analysis (cached)', step2End);
    const step3End = code.indexOf('\n    const html = buildBirdEyeViewUI_(analysis);', newStep3Start);

    if (newStep3Start === -1 || step3End === -1) {
      console.log('❌ Could not find Step 3 section to remove\n');
      return;
    }

    // Remove the Step 3 section entirely
    code = code.substring(0, newStep3Start + 2) + '    // STEP 3: Build UI (analysis will run when user clicks cache button)\n    const analysis = null; // Will be generated on-demand\n' + code.substring(step3End);

    console.log('✅ Removed Step 3 auto-analysis\n');

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
    console.log('\nNow when you click "Categories & Pathways":\n');
    console.log('  1️⃣ Refreshes headers cache (642 field names)');
    console.log('  2️⃣ Initializes 35 intelligent defaults (first time only)');
    console.log('  2.5️⃣ Pre-fetches AI recommendations in background ⚡ (NEW!)');
    console.log('  3️⃣ Opens Pathway Chain Builder UI (no data processing)\n');
    console.log('Benefits:');
    console.log('  ✅ AI recommendations ready when you open field selector');
    console.log('  ✅ No 50k character error (no auto-analysis)');
    console.log('  ✅ Fast UI load (no heavy processing)');
    console.log('  ✅ Full control over when batch processing runs\n');
    console.log('When you click cache button in Pathway UI:');
    console.log('  ✅ Field selector modal opens with pre-cached recommendations');
    console.log('  ✅ Adjust fields as needed');
    console.log('  ✅ Click "Continue to Cache" to start batch processing (25 rows)\n');
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
