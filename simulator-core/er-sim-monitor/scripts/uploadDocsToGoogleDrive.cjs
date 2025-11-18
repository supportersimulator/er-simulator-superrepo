#!/usr/bin/env node

/**
 * UPLOAD DOCUMENTATION TO GOOGLE DRIVE
 *
 * Uploads all cache system documentation to Google Drive backup folder
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const BACKUP_FOLDER_NAME = 'er-sim-monitor-docs';

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

async function findOrCreateFolder(drive, folderName) {
  // Search for existing folder
  const response = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (response.data.files.length > 0) {
    return response.data.files[0].id;
  }

  // Create folder if it doesn't exist
  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id'
  });

  return folder.data.id;
}

async function uploadFile(drive, filePath, folderId) {
  const fileName = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath, 'utf8');

  // Check if file already exists
  const response = await drive.files.list({
    q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  const media = {
    mimeType: 'text/markdown',
    body: fileContent
  };

  if (response.data.files.length > 0) {
    // Update existing file
    const fileId = response.data.files[0].id;
    await drive.files.update({
      fileId: fileId,
      media: media,
      fields: 'id, name, modifiedTime'
    });
    return { fileName, action: 'updated', fileId };
  } else {
    // Create new file
    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, modifiedTime'
    });
    return { fileName, action: 'created', fileId: file.data.id };
  }
}

async function uploadDocs() {
  console.log('\n📤 UPLOADING DOCUMENTATION TO GOOGLE DRIVE\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });

  try {
    // Find or create backup folder
    console.log('📁 Finding/creating backup folder...\n');
    const folderId = await findOrCreateFolder(drive, BACKUP_FOLDER_NAME);
    console.log(`✅ Using folder: ${BACKUP_FOLDER_NAME} (ID: ${folderId})\n`);

    // List of documentation files to upload
    const docsToUpload = [
      'docs/CACHE_SYSTEM_SUCCESS.md',
      'docs/SIMPLE_MODAL_DEPLOYED.md',
      'docs/CACHE_FIX_DEPLOYMENT_COMPLETE.md',
      'docs/CACHE_FIX_IMPLEMENTATION_PLAN.md',
      'docs/CACHE_FIX_RESUME_POINT.md'
    ];

    console.log('📤 Uploading documentation files:\n');

    const results = [];
    for (const docPath of docsToUpload) {
      const fullPath = path.join(__dirname, '..', docPath);

      if (!fs.existsSync(fullPath)) {
        console.log(`   ⚠️  ${path.basename(fullPath)} - File not found, skipping`);
        continue;
      }

      const result = await uploadFile(drive, fullPath, folderId);
      results.push(result);

      const statusIcon = result.action === 'created' ? '🆕' : '🔄';
      console.log(`   ${statusIcon} ${result.fileName} - ${result.action}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('✅ UPLOAD COMPLETE!\n');
    console.log(`   Total files processed: ${results.length}`);
    console.log(`   Created: ${results.filter(r => r.action === 'created').length}`);
    console.log(`   Updated: ${results.filter(r => r.action === 'updated').length}\n`);

    // Get shareable link
    const folder = await drive.files.get({
      fileId: folderId,
      fields: 'webViewLink'
    });

    console.log(`🔗 View documentation: ${folder.data.webViewLink}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) console.log(e.stack);
  }
}

uploadDocs().catch(console.error);
