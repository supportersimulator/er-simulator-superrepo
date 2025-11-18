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

  // Find the script section
  const scriptStart = codeFile.source.indexOf("'<script>' +");
  if (scriptStart === -1) {
    console.log('❌ No <script> tag found');
    return;
  }

  const snippet = codeFile.source.substring(scriptStart, scriptStart + 2000);
  console.log('📋 First part of <script> section:\n');
  console.log(snippet);
}

check();
