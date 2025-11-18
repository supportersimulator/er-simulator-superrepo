#!/usr/bin/env node

/**
 * DEPLOY FIELD SELECTOR TO TEST
 *
 * Carefully deploys the integrated Phase2 file with field selector functions
 * WITHOUT touching Code.gs (which contains the ATSR menu).
 *
 * Changes in this deployment:
 * - Added 6 field selector functions (getAvailableFields, showFieldSelector, etc.)
 * - Renamed preCacheRichData() → preCacheRichDataAfterSelection()
 * - Added new preCacheRichData() entry point that shows field selector first
 * - ALL 61 original functions preserved
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
  console.log('\n🚀 DEPLOYING FIELD SELECTOR TO TEST\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Read integrated Phase2 with field selector
    const integratedPath = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
    const integratedContent = fs.readFileSync(integratedPath, 'utf8');
    const sizeKB = Math.round(integratedContent.length / 1024);

    console.log(`✅ Loaded integrated Phase2: ${sizeKB} KB\n`);
    console.log('📋 Field Selector Features:\n');
    console.log('   • 6 new field selector functions added');
    console.log('   • getAvailableFields() - reads ALL columns dynamically');
    console.log('   • showFieldSelector() - beautiful modal with field grouping');
    console.log('   • preCacheRichData() - NEW entry point (shows selector first)');
    console.log('   • preCacheRichDataAfterSelection() - renamed original');
    console.log('   • All 61 original functions preserved\n');

    // Pull current project to get Code.gs
    console.log('📥 Pulling current TEST project to preserve Code.gs...\n');
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    // Find Code.gs (should remain untouched)
    const codeFile = project.data.files.find(f => f.name === 'Code');
    if (!codeFile) {
      console.log('⚠️  WARNING: Code.gs not found in TEST project!');
      console.log('   Proceeding with Phase2 deployment only.\n');
    } else {
      console.log('✅ Found Code.gs - will preserve it untouched\n');
    }

    // Build updated files array
    const updatedFiles = [
      {
        name: 'Categories_Pathways_Feature_Phase2',
        type: 'SERVER_JS',
        source: integratedContent
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

    // Deploy
    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: {
        files: updatedFiles
      }
    });

    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 FIELD SELECTOR DEPLOYED TO TEST!\n');
    console.log('Next steps:\n');
    console.log('   1. Open TEST spreadsheet');
    console.log('   2. Refresh if it\'s already open');
    console.log('   3. Click TEST Tools → 💾 Pre-Cache Rich Data');
    console.log('   4. Field selector modal should appear (not cache modal)');
    console.log('   5. Select fields and test cache\n');
    console.log('Verification:');
    console.log('   • Modal shows ALL spreadsheet columns');
    console.log('   • Grouped by Tier1 category');
    console.log('   • Current 27 fields pre-selected');
    console.log('   • Can select/deselect fields');
    console.log('   • Clicking Continue starts cache with selected fields\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ DEPLOYMENT FAILED!\n');
    console.error('Error:', error.message);
    if (error.response && error.response.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('\nPlease check:');
    console.error('   • Token is valid (may need re-authentication)');
    console.error('   • Script ID is correct: ' + TEST_SCRIPT_ID);
    console.error('   • You have edit permissions on TEST spreadsheet\n');
    throw error;
  }
}

deploy().catch(error => {
  process.exit(1);
});
