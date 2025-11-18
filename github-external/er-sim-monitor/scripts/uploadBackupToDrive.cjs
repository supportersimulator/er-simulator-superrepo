#!/usr/bin/env node

/**
 * Upload backup files to Google Drive using Drive API
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = '/Users/aarontjomsland/er-sim-monitor/backups/lost-and-found-20251105-203821';

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

async function uploadFile(drive, fileName, filePath, folderId) {
  const fileContent = fs.readFileSync(filePath, 'utf8');

  const fileMetadata = {
    name: fileName,
    parents: [folderId]
  };

  const media = {
    mimeType: 'text/plain',
    body: fileContent
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, size'
  });

  return file.data;
}

async function upload() {
  console.log('\n📤 UPLOADING BACKUP TO GOOGLE DRIVE\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });

  try {
    // Search for existing "Lost and Found" folder
    console.log('🔍 Searching for "Lost and Found" folder...\n');

    const searchResponse = await drive.files.list({
      q: "name='Lost and Found' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    let folderId;

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      folderId = searchResponse.data.files[0].id;
      console.log(`✅ Found existing "Lost and Found" folder: ${folderId}\n`);
    } else {
      console.log('❌ "Lost and Found" folder not found in Drive.\n');
      console.log('💡 Creating it now...\n');

      const folderMetadata = {
        name: 'Lost and Found',
        mimeType: 'application/vnd.google-apps.folder'
      };

      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id'
      });

      folderId = folder.data.id;
      console.log(`✅ Created "Lost and Found" folder: ${folderId}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📤 Uploading files...\n');

    // Get all files from backup directory
    const files = fs.readdirSync(BACKUP_DIR);
    const uploadedFiles = [];

    for (const file of files) {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);

      if (stats.isFile()) {
        console.log(`   Uploading ${file}...`);

        try {
          const result = await uploadFile(drive, file, filePath, folderId);
          const sizeKB = Math.round(result.size / 1024);
          console.log(`   ✅ ${file} (${sizeKB} KB)\n`);
          uploadedFiles.push({ name: file, size: sizeKB });
        } catch (err) {
          console.log(`   ❌ Failed: ${err.message}\n`);
        }
      }
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`🎉 UPLOAD COMPLETE!\n`);
    console.log(`📂 Folder: Lost and Found`);
    console.log(`🆔 Folder ID: ${folderId}\n`);
    console.log(`✅ Uploaded ${uploadedFiles.length} files:\n`);

    uploadedFiles.forEach((f, i) => {
      const star = f.name === 'ATSR_Title_Generator_Feature.gs' ? '🌟 ' : '   ';
      console.log(`${star}${i + 1}. ${f.name} (${f.size} KB)`);
    });

    console.log('\n🌟 Most important: ATSR_Title_Generator_Feature.gs (TEST Tools menu)\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

upload().catch(console.error);
