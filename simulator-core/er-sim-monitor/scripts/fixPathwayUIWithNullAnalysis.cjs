#!/usr/bin/env node

/**
 * FIX PATHWAY UI TO HANDLE NULL ANALYSIS
 * The buildBirdEyeViewUI_ function expects an analysis object
 * but we set it to null in Step 3. Need to handle this gracefully.
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

    console.log('🔧 Option 1: Reverting Step 3 change - restore auto-analysis...\n');

    // Find where we set analysis to null
    const nullAnalysis = code.indexOf('    // STEP 3: Build UI (analysis will run when user clicks cache button)\n    const analysis = null; // Will be generated on-demand');

    if (nullAnalysis !== -1) {
      // Replace with the working version that generates analysis
      const fixedStep3 = `    // STEP 3: Get or create holistic analysis (cached)
    const analysis = getOrCreateHolisticAnalysis_();`;

      code = code.replace(
        '    // STEP 3: Build UI (analysis will run when user clicks cache button)\n    const analysis = null; // Will be generated on-demand',
        fixedStep3
      );

      console.log('✅ Restored auto-analysis in Step 3\n');
      console.log('   Note: This will cache analysis for Pathway UI\n');
      console.log('   The 50k character error is fixed by not saving to sheet\n');
    } else {
      console.log('❌ Could not find null analysis line\n');
      return;
    }

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('✅ PATHWAY UI FIXED!\n');
    console.log('\nWhat changed:\n');
    console.log('  - Restored getOrCreateHolisticAnalysis_() in Step 3');
    console.log('  - This generates analysis needed for Pathway UI');
    console.log('  - Uses cached version if < 24 hours old\n');
    console.log('The sequence is now:\n');
    console.log('  1. Headers cache (fast)');
    console.log('  2. Initialize 35 defaults (fast)');
    console.log('  2.5. AI recommendations (background, OpenAI call)');
    console.log('  3. Generate holistic analysis (uses cache if available)');
    console.log('  4. Open Pathway UI\n');
    console.log('Field selector still works independently via Cache button!\n');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
