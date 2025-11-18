#!/usr/bin/env node

/**
 * Phase 1: Reorganize Google Drive - Move existing backups to Legacy Code folder
 *
 * Creates clean structure:
 * Code Backups/
 *   ├── Legacy Code/          (all current monolithic files)
 *   └── Current Code/          (will contain isolated tools)
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function reorganizeDriveStructure() {
  console.log('\n📂 PHASE 1: REORGANIZING GOOGLE DRIVE STRUCTURE\n');
  console.log('Creating Legacy Code folder and moving monolithic files...\n');

  // Load credentials
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

  // Get Code Backups folder ID
  const codeBackupsFolderId = folderMap.structure['💾 Backups'].subfolders['Code Backups'];
  console.log(`Code Backups Folder ID: ${codeBackupsFolderId}\n`);

  // Step 1: Create "Legacy Code" folder
  console.log('Step 1: Creating "Legacy Code" folder...');

  const legacyFolderMetadata = {
    name: 'Legacy Code',
    mimeType: 'application/vnd.google-apps.folder',
    parents: [codeBackupsFolderId],
    description: 'Historical monolithic code files - preserved for reference'
  };

  const legacyFolder = await drive.files.create({
    requestBody: legacyFolderMetadata,
    fields: 'id, name'
  });

  const legacyFolderId = legacyFolder.data.id;
  console.log(`✅ Created Legacy Code folder: ${legacyFolderId}\n`);

  // Step 2: Create "Current Code" folder
  console.log('Step 2: Creating "Current Code" folder...');

  const currentFolderMetadata = {
    name: 'Current Code',
    mimeType: 'application/vnd.google-apps.folder',
    parents: [codeBackupsFolderId],
    description: 'Isolated, single-purpose tools - clean and modular'
  };

  const currentFolder = await drive.files.create({
    requestBody: currentFolderMetadata,
    fields: 'id, name'
  });

  const currentFolderId = currentFolder.data.id;
  console.log(`✅ Created Current Code folder: ${currentFolderId}\n`);

  // Step 3: Get all existing phase folders
  console.log('Step 3: Finding all existing phase folders...');

  const phaseFoldersResponse = await drive.files.list({
    q: `'${codeBackupsFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  const phaseFolders = phaseFoldersResponse.data.files.filter(f =>
    f.name.startsWith('Phase') ||
    f.name.includes('Apps Script') ||
    f.name.includes('System Builders') ||
    f.name.includes('Additional')
  );

  console.log(`Found ${phaseFolders.length} phase folders to move\n`);

  // Step 4: Move all phase folders to Legacy Code
  console.log('Step 4: Moving phase folders to Legacy Code...');

  for (const folder of phaseFolders) {
    console.log(`  Moving: ${folder.name}`);

    // Move folder by updating its parent
    await drive.files.update({
      fileId: folder.id,
      addParents: legacyFolderId,
      removeParents: codeBackupsFolderId,
      fields: 'id, name, parents'
    });

    console.log(`    ✓ Moved to Legacy Code`);
  }

  console.log(`\n✅ Moved ${phaseFolders.length} folders to Legacy Code\n`);

  // Step 5: Update folder map
  console.log('Step 5: Updating folder map...');

  folderMap.structure['💾 Backups'].subfolders['Code Backups - Legacy'] = legacyFolderId;
  folderMap.structure['💾 Backups'].subfolders['Code Backups - Current'] = currentFolderId;
  folderMap.lastUpdated = new Date().toISOString();

  fs.writeFileSync(folderMapPath, JSON.stringify(folderMap, null, 2));
  console.log('✅ Updated folder map\n');

  // Summary
  console.log('='.repeat(60));
  console.log('📊 REORGANIZATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Legacy Code Folder ID: ${legacyFolderId}`);
  console.log(`Current Code Folder ID: ${currentFolderId}`);
  console.log(`Phase Folders Moved: ${phaseFolders.length}`);
  console.log(`\nStructure:`);
  console.log(`  Code Backups/`);
  console.log(`    ├── Legacy Code/           (${phaseFolders.length} phase folders)`);
  console.log(`    └── Current Code/          (ready for isolated tools)`);
  console.log('='.repeat(60) + '\n');

  return { legacyFolderId, currentFolderId };
}

reorganizeDriveStructure().catch(console.error);
