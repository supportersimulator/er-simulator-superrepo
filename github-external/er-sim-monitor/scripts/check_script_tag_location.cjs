#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkScriptTagLocation() {
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

    console.log('🔍 Looking for <script> tag structure in buildBirdEyeViewUI_\n');

    // Find where discoveryTabHTML is concatenated
    const htmlOutputIdx = codeFile.source.indexOf("' + discoveryTabHTML +");
    if (htmlOutputIdx !== -1) {
      const context = codeFile.source.substring(htmlOutputIdx - 500, htmlOutputIdx + 1000);
      console.log('📄 HTML OUTPUT STRUCTURE (where discoveryTabHTML is added):\n');
      console.log(context);
      console.log('\n...\n');
    }

    // Find the <script> tag location
    const scriptTagIdx = codeFile.source.indexOf("'  <script>' +");
    if (scriptTagIdx !== -1) {
      const context = codeFile.source.substring(scriptTagIdx, scriptTagIdx + 2000);
      console.log('📄 <script> TAG AND FOLLOWING CONTENT:\n');
      console.log(context);
      console.log('\n...\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkScriptTagLocation();
