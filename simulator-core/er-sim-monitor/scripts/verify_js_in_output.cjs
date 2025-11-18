#!/usr/bin/env node

/**
 * VERIFY: Check if Discovery JavaScript is actually in the rendered HTML
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function verifyJSInOutput() {
  try {
    console.log('🔍 VERIFY: Discovery JavaScript in HTML Output\n');
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

    console.log('📊 CHECKING buildBirdEyeViewUI_ OUTPUT STRUCTURE:\n');

    // Find buildBirdEyeViewUI_ function
    const funcStart = codeFile.source.indexOf('function buildBirdEyeViewUI_(');
    const funcEnd = codeFile.source.indexOf('\n}\n', funcStart) + 3;
    const funcCode = codeFile.source.substring(funcStart, funcEnd);

    // Check the return statement structure
    const returnIdx = funcCode.indexOf('return ');
    console.log('1. Function starts with return statement:', returnIdx < 200);

    // Check if discoveryTabHTML is in the output
    const hasDiscoveryTabHTML = funcCode.includes("' + discoveryTabHTML +");
    console.log('2. discoveryTabHTML is concatenated:', hasDiscoveryTabHTML);

    // Check if buildAIDiscoveryTabHTML_() is called
    const hasFunctionCall = funcCode.includes('buildAIDiscoveryTabHTML_()');
    console.log('3. buildAIDiscoveryTabHTML_() is called:', hasFunctionCall);

    // Check WHERE discoveryTabHTML is placed (before or after <script>?)
    const discoveryTabHTMLIdx = funcCode.indexOf("' + discoveryTabHTML +");
    const scriptTagIdx = funcCode.indexOf("'  <script>' +");
    
    if (discoveryTabHTMLIdx !== -1 && scriptTagIdx !== -1) {
      const discoveryBeforeScript = discoveryTabHTMLIdx < scriptTagIdx;
      console.log('4. discoveryTabHTML comes BEFORE <script>:', discoveryBeforeScript);
      
      if (!discoveryBeforeScript) {
        console.log('\n⚠️  WARNING: discoveryTabHTML comes AFTER <script> tag!');
        console.log('   This means the dropdown/button HTML is rendered AFTER JavaScript runs\n');
      }
    }

    // Extract the order of elements
    console.log('\n📄 HTML OUTPUT ORDER:\n');
    
    const elements = [
      { name: 'categoriesTabHTML', idx: funcCode.indexOf("' + categoriesTabHTML +") },
      { name: 'pathwaysTabHTML', idx: funcCode.indexOf("' + pathwaysTabHTML +") },
      { name: 'discoveryTabHTML', idx: funcCode.indexOf("' + discoveryTabHTML +") },
      { name: '<script> tag', idx: funcCode.indexOf("'  <script>' +") },
      { name: 'handleLogicTypeChange()', idx: funcCode.indexOf("function handleLogicTypeChange") },
      { name: 'DOMContentLoaded', idx: funcCode.indexOf("'DOMContentLoaded'") },
      { name: '</script> tag', idx: funcCode.indexOf("'  </script>' +") }
    ];

    elements
      .filter(e => e.idx !== -1)
      .sort((a, b) => a.idx - b.idx)
      .forEach((e, idx) => {
        console.log(`   ${idx + 1}. ${e.name}`);
      });

    console.log('\n💡 EXPECTED ORDER FOR WORKING SYSTEM:\n');
    console.log('   1. categoriesTabHTML (HTML content)');
    console.log('   2. pathwaysTabHTML (HTML content)');
    console.log('   3. discoveryTabHTML (HTML content with dropdown & button)');
    console.log('   4. <script> tag');
    console.log('   5. handleLogicTypeChange() function definition');
    console.log('   6. DOMContentLoaded listener (attaches events)');
    console.log('   7. </script> tag\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

verifyJSInOutput();
