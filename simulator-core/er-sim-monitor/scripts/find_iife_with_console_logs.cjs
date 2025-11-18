#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function findIIFEWithConsoleLogs() {
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

    const content = await script.projects.getContent({ scriptId });
    const codeFile = content.data.files.find(f => f.name === 'Code');

    // Search for the IIFE that should attach Discovery events
    const searchText = 'Attaching Discovery tab event listeners';
    const idx = codeFile.source.indexOf(searchText);

    if (idx === -1) {
      console.log('❌ IIFE WITH CONSOLE LOGS NOT FOUND!\n');
      console.log('The code that should attach event listeners is missing.\n');
      console.log('This explains why the button doesn\'t work - events never attached!\n');
      return;
    }

    console.log('✅ Found IIFE with console logs\n');
    
    const context = codeFile.source.substring(idx - 300, idx + 1000);
    console.log('📄 CONTEXT:\n');
    console.log(context);
    console.log('\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

findIIFEWithConsoleLogs();
