#!/usr/bin/env node

/**
 * CHECK DEFAULTS CONTEXT
 * Find where the hardcoded defaults are and show surrounding code
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

async function check() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const code = codeFile.source;

    // Find selectedFields = [
    const searchStr = 'selectedFields = [';
    const index = code.indexOf(searchStr);

    if (index === -1) {
      console.log('❌ Could not find "selectedFields = ["\n');
      return;
    }

    // Show 500 characters before and after
    const before = code.substring(Math.max(0, index - 500), index);
    const after = code.substring(index, Math.min(code.length, index + 2000));

    console.log('Found at position:', index);
    console.log('\n═══ 500 chars BEFORE ═══\n');
    console.log(before);
    console.log('\n═══ AT POSITION + 2000 chars AFTER ═══\n');
    console.log(after);
    console.log('\n═══════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

check();
