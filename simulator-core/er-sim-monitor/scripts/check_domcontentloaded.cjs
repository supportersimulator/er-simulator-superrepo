#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function checkDOMContentLoaded() {
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

    console.log('🔍 CHECKING IF DOMContentLoaded WAS ADDED:\n');

    if (codeFile.source.includes('DOMContentLoaded')) {
      console.log('✅ DOMContentLoaded found in Code.gs\n');
      
      const domIdx = codeFile.source.indexOf('DOMContentLoaded');
      const context = codeFile.source.substring(domIdx - 200, domIdx + 800);
      console.log('📄 CONTEXT:\n');
      console.log(context);
      console.log('\n...\n');
    } else {
      console.log('❌ DOMContentLoaded NOT FOUND in Code.gs!\n');
      console.log('🐛 The previous deployment might have failed\n');
    }

    // Check the actual end of the script section
    const scriptEndIdx = codeFile.source.indexOf("'  </script>' +\n'</body>");
    if (scriptEndIdx !== -1) {
      const beforeEnd = codeFile.source.substring(scriptEndIdx - 500, scriptEndIdx + 50);
      console.log('📄 CODE BEFORE </script>:\n');
      console.log(beforeEnd);
      console.log('\n...\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDOMContentLoaded();
