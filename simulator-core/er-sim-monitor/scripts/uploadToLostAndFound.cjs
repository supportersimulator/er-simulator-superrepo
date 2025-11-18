#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

async function uploadDocument() {
  try {
    // Authorize
    const credentialsPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

    console.log('🔍 Finding Lost and Found folder...\n');

    // Find Lost and Found folder
    const folderSearch = await drive.files.list({
      q: "name='Lost and Found' and mimeType='application/vnd.google-apps.folder'",
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (folderSearch.data.files.length === 0) {
      console.error('❌ Lost and Found folder not found');
      process.exit(1);
    }

    const folderId = folderSearch.data.files[0].id;
    console.log('✅ Found Lost and Found folder:', folderId, '\n');

    // Read the markdown file
    const filePath = '/tmp/atlas_understanding.md';
    const content = fs.readFileSync(filePath, 'utf8');

    // Create timestamp for filename
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const documentTitle = `Atlas Project Understanding ${timestamp}`;

    console.log('📤 Uploading document...\n');

    // Create the document
    const fileMetadata = {
      name: documentTitle + '.txt',
      mimeType: 'text/plain',
      parents: [folderId]
    };

    const media = {
      mimeType: 'text/plain',
      body: content
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: { body: content },
      fields: 'id, name, webViewLink'
    });

    console.log('✅ Document uploaded successfully!\n');
    console.log('📄 File ID:', file.data.id);
    console.log('📄 File Name:', file.data.name);
    console.log('🔗 View Link:', file.data.webViewLink);
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ ATLAS PROJECT UNDERSTANDING SAVED TO GOOGLE DRIVE');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

uploadDocument();
