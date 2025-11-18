#!/usr/bin/env node

/**
 * Check Deployment Configuration
 *
 * Retrieves current deployment details and configuration
 *
 * Usage:
 *   node scripts/checkDeploymentConfig.cjs
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
 * Check deployment configuration
 */
async function checkDeploymentConfig() {
  console.log('');
  console.log('🔍 CHECKING DEPLOYMENT CONFIGURATION');
  console.log('════════════════════════════════════════════════════');
  console.log(`Apps Script ID: ${APPS_SCRIPT_ID}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const script = createAppsScriptClient();

    // Get all deployments
    console.log('📋 Fetching all deployments...');
    const listResponse = await script.projects.deployments.list({
      scriptId: APPS_SCRIPT_ID
    });

    const deployments = listResponse.data.deployments || [];
    console.log(`✅ Found ${deployments.length} deployment(s)`);
    console.log('');

    // Show details for each deployment
    deployments.forEach((dep, idx) => {
      console.log(`📦 Deployment ${idx + 1}:`);
      console.log(`   ID: ${dep.deploymentId}`);
      console.log(`   Description: ${dep.deploymentConfig?.description || 'No description'}`);
      console.log(`   Version: ${dep.deploymentConfig?.versionNumber || 'HEAD'}`);

      // Show entry points (web app config)
      if (dep.entryPoints && dep.entryPoints.length > 0) {
        console.log(`   Entry Points:`);
        dep.entryPoints.forEach(ep => {
          console.log(`      Type: ${ep.entryPointType}`);
          if (ep.webApp) {
            console.log(`      Web App URL: ${ep.webApp.url}`);
            console.log(`      Execute As: ${ep.webApp.executeAs || 'USER_DEPLOYING'}`);
            console.log(`      Who Has Access: ${ep.webApp.access || 'MYSELF'}`);
          }
        });
      }
      console.log('');
    });

    // Get project metadata
    console.log('📊 Project Metadata:');
    const getResponse = await script.projects.get({
      scriptId: APPS_SCRIPT_ID
    });

    console.log(`   Title: ${getResponse.data.title}`);
    console.log(`   Script ID: ${getResponse.data.scriptId}`);
    console.log(`   Parent ID: ${getResponse.data.parentId || 'None'}`);
    console.log('');

    console.log('════════════════════════════════════════════════════');
    console.log('💡 NEXT STEPS');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log('The deployment was created but needs web app configuration.');
    console.log('');
    console.log('To configure via Google Apps Script UI:');
    console.log('');
    console.log('1. Visit:');
    console.log(`   https://script.google.com/home/projects/${APPS_SCRIPT_ID}/edit`);
    console.log('');
    console.log('2. Click "Deploy" → "Test deployments"');
    console.log('');
    console.log('3. Click "Select type" → "Web app"');
    console.log('');
    console.log('4. Configure:');
    console.log('   - Description: "ER Simulator Batch Processor"');
    console.log('   - Execute as: "Me"');
    console.log('   - Who has access: "Anyone"');
    console.log('');
    console.log('5. Click "Deploy"');
    console.log('');
    console.log('6. Authorize when prompted');
    console.log('');
    console.log('7. Copy the Web App URL');
    console.log('');
    console.log('OR use the direct URL to authorize:');
    console.log(`   https://script.google.com/macros/s/AKfycbxUG6Dvljf2ObdLFqRF3HqkY6GbJLq9C1GJx99SpkKmAX8ZKxsQC82IzMD4Sfikrizs/exec`);
    console.log('');
    console.log('Click "Review permissions" and authorize the app.');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ CHECK FAILED');
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

// Run check
if (require.main === module) {
  checkDeploymentConfig().catch(console.error);
}

module.exports = { checkDeploymentConfig };
