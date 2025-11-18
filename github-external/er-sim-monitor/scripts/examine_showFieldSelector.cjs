#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function examineShowFieldSelector() {
  try {
    console.log('🔍 EXAMINING showFieldSelector PATTERN\n');
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

    // Find showFieldSelector
    const funcStart = codeFile.source.indexOf('function showFieldSelector(');
    const funcEnd = codeFile.source.indexOf('\n}\n', funcStart) + 3;
    const funcCode = codeFile.source.substring(funcStart, funcStart + 3000); // Get first 3000 chars

    console.log('📄 showFieldSelector FUNCTION (HTML BUILDING PATTERN):\n');
    console.log(funcCode);
    console.log('\n...\n');

    // Find where <script> is added in <head>
    const scriptInHead = funcCode.includes("html += '<script>'");
    const scriptLocation = scriptInHead ? 'IN <HEAD>' : 'IN <BODY>';
    
    console.log(`🔑 KEY FINDING:\n`);
    console.log(`   <script> tag location: ${scriptLocation}\n`);

    if (scriptInHead) {
      const scriptIdx = funcCode.indexOf("html += '<script>'");
      const scriptSection = funcCode.substring(scriptIdx, scriptIdx + 1000);
      console.log('📄 SCRIPT TAG IN <HEAD>:\n');
      console.log(scriptSection);
      console.log('\n...\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

examineShowFieldSelector();
