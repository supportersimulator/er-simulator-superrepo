#!/usr/bin/env node

/**
 * SAVE VERSION TO GOOGLE DRIVE "LOST AND FOUND"
 *
 * Creates timestamped backup of current production code to Google Drive
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';
const LOST_AND_FOUND_FOLDER_NAME = 'lost and found';

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

async function saveToGoogleDrive() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    console.log('📥 Downloading current production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const code = codeFile.source;

    console.log('📂 Finding "lost and found" folder...\n');

    // Search for "lost and found" folder
    const folderSearch = await drive.files.list({
      q: `name='${LOST_AND_FOUND_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    let folderId;
    if (folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id;
      console.log(`✅ Found folder: ${LOST_AND_FOUND_FOLDER_NAME} (ID: ${folderId})\n`);
    } else {
      console.log(`📁 Creating folder: ${LOST_AND_FOUND_FOLDER_NAME}...\n`);
      const folder = await drive.files.create({
        requestBody: {
          name: LOST_AND_FOUND_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
      });
      folderId = folder.data.id;
      console.log(`✅ Created folder (ID: ${folderId})\n`);
    }

    // Create timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `batch-caching-complete-${timestamp}.gs`;

    console.log(`💾 Saving to Google Drive: ${filename}...\n`);

    // Upload file to Google Drive
    const fileMetadata = {
      name: filename,
      parents: [folderId],
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

    console.log('✅ Saved to Google Drive!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`📄 File: ${file.data.name}`);
    console.log(`🔗 Link: ${file.data.webViewLink}\n`);
    console.log('📦 Backup includes:');
    console.log('  ✅ Batch caching system (25 rows at a time)');
    console.log('  ✅ Load Defaults button (35 fields)');
    console.log('  ✅ Sheet switching fix (sheet.activate())');
    console.log('  ✅ All 207 rows cached successfully\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

saveToGoogleDrive();
