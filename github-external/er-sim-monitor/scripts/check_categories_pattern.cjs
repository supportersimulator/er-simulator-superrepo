#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkCategoriesPattern() {
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

    console.log('🔍 Checking buildCategoriesTabHTML_ Return Pattern\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const funcStart = codeFile.source.indexOf('function buildCategoriesTabHTML_(analysis) {');
    if (funcStart !== -1) {
      // Find the return statement
      const returnStart = codeFile.source.indexOf('return', funcStart);
      const excerpt = codeFile.source.substring(returnStart, returnStart + 1000);
      
      console.log('📄 RETURN STATEMENT PATTERN:\n');
      console.log(excerpt);
      console.log('\n...\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkCategoriesPattern();
