#!/usr/bin/env node

/**
 * SAVE MONOLITHIC FILE TO LOST AND FOUND FOLDER IN GOOGLE DRIVE
 *
 * Uses Google Drive API to upload the complete monolithic file
 * to the "lost and found" folder for safekeeping.
 */

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

async function saveToDrive() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Step 1: Downloading current monolithic code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const code = content.data.files.find(f => f.name === 'Code').source;

    console.log('✅ Downloaded: ' + (code.length / 1024).toFixed(1) + 'KB\n');

    console.log('🔍 Step 2: Finding "lost and found" folder in Google Drive...\n');

    // Search for "lost and found" folder
    const folderSearch = await drive.files.list({
      q: "name contains 'lost and found' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (!folderSearch.data.files || folderSearch.data.files.length === 0) {
      console.log('❌ Could not find "lost and found" folder\n');
      console.log('Available folders:');

      const allFolders = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
        fields: 'files(id, name)',
        spaces: 'drive',
        pageSize: 20
      });

      allFolders.data.files.forEach(f => {
        console.log('  - ' + f.name + ' (ID: ' + f.id + ')');
      });

      process.exit(1);
    }

    const folder = folderSearch.data.files[0];
    console.log('✅ Found folder: "' + folder.name + '" (ID: ' + folder.id + ')\n');

    console.log('📤 Step 3: Uploading file to Google Drive...\n');

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = 'monolithic-complete-' + date + '-' + time + '.gs';

    const fileMetadata = {
      name: filename,
      parents: [folder.id],
      mimeType: 'text/plain'
    };

    const media = {
      mimeType: 'text/plain',
      body: code
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink'
    });

    console.log('✅ Uploaded successfully!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📂 FILE SAVED TO GOOGLE DRIVE');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Folder: "' + folder.name + '"');
    console.log('File: ' + filename);
    console.log('Size: ' + (code.length / 1024).toFixed(1) + 'KB');
    console.log('Lines: ' + code.split('\n').length);
    console.log('Functions: ' + (code.match(/^function [a-zA-Z_][a-zA-Z0-9_]*\(/gm) || []).length);
    console.log('Timestamp: ' + date + ' ' + time.replace(/-/g, ':'));

    if (file.data.webViewLink) {
      console.log('\n🔗 View in Drive: ' + file.data.webViewLink);
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

saveToDrive();
