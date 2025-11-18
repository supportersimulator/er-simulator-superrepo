#!/usr/bin/env node

/**
 * Deploy Updated ATSR Panel to Test Environment
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SCRIPT_ID = '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i';

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

async function deployUpdates() {
  console.log('\n🚀 DEPLOYING ATSR USABILITY UPDATES\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Read all feature files
    const scriptFiles = [];
    const featureFiles = [
      'ATSR_Title_Generator_Feature.gs',
      'Batch_Processing_Sidebar_Feature.gs',
      'Core_Processing_Engine.gs'
    ];

    console.log('Step 1: Loading updated feature files...\n');

    for (const filename of featureFiles) {
      const filePath = path.join(__dirname, '../apps-script-deployable', filename);
      const content = fs.readFileSync(filePath, 'utf8');
      const name = filename.replace('.gs', '');

      scriptFiles.push({
        name,
        type: 'SERVER_JS',
        source: content
      });

      const status = filename === 'ATSR_Title_Generator_Feature.gs' ? '🔄 UPDATED' : '✓';
      console.log(`   ${status} ${filename} (${(content.length / 1024).toFixed(1)} KB)`);
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

    // Deploy
    console.log('Step 2: Deploying to test environment...\n');

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
      requestBody: { files: scriptFiles }
    });

    console.log('   ✅ Deployment successful!\n');

    // Verify
    console.log('Step 3: Verifying ATSR updates...\n');

    const verifyProject = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const atsrFile = verifyProject.data.files.find(f => f.name === 'ATSR_Title_Generator_Feature');

    if (atsrFile) {
      const hasWrapping = atsrFile.source.includes('word-wrap: break-word');
      const hasLearningObjective = atsrFile.source.includes('learningOutcome');

      console.log(`   ${hasWrapping ? '✅' : '❌'} Title wrapping CSS present`);
      console.log(`   ${hasLearningObjective ? '✅' : '❌'} Learning objective logic present\n`);

      if (hasWrapping && hasLearningObjective) {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('✅ ATSR USABILITY UPDATES DEPLOYED SUCCESSFULLY');
        console.log('═══════════════════════════════════════════════════════════════\n');

        console.log('Changes Deployed:\n');
        console.log('1. Title Readability:');
        console.log('   • Titles now wrap to multiple lines');
        console.log('   • No horizontal scrolling needed');
        console.log('   • Full text visible at a glance\n');

        console.log('2. Learning Objective:');
        console.log('   • Second bullet now shows specific learning outcome');
        console.log('   • Format: "Master [intervention] as critical decision for [diagnosis]"');
        console.log('   • Dynamically generated from case data\n');

        console.log('Test It Now:');
        console.log('   1. Open test spreadsheet');
        console.log('   2. Run ATSR on any processed row');
        console.log('   3. Verify titles wrap properly');
        console.log('   4. Check second bullet says "Learning Objective: Master..."\n');
      } else {
        console.log('⚠️  Updates may not have deployed correctly\n');
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Deployment Error:', error.message);
    throw error;
  }
}

deployUpdates().catch(error => {
  console.error('\nDeployment failed:', error.message);
  process.exit(1);
});
