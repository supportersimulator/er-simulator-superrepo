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

async function find() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const code = content.data.files.find(f => f.name === 'Code').source;

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('CACHE ALL LAYERS FUNCTION');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Find cacheAllLayers function
    let idx = code.indexOf('function cacheAllLayers');
    if (idx !== -1) {
      const endIdx = code.indexOf('\nfunction ', idx + 50);
      const func = code.substring(idx, endIdx > idx ? endIdx : idx + 2500);
      console.log(func.substring(0, 2000));
      console.log('\n...\n');
    } else {
      console.log('❌ cacheAllLayers not found\n');
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('LOOKING FOR performHolisticAnalysis_()');
    console.log('═══════════════════════════════════════════════════════════════\n');

    idx = code.indexOf('function performHolisticAnalysis_');
    if (idx !== -1) {
      const endIdx = code.indexOf('\nfunction ', idx + 50);
      const func = code.substring(idx, endIdx > idx ? endIdx : idx + 3000);
      console.log(func.substring(0, 2500));
      console.log('\n...\n');
    } else {
      console.log('❌ performHolisticAnalysis_ not found\n');
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

find();
