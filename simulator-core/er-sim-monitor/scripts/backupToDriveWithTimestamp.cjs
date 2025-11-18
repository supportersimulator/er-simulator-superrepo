/**
 * Backup Apps Script Code to Google Drive with Timestamp
 * 
 * Creates a JSON backup file in the existing backup folder
 * with today's date and time
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('📦 Creating Google Drive Backup with Timestamp\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const drive = google.drive({ version: 'v3', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  console.log('📥 Downloading current Apps Script project...\n');

  const project = await script.projects.getContent({ scriptId });

  // Create timestamp for filename
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const timestamp = `${month}-${day}-${year}_${hours}-${minutes}-${seconds}`;
  const filename = `Code_Backup_${timestamp}.json`;

  console.log('📝 Backup filename: ' + filename + '\n');

  // Search for existing backup folder
  console.log('🔍 Finding existing backup folder...\n');

  const folderSearch = await drive.files.list({
    q: "name='Apps Script Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  let folderId;
  if (folderSearch.data.files && folderSearch.data.files.length > 0) {
    folderId = folderSearch.data.files[0].id;
    console.log('✅ Found existing folder: Apps Script Backups (ID: ' + folderId + ')\n');
  } else {
    console.log('❌ Backup folder not found');
    console.log('Creating new folder: Apps Script Backups\n');
    
    const folder = await drive.files.create({
      requestBody: {
        name: 'Apps Script Backups',
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    });
    
    folderId = folder.data.id;
    console.log('✅ Created folder (ID: ' + folderId + ')\n');
  }

  // Create backup JSON
  const backupData = {
    timestamp: now.toISOString(),
    scriptId: scriptId,
    files: project.data.files
  };

  const jsonContent = JSON.stringify(backupData, null, 2);

  console.log('☁️  Uploading to Google Drive...\n');

  const file = await drive.files.create({
    requestBody: {
      name: filename,
      mimeType: 'application/json',
      parents: [folderId]
    },
    media: {
      mimeType: 'application/json',
      body: jsonContent
    },
    fields: 'id, name, webViewLink'
  });

  console.log('✅ Backup created successfully!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('📋 Backup Details:\n');
  console.log('  Filename: ' + filename);
  console.log('  Folder: Apps Script Backups');
  console.log('  File ID: ' + file.data.id);
  console.log('  Timestamp: ' + now.toISOString());
  console.log('  Files backed up: ' + project.data.files.length + '\n');
  
  if (file.data.webViewLink) {
    console.log('  Link: ' + file.data.webViewLink + '\n');
  }

  console.log('Files included in backup:');
  project.data.files.forEach((f, i) => {
    console.log('  ' + (i + 1) + '. ' + f.name);
  });
  console.log('');
}

main().catch(console.error);
