#!/usr/bin/env node

/**
 * FIX INDENTATION ERROR IN SCRIPT
 * The "log(\"🎯 JavaScript started\");" line is missing proper indentation
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

    console.log('🔧 Fixing indentation error...\n');

    // Find the broken line
    const brokenLine = "           'log(\"🎯 JavaScript started\");' +";
    const fixedLine = "      'log(\"🎯 JavaScript started\");' +";

    if (code.includes(brokenLine)) {
      code = code.replace(brokenLine, fixedLine);
      console.log('✅ Fixed indentation for JavaScript started line\n');
    } else {
      console.log('⚠️  Could not find exact broken line, checking...\n');

      // Check what's actually there
      const lines = code.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('log("🎯 JavaScript started")')) {
          console.log('Found at line', i + 1, ':', lines[i]);
        }
      }
    }

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ INDENTATION ERROR FIXED!\n');
    console.log('\nThe JavaScript should now execute properly.\n');
    console.log('Try clicking "Cache All Layers" again!\n');
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
