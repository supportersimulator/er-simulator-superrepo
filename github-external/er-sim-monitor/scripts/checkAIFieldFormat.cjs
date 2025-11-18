#!/usr/bin/env node

/**
 * CHECK AI FIELD FORMAT
 * See what field names are being passed to AI and what format it returns
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

async function check() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');

    // Search for where AI prompt is constructed
    const getRecommendedStart = codeFile.source.indexOf('function getRecommendedFields(');

    if (getRecommendedStart === -1) {
      console.log('❌ Could not find getRecommendedFields function\n');

      // Try alternative names
      const altStart = codeFile.source.indexOf('function getStaticRecommendedFields(');
      if (altStart > -1) {
        console.log('✅ Found getStaticRecommendedFields instead\n');
        const funcEnd = codeFile.source.indexOf('\nfunction ', altStart + 10);
        const funcBody = codeFile.source.substring(altStart, funcEnd);
        console.log('Function body preview:');
        console.log('═════════════════════════════════════════════════════════════════');
        console.log(funcBody.substring(0, 2000));
        console.log('═════════════════════════════════════════════════════════════════\n');

        // Check if it uses actual field names or patterns
        if (funcBody.includes('availableFields')) {
          console.log('✅ Function uses availableFields (actual headers from Row 2)\n');
        } else {
          console.log('⚠️ Function may not be using actual header names\n');
        }

        return;
      }

      return;
    }

    // Extract the function body
    const funcEnd = codeFile.source.indexOf('\nfunction ', getRecommendedStart + 10);
    const funcBody = codeFile.source.substring(getRecommendedStart, funcEnd);

    console.log('getRecommendedFields function preview:');
    console.log('═════════════════════════════════════════════════════════════════');
    console.log(funcBody.substring(0, 3000));
    console.log('═════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

check();
