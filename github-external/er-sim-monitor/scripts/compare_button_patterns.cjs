#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function compareButtonPatterns() {
  try {
    console.log('🔍 COMPARING WORKING vs NON-WORKING BUTTON PATTERNS\n');
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

    console.log('1️⃣ CHECKING DISCOVERY TAB JAVASCRIPT (IN CODE.GS <BODY>):\n');
    
    const discoveryJS = codeFile.source.indexOf("'    function handleLogicTypeChange() {' +");
    if (discoveryJS !== -1) {
      console.log('   ✅ handleLogicTypeChange() found in Code.gs <body> <script>\n');
      const jsSection = codeFile.source.substring(discoveryJS, discoveryJS + 800);
      console.log(jsSection);
      console.log('\n...\n');
    } else {
      console.log('   ❌ handleLogicTypeChange() NOT FOUND in Code.gs!\n');
    }

    console.log('2️⃣ CHECKING DISCOVERY TAB HTML (buildAIDiscoveryTabHTML_):\n');
    
    const discoveryHTML = codeFile.source.indexOf('function buildAIDiscoveryTabHTML_');
    if (discoveryHTML !== -1) {
      const htmlEnd = codeFile.source.indexOf('\n}', discoveryHTML);
      const htmlFunc = codeFile.source.substring(discoveryHTML, htmlEnd + 2);
      
      // Check if it has the button
      if (htmlFunc.includes('id="discover-btn"')) {
        console.log('   ✅ Button with id="discover-btn" found\n');
      }
      
      // Check if button has onclick
      if (htmlFunc.includes('onclick="discoverPathways()"')) {
        console.log('   ✅ onclick="discoverPathways()" found\n');
      }
      
      // Check if button is disabled by default
      if (htmlFunc.includes('disabled')) {
        console.log('   ✅ Button has disabled attribute (should be enabled by dropdown)\n');
      }
      
      // Get button HTML
      const btnIdx = htmlFunc.indexOf('id="discover-btn"');
      const btnHTML = htmlFunc.substring(btnIdx - 100, btnIdx + 300);
      console.log('   Button HTML:\n');
      console.log(btnHTML);
      console.log('\n...\n');
    } else {
      console.log('   ❌ buildAIDiscoveryTabHTML_() NOT FOUND!\n');
    }

    console.log('3️⃣ CRITICAL CHECK: WHERE IS buildAIDiscoveryTabHTML_() DEFINED?\n');
    
    // Check if it's in Code.gs
    if (codeFile.source.includes('function buildAIDiscoveryTabHTML_')) {
      console.log('   ✅ buildAIDiscoveryTabHTML_() IS in Code.gs\n');
    } else {
      console.log('   ❌ buildAIDiscoveryTabHTML_() is NOT in Code.gs!\n');
      console.log('   🔍 Checking Phase2_Modal_Integration.gs...\n');
      
      const modalFile = content.data.files.find(f => f.name === 'Phase2_Modal_Integration');
      if (modalFile && modalFile.source.includes('function buildAIDiscoveryTabHTML_')) {
        console.log('   ⚠️  buildAIDiscoveryTabHTML_() is in separate file!\n');
        console.log('   🐛 BUG: Apps Script can\'t call functions from other files!\n');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

compareButtonPatterns();
