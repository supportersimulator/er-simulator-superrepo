#!/usr/bin/env node

/**
 * Upload Feature-Based Modules to Google Drive Current Code Folder
 *
 * Replaces technical decomposition with feature-based organization
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Load Drive folder configuration
const driveFolders = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../config/drive-folders.json'), 'utf8')
);

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

async function deleteOldDecomposition(drive, parentId) {
  console.log('Step 1: Cleaning up old technical decomposition...\n');

  const foldersToDelete = ['Core Modules', 'Refined Utilities'];

  for (const folderName of foldersToDelete) {
    const searchResponse = await drive.files.list({
      q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    });

    if (searchResponse.data.files.length > 0) {
      const folderId = searchResponse.data.files[0].id;
      await drive.files.delete({ fileId: folderId });
      console.log(`  ✓ Deleted: ${folderName}`);
    }
  }

  console.log('');
}

async function uploadFeatureModules() {
  console.log('\n📤 UPLOADING FEATURE-BASED MODULES TO GOOGLE DRIVE\n');
  console.log('Target: Current Code folder');
  console.log('Organization: Feature-based (common utility goal)\n');

  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });

  // Delete old technical decomposition
  await deleteOldDecomposition(drive, CURRENT_CODE_FOLDER_ID);

  // Create new folder structure
  console.log('Step 2: Creating feature-based folder structure...\n');

  const featuresFolderId = await createFolder(
    drive,
    CURRENT_CODE_FOLDER_ID,
    'Features',
    'UI features - everything for one user workflow (HTML + handlers + backend)'
  );
  console.log('  ✓ Created: Features folder');

  const enginesFolderId = await createFolder(
    drive,
    CURRENT_CODE_FOLDER_ID,
    'Engines',
    'Pure business logic - no UI dependencies (reusable across features)'
  );
  console.log('  ✓ Created: Engines folder\n');

  // Upload feature modules
  console.log('Step 3: Uploading feature modules...\n');

  const featureDir = path.join(__dirname, '../isolated-tools/feature-based/features');
  const uploadedFeatures = [];

  if (fs.existsSync(featureDir)) {
    const featureFiles = fs.readdirSync(featureDir).filter(f => f.endsWith('.gs'));

    for (const fileName of featureFiles) {
      const filePath = path.join(featureDir, fileName);
      const stats = fs.statSync(filePath);
      const result = await uploadFile(drive, featuresFolderId, filePath, fileName);

      uploadedFeatures.push({
        fileName,
        status: result.status,
        sizeKB: (stats.size / 1024).toFixed(1),
        fileId: result.fileId
      });

      console.log(`  ${result.status === 'created' ? '✓' : '🔄'} ${fileName} (${(stats.size / 1024).toFixed(1)} KB) - ${result.status}`);
    }
  }

  // Upload engine modules
  console.log('\nStep 4: Uploading engine modules...\n');

  const engineDir = path.join(__dirname, '../isolated-tools/feature-based/engines');
  const uploadedEngines = [];

  if (fs.existsSync(engineDir)) {
    const engineFiles = fs.readdirSync(engineDir).filter(f => f.endsWith('.gs'));

    for (const fileName of engineFiles) {
      const filePath = path.join(engineDir, fileName);
      const stats = fs.statSync(filePath);
      const result = await uploadFile(drive, enginesFolderId, filePath, fileName);

      uploadedEngines.push({
        fileName,
        status: result.status,
        sizeKB: (stats.size / 1024).toFixed(1),
        fileId: result.fileId
      });

      console.log(`  ${result.status === 'created' ? '✓' : '🔄'} ${fileName} (${(stats.size / 1024).toFixed(1)} KB) - ${result.status}`);
    }
  }

  // Upload manifest
  console.log('\nStep 5: Uploading manifest...\n');

  const manifestPath = path.join(__dirname, '../isolated-tools/feature-based/FEATURE_BASED_MANIFEST.json');
  if (fs.existsSync(manifestPath)) {
    await uploadFile(drive, CURRENT_CODE_FOLDER_ID, manifestPath, 'FEATURE_BASED_MANIFEST.json');
    console.log('  ✓ Uploaded: FEATURE_BASED_MANIFEST.json');
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 UPLOAD COMPLETE');
  console.log('='.repeat(70));
  console.log(`Features Uploaded: ${uploadedFeatures.length}`);
  console.log(`Engines Uploaded: ${uploadedEngines.length}`);
  console.log(`Total Files: ${uploadedFeatures.length + uploadedEngines.length}`);
  console.log(`Target Folder: Current Code (Feature-Based)`);
  console.log('');
  console.log('Organization Principle:');
  console.log('  ✓ Common utility goal - group by user workflow feature');
  console.log('  ✓ UI features: HTML + handlers + backend together');
  console.log('  ✓ Engines: Pure logic, no UI, reusable');
  console.log('');
  console.log('Benefits:');
  console.log('  ✓ Modify batch sidebar? Open ONE file');
  console.log('  ✓ All related code stays together');
  console.log('  ✓ Easy to understand feature scope');
  console.log('  ✓ Clean separation: features vs engines');
  console.log('='.repeat(70) + '\n');

  // Save upload report
  const report = {
    timestamp: new Date().toISOString(),
    approach: 'feature-based',
    principle: 'Common utility goal - group by user workflow feature',
    targetFolder: 'Current Code',
    targetFolderId: CURRENT_CODE_FOLDER_ID,
    featuresUploaded: uploadedFeatures.length,
    enginesUploaded: uploadedEngines.length,
    totalFiles: uploadedFeatures.length + uploadedEngines.length,
    details: {
      features: uploadedFeatures,
      engines: uploadedEngines
    }
  };

  const reportPath = path.join(__dirname, '../docs/FEATURE_BASED_UPLOAD_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📋 Upload report saved: ${reportPath}\n`);

  return report;
}

uploadFeatureModules().catch(console.error);
