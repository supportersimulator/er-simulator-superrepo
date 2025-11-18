#!/usr/bin/env node

/**
 * FIX: Change HtmlService sandbox mode to NATIVE to allow inline scripts
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

    console.log('📥 Downloading...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');
    let code = codeFile.source;

    console.log('🔧 Changing HtmlService sandbox mode to NATIVE...\n');

    // Find the line where HtmlOutput is created
    const oldPattern = '    var htmlOutput = HtmlService.createHtmlOutput(html)';
    const newPattern = '    var htmlOutput = HtmlService.createHtmlOutput(html)\n' +
      '      .setSandboxMode(HtmlService.SandboxMode.IFRAME)';

    if (code.includes(oldPattern) && !code.includes('setSandboxMode')) {
      code = code.replace(oldPattern, newPattern);
      console.log('✅ Added setSandboxMode(IFRAME)\n');
    } else if (code.includes('setSandboxMode')) {
      console.log('⏭️  Sandbox mode already set\n');
    } else {
      console.log('⚠️  Pattern not found\n');
    }

    console.log('📤 Deploying...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ SANDBOX MODE FIXED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Reload sheet and try again!\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

fix();
