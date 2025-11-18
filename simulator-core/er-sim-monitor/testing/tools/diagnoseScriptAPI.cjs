#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const SCRIPT_ID = process.env.APPS_SCRIPT_ID;
const TOKEN_PATH = path.join(__dirname, '../../config/token.json');

async function diagnoseScriptAPI() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oauth2Client });

  console.log('\n🔍 DIAGNOSING APPS SCRIPT API ACCESS\n');
  console.log('Script ID:', SCRIPT_ID);
  console.log('━'.repeat(70) + '\n');

  // Test 1: Get script metadata
  console.log('Test 1: Get script metadata...');
  try {
    const metadata = await script.projects.get({ scriptId: SCRIPT_ID });
    console.log('✅ Metadata accessible');
    console.log('  - Title:', metadata.data.title);
    console.log('  - Create Time:', metadata.data.createTime);
    console.log('');
  } catch (error) {
    console.log('❌ Cannot access metadata:', error.message);
    console.log('');
  }

  // Test 2: Get script content
  console.log('Test 2: Get script content...');
  try {
    const content = await script.projects.getContent({ scriptId: SCRIPT_ID });
    console.log('✅ Content accessible');
    console.log('  - Files:', content.data.files.length);
    console.log('');
  } catch (error) {
    console.log('❌ Cannot access content:', error.message);
    console.log('');
  }

  // Test 3: List deployments
  console.log('Test 3: List deployments...');
  try {
    const deployments = await script.projects.deployments.list({ scriptId: SCRIPT_ID });
    console.log('✅ Deployments accessible');
    console.log('  - Count:', deployments.data.deployments ? deployments.data.deployments.length : 0);
    if (deployments.data.deployments) {
      deployments.data.deployments.forEach(d => {
        const desc = d.deploymentConfig && d.deploymentConfig.description ? d.deploymentConfig.description : 'No description';
        console.log(`  - ${d.deploymentId}: ${desc}`);
      });
    }
    console.log('');
  } catch (error) {
    console.log('❌ Cannot list deployments:', error.message);
    console.log('');
  }

  // Test 4: Try to execute a simple function
  console.log('Test 4: Try to execute checkApiStatus...');
  try {
    const response = await script.scripts.run({
      scriptId: SCRIPT_ID,
      requestBody: {
        function: 'checkApiStatus',
        devMode: false
      }
    });
    console.log('✅ Execution successful');
    console.log('  - Response:', JSON.stringify(response.data, null, 2).substring(0, 500));
  } catch (error) {
    console.log('❌ Execution failed:', error.message);
    if (error.errors) {
      console.log('  - Error details:', JSON.stringify(error.errors, null, 2));
    }
  }

  console.log('\n' + '━'.repeat(70));
  console.log('\n💡 DIAGNOSIS COMPLETE\n');
}

diagnoseScriptAPI().catch(console.error);
