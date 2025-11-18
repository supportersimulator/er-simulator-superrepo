#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

async function check() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const content = await script.projects.getContent({ scriptId: PRODUCTION_PROJECT_ID });
  const code = content.data.files.find(f => f.name === 'Code').source;

  // Search for specific functions
  const functions = [
    'getFieldSelectorData',
    'getFieldSelectorRoughDraft',
    'getAIRecommendations',
    'getRecommendedFields',
    'showFieldSelector'
  ];

  console.log('Function search results:\n');
  functions.forEach(fn => {
    const regex = new RegExp(`function ${fn}\\s*\\(`);
    const found = regex.test(code);
    console.log(`  ${found ? '✅' : '❌'} ${fn}()`);
  });

  // Check for Live Log panel
  const hasLiveLog = code.includes('id="liveLog"');
  console.log(`\n  ${hasLiveLog ? '✅' : '❌'} Live Log panel in HTML`);
}

check().catch(console.error);
