#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SCRIPT_ID = '1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6';
const CODE_PATH = path.join(__dirname, 'Code_ULTIMATE_ATSR.gs');

async function deploy() {
  console.log('🚀 Deploying Ultimate ATSR (disease mentions removed)...');

  const code = fs.readFileSync(CODE_PATH, 'utf8');

  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const script = google.script({version: 'v1', auth: oAuth2Client});

  const project = await script.projects.getContent({scriptId: SCRIPT_ID});

  const updatedFiles = project.data.files.map(file => {
    if (file.name === 'Code') {
      return { name: file.name, type: file.type, source: code };
    }
    return file;
  });

  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: updatedFiles }
  });

  console.log('✅ Deployed! Memory anchors now focus purely on personality/appearance.');
  console.log('');
  console.log('Fixed examples:');
  console.log('   ✅ "Very sweaty face, pale complexion, looks terrified"');
  console.log('   ✅ "Wearing AC/DC \'Thunderstruck\' concert t-shirt, vintage 1990"');
  console.log('   ✅ "Wearing faded grey \'World\'s Best Grandpa\' shirt with coffee stain"');
  console.log('');
  console.log('NO disease mentions - pure personality and observational details!');
}

deploy().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
