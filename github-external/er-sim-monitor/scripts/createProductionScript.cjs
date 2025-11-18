#!/usr/bin/env node

/**
 * CREATE NEW CONTAINER-BOUND SCRIPT FOR PRODUCTION
 * Creates a new Apps Script project bound to production spreadsheet
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_SPREADSHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';
const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n🏗️  CREATING PRODUCTION APPS SCRIPT PROJECT\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

async function createProject() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`📊 Production Spreadsheet: ${PRODUCTION_SPREADSHEET_ID}\n`);

    // Load the complete code from GPT Formatter backup
    const codePath = path.join(__dirname, '../backups/gpt-formatter-ready-for-production-2025-11-06.gs');

    if (!fs.existsSync(codePath)) {
      console.log('❌ Production code backup not found!\n');
      console.log('Run checkGPTFormatterForProduction.cjs first.\n');
      return;
    }

    const completeCode = fs.readFileSync(codePath, 'utf8');
    console.log(`📥 Loaded production code: ${(completeCode.length / 1024).toFixed(1)} KB\n`);

    // Create new container-bound Apps Script project
    console.log('🏗️  Creating new container-bound project...\n');

    const createResponse = await script.projects.create({
      requestBody: {
        title: 'Sim Builder (Production)',
        parentId: PRODUCTION_SPREADSHEET_ID
      }
    });

    const newProjectId = createResponse.data.scriptId;
    console.log(`✅ Created new project: ${newProjectId}\n`);

    // Deploy code to new project
    console.log('📤 Deploying code to new project...\n');

    const files = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: completeCode
      },
      {
        name: 'appsscript',
        type: 'JSON',
        source: JSON.stringify({
          timeZone: 'America/Los_Angeles',
          dependencies: {},
          exceptionLogging: 'STACKDRIVER',
          runtimeVersion: 'V8'
        }, null, 2)
      }
    ];

    await script.projects.updateContent({
      scriptId: newProjectId,
      requestBody: { files }
    });

    console.log('✅ Code deployed successfully!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 PRODUCTION SCRIPT CREATED!\n');
    console.log(`Project ID: ${newProjectId}\n`);
    console.log(`Project URL: https://script.google.com/home/projects/${newProjectId}/edit\n`);
    console.log('Next steps:\n');
    console.log('   1. Refresh production spreadsheet\n');
    console.log('   2. Wait 10-15 seconds for onOpen() to trigger\n');
    console.log('   3. Look for "🧠 Sim Builder" menu\n');
    console.log('   4. Test ATSR Titles Optimizer → Mystery button should work!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

createProject();
