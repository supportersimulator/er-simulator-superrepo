#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

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

async function pull() {
  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
  const phase2 = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');

  // Show first 50 lines
  const lines = phase2.source.split('\n').slice(0, 50);
  console.log('\n📋 LIVE Phase 2 in TEST (first 50 lines):\n');
  lines.forEach((line, i) => {
    console.log(`${String(i + 1).padStart(3, ' ')}→${line}`);
  });
}

pull().catch(console.error);
