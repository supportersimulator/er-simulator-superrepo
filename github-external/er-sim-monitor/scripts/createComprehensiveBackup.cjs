#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

async function createBackup() {
  console.log('💾 CREATING COMPREHENSIVE BACKUP\n');
  console.log('Backup includes:');
  console.log('  1. Full spreadsheet copy in Google Drive');
  console.log('  2. Local JSON export');
  console.log('  3. Apps Script code backup');
  console.log('  4. Timestamped versions\n');
  console.log('━'.repeat(70) + '\n');

  // Auth setup
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const drive = google.drive({version: 'v3', auth: oAuth2Client});
  const sheets = google.sheets({version: 'v4', auth: oAuth2Client});

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFolder = `ER Sim Backups`;

  // 1. Create backup folder in Google Drive (if doesn't exist)
  console.log('📁 Setting up backup folder in Google Drive...');

  let folderId;
  const folderSearch = await drive.files.list({
    q: `name='${backupFolder}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)'
  });

  if (folderSearch.data.files.length > 0) {
    folderId = folderSearch.data.files[0].id;
    console.log(`✅ Found existing backup folder: ${folderId}\n`);
  } else {
    const folder = await drive.files.create({
      requestBody: {
        name: backupFolder,
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    });
    folderId = folder.data.id;
    console.log(`✅ Created new backup folder: ${folderId}\n`);
  }

  // 2. Copy the entire spreadsheet
  console.log('📋 Copying spreadsheet to Google Drive...');

  const originalSheetId = process.env.GOOGLE_SHEET_ID;
  const backupName = `Master Scenario Convert - BACKUP ${timestamp}`;

  const copiedFile = await drive.files.copy({
    fileId: originalSheetId,
    requestBody: {
      name: backupName,
      parents: [folderId]
    }
  });

  const backupSheetId = copiedFile.data.id;
  console.log(`✅ Spreadsheet backed up: ${backupSheetId}`);
  console.log(`   URL: https://docs.google.com/spreadsheets/d/${backupSheetId}/edit\n`);

  // 3. Export local JSON backup
  console.log('💾 Exporting local JSON backup...');

  const dataResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: originalSheetId,
    range: 'Master Scenario Convert!A1:ZZ1000'
  });

  const backupData = {
    timestamp,
    originalSheetId,
    backupSheetId,
    data: dataResponse.data.values
  };

  const localBackupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(localBackupDir)) {
    fs.mkdirSync(localBackupDir, {recursive: true});
  }

  const localBackupPath = path.join(localBackupDir, `sheet-backup-${timestamp}.json`);
  fs.writeFileSync(localBackupPath, JSON.stringify(backupData, null, 2));

  console.log(`✅ Local backup: ${localBackupPath}\n`);

  // 4. Backup Apps Script code
  console.log('📝 Backing up Apps Script code...');

  const scriptBackupPath = path.join(localBackupDir, `apps-script-${timestamp}.gs`);
  const currentCodePath = path.join(__dirname, 'Code_ULTIMATE_ATSR.gs');

  if (fs.existsSync(currentCodePath)) {
    fs.copyFileSync(currentCodePath, scriptBackupPath);
    console.log(`✅ Apps Script backup: ${scriptBackupPath}\n`);
  }

  // 5. Create backup manifest
  const manifest = {
    created: timestamp,
    googleDrive: {
      folderId,
      folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
      backupSheetId,
      backupSheetUrl: `https://docs.google.com/spreadsheets/d/${backupSheetId}/edit`
    },
    local: {
      dataBackup: localBackupPath,
      scriptBackup: fs.existsSync(scriptBackupPath) ? scriptBackupPath : null
    },
    stats: {
      totalRows: dataResponse.data.values.length,
      totalCells: dataResponse.data.values.reduce((sum, row) => sum + row.length, 0)
    }
  };

  const manifestPath = path.join(localBackupDir, `backup-manifest-${timestamp}.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // 6. Update latest backup symlink
  const latestManifestPath = path.join(localBackupDir, 'latest-backup.json');
  fs.writeFileSync(latestManifestPath, JSON.stringify(manifest, null, 2));

  console.log('━'.repeat(70));
  console.log('✅ BACKUP COMPLETE\n');
  console.log('📊 Backup Summary:');
  console.log(`   Timestamp: ${timestamp}`);
  console.log(`   Rows backed up: ${manifest.stats.totalRows}`);
  console.log(`   Cells backed up: ${manifest.stats.totalCells}`);
  console.log('');
  console.log('📁 Google Drive:');
  console.log(`   Folder: ${manifest.googleDrive.folderUrl}`);
  console.log(`   Backup Sheet: ${manifest.googleDrive.backupSheetUrl}`);
  console.log('');
  console.log('💾 Local Backups:');
  console.log(`   Manifest: ${manifestPath}`);
  console.log(`   Data: ${localBackupPath}`);
  if (manifest.local.scriptBackup) {
    console.log(`   Script: ${scriptBackupPath}`);
  }
  console.log('');
  console.log('🔒 Safe to proceed with modifications.\n');
  console.log('━'.repeat(70) + '\n');

  return manifest;
}

createBackup().catch(err => {
  console.error('❌ Backup failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
