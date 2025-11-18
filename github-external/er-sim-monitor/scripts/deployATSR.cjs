#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const ATSR_SCRIPT_ID = '1Bkbm2MNA-YmXQEoMsIlC-VgEgHiQHO2EuMXR-yyxy9lYWl3eNcEHk_S-';
const CODE_PATH = path.join(__dirname, 'Code_ATSR_Trimmed.gs');

async function deploy() {
  console.log('🚀 Deploying ATSR Tool (Standalone)...\n');

  const code = fs.readFileSync(CODE_PATH, 'utf8');
  const lines = code.split('\n').length;

  console.log(`📊 Code size: ${lines} lines`);

  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const script = google.script({version: 'v1', auth: oAuth2Client});

  const project = await script.projects.getContent({scriptId: ATSR_SCRIPT_ID});

  const updatedFiles = project.data.files.map(file => {
    if (file.name === 'Code') {
      return { name: file.name, type: file.type, source: code };
    }
    return file;
  });

  await script.projects.updateContent({
    scriptId: ATSR_SCRIPT_ID,
    requestBody: { files: updatedFiles }
  });

  console.log('✅ Deployed successfully!');
  console.log(`   URL: https://script.google.com/d/${ATSR_SCRIPT_ID}/edit\n`);
}

deploy().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
