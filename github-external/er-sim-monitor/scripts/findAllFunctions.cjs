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

    // Find all function definitions related to cache/field selection
    const funcRegex = /function\s+(show\w+|cache\w+|get\w+Field\w*)\s*\(/g;
    const matches = [];
    let match;

    while ((match = funcRegex.exec(code)) !== null) {
      matches.push({
        name: match[1],
        position: match.index
      });
    }

    console.log(`\nFound ${matches.length} relevant functions:\n`);
    matches.forEach(m => {
      console.log(`- ${m.name} (pos: ${m.position})`);
    });

    // Check specifically for field selector related functions
    console.log('\n\n🔍 Field Selector Functions:');
    const fieldSelectorFuncs = matches.filter(m => m.name.toLowerCase().includes('field'));
    fieldSelectorFuncs.forEach(m => {
      console.log(`\n✅ ${m.name}`);
      console.log(code.substring(m.position, m.position + 300));
    });

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

search();
