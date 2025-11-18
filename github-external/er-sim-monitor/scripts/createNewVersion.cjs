#!/usr/bin/env node

/**
 * Create New Apps Script Version
 *
 * Creates a new immutable version of the current HEAD code
 *
 * Usage:
 *   node scripts/createNewVersion.cjs
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
 * Create new version
 */
async function createNewVersion() {
  console.log('');
  console.log('📦 CREATING NEW APPS SCRIPT VERSION');
  console.log('════════════════════════════════════════════════════');
  console.log(`Apps Script ID: ${APPS_SCRIPT_ID}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const script = createAppsScriptClient();

    // Create new version
    console.log('📝 Creating new version from HEAD...');
    const versionResponse = await script.projects.versions.create({
      scriptId: APPS_SCRIPT_ID,
      requestBody: {
        description: 'Web app context fix - getSafeUi_() wrapper'
      }
    });

    const versionNumber = versionResponse.data.versionNumber;
    console.log(`✅ Created version ${versionNumber}`);
    console.log('');

    console.log('════════════════════════════════════════════════════');
    console.log('✅ VERSION CREATED SUCCESSFULLY');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log(`Version Number: ${versionNumber}`);
    console.log('');
    console.log('Next steps:');
    console.log('   1. Update deployment to use this version');
    console.log('   2. Or create new deployment with this version');
    console.log('');

    return versionNumber;

  } catch (error) {
    console.error('');
    console.error('❌ VERSION CREATION FAILED');
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

// Run version creation
if (require.main === module) {
  createNewVersion().catch(console.error);
}

module.exports = { createNewVersion };
