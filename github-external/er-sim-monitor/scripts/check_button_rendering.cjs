#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkButtonRendering() {
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

    console.log('🔍 Checking "Discover Pathways" Button Rendering\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Check if buildAIDiscoveryTabHTML_ is being called
    const callsFunction = codeFile.source.includes('const discoveryTabHTML = buildAIDiscoveryTabHTML_();');
    console.log('📋 Function Call Check:\n');
    console.log('   ' + (callsFunction ? '✅' : '❌') + ' buildBirdEyeViewUI_() calls buildAIDiscoveryTabHTML_()\n');

    // Check if the HTML contains the button
    const hasBtnInFunction = codeFile.source.includes('id="discover-btn"');
    console.log('📋 Button HTML in Code.gs:\n');
    console.log('   ' + (hasBtnInFunction ? '✅' : '❌') + ' id="discover-btn" exists in code\n');

    // Find the button definition
    const btnStart = codeFile.source.indexOf('id="discover-btn"');
    if (btnStart !== -1) {
      const excerpt = codeFile.source.substring(btnStart - 200, btnStart + 400);
      console.log('📄 BUTTON HTML (from buildAIDiscoveryTabHTML_):\n');
      console.log(excerpt);
      console.log('\n...\n');
    }

    // Check if discoveryTabHTML is added to the main HTML output
    const addedToOutput = codeFile.source.includes("' + discoveryTabHTML +");
    console.log('📋 HTML Output Integration:\n');
    console.log('   ' + (addedToOutput ? '✅' : '❌') + ' discoveryTabHTML added to main HTML output\n');

    // Find where it's added
    const outputStart = codeFile.source.indexOf("' + discoveryTabHTML +");
    if (outputStart !== -1) {
      const excerpt = codeFile.source.substring(outputStart - 300, outputStart + 300);
      console.log('📄 HTML OUTPUT CONCATENATION:\n');
      console.log(excerpt);
      console.log('\n...\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('💡 NEXT DEBUG STEP:\n');
    console.log('If button exists in code but is not selectable in UI:\n');
    console.log('1. Check browser DevTools (F12) → Elements tab');
    console.log('2. Search for id="discover-btn" in the DOM');
    console.log('3. Check if element has "disabled" attribute');
    console.log('4. Check CSS: button might have pointer-events: none');
    console.log('5. Check z-index: button might be behind another element\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkButtonRendering();
