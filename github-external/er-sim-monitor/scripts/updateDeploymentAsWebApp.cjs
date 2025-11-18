#!/usr/bin/env node

/**
 * Update Deployment as Web App
 *
 * Updates the existing deployment to be properly configured as a web app
 *
 * Usage:
 *   node scripts/updateDeploymentAsWebApp.cjs
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
 * Update deployment as web app
 */
async function updateDeploymentAsWebApp() {
  console.log('');
  console.log('🔧 UPDATING DEPLOYMENT AS WEB APP');
  console.log('════════════════════════════════════════════════════');
  console.log(`Apps Script ID: ${APPS_SCRIPT_ID}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const script = createAppsScriptClient();

    // Step 1: Delete existing deployment
    console.log('🗑️  STEP 1: Removing old deployment...');
    const deploymentId = 'AKfycbxUG6Dvljf2ObdLFqRF3HqkY6GbJLq9C1GJx99SpkKmAX8ZKxsQC82IzMD4Sfikrizs';

    try {
      await script.projects.deployments.delete({
        scriptId: APPS_SCRIPT_ID,
        deploymentId: deploymentId
      });
      console.log('✅ Old deployment removed');
    } catch (e) {
      console.log('⚠️  No existing deployment to remove');
    }
    console.log('');

    // Step 2: Create new version
    console.log('📦 STEP 2: Creating new version...');
    const versionResponse = await script.projects.versions.create({
      scriptId: APPS_SCRIPT_ID,
      requestBody: {
        description: 'Web App with HTTP endpoints - v2'
      }
    });

    const versionNumber = versionResponse.data.versionNumber;
    console.log(`✅ Created version ${versionNumber}`);
    console.log('');

    // Step 3: Create web app deployment with explicit config
    console.log('🌐 STEP 3: Creating web app deployment...');

    const deployResponse = await script.projects.deployments.create({
      scriptId: APPS_SCRIPT_ID,
      requestBody: {
        versionNumber: versionNumber,
        manifestFileName: 'appsscript',
        description: 'ER Simulator Batch Processor - Web App API'
      }
    });

    const deployment = deployResponse.data;
    const newDeploymentId = deployment.deploymentId;

    console.log('✅ Deployment created!');
    console.log(`   ID: ${newDeploymentId}`);
    console.log('');

    // Step 4: Update .env
    console.log('💾 STEP 4: Updating .env...');
    const webAppUrl = `https://script.google.com/macros/s/${newDeploymentId}/exec`;

    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    if (envContent.includes('WEB_APP_URL=')) {
      envContent = envContent.replace(/WEB_APP_URL=.*/, `WEB_APP_URL=${webAppUrl}`);
    } else {
      envContent += `\nWEB_APP_URL=${webAppUrl}\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ Updated .env');
    console.log('');

    console.log('════════════════════════════════════════════════════');
    console.log('✅ DEPLOYMENT UPDATED');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log('⚠️  IMPORTANT: Manual authorization still required');
    console.log('');
    console.log('The Apps Script API cannot set web app permissions.');
    console.log('You must configure this ONCE via the Google Sheets UI:');
    console.log('');
    console.log('1. Open your Google Sheet:');
    console.log('   https://docs.google.com/spreadsheets/d/1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM');
    console.log('');
    console.log('2. Click Extensions → Apps Script');
    console.log('');
    console.log('3. Click Deploy → New deployment');
    console.log('');
    console.log('4. Click gear icon next to "Select type"');
    console.log('');
    console.log('5. Select "Web app"');
    console.log('');
    console.log('6. Configure:');
    console.log('   - Description: ER Simulator Batch API');
    console.log('   - Execute as: Me');
    console.log('   - Who has access: Anyone');
    console.log('');
    console.log('7. Click Deploy');
    console.log('');
    console.log('8. Authorize when prompted');
    console.log('');
    console.log('9. Copy the deployment URL and update .env');
    console.log('');
    console.log('This is a one-time setup - after authorization,');
    console.log('all future batch processing will be fully programmatic!');
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

    process.exit(1);
  }
}

// Run update
if (require.main === module) {
  updateDeploymentAsWebApp().catch(console.error);
}

module.exports = { updateDeploymentAsWebApp };
