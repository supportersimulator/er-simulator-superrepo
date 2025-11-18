#!/usr/bin/env node

/**
 * Fetch CURRENT Apps Script Code.gs
 * This gets whatever is currently deployed
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SCRIPT_ID = '1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6';
const OUTPUT_PATH = path.join(__dirname, 'Code_CURRENT_DEPLOYED.gs');

async function fetchCurrent() {
  console.log('🔐 Authenticating...');
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const script = google.script({version: 'v1', auth: oAuth2Client});

  console.log('📥 Fetching current Apps Script...');
  const project = await script.projects.getContent({scriptId: SCRIPT_ID});

  const codeFile = project.data.files.find(f => f.name === 'Code');

  if (!codeFile) {
    console.error('❌ No Code.gs file found');
    process.exit(1);
  }

  fs.writeFileSync(OUTPUT_PATH, codeFile.source);

  console.log(`✅ Saved to: ${OUTPUT_PATH}`);
  console.log(`📊 Size: ${codeFile.source.length} characters`);
  console.log(`📊 Lines: ${codeFile.source.split('\n').length}`);

  // Check if it has Case_ID
  if (codeFile.source.includes('Case_ID')) {
    console.log('⚠️  Contains Case_ID references');
  } else {
    console.log('✅ No Case_ID references (good!)');
  }
}

fetchCurrent().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
