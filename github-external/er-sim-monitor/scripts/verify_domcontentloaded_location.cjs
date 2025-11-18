#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function verifyDOMContentLoadedLocation() {
  try {
    console.log('🔍 VERIFYING DOMContentLoaded EVENT LISTENER LOCATION\n');
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

    // Find the DOMContentLoaded section
    const domIdx = codeFile.source.indexOf("document.addEventListener('DOMContentLoaded'");
    
    if (domIdx === -1) {
      console.log('❌ DOMContentLoaded listener NOT FOUND!\n');
      console.log('This is the problem - event listeners are never attached.\n');
      return;
    }

    console.log('✅ Found DOMContentLoaded listener\n');
    
    // Check the context
    const context = codeFile.source.substring(domIdx - 500, domIdx + 1000);
    console.log('📄 CONTEXT:\n');
    console.log(context);
    console.log('\n...\n');

    // Check if it's inside the <script> tag section
    const scriptTagIdx = codeFile.source.lastIndexOf("'  <script>' +", domIdx);
    const scriptEndIdx = codeFile.source.indexOf("'  </script>' +", domIdx);
    
    if (scriptTagIdx !== -1 && scriptEndIdx !== -1 && scriptTagIdx < domIdx && domIdx < scriptEndIdx) {
      console.log('✅ DOMContentLoaded is inside <script> tag\n');
    } else {
      console.log('❌ DOMContentLoaded is NOT inside <script> tag!\n');
      console.log('   This means it won\'t run in the browser\n');
    }

    // Check what's actually in the addEventListener callback
    const listenerStart = domIdx;
    const listenerEnd = codeFile.source.indexOf('});', domIdx) + 3;
    const listenerCode = codeFile.source.substring(listenerStart, listenerEnd);
    
    console.log('📄 COMPLETE DOMContentLoaded CODE:\n');
    console.log(listenerCode);
    console.log('\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

verifyDOMContentLoadedLocation();
