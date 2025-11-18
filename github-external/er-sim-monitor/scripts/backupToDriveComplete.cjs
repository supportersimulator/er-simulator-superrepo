#!/usr/bin/env node

/**
 * Backup Complete Ultimate Categorization Tool to Google Drive
 * Creates a backup with timestamp in Google Drive
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'config', 'credentials.json');

// Files to backup
const FILES_TO_BACKUP = [
  {
    localPath: path.join(__dirname, '..', 'apps-script-deployable', 'Ultimate_Categorization_Tool_Complete.gs'),
    name: 'Ultimate_Categorization_Tool_Complete.gs'
  },
  {
    localPath: path.join(__dirname, '..', 'TESTING_GUIDE_COMPLETE.md'),
    name: 'TESTING_GUIDE_COMPLETE.md'
  },
  {
    localPath: path.join(__dirname, '..', 'COMPLETE_TOOL_DEPLOYMENT_SUMMARY.md'),
    name: 'COMPLETE_TOOL_DEPLOYMENT_SUMMARY.md'
  },
  {
    localPath: path.join(__dirname, '..', 'scripts', 'deployUltimateToolComplete.cjs'),
    name: 'deployUltimateToolComplete.cjs'
  }
];

async function backupToDrive() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('💾 BACKING UP TO GOOGLE DRIVE');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Get timestamp
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // 2025-11-12T01-30-45
  const folderName = `Ultimate_Tool_Backup_${timestamp}`;

  console.log('📅 Timestamp: ' + timestamp);
  console.log('📁 Folder: ' + folderName);
  console.log('');

  // Load credentials
  console.log('🔑 Loading credentials...');
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  console.log('   ✅ Credentials loaded');
  console.log('');

  const drive = google.drive({ version: 'v3', auth: oAuth2Client });

  // Create backup folder
  console.log('📂 Creating backup folder...');
  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  const folder = await drive.files.create({
    resource: folderMetadata,
    fields: 'id, name, webViewLink'
  });
  const folderId = folder.data.id;
  console.log('   ✅ Created: ' + folder.data.name);
  console.log('   🔗 Link: ' + folder.data.webViewLink);
  console.log('');

  // Upload files
  console.log('📤 Uploading files...');
  for (const file of FILES_TO_BACKUP) {
    if (!fs.existsSync(file.localPath)) {
      console.log('   ⚠️  Skipped: ' + file.name + ' (not found)');
      continue;
    }

    const fileMetadata = {
      name: file.name,
      parents: [folderId]
    };
    const media = {
      body: fs.createReadStream(file.localPath)
    };

    const uploadedFile = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, size'
    });

    const sizeKB = (parseInt(uploadedFile.data.size) / 1024).toFixed(2);
    console.log('   ✅ Uploaded: ' + uploadedFile.data.name + ' (' + sizeKB + ' KB)');
  }
  console.log('');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 BACKUP COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📁 Google Drive Folder: ' + folder.data.name);
  console.log('🔗 View at: ' + folder.data.webViewLink);
  console.log('');
}

backupToDrive().catch(console.error);
