#!/usr/bin/env node

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

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const code = content.data.files.find(f => f.name === 'Code').source;

    // Find getRecommendedFields
    const idx = code.indexOf('function getRecommendedFields');

    if (idx !== -1) {
      console.log('✅ getRecommendedFields function EXISTS\n');

      // Find the end of the function
      const endIdx = code.indexOf('\nfunction ', idx + 50);
      const funcCode = code.substring(idx, endIdx > idx ? endIdx : idx + 3000);

      console.log('First 1500 characters:\n');
      console.log(funcCode.substring(0, 1500));
      console.log('\n...\n');

      // Check if it uses OpenAI
      if (funcCode.includes('openai') || funcCode.includes('gpt-4')) {
        console.log('✅ Uses OpenAI API');
      }

      // Check what it returns
      if (funcCode.includes('return')) {
        console.log('✅ Has return statement');
      }

    } else {
      console.log('❌ getRecommendedFields function NOT FOUND\n');
      console.log('Need to create it.');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

check();
