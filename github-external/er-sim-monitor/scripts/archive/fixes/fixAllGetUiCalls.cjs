#!/usr/bin/env node

/**
 * Fix ALL Web App Context Errors
 *
 * Replaces ALL SpreadsheetApp.getUi() calls with getSafeUi_() wrapper
 *
 * Usage:
 *   node scripts/fixAllGetUiCalls.cjs
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

// OAuth2 credentials
const OAUTH_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OAUTH_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const APPS_SCRIPT_ID = process.env.APPS_SCRIPT_ID;

/**
 * Load OAuth2 token from disk
 */
function loadToken() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error(`Token file not found at ${TOKEN_PATH}. Run 'npm run auth-google' first.`);
  }
  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  return tokenData;
}

/**
 * Create authenticated Apps Script API client
 */
function createAppsScriptClient() {
  const oauth2Client = new google.auth.OAuth2(
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );

  const token = loadToken();
  oauth2Client.setCredentials(token);

  return google.script({ version: 'v1', auth: oauth2Client });
}

/**
 * Fix ALL getUi() calls
 */
async function fixAllGetUiCalls() {
  console.log('');
  console.log('🔧 FIXING ALL GETUI() CALLS');
  console.log('════════════════════════════════════════════════════');
  console.log(`Apps Script ID: ${APPS_SCRIPT_ID}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const script = createAppsScriptClient();

    // Step 1: Read current project
    console.log('📖 STEP 1: Reading current Apps Script...');
    const getResponse = await script.projects.getContent({
      scriptId: APPS_SCRIPT_ID
    });

    const files = getResponse.data.files || [];
    console.log(`✅ Found ${files.length} file(s)`);
    console.log('');

    // Step 2: Fix ALL getUi() calls
    console.log('🔍 STEP 2: Replacing ALL getUi() calls...');
    const codeFile = files.find(f => f.name === 'Code');

    if (!codeFile) {
      throw new Error('Code.gs file not found');
    }

    let code = codeFile.source;
    let changeCount = 0;

    // Add getSafeUi_ helper if not present
    if (!code.includes('function getSafeUi_()')) {
      console.log('   Adding getSafeUi_() helper function...');

      const helperCode = `/**
 * Safe UI helper - only calls getUi() if in UI context
 * Added for web app compatibility
 */
function getSafeUi_() {
  try {
    return SpreadsheetApp.getUi();
  } catch (e) {
    return null;
  }
}

`;
      code = helperCode + code;
      changeCount++;
    }

    // Replace ALL occurrences of SpreadsheetApp.getUi() with getSafeUi_()
    const originalCode = code;
    code = code.replace(/SpreadsheetApp\.getUi\(\)/g, 'getSafeUi_()');

    // Count replacements
    const replacements = (originalCode.match(/SpreadsheetApp\.getUi\(\)/g) || []).length;
    changeCount += replacements;

    console.log(`✅ Replaced ${replacements} getUi() call(s)`);
    console.log('');

    codeFile.source = code;

    // Step 3: Update the project
    console.log('💾 STEP 3: Updating Apps Script...');
    await script.projects.updateContent({
      scriptId: APPS_SCRIPT_ID,
      requestBody: {
        files: files
      }
    });

    console.log('✅ Project updated');
    console.log('');

    console.log('════════════════════════════════════════════════════');
    console.log('✅ ALL GETUI() CALLS FIXED');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log(`Total changes: ${changeCount}`);
    console.log('');
    console.log('Next steps:');
    console.log('   1. Create new version: node scripts/createNewVersion.cjs');
    console.log('   2. Update deployment to new version manually');
    console.log('   3. Test web app: npm run run-batch-http "2,3"');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ FIX FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.response && error.response.data) {
      console.error('Full error details:');
      console.error(JSON.stringify(error.response.data, null, 2));
      console.error('');
    }

    process.exit(1);
  }
}

// Run fix
if (require.main === module) {
  fixAllGetUiCalls().catch(console.error);
}

module.exports = { fixAllGetUiCalls };
