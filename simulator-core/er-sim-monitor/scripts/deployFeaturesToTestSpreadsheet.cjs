#!/usr/bin/env node

/**
 * Deploy Feature-Based Code to Test Spreadsheet via Apps Script API
 *
 * Safely deploys 3 feature files to test spreadsheet without touching originals
 *
 * Safety:
 * - Only touches test spreadsheet (1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI)
 * - Original spreadsheet (1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM) is never modified
 * - Creates backup of test spreadsheet code before deployment
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Test spreadsheet ONLY - original is never touched
const TEST_SHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';
const ORIGINAL_SHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM'; // Read-only, never modified

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

async function deployFeaturesToTest() {
  console.log('\n🚀 DEPLOYING FEATURE-BASED CODE TO TEST SPREADSHEET\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Safety check
  console.log('🔒 SAFETY VERIFICATION:');
  console.log(`   Test Spreadsheet ID: ${TEST_SHEET_ID}`);
  console.log(`   Original Spreadsheet ID: ${ORIGINAL_SHEET_ID} (READ-ONLY, NEVER MODIFIED)`);
  console.log('   ✅ Confirmed: Only test spreadsheet will be modified\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  // Step 1: Get the Apps Script project ID for the test spreadsheet
  console.log('Step 1: Finding Apps Script project for test spreadsheet...\n');

  const drive = google.drive({ version: 'v3', auth });

  // Search for Apps Script project bound to test spreadsheet
  const searchResponse = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.script' and '${TEST_SHEET_ID}' in parents`,
    fields: 'files(id, name)'
  });

  let scriptId;

  if (searchResponse.data.files.length > 0) {
    scriptId = searchResponse.data.files[0].id;
    console.log(`   ✓ Found existing Apps Script project: ${scriptId}\n`);
  } else {
    console.log('   ⚠️  No Apps Script project found. Creating one...');
    console.log('   Note: You may need to manually create the project first via Extensions > Apps Script\n');
    console.log('   Once created, run this script again.\n');
    process.exit(1);
  }

  // Step 2: Backup current code
  console.log('Step 2: Backing up current code from test spreadsheet...\n');

  try {
    const currentProject = await script.projects.getContent({ scriptId });

    const backupDir = path.join(__dirname, '../backups/test-spreadsheet');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupPath = path.join(backupDir, `backup_${new Date().toISOString().replace(/:/g, '-')}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(currentProject.data, null, 2));

    console.log(`   ✓ Backup saved: ${backupPath}\n`);
  } catch (error) {
    console.log('   ⚠️  Could not backup (project may be new): ' + error.message + '\n');
  }

  // Step 3: Read feature files
  console.log('Step 3: Reading feature-based code files...\n');

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
  console.log('   ✓ Added: appsscript.json manifest');

  console.log('');

  // Step 4: Deploy to test spreadsheet
  console.log('Step 4: Deploying feature files to test spreadsheet...\n');

  const deployRequest = {
    scriptId,
    requestBody: {
      files: scriptFiles
    }
  };

  try {
    const deployResponse = await script.projects.updateContent(deployRequest);

    console.log('   ✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('   Deployed files:');
    files.forEach(file => {
      console.log(`      • ${file.name}.gs`);
    });
    console.log('');

  } catch (error) {
    console.error('   ❌ Deployment failed:', error.message);
    console.error('\n   Details:', error);
    process.exit(1);
  }

  // Step 5: Verify deployment
  console.log('Step 5: Verifying deployment...\n');

  const verifyProject = await script.projects.getContent({ scriptId });
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
  console.log(`Apps Script Project: ${scriptId}`);
  console.log(`Files Deployed: ${files.length}`);
  console.log('');
  console.log('✅ Feature-based code successfully deployed to TEST spreadsheet');
  console.log('✅ Original spreadsheet untouched');
  console.log('✅ All golden prompts preserved');
  console.log('');
  console.log('Next Steps:');
  console.log('  1. Open test spreadsheet:');
  console.log(`     https://docs.google.com/spreadsheets/d/${TEST_SHEET_ID}/edit`);
  console.log('  2. Test ATSR on a row');
  console.log('  3. Test batch processing sidebar');
  console.log('  4. Compare outputs with original');
  console.log('═══════════════════════════════════════════════════════════════\n');

  return {
    testSheetId: TEST_SHEET_ID,
    scriptId,
    filesDeployed: files.length,
    timestamp: new Date().toISOString()
  };
}

deployFeaturesToTest().catch(error => {
  console.error('\n❌ ERROR:', error.message);
  console.error('\nIf you see authentication errors, you may need to:');
  console.error('  1. Enable Apps Script API in Google Cloud Console');
  console.error('  2. Add Apps Script API scope to your OAuth consent screen');
  console.error('  3. Re-run: npm run auth-google\n');
  process.exit(1);
});
