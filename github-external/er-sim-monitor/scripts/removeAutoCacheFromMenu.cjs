#!/usr/bin/env node

/**
 * REMOVE AUTO-CACHE FROM MENU
 * User doesn't want automatic caching - only headers refresh
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

    console.log('🔧 Removing Step 2.5 auto-cache from runPathwayChainBuilder()...\n');

    // Find and remove the entire Step 2.5 section
    const step25Start = code.indexOf('    // STEP 2.5: Auto-run cache process in background');

    if (step25Start === -1) {
      console.log('⚠️  Step 2.5 not found - may have already been removed\n');
      return;
    }

    // Find the end of Step 2.5 (right before "// STEP 3")
    const step3Start = code.indexOf('    // STEP 3: Get or create holistic analysis (cached)', step25Start);

    if (step3Start === -1) {
      console.log('❌ Could not find Step 3 marker\n');
      return;
    }

    // Remove everything between Step 2 end and Step 3 start
    code = code.substring(0, step25Start) + code.substring(step3Start);

    console.log('✅ Removed Step 2.5 auto-cache\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ AUTO-CACHE REMOVED FROM MENU!\n');
    console.log('\nNow when you click "Categories & Pathways":\n');
    console.log('  1️⃣ Refreshes headers cache (642 Row 2 field names)');
    console.log('  2️⃣ Initializes 35 intelligent defaults (first time only)');
    console.log('  3️⃣ Opens Pathway Chain Builder UI\n');
    console.log('What it does NOT do:');
    console.log('  ❌ Does NOT run cache process automatically');
    console.log('  ❌ Does NOT process your simulation cases\n');
    console.log('To run cache manually:');
    console.log('  ✅ Click "🗄️ Cache Management → 📦 Cache All Layers"');
    console.log('  ✅ Adjust fields in selector modal');
    console.log('  ✅ Click "Continue to Cache" when ready\n');
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
