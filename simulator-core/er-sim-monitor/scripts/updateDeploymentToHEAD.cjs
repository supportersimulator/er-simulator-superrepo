#!/usr/bin/env node

/**
 * Update Deployment to HEAD
 *
 * Updates the existing web app deployment to use the latest HEAD code
 *
 * Usage:
 *   node scripts/updateDeploymentToHEAD.cjs
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
 * Update deployment to HEAD
 */
async function updateDeploymentToHEAD() {
  console.log('');
  console.log('🔄 UPDATING DEPLOYMENT TO HEAD');
  console.log('════════════════════════════════════════════════════');
  console.log(`Apps Script ID: ${APPS_SCRIPT_ID}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const script = createAppsScriptClient();

    // Step 1: List all deployments
    console.log('📋 STEP 1: Fetching current deployments...');
    const listResponse = await script.projects.deployments.list({
      scriptId: APPS_SCRIPT_ID
    });

    const deployments = listResponse.data.deployments || [];
    console.log(`✅ Found ${deployments.length} deployment(s)`);
    console.log('');

    // Find the latest web app deployment
    const webAppDeployment = deployments.find(d =>
      d.entryPoints && d.entryPoints.some(ep => ep.entryPointType === 'WEB_APP')
    );

    if (!webAppDeployment) {
      throw new Error('No web app deployment found');
    }

    console.log(`📦 Current deployment: ${webAppDeployment.deploymentId}`);
    console.log(`   Version: ${webAppDeployment.deploymentConfig?.versionNumber || 'HEAD'}`);
    console.log('');

    // Step 2: Update deployment to use HEAD
    console.log('🔄 STEP 2: Updating deployment to HEAD...');
    const updateResponse = await script.projects.deployments.update({
      scriptId: APPS_SCRIPT_ID,
      deploymentId: webAppDeployment.deploymentId,
      requestBody: {
        deploymentConfig: {
          scriptId: APPS_SCRIPT_ID,
          description: 'ER Simulator Batch API - Updated to HEAD',
          manifestFileName: 'appsscript',
          versionNumber: undefined // undefined means HEAD
        }
      }
    });

    console.log('✅ Deployment updated to HEAD');
    console.log('');

    // Get the web app URL
    const updatedDeployment = updateResponse.data;
    const webAppEntryPoint = updatedDeployment.entryPoints?.find(
      ep => ep.entryPointType === 'WEB_APP'
    );

    console.log('════════════════════════════════════════════════════');
    console.log('✅ DEPLOYMENT UPDATED SUCCESSFULLY');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log(`Deployment ID: ${updatedDeployment.deploymentId}`);
    if (webAppEntryPoint && webAppEntryPoint.webApp) {
      console.log(`Web App URL: ${webAppEntryPoint.webApp.url}`);
    }
    console.log('');
    console.log('Next steps:');
    console.log('   1. Test the web app endpoint');
    console.log('   2. Run batch processing');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ UPDATE FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.response && error.response.data) {
      console.error('Full error details:');
      console.error(JSON.stringify(error.response.data, null, 2));
      console.error('');
    }

    // If API doesn't support updates, suggest manual approach
    if (error.message.includes('not found') || error.message.includes('not supported')) {
      console.error('💡 The API may not support deployment updates.');
      console.error('');
      console.error('Try manual approach:');
      console.error('1. Visit: https://script.google.com/home/projects/' + APPS_SCRIPT_ID + '/edit');
      console.error('2. Click "Deploy" → "Manage deployments"');
      console.error('3. Click pencil icon on latest deployment');
      console.error('4. Change "Version" to "Head"');
      console.error('5. Click "Deploy"');
      console.error('');
    }

    process.exit(1);
  }
}

// Run update
if (require.main === module) {
  updateDeploymentToHEAD().catch(console.error);
}

module.exports = { updateDeploymentToHEAD };
