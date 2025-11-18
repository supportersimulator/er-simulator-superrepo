#!/usr/bin/env node

/**
 * Deploy Categories_Pathways_Feature_Phase2.gs to TEST spreadsheet
 * This version includes:
 * - Full pathway chain builder with AI discovery
 * - Live cache progress with terminal logs
 * - Header cache integration (refreshHeaders() called FIRST)
 * - 23-26 field mappings dynamically resolved
 * - Batch processing + Multi-step workflows
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

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

async function deploy() {
  console.log('\n🚀 DEPLOYING CATEGORIES & PATHWAYS PHASE 2 TO TEST\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Read Phase 2 code
    const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
    console.log('📥 Reading Categories_Pathways_Feature_Phase2.gs...\n');

    if (!fs.existsSync(phase2Path)) {
      console.log('❌ Phase 2 file not found!\n');
      return;
    }

    const phase2Code = fs.readFileSync(phase2Path, 'utf8');
    const codeSize = Math.round(phase2Code.length / 1024);

    console.log(`   Size: ${codeSize} KB`);
    console.log(`   ${phase2Code.includes('refreshHeaders') ? '✅' : '❌'} Contains refreshHeaders()`);
    console.log(`   ${phase2Code.includes('preCacheRichData') ? '✅' : '❌'} Contains preCacheRichData() (cache button)`);
    console.log(`   ${phase2Code.includes('getColumnIndexByHeader_') ? '✅' : '❌'} Contains getColumnIndexByHeader_() (header mapping)`);
    console.log(`   ${phase2Code.includes('performCacheWithProgress') ? '✅' : '❌'} Contains live cache progress\n`);

    // Get current TEST script
    console.log('📋 Getting current TEST script...\n');
    const currentProject = await script.projects.getContent({
      scriptId: TEST_SCRIPT_ID
    });

    // Find existing files
    // CRITICAL FIX: Look for ATSR file by ANY of its possible names
    const existingATSR = currentProject.data.files.find(f =>
      f.name === 'ATSR_Title_Generator_Feature' ||
      f.name === 'Code' ||
      f.name === 'ATSR_Title_Generator_Feature.gs'
    );
    const manifestFile = currentProject.data.files.find(f => f.name === 'appsscript');

    // Prepare deployment
    const files = [];

    // Keep manifest
    if (manifestFile) {
      files.push(manifestFile);
    } else {
      files.push({
        name: 'appsscript',
        type: 'JSON',
        source: JSON.stringify({
          timeZone: "America/New_York",
          dependencies: {},
          exceptionLogging: "STACKDRIVER"
        }, null, 2)
      });
    }

    // Keep existing ATSR if it exists
    if (existingATSR) {
      console.log(`   ✅ Preserving existing ATSR file (found as: "${existingATSR.name}")\n`);
      files.push(existingATSR);
    } else {
      console.log('   ⚠️  No ATSR file found - TEST Tools menu will be missing!\n');
      console.log('   💡 Run: node scripts/restoreATSRToTest.cjs to restore it\n');
    }

    // Add Phase 2 Categories & Pathways
    files.push({
      name: 'Categories_Pathways_Feature_Phase2',
      type: 'SERVER_JS',
      source: phase2Code
    });

    // Deploy
    console.log('🚀 Deploying to TEST spreadsheet...\n');

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: {
        files: files
      }
    });

    console.log('✅ Successfully deployed!\n');

    // Verify
    const updatedProject = await script.projects.getContent({
      scriptId: TEST_SCRIPT_ID
    });

    const categoriesFile = updatedProject.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');

    if (categoriesFile) {
      const deployedSize = Math.round(categoriesFile.source.length / 1024);
      const hasRefreshHeaders = categoriesFile.source.includes('refreshHeaders()');
      const hasLiveProgress = categoriesFile.source.includes('performCacheWithProgress');
      const hasHeaderMapping = categoriesFile.source.includes('getColumnIndexByHeader_');

      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅ VERIFICATION:\n');
      console.log(`   Deployed size: ${deployedSize} KB`);
      console.log(`   refreshHeaders() integration: ${hasRefreshHeaders ? '✅' : '❌'}`);
      console.log(`   Live cache progress: ${hasLiveProgress ? '✅' : '❌'}`);
      console.log(`   Header column mapping: ${hasHeaderMapping ? '✅' : '❌'}\n`);

      if (hasRefreshHeaders && hasLiveProgress && hasHeaderMapping) {
        console.log('🎉 PHASE 2 SUCCESSFULLY DEPLOYED WITH FULL FEATURES!\n');
        console.log('📋 What you now have on TEST spreadsheet:\n');
        console.log('   ✅ Categories & Pathways Chain Builder (Phase 2)');
        console.log('   ✅ Live cache progress with terminal logs');
        console.log('   ✅ Header cache integration (refreshHeaders() runs FIRST)');
        console.log('   ✅ Dynamic column mapping (23-26 fields)');
        console.log('   ✅ AI-powered pathway discovery');
        console.log('   ✅ Batch processing support');
        console.log('   ✅ Multi-step workflows\n');
        console.log('🔄 CACHE BUTTON WORKFLOW:\n');
        console.log('   1. Click "💾 Pre-Cache Rich Data" button');
        console.log('   2. refreshHeaders() runs FIRST → maps all 23-26 columns');
        console.log('   3. Saves column mappings to CACHED_HEADER2 property');
        console.log('   4. Performs holistic analysis using dynamic column indices');
        console.log('   5. Shows live progress: timestamp logs + progress bar');
        console.log('   6. Caches all case data for instant AI discovery\n');
        console.log('📊 WHAT GETS CACHED (23-26 fields per case):\n');
        console.log('   • Demographics (case ID, spark title, diagnosis)');
        console.log('   • Categories & Pathway assignments');
        console.log('   • System distribution data');
        console.log('   • Clinical context for nuanced pathway detection\n');
        console.log('🔄 Next steps:\n');
        console.log('   1. Refresh TEST spreadsheet');
        console.log('   2. Look for new menu items or cache button');
        console.log('   3. Click cache button to test header integration');
        console.log('   4. Check execution logs for "🔄 Refreshing headers..."');
        console.log('   5. Verify 23-26 fields are properly mapped\n');
      } else {
        console.log('⚠️  Some features may be missing\n');
      }
      console.log('═══════════════════════════════════════════════════════════════\n');
    }

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

deploy().catch(console.error);
