#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkButtonEnableLogic() {
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

    console.log('🔍 CHECKING ACTUAL DEPLOYED BUTTON LOGIC\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const content = await script.projects.getContent({ scriptId });
    const codeFile = content.data.files.find(f => f.name === 'Code');

    // Extract the handleLogicTypeChange function as deployed
    const funcStart = codeFile.source.indexOf("'    function handleLogicTypeChange() {' +");
    if (funcStart !== -1) {
      const funcSection = codeFile.source.substring(funcStart, funcStart + 1000);
      console.log('📄 ACTUAL DEPLOYED handleLogicTypeChange():\n');
      console.log(funcSection);
      console.log('\n...\n');
    } else {
      console.log('❌ handleLogicTypeChange() NOT FOUND in deployed code!\n');
    }

    // Check the button HTML
    const btnStart = codeFile.source.indexOf('id="discover-btn"');
    if (btnStart !== -1) {
      const btnSection = codeFile.source.substring(btnStart - 100, btnStart + 300);
      console.log('📄 ACTUAL DEPLOYED BUTTON HTML:\n');
      console.log(btnSection);
      console.log('\n...\n');
    }

    // Check the dropdown HTML
    const dropdownStart = codeFile.source.indexOf('id="logic-type-selector"');
    if (dropdownStart !== -1) {
      const dropdownSection = codeFile.source.substring(dropdownStart - 100, dropdownStart + 300);
      console.log('📄 ACTUAL DEPLOYED DROPDOWN HTML:\n');
      console.log(dropdownSection);
      console.log('\n...\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkButtonEnableLogic();
