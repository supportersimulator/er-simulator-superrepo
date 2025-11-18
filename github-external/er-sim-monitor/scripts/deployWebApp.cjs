#!/usr/bin/env node

/**
 * Deploy Apps Script as Web App
 *
 * Attempts to create a web app deployment programmatically
 *
 * Usage:
 *   node scripts/deployWebApp.cjs
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
 * Deploy as web app
 */
async function deployWebApp() {
  console.log('');
  console.log('🌐 DEPLOYING APPS SCRIPT AS WEB APP');
  console.log('════════════════════════════════════════════════════');
  console.log(`Apps Script ID: ${APPS_SCRIPT_ID}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const script = createAppsScriptClient();

    // Step 1: Create a new version
    console.log('📦 STEP 1: Creating new version...');

    const versionResponse = await script.projects.versions.create({
      scriptId: APPS_SCRIPT_ID,
      requestBody: {
        description: 'Web App with HTTP endpoints for batch processing'
      }
    });

    const versionNumber = versionResponse.data.versionNumber;
    console.log(`✅ Created version ${versionNumber}`);
    console.log('');

    // Step 2: Create deployment
    console.log('🚀 STEP 2: Creating web app deployment...');

    const deployResponse = await script.projects.deployments.create({
      scriptId: APPS_SCRIPT_ID,
      requestBody: {
        versionNumber: versionNumber,
        manifestFileName: 'appsscript',
        description: 'Web App - ER Simulator Batch Processor API'
      }
    });

    const deployment = deployResponse.data;
    const deploymentId = deployment.deploymentId;

    console.log('✅ Deployment created successfully!');
    console.log('');
    console.log('Deployment details:');
    console.log(`   ID: ${deploymentId}`);
    console.log(`   Description: ${deployment.deploymentConfig.description}`);
    console.log('');

    // Step 3: Get the web app URL
    console.log('🔗 STEP 3: Getting web app URL...');

    const webAppUrl = `https://script.google.com/macros/s/${deploymentId}/exec`;
    console.log(`✅ Web App URL: ${webAppUrl}`);
    console.log('');

    // Step 4: Update .env
    console.log('💾 STEP 4: Updating .env...');

    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Add WEB_APP_URL
    if (envContent.includes('WEB_APP_URL=')) {
      envContent = envContent.replace(/WEB_APP_URL=.*/, `WEB_APP_URL=${webAppUrl}`);
    } else {
      envContent += `\nWEB_APP_URL=${webAppUrl}\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ Updated .env with WEB_APP_URL');
    console.log('');

    console.log('════════════════════════════════════════════════════');
    console.log('✅ WEB APP DEPLOYMENT COMPLETE');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log('Web App URL:');
    console.log(`   ${webAppUrl}`);
    console.log('');
    console.log('Next steps:');
    console.log('   1. Test status endpoint:');
    console.log(`      curl "${webAppUrl}?action=status"`);
    console.log('');
    console.log('   2. Run batch processing:');
    console.log('      npm run run-batch-http "2,3"');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ WEB APP DEPLOYMENT FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.response && error.response.data) {
      console.error('Full error details:');
      console.error(JSON.stringify(error.response.data, null, 2));
      console.error('');
    }

    console.error('💡 MANUAL DEPLOYMENT INSTRUCTIONS:');
    console.error('');
    console.error('   1. Open Apps Script project:');
    console.error(`      https://script.google.com/home/projects/${APPS_SCRIPT_ID}/edit`);
    console.error('');
    console.error('   2. Click "Deploy" → "New deployment"');
    console.error('   3. Click gear icon → Select "Web app"');
    console.error('   4. Configure:');
    console.error('      - Description: "ER Simulator Batch Processor API"');
    console.error('      - Execute as: "Me"');
    console.error('      - Who has access: "Anyone"');
    console.error('   5. Click "Deploy"');
    console.error('   6. Copy the Web App URL');
    console.error('   7. Add to .env:');
    console.error('      WEB_APP_URL=<your_url_here>');
    console.error('');

    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  deployWebApp().catch(console.error);
}

module.exports = { deployWebApp };
