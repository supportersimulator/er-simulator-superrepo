#!/usr/bin/env node

/**
 * Add Web App Endpoint to Apps Script
 *
 * Adds doGet() and doPost() handlers for HTTP-triggered batch processing
 *
 * Usage:
 *   node scripts/addWebAppEndpoint.cjs
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
 * Add web app endpoint
 */
async function addWebAppEndpoint() {
  console.log('');
  console.log('🌐 ADDING WEB APP ENDPOINT TO APPS SCRIPT');
  console.log('════════════════════════════════════════════════════');
  console.log(`Apps Script ID: ${APPS_SCRIPT_ID}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const script = createAppsScriptClient();

    // Step 1: Read current project content
    console.log('📖 STEP 1: Reading current Apps Script project...');
    const getResponse = await script.projects.getContent({
      scriptId: APPS_SCRIPT_ID
    });

    const currentFiles = getResponse.data.files || [];
    console.log(`✅ Found ${currentFiles.length} file(s) in project`);
    console.log('');

    // Step 2: Read the web app endpoint code
    console.log('📋 STEP 2: Loading web app endpoint code...');
    const endpointPath = path.join(__dirname, '..', 'apps-script-additions', 'WebAppEndpoint.gs');
    const endpointCode = fs.readFileSync(endpointPath, 'utf8');
    console.log(`✅ Loaded ${endpointCode.length} characters`);
    console.log('');

    // Step 3: Check if WebAppEndpoint already exists
    console.log('🔍 STEP 3: Checking for existing WebAppEndpoint...');
    const existingEndpoint = currentFiles.find(f => f.name === 'WebAppEndpoint');

    if (existingEndpoint) {
      console.log('⚠️  WebAppEndpoint.gs already exists!');
      console.log('   Will update existing file');
      console.log('');

      // Update existing
      existingEndpoint.source = endpointCode;
    } else {
      console.log('✅ No existing WebAppEndpoint found');
      console.log('   Will create new file');
      console.log('');

      // Add new file
      currentFiles.push({
        name: 'WebAppEndpoint',
        type: 'SERVER_JS',
        source: endpointCode
      });
    }

    // Step 4: Update the project
    console.log('💾 STEP 4: Updating Apps Script project...');
    const updateResponse = await script.projects.updateContent({
      scriptId: APPS_SCRIPT_ID,
      requestBody: {
        files: currentFiles
      }
    });

    console.log('✅ Project updated successfully!');
    console.log('');

    // Step 5: Verify the update
    console.log('🔍 STEP 5: Verifying update...');
    const verifyResponse = await script.projects.getContent({
      scriptId: APPS_SCRIPT_ID
    });

    const updatedFiles = verifyResponse.data.files || [];
    const webAppFile = updatedFiles.find(f => f.name === 'WebAppEndpoint');

    if (webAppFile) {
      console.log('✅ WebAppEndpoint.gs verified in project');
      console.log(`   Size: ${webAppFile.source.length} characters`);
    } else {
      throw new Error('WebAppEndpoint not found after update');
    }
    console.log('');

    console.log('════════════════════════════════════════════════════');
    console.log('✅ WEB APP ENDPOINT ADDED');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log('Next steps:');
    console.log('   1. Open Apps Script project:');
    console.log(`      https://script.google.com/home/projects/${APPS_SCRIPT_ID}/edit`);
    console.log('');
    console.log('   2. Deploy as Web App:');
    console.log('      - Click "Deploy" → "New deployment"');
    console.log('      - Type: "Web app"');
    console.log('      - Execute as: "Me"');
    console.log('      - Who has access: "Anyone" (or "Anyone with Google account")');
    console.log('      - Click "Deploy"');
    console.log('      - Copy the Web App URL');
    console.log('');
    console.log('   3. Save Web App URL to .env:');
    console.log('      WEB_APP_URL=https://script.google.com/macros/s/{ID}/exec');
    console.log('');
    console.log('   4. Test: npm run test-web-app');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ FAILED TO ADD WEB APP ENDPOINT');
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

// Run
if (require.main === module) {
  addWebAppEndpoint().catch(console.error);
}

module.exports = { addWebAppEndpoint };
