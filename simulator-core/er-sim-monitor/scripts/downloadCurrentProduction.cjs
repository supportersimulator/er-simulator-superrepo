#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

async function download() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const content = await script.projects.getContent({ scriptId: PRODUCTION_PROJECT_ID });
  const code = content.data.files.find(f => f.name === 'Code').source;

  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const outPath = path.join(__dirname, `../backups/current-production-${timestamp}.gs`);

  fs.writeFileSync(outPath, code, 'utf8');

  console.log(`✅ Downloaded current production to: ${outPath}`);
  console.log(`   Size: ${(code.length / 1024).toFixed(1)} KB`);
}

download().catch(console.error);
