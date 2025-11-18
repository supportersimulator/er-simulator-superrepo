#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function dumpDiscoveryHTMLFunction() {
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

    // Find and extract COMPLETE buildAIDiscoveryTabHTML_ function
    const funcStart = codeFile.source.indexOf('function buildAIDiscoveryTabHTML_() {');
    const funcEnd = codeFile.source.indexOf('\n}\n', funcStart) + 3;
    const funcCode = codeFile.source.substring(funcStart, funcEnd);

    console.log('📄 COMPLETE buildAIDiscoveryTabHTML_() FROM CODE.GS:\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(funcCode);
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Search for onchange in this function
    if (funcCode.includes('onchange')) {
      console.log('❌ FOUND "onchange" in function!\n');
      const onchangeIdx = funcCode.indexOf('onchange');
      const context = funcCode.substring(onchangeIdx - 100, onchangeIdx + 100);
      console.log('Context:', context, '\n');
    } else {
      console.log('✅ NO "onchange" found in function\n');
    }

    // Search for onclick in this function
    if (funcCode.includes('onclick')) {
      console.log('❌ FOUND "onclick" in function!\n');
      const onclickIdx = funcCode.indexOf('onclick');
      const context = funcCode.substring(onclickIdx - 100, onclickIdx + 100);
      console.log('Context:', context, '\n');
    } else {
      console.log('✅ NO "onclick" found in function\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

dumpDiscoveryHTMLFunction();
