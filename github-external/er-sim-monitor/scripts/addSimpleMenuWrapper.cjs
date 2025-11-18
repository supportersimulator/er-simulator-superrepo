#!/usr/bin/env node

/**
 * Add simple wrapper function that can be called from TEST menu
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i';

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

async function addWrapper() {
  console.log('\n🔧 ADDING MENU WRAPPER FUNCTIONS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const uiFile = project.data.files.find(f => f.name === 'Multi_Step_Cache_UI');

    if (!uiFile) {
      console.log('❌ UI file not found\n');
      return;
    }

    let code = uiFile.source;

    // Check if wrapper already exists
    if (code.includes('function cacheAllLayersFromMenu()')) {
      console.log('✅ Wrapper functions already exist\n');
      return;
    }

    // Add simple wrapper functions at the end of file
    const wrapperFunctions = `

// ============================================================================
// SIMPLE MENU WRAPPERS (Call these from TEST menu)
// ============================================================================

/**
 * Cache all layers - call this from TEST menu
 */
function cacheAllLayersFromMenu() {
  showCacheAllLayersModal();
}

/**
 * View cache status - call this from TEST menu
 */
function viewCacheStatusFromMenu() {
  showCacheStatus();
}

/**
 * Clear all caches - call this from TEST menu
 */
function clearAllCachesFromMenu() {
  clearAllCacheLayers();
}
`;

    code += wrapperFunctions;

    uiFile.source = code;

    console.log('🚀 Deploying wrapper functions...\n');

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: {
        files: project.data.files
      }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ WRAPPER FUNCTIONS ADDED\n');
    console.log('📋 AVAILABLE FUNCTIONS TO ADD TO YOUR TEST MENU:\n');
    console.log('   • cacheAllLayersFromMenu() - Cache all 7 layers');
    console.log('   • viewCacheStatusFromMenu() - View cache status');
    console.log('   • clearAllCachesFromMenu() - Clear all caches\n');
    console.log('💡 HOW TO ADD TO TEST MENU:\n');
    console.log('   1. Find your TEST menu code in ATSR_Title_Generator_Feature');
    console.log('   2. Add menu items like:');
    console.log('      testMenu.addItem("📦 Cache All Layers", "cacheAllLayersFromMenu");');
    console.log('      testMenu.addItem("📊 View Cache Status", "viewCacheStatusFromMenu");');
    console.log('      testMenu.addItem("🧹 Clear All Caches", "clearAllCachesFromMenu");\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Failed: ' + e.message + '\n');
  }
}

addWrapper().catch(console.error);
