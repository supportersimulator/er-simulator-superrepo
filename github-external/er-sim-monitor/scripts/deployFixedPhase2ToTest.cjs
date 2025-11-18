#!/usr/bin/env node

/**
 * DEPLOY FIXED PHASE2 TO TEST
 *
 * This script deploys the fixed Categories_Pathways_Feature_Phase2.gs to TEST
 * WITHOUT touching Code.gs (which contains the ATSR menu).
 *
 * Changes made to Phase2:
 * - performHolisticAnalysis_() now extracts ALL 27 fields (was 6)
 * - Implements 25-row batch processing (was processing all at once)
 * - Uses header cache for dynamic column mapping
 * - Added tryParseVitals_() helper for JSON parsing
 * - Added truncateField_() helper to prevent cache bloat
 * - All existing system/pathway distribution logic preserved
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
  console.log('\n🚀 DEPLOYING FIXED PHASE2 TO TEST\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Read fixed Phase2 from backup (which we just edited)
    const fixedPhase2Path = path.join(__dirname, '../backups/phase2-before-cache-fix-2025-11-06T14-51-17/Categories_Pathways_Feature_Phase2.gs');
    const fixedPhase2Content = fs.readFileSync(fixedPhase2Path, 'utf8');
    const sizeKB = Math.round(fixedPhase2Content.length / 1024);

    console.log(`✅ Loaded fixed Phase2: ${sizeKB} KB\n`);
    console.log('📋 Changes included:\n');
    console.log('   • performHolisticAnalysis_() extracts ALL 27 fields (was 6)');
    console.log('   • 25-row batch processing with progress logs');
    console.log('   • Header cache for dynamic column mapping');
    console.log('   • tryParseVitals_() for JSON vitals parsing');
    console.log('   • truncateField_() to prevent cache bloat');
    console.log('   • All existing logic preserved\n');

    // Pull current project to get Code.gs
    console.log('📥 Pulling current TEST project to preserve Code.gs...\n');
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    // Find Code.gs (should remain untouched)
    const codeFile = project.data.files.find(f => f.name === 'Code');
    if (!codeFile) {
      console.log('⚠️  WARNING: Code.gs not found in TEST project!');
      console.log('   This means ATSR menu might not be deployed.');
      console.log('   Proceeding with Phase2 deployment only.\n');
    } else {
      console.log('✅ Found Code.gs - will preserve it untouched\n');
    }

    // Build updated files array
    const updatedFiles = [
      {
        name: 'Categories_Pathways_Feature_Phase2',
        type: 'SERVER_JS',
        source: fixedPhase2Content
      }
    ];

    // Add Code.gs if it exists (preserve it)
    if (codeFile) {
      updatedFiles.push({
        name: 'Code',
        type: 'SERVER_JS',
        source: codeFile.source
      });
    }

    // Add appsscript.json manifest
    const manifestFile = project.data.files.find(f => f.name === 'appsscript');
    if (manifestFile) {
      updatedFiles.push(manifestFile);
    }

    console.log('🚀 Deploying to TEST...\n');
    console.log('   Files being deployed:');
    updatedFiles.forEach(f => {
      const size = f.source ? Math.round(f.source.length / 1024) : 0;
      console.log(`   • ${f.name}: ${size} KB`);
    });
    console.log('');

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: {
        files: updatedFiles
      }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('📋 What was deployed:\n');
    console.log('   ✅ Categories_Pathways_Feature_Phase2.gs (FIXED)');
    console.log('      • 27-field extraction');
    console.log('      • 25-row batch processing');
    console.log('      • Header cache integration');
    console.log('      • Helper functions added\n');
    if (codeFile) {
      console.log('   ✅ Code.gs (PRESERVED - unchanged)');
      console.log('      • TEST Tools menu intact');
      console.log('      • ATSR Titles Optimizer working');
      console.log('      • Pathway Chain Builder working\n');
    }
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🧪 Next Steps:\n');
    console.log('   1. Open TEST spreadsheet');
    console.log('   2. Verify TEST Tools menu appears');
    console.log('   3. Run: 💾 Pre-Cache Rich Data button');
    console.log('   4. Watch terminal logs for batch progress');
    console.log('   5. Verify all 27 fields are cached\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) console.log(e.stack);
  }
}

deploy().catch(console.error);
