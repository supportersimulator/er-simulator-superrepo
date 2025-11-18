#!/usr/bin/env node

/**
 * Create subfolders in Documentation and Backups categories
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function createDocSubfolders() {
  console.log('\n📁 CREATING DOCUMENTATION & BACKUP SUBFOLDERS\n');

  // Load config
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const folderMapPath = path.join(__dirname, '../config/drive-folders.json');

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const folderMap = JSON.parse(fs.readFileSync(folderMapPath, 'utf8'));

  const { client_id, client_secret } = credentials.installed || credentials.web;

  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
  oauth2Client.setCredentials(token);

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // Get parent folder IDs
  const docFolderId = folderMap.structure['📚 Documentation'];
  const backupFolderId = folderMap.structure['💾 Backups'];

  // Subfolders to create
  const subfoldersToCreate = [
    { name: 'System Documentation', parent: docFolderId, key: 'docSystemDocs' },
    { name: 'Code Backups', parent: backupFolderId, key: 'backupCode' }
  ];

  const createdFolders = {};

  for (const subfolder of subfoldersToCreate) {
    try {
      // Check if folder exists
      const existingSearch = await drive.files.list({
        q: `name='${subfolder.name}' and '${subfolder.parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive'
      });

      if (existingSearch.data.files && existingSearch.data.files.length > 0) {
        console.log(`✅ EXISTS: ${subfolder.name} (${existingSearch.data.files[0].id})`);
        createdFolders[subfolder.key] = existingSearch.data.files[0].id;
      } else {
        // Create folder
        const folder = await drive.files.create({
          requestBody: {
            name: subfolder.name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [subfolder.parent]
          },
          fields: 'id, name'
        });

        console.log(`✅ CREATED: ${subfolder.name} (${folder.data.id})`);
        createdFolders[subfolder.key] = folder.data.id;
      }
    } catch (error) {
      console.error(`❌ ERROR creating ${subfolder.name}:`, error.message);
    }
  }

  // Update folder map
  if (!folderMap.structure['📚 Documentation'].subfolders) {
    folderMap.structure['📚 Documentation'] = {
      id: docFolderId,
      subfolders: {}
    };
  }
  if (!folderMap.structure['💾 Backups'].subfolders) {
    folderMap.structure['💾 Backups'] = {
      id: backupFolderId,
      subfolders: {}
    };
  }

  folderMap.structure['📚 Documentation'].subfolders['System Documentation'] = createdFolders.docSystemDocs;
  folderMap.structure['💾 Backups'].subfolders['Code Backups'] = createdFolders.backupCode;
  folderMap.lastUpdated = new Date().toISOString();

  // Save updated map
  fs.writeFileSync(folderMapPath, JSON.stringify(folderMap, null, 2));

  console.log('\n✅ Subfolders created and folder map updated\n');
  return createdFolders;
}

createDocSubfolders().catch(console.error);
