#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '../config/token.json');
const CREDS_PATH = path.join(__dirname, '../config/credentials.json');

async function uploadBackupToDrive() {
  try {
    console.log('\n📤 UPLOADING ECG-TO-SVG CONVERTER BACKUP TO GOOGLE DRIVE\n');
    console.log('='.repeat(80) + '\n');

    // Load credentials
    const credentials = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
    const { client_id, client_secret } = credentials.installed || credentials.web;
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
    oauth2Client.setCredentials(token);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 1. Check if "ER Simulator Backups" folder exists, create if not
    console.log('🔍 Checking for "ER Simulator Backups" folder...');

    const folderQuery = await drive.files.list({
      q: "name='ER Simulator Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    let folderId;
    if (folderQuery.data.files.length > 0) {
      folderId = folderQuery.data.files[0].id;
      console.log(`✅ Found existing folder (ID: ${folderId})`);
    } else {
      console.log('📁 Creating "ER Simulator Backups" folder...');
      const folderMetadata = {
        name: 'ER Simulator Backups',
        mimeType: 'application/vnd.google-apps.folder'
      };
      const folder = await drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });
      folderId = folder.data.id;
      console.log(`✅ Created folder (ID: ${folderId})`);
    }

    // 2. Check if "Tools" subfolder exists, create if not
    console.log('\n🔍 Checking for "Tools" subfolder...');

    const subfolderQuery = await drive.files.list({
      q: `name='Tools' and '${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    let subfolderId;
    if (subfolderQuery.data.files.length > 0) {
      subfolderId = subfolderQuery.data.files[0].id;
      console.log(`✅ Found existing subfolder (ID: ${subfolderId})`);
    } else {
      console.log('📁 Creating "Tools" subfolder...');
      const subfolderMetadata = {
        name: 'Tools',
        mimeType: 'application/vnd.google-apps.folder',
        parents: [folderId]
      };
      const subfolder = await drive.files.create({
        resource: subfolderMetadata,
        fields: 'id'
      });
      subfolderId = subfolder.data.id;
      console.log(`✅ Created subfolder (ID: ${subfolderId})`);
    }

    // 3. Upload the backup file
    const backupPath = path.join(__dirname, '../backups/tools/ecg-to-svg-converter/ecg-to-svg-converter_backup_2025-11-03.html');
    const fileName = 'ecg-to-svg-converter_backup_2025-11-03.html';

    console.log(`\n📤 Uploading ${fileName}...`);
    console.log(`   Source: ${backupPath}`);

    const fileMetadata = {
      name: fileName,
      parents: [subfolderId]
    };

    const media = {
      mimeType: 'text/html',
      body: fs.createReadStream(backupPath)
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, size, webViewLink'
    });

    console.log('\n✅ BACKUP UPLOADED SUCCESSFULLY!\n');
    console.log(`   File ID: ${file.data.id}`);
    console.log(`   File Name: ${file.data.name}`);
    console.log(`   File Size: ${(file.data.size / 1024).toFixed(1)} KB`);
    console.log(`   View Link: ${file.data.webViewLink}`);

    console.log('\n📂 Google Drive Structure:');
    console.log('   My Drive/');
    console.log('   └── ER Simulator Backups/');
    console.log('       └── Tools/');
    console.log(`           └── ${fileName}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ BACKUP COMPLETE - ECG-to-SVG converter safely stored on Google Drive');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR uploading backup to Google Drive:');
    console.error(error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

uploadBackupToDrive();
