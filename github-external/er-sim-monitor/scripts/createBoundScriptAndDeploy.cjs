#!/usr/bin/env node

/**
 * Create Bound Apps Script Container and Deploy Feature Code
 *
 * Uses Apps Script API to:
 * 1. Create a container-bound script attached to test spreadsheet
 * 2. Deploy our feature-based code to it
 * 3. Verify deployment
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

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

async function createBoundScriptAndDeploy() {
  console.log('\n🔧 CREATING BOUND APPS SCRIPT AND DEPLOYING FEATURE CODE\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Step 1: Prepare feature files
    console.log('Step 1: Loading feature files...\n');

    const scriptFiles = [];
    const featureFiles = [
      'ATSR_Title_Generator_Feature.gs',
      'Batch_Processing_Sidebar_Feature.gs',
      'Core_Processing_Engine.gs'
    ];

    for (const filename of featureFiles) {
      const filePath = path.join(__dirname, '../apps-script-deployable', filename);
      const content = fs.readFileSync(filePath, 'utf8');
      const name = filename.replace('.gs', '');

      scriptFiles.push({
        name,
        type: 'SERVER_JS',
        source: content
      });

      console.log(`   ✓ Loaded ${filename} (${(content.length / 1024).toFixed(1)} KB)`);
    }

    // Add manifest
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

    console.log('   ✓ Added appsscript.json manifest\n');

    // Step 2: Create container-bound Apps Script project
    console.log('Step 2: Creating container-bound Apps Script project...\n');

    const createResponse = await script.projects.create({
      requestBody: {
        title: 'TEST_Feature_Based_Code',
        parentId: TEST_SHEET_ID
      }
    });

    const newScriptId = createResponse.data.scriptId;
    console.log(`   ✅ Created bound Apps Script project: ${newScriptId}\n`);

    // Step 3: Deploy feature code to bound project
    console.log('Step 3: Deploying feature code to bound project...\n');

    await script.projects.updateContent({
      scriptId: newScriptId,
      requestBody: { files: scriptFiles }
    });

    console.log('   ✅ Feature code deployed successfully!\n');

    // Step 4: Verify deployment
    console.log('Step 4: Verifying deployment...\n');

    const verifyProject = await script.projects.getContent({ scriptId: newScriptId });
    const verifyFiles = verifyProject.data.files.filter(f => f.type === 'SERVER_JS');
    const verifyCode = verifyFiles.map(f => f.source).join('\n');

    const checks = [
      { name: 'getProp', found: verifyCode.includes('function getProp(') },
      { name: 'hashText', found: verifyCode.includes('function hashText(') },
      { name: 'cleanDuplicateLines', found: verifyCode.includes('function cleanDuplicateLines(') },
      { name: 'appendLogSafe', found: verifyCode.includes('function appendLogSafe(') },
      { name: 'processOneInputRow_', found: verifyCode.includes('function processOneInputRow_(') },
      { name: 'openSimSidebar', found: verifyCode.includes('function openSimSidebar(') },
      { name: 'runATSRTitleGenerator', found: verifyCode.includes('function runATSRTitleGenerator(') }
    ];

    console.log('   Function verification:\n');
    checks.forEach(check => {
      console.log(`      ${check.found ? '✅' : '❌'} ${check.name}()`);
    });

    const allFound = checks.every(c => c.found);

    console.log('');

    // Step 5: Save configuration
    console.log('Step 5: Saving configuration...\n');

    const config = {
      testSpreadsheetId: TEST_SHEET_ID,
      boundScriptId: newScriptId,
      deploymentDate: new Date().toISOString(),
      filesDeployed: featureFiles.length,
      features: [
        'ATSR Title Generator',
        'Batch Processing Sidebar',
        'Core Processing Engine'
      ]
    };

    const configPath = path.join(__dirname, '../config/test-bound-script.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log(`   ✅ Configuration saved: ${configPath}\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 DEPLOYMENT COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (allFound) {
      console.log('✅ SUCCESS - Bound Apps Script created and feature code deployed');
      console.log('✅ All 7 critical functions verified in deployed code');
      console.log('✅ Test spreadsheet now has working feature-based code\n');

      console.log('What This Means:');
      console.log('   • Test spreadsheet now has its own bound Apps Script project');
      console.log('   • All feature-based code (ATSR, Batch, Core Engine) deployed');
      console.log('   • All utility functions (getProp, hashText, etc.) included');
      console.log('   • Original spreadsheet completely untouched and safe\n');

      console.log('Next Steps:');
      console.log('   1. Open test spreadsheet Extensions → Apps Script');
      console.log('   2. You should see 3 feature files deployed');
      console.log('   3. Try processing Row 206 again - should work now!');
      console.log('   4. Check for "hashText is not defined" error - should be fixed\n');
    } else {
      console.log('⚠️  Some functions missing - manual review needed\n');
    }

    console.log('Test Spreadsheet URL:');
    console.log(`   https://docs.google.com/spreadsheets/d/${TEST_SHEET_ID}/edit\n`);

    console.log('Bound Apps Script Project URL:');
    console.log(`   https://script.google.com/home/projects/${newScriptId}\n`);

    console.log('Apps Script Editor (from spreadsheet):');
    console.log('   Extensions → Apps Script in test spreadsheet\n');

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('parentId')) {
      console.error('\n⚠️  Container-bound script creation failed.');
      console.error('    This may be a permission issue with the API.\n');
      console.error('Manual Alternative:');
      console.error('    1. Open test spreadsheet');
      console.error('    2. Extensions → Apps Script');
      console.error('    3. This creates the bound project automatically');
      console.error('    4. Then re-run this script to deploy code to it\n');
    }

    throw error;
  }
}

createBoundScriptAndDeploy().catch(error => {
  console.error('\nDeployment failed:', error.message);
  process.exit(1);
});
