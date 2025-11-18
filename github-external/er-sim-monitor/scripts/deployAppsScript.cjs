#!/usr/bin/env node

/**
 * Deploy Apps Script as API Executable
 *
 * Creates a deployment that allows the script to be executed via API
 *
 * Usage:
 *   node scripts/deployAppsScript.cjs
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
 * Deploy Apps Script as API executable
 */
async function deployAppsScript() {
  console.log('');
  console.log('🚀 DEPLOYING APPS SCRIPT AS API EXECUTABLE');
  console.log('════════════════════════════════════════════════════');
  console.log(`Apps Script ID: ${APPS_SCRIPT_ID}`);
  console.log('════════════════════════════════════════════════════');
  console.log('');

  try {
    const script = createAppsScriptClient();

    // Step 1: List existing deployments
    console.log('📋 STEP 1: Checking existing deployments...');
    const listResponse = await script.projects.deployments.list({
      scriptId: APPS_SCRIPT_ID
    });

    const existingDeployments = listResponse.data.deployments || [];
    console.log(`✅ Found ${existingDeployments.length} existing deployment(s)`);

    if (existingDeployments.length > 0) {
      console.log('');
      console.log('Existing deployments:');
      existingDeployments.forEach((dep, idx) => {
        console.log(`   ${idx + 1}. ${dep.deploymentId} - ${dep.deploymentConfig.description || 'No description'}`);
      });
    }
    console.log('');

    // Step 2: Create new API executable deployment
    console.log('🎯 STEP 2: Creating API executable deployment...');

    const createResponse = await script.projects.deployments.create({
      scriptId: APPS_SCRIPT_ID,
      requestBody: {
        versionNumber: 1, // Use version 1 (HEAD version)
        manifestFileName: 'appsscript',
        description: 'API Executable - ER Simulator Batch Processor'
      }
    });

    const deployment = createResponse.data;
    console.log('✅ Deployment created successfully!');
    console.log('');
    console.log('Deployment details:');
    console.log(`   ID: ${deployment.deploymentId}`);
    console.log(`   Description: ${deployment.deploymentConfig.description}`);
    console.log('');

    // Step 3: Update .env with deployment ID
    console.log('📝 STEP 3: Updating .env with deployment ID...');

    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Check if DEPLOYMENT_ID already exists
    if (envContent.includes('DEPLOYMENT_ID=')) {
      // Replace existing
      envContent = envContent.replace(
        /DEPLOYMENT_ID=.*/,
        `DEPLOYMENT_ID=${deployment.deploymentId}`
      );
    } else {
      // Add new
      envContent += `\nDEPLOYMENT_ID=${deployment.deploymentId}\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ Updated .env with DEPLOYMENT_ID');
    console.log('');

    // Step 4: Test execution
    console.log('🧪 STEP 4: Testing API execution...');
    console.log('   Calling test function...');

    try {
      const testResponse = await script.scripts.run({
        scriptId: APPS_SCRIPT_ID,
        requestBody: {
          function: 'test',
          devMode: false
        }
      });

      if (testResponse.data.response) {
        console.log('✅ API execution test successful!');
        console.log(`   Result: ${JSON.stringify(testResponse.data.response.result)}`);
      } else if (testResponse.data.error) {
        console.log('⚠️  API execution test had error:');
        console.log(`   ${testResponse.data.error.message}`);
      }
    } catch (testError) {
      console.log('⚠️  Test execution skipped (may need function deployment)');
    }

    console.log('');
    console.log('════════════════════════════════════════════════════');
    console.log('✅ DEPLOYMENT COMPLETE');
    console.log('════════════════════════════════════════════════════');
    console.log('');
    console.log('Next steps:');
    console.log('   1. Deployment ID saved to .env');
    console.log('   2. Ready for programmatic batch processing');
    console.log('   3. Run: npm run run-batch-direct "2,3"');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ DEPLOYMENT FAILED');
    console.error('════════════════════════════════════════════════════');
    console.error(`Error: ${error.message}`);
    console.error('');

    if (error.response && error.response.data) {
      console.error('Full error details:');
      console.error(JSON.stringify(error.response.data, null, 2));
      console.error('');
    }

    if (error.message.includes('insufficient authentication')) {
      console.error('💡 Solution: Need deployment creation permission');
      console.error('');
      console.error('   Re-authenticate with additional scope:');
      console.error('   https://www.googleapis.com/auth/script.deployments');
      console.error('');
      console.error('   Run: npm run auth-google');
      console.error('');
    }

    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  deployAppsScript().catch(console.error);
}

module.exports = { deployAppsScript };
