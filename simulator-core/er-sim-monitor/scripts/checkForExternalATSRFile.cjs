#!/usr/bin/env node

/**
 * CHECK IF THERE'S AN EXTERNAL ATSR FILE IN DRIVE
 * The Drive screenshot shows "Title_Optimizer_ATSR_Title_Generator_Feature.gs"
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

console.log('\n🔍 SEARCHING FOR EXTERNAL ATSR FILES IN DRIVE\n');
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

async function searchForATSRFiles() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    console.log('🔍 Searching for ATSR-related files...\n');

    // Search for files with ATSR in the name
    const response = await drive.files.list({
      q: "name contains 'ATSR' or name contains 'Title_Optimizer'",
      fields: 'files(id, name, mimeType, webViewLink, modifiedTime)',
      orderBy: 'modifiedTime desc'
    });

    const files = response.data.files;

    if (files.length === 0) {
      console.log('✅ No external ATSR files found\n');
      return;
    }

    console.log(`📁 FOUND ${files.length} ATSR-RELATED FILES:\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   Type: ${file.mimeType}`);
      console.log(`   Modified: ${new Date(file.modifiedTime).toLocaleString()}`);
      console.log(`   URL: ${file.webViewLink || 'N/A'}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('⚠️  POTENTIAL ISSUE:\n');
    console.log('If any of these are standalone Apps Script projects, they might be\n');
    console.log('overriding your container-bound script!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

searchForATSRFiles();
