#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_SPREADSHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';

console.log('\n🔍 FINDING SCRIPT BOUND TO PRODUCTION SPREADSHEET\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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
    const drive = google.drive({ version: 'v3', auth });

    console.log(`🎯 Production Spreadsheet: ${PRODUCTION_SPREADSHEET_ID}\n`);

    // Find bound scripts
    const response = await drive.files.list({
      q: `'${PRODUCTION_SPREADSHEET_ID}' in parents and mimeType='application/vnd.google-apps.script'`,
      fields: 'files(id, name, createdTime, modifiedTime)',
      pageSize: 10
    });

    const scripts = response.data.files || [];

    console.log(`Found ${scripts.length} bound script(s):\n`);

    if (scripts.length === 0) {
      console.log('❌ NO BOUND SCRIPTS FOUND!\n');
      console.log('   The production spreadsheet has no Apps Script attached.\n');
      console.log('   This is why the menu doesn\'t appear.\n\n');
      console.log('   SOLUTION:\n');
      console.log('   1. Open production spreadsheet\n');
      console.log('   2. Extensions → Apps Script\n');
      console.log('   3. This will create a new container-bound script\n');
      console.log('   4. Then I can deploy our code to it\n');
    } else {
      scripts.forEach((script, index) => {
        console.log(`${index + 1}. ${script.name}`);
        console.log(`   ID: ${script.id}`);
        console.log(`   Modified: ${new Date(script.modifiedTime).toLocaleString()}\n`);
      });
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

find();
