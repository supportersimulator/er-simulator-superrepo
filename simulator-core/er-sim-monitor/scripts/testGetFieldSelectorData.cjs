#!/usr/bin/env node

/**
 * TEST getFieldSelectorData() DIRECTLY
 * See what the function returns
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

    console.log('🔧 Calling getFieldSelectorData() directly via Apps Script API...\n');

    // Call the function
    const response = await script.scripts.run({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        function: 'getFieldSelectorData',
        devMode: false
      }
    });

    if (response.data.error) {
      console.log('❌ ERROR from Apps Script:\n');
      console.log(JSON.stringify(response.data.error, null, 2));
    } else {
      console.log('✅ Function executed successfully\n');
      const result = response.data.response.result;
      console.log('Result keys:', Object.keys(result));
      console.log('Selected count:', result.selected ? result.selected.length : 'N/A');
      console.log('Recommended count:', result.recommended ? result.recommended.length : 'N/A');
      console.log('Grouped categories count:', result.grouped ? Object.keys(result.grouped).length : 'N/A');
      console.log('Has logs:', result.logs ? 'YES (' + result.logs.length + ')' : 'NO');

      if (result.logs && result.logs.length > 0) {
        console.log('\n📋 Server Logs:');
        result.logs.slice(0, 10).forEach(log => console.log('   ' + log));
        if (result.logs.length > 10) {
          console.log('   ... (' + (result.logs.length - 10) + ' more)');
        }
      }
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('\nResponse data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

test();
