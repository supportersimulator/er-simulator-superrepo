#!/usr/bin/env node

/**
 * FIX PRIORITY PATTERNS ERROR
 * Remove the pattern matching loop completely
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function fix() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Removing leftover pattern matching loop...\n');

    // Find and remove the entire pattern matching loop
    const loopStart = code.indexOf('for (var i = 0; i < priorityPatterns.length');

    if (loopStart === -1) {
      console.log('✅ No pattern loop found - code may already be fixed\n');
      return;
    }

    // Find the end of this loop (look for the closing brace after the nested loops)
    let braceCount = 0;
    let inLoop = false;
    let loopEnd = loopStart;

    for (let i = loopStart; i < code.length; i++) {
      if (code[i] === '{') {
        braceCount++;
        inLoop = true;
      } else if (code[i] === '}') {
        braceCount--;
        if (inLoop && braceCount === 0) {
          loopEnd = i + 1;
          break;
        }
      }
    }

    console.log('Found loop from position', loopStart, 'to', loopEnd);

    // Remove the entire loop - the selectedFields array is already populated above
    code = code.substring(0, loopStart) + '\n' + code.substring(loopEnd);

    console.log('✅ Removed pattern matching loop\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ FIXED priorityPatterns ERROR!\n');
    console.log('Removed leftover pattern matching loop\n');
    console.log('Now using direct field name array\n');
    console.log('Try "Categories & Pathways" again!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
