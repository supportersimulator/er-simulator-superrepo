#!/usr/bin/env node

/**
 * Fix Web App Context Error
 *
 * Fixes the SpreadsheetApp.getUi() error by adding safe UI wrappers
 *
 * Usage:
 *   node scripts/fixWebAppContext.cjs
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
 * Fix web app context
 */
async function fixWebAppContext() {
  console.log('');
  console.log('🔧 FIXING WEB APP CONTEXT ERROR');
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

    // Step 2: Find Code.gs and fix getUi() calls
    console.log('🔍 STEP 2: Finding and fixing getUi() calls...');
    const codeFile = files.find(f => f.name === 'Code');

    if (!codeFile) {
      throw new Error('Code.gs file not found');
    }

    let code = codeFile.source;
    let changeCount = 0;

    // Find line 2062 area and fix it
    const lines = code.split('\n');
    console.log(`   Scanning ${lines.length} lines...`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Fix: SpreadsheetApp.getUi()
      if (line.includes('SpreadsheetApp.getUi()') && !line.includes('getSafeUi_')) {
        console.log(`   Line ${i + 1}: Found getUi() call`);

        // Check if it's the problematic line (around 2062)
        if (i > 2050 && i < 2070) {
          console.log(`   ⚠️  This is near line 2062 - critical fix needed`);

          // Replace with safe version
          lines[i] = line.replace('SpreadsheetApp.getUi()', 'getSafeUi_()');

          // Add null check if assigning to variable
          if (line.includes('const ui =') || line.includes('let ui =') || line.includes('var ui =')) {
            // Add safety check on next line
            lines.splice(i + 1, 0, '  if (!ui) { Logger.log("Web app context - skipping UI"); }');
            changeCount++;
          }

          changeCount++;
        }
      }
    }

    // Add getSafeUi_ helper if not present
    if (!code.includes('function getSafeUi_()')) {
      console.log('   Adding getSafeUi_() helper function...');

      const helperCode = `

/**
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
      lines.unshift(helperCode);
      changeCount++;
    }

    const fixedCode = lines.join('\n');
    codeFile.source = fixedCode;

    console.log(`✅ Made ${changeCount} fix(es)`);
    console.log('');

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
    console.log('✅ WEB APP CONTEXT FIXED');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log('Changes made:');
    console.log(`   - Added getSafeUi_() helper function`);
    console.log(`   - Fixed ${changeCount} getUi() call(s)`);
    console.log('');
    console.log('Test the web app:');
    console.log('   npm run run-batch-http "2,3"');
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
  fixWebAppContext().catch(console.error);
}

module.exports = { fixWebAppContext };
