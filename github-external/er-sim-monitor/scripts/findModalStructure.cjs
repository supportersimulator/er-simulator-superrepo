#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

async function find() {
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

  // Find showFieldSelector function
  const funcStart = code.indexOf('function showFieldSelector() {');
  if (funcStart === -1) {
    console.log('❌ Could not find showFieldSelector');
    return;
  }

  // Find the HTML part
  const htmlStart = code.indexOf('const html = `', funcStart);
  if (htmlStart === -1) {
    console.log('❌ Could not find HTML template');
    return;
  }

  // Extract a snippet to see structure
  const snippet = code.substring(htmlStart, htmlStart + 2000);

  console.log('Modal HTML structure snippet:\n');
  console.log(snippet);
  console.log('\n\nSearching for key elements:');

  const elements = [
    'id="categories"',
    'id="count"',
    'id="liveLog"',
    'id="logContent"',
    '<body>',
    '</body>'
  ];

  elements.forEach(el => {
    const found = code.substring(funcStart).includes(el);
    console.log(`  ${found ? '✅' : '❌'} ${el}`);
  });
}

find().catch(console.error);
