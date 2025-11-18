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

async function search() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const code = content.data.files.find(f => f.name === 'Code').source;

    // Search for the cache modal function
    const searchTerms = [
      'showCacheAllLayersModal',
      'function showFieldSelectorModal',
      'Continue to Cache',
      'HtmlService.createHtmlOutput'
    ];

    searchTerms.forEach(term => {
      const idx = code.indexOf(term);
      if (idx !== -1) {
        console.log(`\n✅ Found "${term}" at position ${idx}`);
        console.log('Context:');
        console.log(code.substring(Math.max(0, idx - 200), idx + 800));
        console.log('\n' + '='.repeat(80) + '\n');
      } else {
        console.log(`❌ "${term}" not found`);
      }
    });

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

search();
