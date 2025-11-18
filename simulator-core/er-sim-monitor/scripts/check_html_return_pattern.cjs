#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkHTMLPattern() {
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

    console.log('🔍 Checking HTML Return Pattern\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Find buildCategoriesTabHTML_ function
    const categoriesStart = codeFile.source.indexOf('function buildCategoriesTabHTML_(analysis) {');
    if (categoriesStart !== -1) {
      const excerpt = codeFile.source.substring(categoriesStart, categoriesStart + 500);
      console.log('✅ buildCategoriesTabHTML_ RETURN PATTERN:\n');
      console.log(excerpt);
      console.log('\n...\n');
    }

    // Check if buildAIDiscoveryTabHTML_ exists and how it returns
    const discoveryHTMLStart = codeFile.source.indexOf('function buildAIDiscoveryTabHTML_()');
    console.log('🔍 buildAIDiscoveryTabHTML_() in Code.gs: ' + (discoveryHTMLStart !== -1 ? '✅ FOUND' : '❌ NOT FOUND'));
    
    if (discoveryHTMLStart === -1) {
      console.log('\n⚠️  PROBLEM IDENTIFIED: buildAIDiscoveryTabHTML_() is NOT in Code.gs!');
      console.log('    It\'s only in Phase2_Modal_Integration.gs, which needs to be called.\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkHTMLPattern();
