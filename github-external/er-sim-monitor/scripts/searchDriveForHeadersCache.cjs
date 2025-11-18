#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

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

async function searchDrive() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    console.log('🔍 Searching Google Drive for headers cache documentation...\\n');

    // Search for files related to "headers cache" or "cache system"
    const searchQueries = [
      'name contains "headers" and name contains "cache"',
      'name contains "field-selector"',
      'name contains "cache" and modifiedTime > "2025-11-06"'
    ];

    for (const query of searchQueries) {
      console.log('Searching: ' + query + '\\n');

      const response = await drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, createdTime, modifiedTime, webViewLink)',
        orderBy: 'modifiedTime desc',
        pageSize: 10
      });

      if (response.data.files && response.data.files.length > 0) {
        console.log('Found ' + response.data.files.length + ' files:\\n');

        response.data.files.forEach(file => {
          console.log('═══════════════════════════════════════════════════════════════');
          console.log('📄 ' + file.name);
          console.log('ID: ' + file.id);
          console.log('Type: ' + file.mimeType);
          console.log('Modified: ' + file.modifiedTime);
          if (file.webViewLink) {
            console.log('Link: ' + file.webViewLink);
          }
          console.log('');
        });
      } else {
        console.log('No files found for this query\\n');
      }

      console.log('');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

searchDrive();
