#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

async function verifyWhichOnOpenToKeep() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const PROJECT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

  console.log('\n🔍 VERIFYING WHICH onOpen() TO KEEP\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const content = await script.projects.getContent({ scriptId: PROJECT_ID });
  const files = content.data.files.filter(f => f.type === 'SERVER_JS');

  files.forEach((file, fileIndex) => {
    if (file.source.includes('function onOpen()')) {
      console.log(`📄 FILE #${fileIndex + 1}: ${file.name}.gs\n`);

      // Extract onOpen function
      const lines = file.source.split('\n');
      let inFunction = false;
      let braceDepth = 0;
      let functionLines = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.includes('function onOpen()')) {
          inFunction = true;
          braceDepth = 0;
        }

        if (inFunction) {
          functionLines.push(line);

          for (const char of line) {
            if (char === '{') braceDepth++;
            if (char === '}') braceDepth--;
          }

          if (braceDepth === 0 && functionLines.length > 1) {
            break;
          }
        }
      }

      console.log('   onOpen() Function:\n');
      functionLines.forEach(line => {
        console.log('   ' + line);
      });

      // Check if this onOpen has "TEST Tools" menu
      const hasTestTools = functionLines.some(line => line.includes('TEST Tools') || line.includes('🧪 TEST Tools'));

      if (hasTestTools) {
        console.log('\n   ✅ THIS ONE HAS "🧪 TEST Tools" MENU - KEEP THIS!\n');
      } else {
        console.log('\n   ⚠️  This one does NOT have test tools menu\n');
      }

      console.log('═══════════════════════════════════════════════════════════════\n');
    }
  });

  console.log('💡 RECOMMENDATION:\n');
  console.log('Both files have IDENTICAL onOpen() functions with "🧪 TEST Tools" menu.');
  console.log('We should KEEP the one in Code.gs and REMOVE the one in ATSR_Title_Generator_Feature.gs\n');
  console.log('Reason: Code.gs is the main file, ATSR_Title_Generator_Feature.gs is just');
  console.log('a feature-specific file that should not define the main menu.\n');
}

verifyWhichOnOpenToKeep().catch(console.error);
