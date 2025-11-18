#!/usr/bin/env node

/**
 * CHECK PRODUCTION MENU NOW
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔍 CHECKING PRODUCTION MENU\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

async function check() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const code = codeFile.source;

    // Extract onOpen function
    const onOpenMatch = code.match(/function onOpen\(\) \{[\s\S]*?^\}/m);

    if (!onOpenMatch) {
      console.log('❌ NO onOpen FUNCTION FOUND!\n');
      console.log('Searching for any menu creation...\n');

      const menuMatches = code.match(/createMenu\(['"](.*?)['"]\)/g);
      if (menuMatches) {
        console.log('Found menu creation calls:\n');
        menuMatches.forEach(m => console.log(`   ${m}`));
      }
      return;
    }

    console.log('✅ onOpen function found!\n');
    console.log(onOpenMatch[0].substring(0, 500));
    console.log('\n...\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

check();
