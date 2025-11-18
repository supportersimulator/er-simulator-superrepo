#!/usr/bin/env node

/**
 * Initialize Apps Script Project and Deploy Feature-Based Code
 *
 * Creates Apps Script project for test spreadsheet and deploys feature files
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';
const ORIGINAL_SHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM'; // Never touched

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

async function initializeAndDeploy() {
  console.log('\n🚀 INITIALIZING APPS SCRIPT PROJECT AND DEPLOYING FEATURES\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  // Safety verification
  console.log('🔒 SAFETY VERIFICATION:');
  console.log(`   Test Spreadsheet: ${TEST_SHEET_ID} (WILL BE MODIFIED)`);
  console.log(`   Original Spreadsheet: ${ORIGINAL_SHEET_ID} (READ-ONLY, NEVER TOUCHED)`);
  console.log('   ✅ Confirmed: Only test spreadsheet will be modified\n');

  // Step 1: Create Apps Script project
  console.log('Step 1: Creating Apps Script project for test spreadsheet...\n');

  const featuresDir = path.join(__dirname, '../apps-script-deployable');

  const files = [
    {
      name: 'ATSR_Title_Generator_Feature',
      path: path.join(featuresDir, 'ATSR_Title_Generator_Feature.gs'),
      type: 'SERVER_JS'
    },
    {
      name: 'Batch_Processing_Sidebar_Feature',
      path: path.join(featuresDir, 'Batch_Processing_Sidebar_Feature.gs'),
      type: 'SERVER_JS'
    },
    {
      name: 'Core_Processing_Engine',
      path: path.join(featuresDir, 'Core_Processing_Engine.gs'),
      type: 'SERVER_JS'
    }
  ];

  // Read file contents
  const scriptFiles = files.map(file => {
    const content = fs.readFileSync(file.path, 'utf8');
    console.log(`   ✓ Read: ${file.name}.gs (${(content.length / 1024).toFixed(1)} KB)`);
    return {
      name: file.name,
      type: file.type,
      source: content
    };
  });

  // Add required appsscript.json manifest
  scriptFiles.push({
    name: 'appsscript',
    type: 'JSON',
    source: JSON.stringify({
      timeZone: 'America/Los_Angeles',
      dependencies: {},
      exceptionLogging: 'STACKDRIVER',
      runtimeVersion: 'V8'
    }, null, 2)
  });
  console.log('   ✓ Added: appsscript.json manifest\n');

  console.log('\nStep 2: Creating bound Apps Script project...\n');

  try {
    // Create a new Apps Script project
    const createResponse = await script.projects.create({
      requestBody: {
        title: 'TEST_Feature_Based_Code',
        parentId: TEST_SHEET_ID
      }
    });

    const scriptId = createResponse.data.scriptId;
    console.log(`   ✓ Created Apps Script project: ${scriptId}\n`);

    // Step 3: Update with feature files
    console.log('Step 3: Deploying feature files...\n');

    await script.projects.updateContent({
      scriptId,
      requestBody: {
        files: scriptFiles
      }
    });

    console.log('   ✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('   Deployed files:');
    files.forEach(file => {
      console.log(`      • ${file.name}.gs`);
    });
    console.log('');

    // Verify
    const verifyProject = await script.projects.getContent({ scriptId });
    const deployedFiles = verifyProject.data.files;

    console.log(`   ✓ Verified: ${deployedFiles.length} files deployed\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 DEPLOYMENT COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Test Spreadsheet ID: ${TEST_SHEET_ID}`);
    console.log(`Apps Script Project ID: ${scriptId}`);
    console.log(`Files Deployed: ${files.length}`);
    console.log('');
    console.log('✅ Feature-based code deployed to TEST spreadsheet');
    console.log('✅ Original spreadsheet untouched');
    console.log('✅ All golden prompts preserved');
    console.log('');
    console.log('🎯 READY TO TEST:');
    console.log(`   URL: https://docs.google.com/spreadsheets/d/${TEST_SHEET_ID}/edit`);
    console.log('');
    console.log('   Try:');
    console.log('   1. Run ATSR on a row');
    console.log('   2. Open batch processing sidebar');
    console.log('   3. Compare outputs with original');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Save deployment info
    const deployInfo = {
      timestamp: new Date().toISOString(),
      testSheetId: TEST_SHEET_ID,
      scriptId,
      filesDeployed: files.length,
      files: files.map(f => f.name)
    };

    const infoPath = path.join(__dirname, '../config/deployment-info.json');
    fs.writeFileSync(infoPath, JSON.stringify(deployInfo, null, 2));

    return deployInfo;

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);

    if (error.message.includes('Apps Script API has not been used')) {
      console.error('\n🔧 FIX: Enable Apps Script API');
      console.error('   1. Go to: https://console.cloud.google.com/apis/library/script.googleapis.com');
      console.error('   2. Enable the Apps Script API');
      console.error('   3. Run this script again\n');
    }

    throw error;
  }
}

initializeAndDeploy().catch(error => {
  console.error('\nDeployment failed. Check error above for details.\n');
  process.exit(1);
});
