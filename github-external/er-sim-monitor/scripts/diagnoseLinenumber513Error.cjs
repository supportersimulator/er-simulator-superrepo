#!/usr/bin/env node

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

async function diagnose() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current production code...\\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const code = content.data.files.find(f => f.name === 'Code').source;
    const lines = code.split('\\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('CHECKING LINE 513 AND SURROUNDING CODE');
    console.log('═══════════════════════════════════════════════════════════════\\n');

    const startLine = Math.max(0, 510);
    const endLine = Math.min(lines.length - 1, 520);

    for (let i = startLine; i <= endLine; i++) {
      const lineNum = i + 1;
      const marker = lineNum === 513 ? '>>> ' : '    ';
      console.log(marker + lineNum + ': ' + lines[i]);
    }

    console.log('\\n═══════════════════════════════════════════════════════════════\\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

diagnose();
