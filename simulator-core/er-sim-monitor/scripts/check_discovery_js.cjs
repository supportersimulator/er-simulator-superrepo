#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkDiscoveryJS() {
  try {
    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');

    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const scriptId = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

    console.log('🔍 Checking for discovery JavaScript functions in Code.gs\n');

    const content = await script.projects.getContent({ scriptId });
    const codeFile = content.data.files.find(f => f.name === 'Code');

    const functionsToCheck = [
      'function handleLogicTypeChange()',
      'function discoverPathways()',
      'function handleDiscoveryResults(result)',
      'function handleDiscoveryError(error)',
      'function clearDiscoveryResults()',
      'function viewLogicTypeLibrary()',
      'function viewPathwaysMaster()'
    ];

    console.log('JavaScript Functions in Code.gs:\n');
    functionsToCheck.forEach(fn => {
      const exists = codeFile.source.includes(fn);
      console.log('  ' + (exists ? '✅' : '❌') + ' ' + fn);
    });

    console.log('\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDiscoveryJS();
