#!/usr/bin/env node

/**
 * CHECK SAVED FIELD SELECTION
 * Read SELECTED_CACHE_FIELDS from DocumentProperties
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔍 CHECKING SAVED FIELD SELECTION\n');
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

async function check() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const code = codeFile.source;

    // Create a temporary function to read the property
    const checkFunction = `
function checkSavedFields() {
  const docProps = PropertiesService.getDocumentProperties();
  const saved = docProps.getProperty('SELECTED_CACHE_FIELDS');

  if (!saved) {
    return { status: 'NO_SAVED_FIELDS', message: 'No saved field selection found' };
  }

  try {
    const fields = JSON.parse(saved);
    return {
      status: 'FOUND',
      count: fields.length,
      fields: fields
    };
  } catch (e) {
    return {
      status: 'ERROR',
      message: 'Error parsing saved fields: ' + e.message,
      raw: saved
    };
  }
}
`;

    // Add the check function temporarily
    const updatedFiles = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: code + '\n\n' + checkFunction
      },
      content.data.files.find(f => f.name === 'appsscript')
    ];

    console.log('📤 Deploying temporary check function...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: updatedFiles }
    });

    console.log('✅ Deployed, waiting for propagation...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🔍 Reading SELECTED_CACHE_FIELDS property...\n');

    // Run the function
    const result = await script.scripts.run({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        function: 'checkSavedFields'
      }
    });

    if (result.data.error) {
      console.error('❌ Error:', result.data.error.details[0].errorMessage);
    } else {
      const response = result.data.response.result;

      if (response.status === 'NO_SAVED_FIELDS') {
        console.log('❌ NO SAVED FIELDS FOUND\n');
        console.log('This means you haven\'t selected fields yet, or they were cleared.\n');
      } else if (response.status === 'ERROR') {
        console.log('⚠️  ERROR PARSING SAVED FIELDS:\n');
        console.log(`   ${response.message}\n`);
        console.log('   Raw value:', response.raw);
      } else if (response.status === 'FOUND') {
        console.log(`✅ FOUND SAVED FIELD SELECTION: ${response.count} fields\n`);
        console.log('Fields:\n');
        response.fields.forEach((field, i) => {
          console.log(`   ${i + 1}. ${field}`);
        });
        console.log('');
      }
    }

    // Restore original code
    console.log('🔄 Restoring original code...\n');
    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          {
            name: 'Code',
            type: 'SERVER_JS',
            source: code
          },
          content.data.files.find(f => f.name === 'appsscript')
        ]
      }
    });

    console.log('✅ Original code restored\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

check();
