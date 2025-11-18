#!/usr/bin/env node

/**
 * Upload Legacy Tools Documentation to Google Drive
 *
 * Uploads:
 * 1. LEGACY_TOOLS_V3.7_DOCUMENTATION.md → Documentation/System Documentation
 * 2. ER_Simulator_Builder_v3.7.gs → Backups/Code Backups
 * 3. legacy_code_analysis.txt → Documentation/System Documentation
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function uploadLegacyDocumentation() {
  console.log('\n📤 UPLOADING LEGACY TOOLS DOCUMENTATION TO GOOGLE DRIVE\n');

  // Load OAuth credentials and token
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const folderMapPath = path.join(__dirname, '../config/drive-folders.json');

  if (!fs.existsSync(credentialsPath)) {
    console.error('❌ credentials.json not found');
    process.exit(1);
  }

  if (!fs.existsSync(tokenPath)) {
    console.error('❌ token.json not found - run npm run auth-google first');
    process.exit(1);
  }

  if (!fs.existsSync(folderMapPath)) {
    console.error('❌ drive-folders.json not found - run folder organization script first');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const folderMap = JSON.parse(fs.readFileSync(folderMapPath, 'utf8'));

  const { client_id, client_secret } = credentials.installed || credentials.web;

  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
  oauth2Client.setCredentials(token);

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // Get folder IDs from map
  const docFolderId = folderMap.structure['📚 Documentation'].subfolders['System Documentation'];
  const backupFolderId = folderMap.structure['💾 Backups'].subfolders['Code Backups'];

  if (!docFolderId || !backupFolderId) {
    console.error('❌ Required folder IDs not found in drive-folders.json');
    process.exit(1);
  }

  console.log(`📁 Target folders:`);
  console.log(`   Documentation: ${docFolderId}`);
  console.log(`   Code Backups: ${backupFolderId}\n`);

  // Files to upload
  const uploads = [
    {
      localPath: path.join(__dirname, '../docs/LEGACY_TOOLS_V3.7_DOCUMENTATION.md'),
      name: 'LEGACY_TOOLS_V3.7_DOCUMENTATION.md',
      mimeType: 'text/markdown',
      folderId: docFolderId,
      description: 'Complete documentation of all 20 tools from v3.7 ChatGPT-era code'
    },
    {
      localPath: path.join(__dirname, '../backups/ER_Simulator_Builder_v3.7.gs'),
      name: 'ER_Simulator_Builder_v3.7.gs',
      mimeType: 'text/plain',
      folderId: backupFolderId,
      description: 'Legacy Apps Script v3.7 code archive'
    },
    {
      localPath: '/tmp/legacy_code_analysis.txt',
      name: 'LEGACY_CODE_ANALYSIS.txt',
      mimeType: 'text/plain',
      folderId: docFolderId,
      description: 'Initial analysis output from legacy code extraction'
    }
  ];

  let successCount = 0;
  let skipCount = 0;

  for (const upload of uploads) {
    try {
      if (!fs.existsSync(upload.localPath)) {
        console.log(`⚠️  SKIPPED: ${upload.name} (file not found)`);
        skipCount++;
        continue;
      }

      console.log(`📤 Uploading: ${upload.name}...`);

      // Check if file already exists in target folder
      const existingFiles = await drive.files.list({
        q: `name='${upload.name}' and '${upload.folderId}' in parents and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive'
      });

      if (existingFiles.data.files && existingFiles.data.files.length > 0) {
        // Update existing file
        const fileId = existingFiles.data.files[0].id;

        await drive.files.update({
          fileId: fileId,
          media: {
            mimeType: upload.mimeType,
            body: fs.createReadStream(upload.localPath)
          }
        });

        console.log(`   ✅ UPDATED: ${upload.name} (${upload.description})`);
      } else {
        // Create new file
        const file = await drive.files.create({
          requestBody: {
            name: upload.name,
            parents: [upload.folderId],
            description: upload.description
          },
          media: {
            mimeType: upload.mimeType,
            body: fs.createReadStream(upload.localPath)
          },
          fields: 'id, name, webViewLink'
        });

        console.log(`   ✅ UPLOADED: ${upload.name}`);
        console.log(`      📎 Link: ${file.data.webViewLink}`);
      }

      successCount++;

    } catch (error) {
      console.error(`   ❌ ERROR uploading ${upload.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Upload complete: ${successCount} successful, ${skipCount} skipped`);
  console.log('='.repeat(60) + '\n');

  console.log('📂 Files organized in Google Drive:');
  console.log(`   📚 Documentation/System Documentation/`);
  console.log(`      - LEGACY_TOOLS_V3.7_DOCUMENTATION.md`);
  console.log(`      - LEGACY_CODE_ANALYSIS.txt`);
  console.log(`   💾 Backups/Code Backups/`);
  console.log(`      - ER_Simulator_Builder_v3.7.gs\n`);
}

uploadLegacyDocumentation().catch(console.error);
