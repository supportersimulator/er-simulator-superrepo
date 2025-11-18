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

async function check() {
  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  const content = await script.projects.getContent({
    scriptId: PRODUCTION_PROJECT_ID
  });

  const codeFile = content.data.files.find(f => f.name === 'Code');

  // Check if there's a renderFields function in the client-side JavaScript
  const hasRenderFields = codeFile.source.includes('function renderFields(data)');
  console.log('Has renderFields in client JS:', hasRenderFields);

  // Find the section rendering logic
  const hasSection1 = codeFile.source.includes('SELECTED FIELDS');
  const hasSection2 = codeFile.source.includes('AI RECOMMENDED');
  const hasSection3 = codeFile.source.includes('ALL OTHER');

  console.log('Has Section 1 header:', hasSection1);
  console.log('Has Section 2 header:', hasSection2);
  console.log('Has Section 3 header:', hasSection3);

  // Check what's actually rendering
  const renderStart = codeFile.source.indexOf('log("📋 Rendering fields...");');
  if (renderStart !== -1) {
    const snippet = codeFile.source.substring(renderStart, renderStart + 1500);
    console.log('\n📋 Rendering code snippet:\n');
    console.log(snippet.substring(0, 800));
  }
}

check();
