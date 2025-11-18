#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkDropdownHandler() {
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

    console.log('🔍 Checking Dropdown onChange Handler\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Find the logic type selector
    const selectorStart = codeFile.source.indexOf('id="logic-type-selector"');
    if (selectorStart !== -1) {
      const excerpt = codeFile.source.substring(selectorStart - 100, selectorStart + 400);
      console.log('📄 LOGIC TYPE DROPDOWN:\n');
      console.log(excerpt);
      console.log('\n...\n');
    }

    // Check if handleLogicTypeChange exists
    const hasHandler = codeFile.source.includes('function handleLogicTypeChange() {');
    console.log('📋 JavaScript Handler:\n');
    console.log('   ' + (hasHandler ? '✅' : '❌') + ' handleLogicTypeChange() function exists\n');

    if (hasHandler) {
      const handlerStart = codeFile.source.indexOf('function handleLogicTypeChange() {');
      const excerpt = codeFile.source.substring(handlerStart, handlerStart + 800);
      console.log('📄 HANDLER FUNCTION:\n');
      console.log(excerpt);
      console.log('\n...\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDropdownHandler();
