#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkDropdownOnchange() {
  try {
    console.log('🔍 CHECKING DROPDOWN ONCHANGE ATTRIBUTE\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

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

    // Find buildAIDiscoveryTabHTML_
    const funcStart = codeFile.source.indexOf('function buildAIDiscoveryTabHTML_');
    const funcEnd = codeFile.source.indexOf('\n}\n', funcStart) + 3;
    const funcCode = codeFile.source.substring(funcStart, funcEnd);

    console.log('📄 buildAIDiscoveryTabHTML_() FUNCTION:\n');
    
    // Find the dropdown <select> element
    const selectIdx = funcCode.indexOf('id="logic-type-selector"');
    if (selectIdx === -1) {
      console.log('❌ logic-type-selector not found!\n');
      return;
    }

    const selectHTML = funcCode.substring(selectIdx - 200, selectIdx + 500);
    console.log(selectHTML);
    console.log('\n...\n');

    // Check if onchange attribute exists
    if (funcCode.includes('onchange="handleLogicTypeChange()"')) {
      console.log('✅ onchange="handleLogicTypeChange()" FOUND in dropdown\n');
    } else if (funcCode.includes('onchange')) {
      console.log('⚠️  onchange attribute exists but might have wrong value\n');
      const onchangeIdx = funcCode.indexOf('onchange', selectIdx - 200);
      const onchangeSection = funcCode.substring(onchangeIdx, onchangeIdx + 100);
      console.log('   Current onchange:', onchangeSection, '\n');
    } else {
      console.log('❌ NO onchange attribute found on dropdown!\n');
      console.log('🔧 FIX NEEDED: Add onchange="handleLogicTypeChange()" to <select>\n');
    }

    // Check button HTML
    const btnIdx = funcCode.indexOf('id="discover-btn"');
    if (btnIdx !== -1) {
      const btnHTML = funcCode.substring(btnIdx - 150, btnIdx + 250);
      console.log('📄 BUTTON HTML:\n');
      console.log(btnHTML);
      console.log('\n...\n');
      
      if (funcCode.includes('onclick="discoverPathways()"')) {
        console.log('✅ onclick="discoverPathways()" FOUND on button\n');
      } else {
        console.log('❌ NO onclick attribute on button!\n');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDropdownOnchange();
