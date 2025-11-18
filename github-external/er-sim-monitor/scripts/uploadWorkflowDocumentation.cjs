#!/usr/bin/env node

/**
 * Upload Comprehensive Workflow Tools Documentation to Google Drive
 *
 * Uploads:
 * 1. WORKFLOW_TOOLS_MASTER.md → Documentation/System Documentation
 * 2. TOOLS_AUDIT_REPORT.md → Documentation/System Documentation
 * 3. TOOL_TEST_RESULTS.md → Documentation/System Documentation
 * 4. COMPLETE_TOOLS_DOCUMENTATION.md → Documentation/System Documentation
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function uploadWorkflowDocumentation() {
  console.log('\n📤 UPLOADING COMPREHENSIVE WORKFLOW DOCUMENTATION TO GOOGLE DRIVE\n');

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
    console.error('❌ drive-folders.json not found');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const folderMap = JSON.parse(fs.readFileSync(folderMapPath, 'utf8'));

  const { client_id, client_secret } = credentials.installed || credentials.web;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
  oauth2Client.setCredentials(token);

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // Get System Documentation folder ID
  const docFolderId = folderMap.structure['📚 Documentation'].subfolders['System Documentation'];

  console.log(`📂 Target folder: System Documentation (${docFolderId})\n`);

  // Files to upload
  const uploads = [
    {
      localPath: path.join(__dirname, '../docs/WORKFLOW_TOOLS_MASTER.md'),
      name: 'WORKFLOW_TOOLS_MASTER.md',
      folderId: docFolderId,
      description: 'Complete chronological reference for all 170 workflow tools'
    },
    {
      localPath: path.join(__dirname, '../docs/TOOLS_AUDIT_REPORT.md'),
      name: 'TOOLS_AUDIT_REPORT.md',
      folderId: docFolderId,
      description: 'Comprehensive audit report of all tools with documentation status'
    },
    {
      localPath: path.join(__dirname, '../docs/TOOL_TEST_RESULTS.md'),
      name: 'TOOL_TEST_RESULTS.md',
      folderId: docFolderId,
      description: 'Automated testing results for workflow tools'
    },
    {
      localPath: path.join(__dirname, '../docs/COMPLETE_TOOLS_DOCUMENTATION.md'),
      name: 'COMPLETE_TOOLS_DOCUMENTATION.md',
      folderId: docFolderId,
      description: 'Auto-generated documentation for all tools'
    }
  ];

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const upload of uploads) {
    try {
      console.log(`📄 Processing: ${upload.name}`);

      if (!fs.existsSync(upload.localPath)) {
        console.log(`   ⚠️  File not found: ${upload.localPath}`);
        skipCount++;
        continue;
      }

      // Check if file already exists
      const searchResponse = await drive.files.list({
        q: `name='${upload.name}' and '${upload.folderId}' in parents and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive'
      });

      const media = {
        mimeType: 'text/markdown',
        body: fs.createReadStream(upload.localPath)
      };

      if (searchResponse.data.files.length > 0) {
        // File exists - update it
        const fileId = searchResponse.data.files[0].id;
        console.log(`   🔄 Updating existing file (${fileId})`);

        await drive.files.update({
          fileId: fileId,
          media: media,
          fields: 'id, name, modifiedTime'
        });

        console.log(`   ✅ Updated successfully`);
      } else {
        // File doesn't exist - create it
        console.log(`   📤 Uploading new file`);

        const requestBody = {
          name: upload.name,
          parents: [upload.folderId],
          description: upload.description
        };

        await drive.files.create({
          requestBody: requestBody,
          media: media,
          fields: 'id, name, webViewLink'
        });

        console.log(`   ✅ Uploaded successfully`);
      }

      successCount++;
      console.log('');
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      errorCount++;
      console.log('');
    }
  }

  console.log('═'.repeat(60));
  console.log('UPLOAD SUMMARY:');
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ⚠️  Skipped: ${skipCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  📊 Total: ${uploads.length}`);
  console.log('═'.repeat(60));
  console.log('');

  if (successCount === uploads.length - skipCount) {
    console.log('✅ All documentation uploaded to Google Drive successfully!\n');
  } else {
    console.log('⚠️  Some files were not uploaded. Please review errors above.\n');
  }
}

uploadWorkflowDocumentation().catch(console.error);
