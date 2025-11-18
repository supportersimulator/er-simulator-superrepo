#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function extractJSPattern() {
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

    console.log('🔍 Extracting Existing JavaScript Pattern from Code.gs\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Find the showCategories function to see the working pattern
    const showCategoriesStart = codeFile.source.indexOf("'    function showCategories() {' +");
    if (showCategoriesStart !== -1) {
      const excerpt = codeFile.source.substring(showCategoriesStart, showCategoriesStart + 800);
      console.log('✅ WORKING PATTERN (showCategories):\n');
      console.log(excerpt);
      console.log('\n...\n');
    }

    // Find where onclick handlers are defined in tab buttons
    const tabButtonStart = codeFile.source.indexOf('onclick="showCategories()"');
    if (tabButtonStart !== -1) {
      const excerpt = codeFile.source.substring(tabButtonStart - 200, tabButtonStart + 400);
      console.log('\n✅ TAB BUTTON ONCLICK PATTERN:\n');
      console.log(excerpt);
      console.log('\n...\n');
    }

    // Check how the existing code handles the onclick for the discovery button
    const discoveryButtonStart = codeFile.source.indexOf('id="discovery-tab-btn"');
    if (discoveryButtonStart !== -1) {
      const excerpt = codeFile.source.substring(discoveryButtonStart - 100, discoveryButtonStart + 600);
      console.log('\n🔍 DISCOVERY TAB BUTTON (as currently deployed):\n');
      console.log(excerpt);
      console.log('\n...\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

extractJSPattern();
