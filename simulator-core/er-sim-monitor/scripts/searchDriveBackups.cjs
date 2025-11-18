#!/usr/bin/env node

/**
 * SEARCH FOR BACKUP FOLDERS ON GOOGLE DRIVE
 * Find any folders with "lost" or "backup" in the name
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

console.log('\n🔍 SEARCHING FOR BACKUP FOLDERS ON GOOGLE DRIVE\n');
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

async function search() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    console.log('🔎 Searching for folders containing "lost", "backup", or "found"...\n');

    const searches = [
      "name contains 'lost' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      "name contains 'backup' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      "name contains 'found' and mimeType='application/vnd.google-apps.folder' and trashed=false"
    ];

    const allFolders = new Map();

    for (const query of searches) {
      const result = await drive.files.list({
        q: query,
        fields: 'files(id, name, createdTime, modifiedTime, webViewLink)',
        spaces: 'drive',
        pageSize: 20
      });

      if (result.data.files && result.data.files.length > 0) {
        result.data.files.forEach(folder => {
          allFolders.set(folder.id, folder);
        });
      }
    }

    if (allFolders.size === 0) {
      console.log('❌ No backup folders found on Google Drive!\n');
      console.log('This suggests backups may need to be created.\n');
      return;
    }

    console.log(`✅ Found ${allFolders.size} backup folder(s):\n`);

    let index = 1;
    for (const [id, folder] of allFolders) {
      console.log(`${index}. ${folder.name}`);
      console.log(`   ID: ${folder.id}`);
      console.log(`   Created: ${new Date(folder.createdTime).toLocaleString()}`);
      console.log(`   Modified: ${new Date(folder.modifiedTime).toLocaleString()}`);
      console.log(`   Link: ${folder.webViewLink}`);
      console.log('');
      index++;
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📋 To check contents of a specific folder:\n');
    console.log('   1. Click the link above');
    console.log('   2. Or update verifyDriveBackups.cjs with the correct folder name\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

search();
