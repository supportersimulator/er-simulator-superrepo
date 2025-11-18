#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const PROD_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

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

async function getScriptId() {
  console.log('\n🔍 GETTING PRODUCTION SCRIPT ID\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  try {
    // Get spreadsheet metadata
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: PROD_SPREADSHEET_ID
    });
    
    console.log(`📊 Spreadsheet: ${spreadsheet.data.properties.title}\n`);
    
    // List files in Drive to find the bound script
    const response = await drive.files.list({
      q: `'${PROD_SPREADSHEET_ID}' in parents and mimeType='application/vnd.google-apps.script'`,
      fields: 'files(id, name, mimeType)',
      spaces: 'drive'
    });
    
    if (response.data.files.length > 0) {
      const scriptFile = response.data.files[0];
      console.log('✅ Found bound Apps Script project:\n');
      console.log(`   Name: ${scriptFile.name}`);
      console.log(`   Script ID: ${scriptFile.id}\n`);
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('💾 SAVE THIS SCRIPT ID:\n');
      console.log(`   const PROD_SCRIPT_ID = '${scriptFile.id}';\n`);
      console.log('═══════════════════════════════════════════════════════════════\n');
      
      return scriptFile.id;
    } else {
      console.log('⚠️  No bound script found for this spreadsheet\n');
      console.log('The spreadsheet might not have an Apps Script project attached.\n');
      return null;
    }

  } catch (e) {
    console.log('\n❌ Failed: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
    return null;
  }
}

getScriptId().catch(console.error);
