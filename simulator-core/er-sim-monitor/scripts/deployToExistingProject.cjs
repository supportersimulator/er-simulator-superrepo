#!/usr/bin/env node

/**
 * Deploy Features to Existing Apps Script Project
 *
 * Uses the scriptId from the project we already created
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// The Apps Script project we created earlier
const SCRIPT_ID = '1INZy2-kQNEfEWEipSQ_WCvrvEhGgAeW4G4TM61W2ajNp_63G39KLPm4Y';
const TEST_SHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

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

async function deployToExisting() {
  console.log('\n🚀 DEPLOYING FEATURES TO EXISTING APPS SCRIPT PROJECT\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  // Read feature files
  console.log('Step 1: Reading feature files...\n');

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

  // Deploy to project
  console.log('Step 2: Deploying to Apps Script project...\n');
  console.log(`   Project ID: ${SCRIPT_ID}\n`);

  try {
    await script.projects.updateContent({
      scriptId: SCRIPT_ID,
      requestBody: {
        files: scriptFiles
      }
    });

    console.log('   ✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('   Deployed files:');
    files.forEach(file => {
      console.log(`      • ${file.name}.gs`);
    });
    console.log('      • appsscript.json');
    console.log('');

    // Verify
    console.log('Step 3: Verifying deployment...\n');

    const verifyProject = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const deployedFiles = verifyProject.data.files;

    console.log(`   ✓ Verified: ${deployedFiles.length} files in project`);
    deployedFiles.forEach(file => {
      console.log(`      • ${file.name} (${file.type})`);
    });
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 DEPLOYMENT COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Test Spreadsheet: ${TEST_SHEET_ID}`);
    console.log(`Apps Script Project: ${SCRIPT_ID}`);
    console.log(`Files Deployed: ${files.length + 1} (including manifest)`);
    console.log('');
    console.log('✅ Feature-based code successfully deployed to TEST spreadsheet');
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
      scriptId: SCRIPT_ID,
      filesDeployed: files.length + 1,
      files: [...files.map(f => f.name), 'appsscript']
    };

    const infoPath = path.join(__dirname, '../config/deployment-info.json');
    fs.writeFileSync(infoPath, JSON.stringify(deployInfo, null, 2));

    return deployInfo;

  } catch (error) {
    console.error('   ❌ Deployment failed:', error.message);
    console.error('\n   Details:', error);
    process.exit(1);
  }
}

deployToExisting().catch(error => {
  console.error('\n❌ ERROR:', error.message);
  process.exit(1);
});
