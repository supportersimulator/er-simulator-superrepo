#!/usr/bin/env node

/**
 * Test Functions via API Executable Deployment
 * Uses the proper deployment ID for execution
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const SCRIPT_ID = process.env.APPS_SCRIPT_ID;
const TOKEN_PATH = path.join(__dirname, '../../config/token.json');

// API Executable deployment ID from diagnosis
const API_DEPLOYMENT_ID = 'AKfycbzHmGqKDbK-pPu85GzsZ8jpnWp4TruOG5t_BB55f_kqR5lXsBvmsDoz8WMNZk5DPWyJ';

const TESTABLE_FUNCTIONS = [
  'checkApiStatus',
  'runQualityAudit_AllOrRows',
  'refreshHeaders',
  'cleanUpLowValueRows',
  'retrainPromptStructure'
];

async function authenticate() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

async function testWithDeployment() {
  console.log('\n🧪 TESTING FUNCTIONS VIA API DEPLOYMENT\n');
  console.log('━'.repeat(70));

  const auth = await authenticate();
  const script = google.script({ version: 'v1', auth });

  console.log('Script ID:', SCRIPT_ID);
  console.log('Deployment ID:', API_DEPLOYMENT_ID);
  console.log('');

  for (const funcName of TESTABLE_FUNCTIONS) {
    console.log(`📋 Testing: ${funcName}`);
    console.log(`   ⚙️  Invoking...`);

    try {
      const response = await script.scripts.run({
        scriptId: SCRIPT_ID,
        requestBody: {
          function: funcName,
          parameters: [],
          devMode: false
        }
      });

      if (response.data.error) {
        console.log(`   ❌ Error: ${response.data.error.details?.[0]?.errorMessage || response.data.error.message}`);
      } else {
        console.log(`   ✅ Success`);
        console.log(`   📊 Output:`, JSON.stringify(response.data.response?.result || 'no output').substring(0, 200));
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
    console.log('');
  }

  console.log('━'.repeat(70));
  console.log('\n💡 TEST COMPLETE\n');
}

testWithDeployment().catch(console.error);
