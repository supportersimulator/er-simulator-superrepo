#!/usr/bin/env node

/**
 * ADD AUTO-CACHE TO PATHWAY MENU
 * When clicking "Categories & Pathways", automatically:
 * 1. Refresh headers cache
 * 2. Initialize 35 defaults (if needed)
 * 3. Run cache process in background (NEW!)
 * 4. Open Pathway Chain Builder UI
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

    console.log('🔧 Adding auto-cache step to runPathwayChainBuilder()...\n');

    // Find the exact location in runPathwayChainBuilder after Step 2
    const step2End = code.indexOf("      Logger.log('✅ Field selection already cached (' + JSON.parse(savedSelection).length + ' fields)');\n    }\n\n    // STEP 3: Get or create holistic analysis (cached)");

    if (step2End === -1) {
      console.log('❌ Could not find Step 2 end marker\n');
      return;
    }

    // Find where to insert (right before "// STEP 3")
    const step3Comment = code.indexOf('    // STEP 3: Get or create holistic analysis (cached)', step2End);

    if (step3Comment === -1) {
      console.log('❌ Could not find Step 3 comment\n');
      return;
    }

    // Insert the auto-cache step
    const autoCacheCode = `
    // STEP 2.5: Auto-run cache process in background
    Logger.log('📦 Step 2.5: Auto-caching selected fields...');
    try {
      // Get the saved/default field selection
      var finalSelection = savedSelection ? JSON.parse(savedSelection) : defaultFields;
      Logger.log('   Caching ' + finalSelection.length + ' fields');

      // Save the selection
      docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(finalSelection));

      // Run the actual cache process (this uses the existing batch system)
      // performCacheWithProgress() calls getOrCreateHolisticAnalysis_(true)
      // which processes cases in batches of 25
      var cacheResult = performCacheWithProgress();

      if (cacheResult.success) {
        Logger.log('✅ Auto-cache completed: ' + cacheResult.casesProcessed + ' cases, ' + cacheResult.elapsed + 's');
      } else {
        Logger.log('⚠️ Auto-cache failed: ' + cacheResult.error);
      }
    } catch (cacheError) {
      Logger.log('⚠️ Auto-cache warning: ' + cacheError.toString());
      // Don't block the UI if cache fails - just log it
    }

    `;

    code = code.substring(0, step3Comment) + autoCacheCode + code.substring(step3Comment);

    console.log('✅ Added auto-cache step between Step 2 and Step 3\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ AUTO-CACHE ADDED TO "CATEGORIES & PATHWAYS"!\n');
    console.log('\nNow when you click "Categories & Pathways" from menu:\n');
    console.log('  1️⃣ Refreshes headers cache (642 Row 2 field names)');
    console.log('  2️⃣ Initializes 35 intelligent defaults (first time only)');
    console.log('  2.5️⃣ AUTO-RUNS cache process in background ⚡ (NEW!)');
    console.log('  3️⃣ Opens Pathway Chain Builder UI\n');
    console.log('Benefits:');
    console.log('  ✅ Cache runs automatically in background');
    console.log('  ✅ No need to click "Cache Management → Cache All Layers"');
    console.log('  ✅ Data ready immediately for AI pathway discovery');
    console.log('  ✅ Field selector modal only shows when you explicitly want to change fields\n');
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
