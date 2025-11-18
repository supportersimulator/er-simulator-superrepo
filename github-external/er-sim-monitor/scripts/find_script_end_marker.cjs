#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function findScriptEndMarker() {
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

    // Find buildBirdEyeViewUI_
    const funcStart = codeFile.source.indexOf('function buildBirdEyeViewUI_(');
    const funcEnd = codeFile.source.indexOf('\n}\n', funcStart);
    const funcCode = codeFile.source.substring(funcStart, funcEnd);

    // Find where viewPathwaysMaster ends
    const viewPathwaysIdx = funcCode.indexOf("function viewPathwaysMaster");
    if (viewPathwaysIdx !== -1) {
      const afterFunction = funcCode.substring(viewPathwaysIdx, viewPathwaysIdx + 1000);
      console.log('📄 Code after viewPathwaysMaster():\n');
      console.log(afterFunction);
      console.log('\n...\n');
    }

    // Find </script> location
    const scriptEndIdx = funcCode.indexOf("'  </script>' +");
    if (scriptEndIdx !== -1) {
      const beforeScriptEnd = funcCode.substring(scriptEndIdx - 300, scriptEndIdx + 50);
      console.log('📄 Code before </script>:\n');
      console.log(beforeScriptEnd);
      console.log('\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

findScriptEndMarker();
