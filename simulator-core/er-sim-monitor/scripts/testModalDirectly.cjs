#!/usr/bin/env node

/**
 * TEST MODAL DIRECTLY
 * Call showFieldSelector() to see what error occurs
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

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

async function test() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('🔧 Calling showFieldSelector() directly via Apps Script API...\n');

    // Call the function
    const response = await script.scripts.run({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        function: 'showFieldSelector',
        devMode: false
      }
    });

    if (response.data.error) {
      console.log('❌ ERROR from Apps Script:\n');
      console.log(JSON.stringify(response.data.error, null, 2));
    } else {
      console.log('✅ Function executed successfully\n');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('\nResponse data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

test();
