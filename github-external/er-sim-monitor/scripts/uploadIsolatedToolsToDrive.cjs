#!/usr/bin/env node

/**
 * Upload Isolated Tools to Google Drive "Current Code" Folder
 *
 * Uploads all cleanly decomposed single-purpose modules to Current Code folder
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Load Drive folder configuration
const driveFolders = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/drive-folders.json'), 'utf8')
);

// Current Code folder ID
const CURRENT_CODE_FOLDER_ID = driveFolders.structure['💾 Backups'].subfolders['Code Backups - Current'];

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

async function uploadFile(drive, folderId, filePath, fileName) {
  const fileMetadata = {
    name: fileName,
    parents: [folderId]
  };

  const media = {
    mimeType: 'text/plain',
    body: fs.createReadStream(filePath)
  };

  // Check if file already exists
  const searchResponse = await drive.files.list({
    q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id, name)'
  });

  if (searchResponse.data.files.length > 0) {
    // Update existing file
    const fileId = searchResponse.data.files[0].id;
    await drive.files.update({
      fileId: fileId,
      media: media
    });
    return { status: 'updated', fileId };
  } else {
    // Create new file
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id'
    });
    return { status: 'created', fileId: response.data.id };
  }
}

async function createFolder(drive, parentId, folderName, description = '') {
  // Check if folder already exists
  const searchResponse = await drive.files.list({
    q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)'
  });

  if (searchResponse.data.files.length > 0) {
    return searchResponse.data.files[0].id;
  }

  // Create new folder
  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId],
    description
  };

  const response = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id'
  });

  return response.data.id;
}

async function uploadIsolatedTools() {
  console.log('\n📤 UPLOADING ISOLATED TOOLS TO GOOGLE DRIVE\n');
  console.log('Target: Current Code folder\n');

  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });

  // Create folder structure
  console.log('Step 1: Creating folder structure...\n');

  const coreModulesFolderId = await createFolder(
    drive,
    CURRENT_CODE_FOLDER_ID,
    'Core Modules',
    'Primary decomposed modules from monolithic code'
  );
  console.log('✓ Created: Core Modules folder');

  const refinedModulesFolderId = await createFolder(
    drive,
    CURRENT_CODE_FOLDER_ID,
    'Refined Utilities',
    'Further decomposed utility modules'
  );
  console.log('✓ Created: Refined Utilities folder\n');

  // Upload core modules
  console.log('Step 2: Uploading core modules...\n');

  const coreModulesDir = path.join(__dirname, '../isolated-tools');
  const coreModules = fs.readdirSync(coreModulesDir)
    .filter(f => f.endsWith('.gs') && !f.includes('MANIFEST'));

  const uploadedCore = [];

  for (const fileName of coreModules) {
    const filePath = path.join(coreModulesDir, fileName);
    const stats = fs.statSync(filePath);
    const result = await uploadFile(drive, coreModulesFolderId, filePath, fileName);

    uploadedCore.push({
      fileName,
      status: result.status,
      sizeKB: (stats.size / 1024).toFixed(1),
      fileId: result.fileId
    });

    console.log(`  ${result.status === 'created' ? '✓' : '🔄'} ${fileName} (${(stats.size / 1024).toFixed(1)} KB) - ${result.status}`);
  }

  // Upload refined modules
  console.log('\nStep 3: Uploading refined utility modules...\n');

  const refinedModulesDir = path.join(__dirname, '../isolated-tools/refined');
  let uploadedRefined = [];

  if (fs.existsSync(refinedModulesDir)) {
    const refinedModules = fs.readdirSync(refinedModulesDir)
      .filter(f => f.endsWith('.gs') && !f.includes('MANIFEST'));

    for (const fileName of refinedModules) {
      const filePath = path.join(refinedModulesDir, fileName);
      const stats = fs.statSync(filePath);
      const result = await uploadFile(drive, refinedModulesFolderId, filePath, fileName);

      uploadedRefined.push({
        fileName,
        status: result.status,
        sizeKB: (stats.size / 1024).toFixed(1),
        fileId: result.fileId
      });

      console.log(`  ${result.status === 'created' ? '✓' : '🔄'} ${fileName} (${(stats.size / 1024).toFixed(1)} KB) - ${result.status}`);
    }
  }

  // Upload manifests
  console.log('\nStep 4: Uploading manifests...\n');

  const decompositionManifest = path.join(coreModulesDir, 'DECOMPOSITION_MANIFEST.json');
  if (fs.existsSync(decompositionManifest)) {
    await uploadFile(drive, coreModulesFolderId, decompositionManifest, 'DECOMPOSITION_MANIFEST.json');
    console.log('  ✓ Uploaded: DECOMPOSITION_MANIFEST.json');
  }

  const refinedManifest = path.join(refinedModulesDir, 'REFINED_MANIFEST.json');
  if (fs.existsSync(refinedManifest)) {
    await uploadFile(drive, refinedModulesFolderId, refinedManifest, 'REFINED_MANIFEST.json');
    console.log('  ✓ Uploaded: REFINED_MANIFEST.json');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPLOAD COMPLETE');
  console.log('='.repeat(60));
  console.log(`Core Modules Uploaded: ${uploadedCore.length}`);
  console.log(`Refined Modules Uploaded: ${uploadedRefined.length}`);
  console.log(`Total Files: ${uploadedCore.length + uploadedRefined.length}`);
  console.log(`Target Folder: Current Code`);
  console.log('='.repeat(60) + '\n');

  // Save upload report
  const report = {
    timestamp: new Date().toISOString(),
    targetFolder: 'Current Code',
    targetFolderId: CURRENT_CODE_FOLDER_ID,
    coreModulesUploaded: uploadedCore.length,
    refinedModulesUploaded: uploadedRefined.length,
    totalFiles: uploadedCore.length + uploadedRefined.length,
    details: {
      coreModules: uploadedCore,
      refinedModules: uploadedRefined
    }
  };

  const reportPath = path.join(__dirname, '../docs/ISOLATED_TOOLS_UPLOAD_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📋 Upload report saved: ${reportPath}\n`);

  return report;
}

uploadIsolatedTools().catch(console.error);
