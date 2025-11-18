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

  // Find all occurrences of selectedFields = [
  let searchPos = 0;
  let count = 0;

  while ((searchPos = codeFile.source.indexOf('selectedFields = [', searchPos)) !== -1) {
    count++;
    console.log(`\n[${count}] Found at position: ${searchPos}`);
    console.log('Context:');
    console.log(codeFile.source.substring(searchPos - 150, searchPos + 400));
    console.log('\n═══════════════════════════════════════\n');
    searchPos += 1;
  }

  console.log(`\nTotal occurrences: ${count}`);

  if (count > 1) {
    console.log('\n⚠️ MULTIPLE selectedFields assignments found!');
    console.log('This is causing the 35 → 27 override issue.');
  }
}

check().catch(console.error);
