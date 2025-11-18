#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CREDS_PATH = path.join(__dirname, '../config/credentials.json');
const TOKEN_PATH = path.join(__dirname, '../config/token.json');
const FILE_PATH = path.join(__dirname, '../docs/COMPREHENSIVE_TOOLS_INVENTORY.md');

async function uploadToolsInventory() {
  console.log('\n📤 UPLOADING COMPREHENSIVE TOOLS INVENTORY TO GOOGLE DRIVE\n');
  console.log('='.repeat(80) + '\n');

  try {
    // Load credentials
    const credentials = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
    const { client_id, client_secret } = credentials.installed || credentials.web;
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

    // Check if we have write permissions
    const hasWriteScope = token.scope.includes('drive.file') || token.scope.includes('drive');
    
    if (!hasWriteScope) {
      console.log('⚠️  OAuth token lacks Google Drive write permissions\n');
      console.log('Current scopes:', token.scope);
      console.log('\nTo upload to Google Drive, you need to re-authorize with write permissions.');
      console.log('Run: node scripts/authGoogleDrive.cjs\n');
      console.log('For now, the file is available locally at:');
      console.log(`   ${FILE_PATH}\n`);
      console.log('You can also push to GitHub, which provides cloud backup:');
      console.log('   git add docs/COMPREHENSIVE_TOOLS_INVENTORY.md');
      console.log('   git commit -m "Add comprehensive tools inventory"');
      console.log('   git push origin main\n');
      return;
    }

    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
    oauth2Client.setCredentials(token);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Search for "ER Simulator Dev" folder
    console.log('🔍 Searching for "ER Simulator Dev" folder...\n');
    
    const folderSearch = await drive.files.list({
      q: "name='ER Simulator Dev' and mimeType='application/vnd.google-apps.folder'",
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    let folderId;
    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
      folderId = folderSearch.data.files[0].id;
      console.log(`✅ Found "ER Simulator Dev" folder (ID: ${folderId})\n`);
    } else {
      console.log('⚠️  "ER Simulator Dev" folder not found. Creating it...\n');
      const folder = await drive.files.create({
        requestBody: {
          name: 'ER Simulator Dev',
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
      });
      folderId = folder.data.id;
      console.log(`✅ Created "ER Simulator Dev" folder (ID: ${folderId})\n`);
    }

    // Check if file already exists in folder
    const existingFileSearch = await drive.files.list({
      q: `name='COMPREHENSIVE_TOOLS_INVENTORY.md' and '${folderId}' in parents`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    let fileId;
    if (existingFileSearch.data.files && existingFileSearch.data.files.length > 0) {
      fileId = existingFileSearch.data.files[0].id;
      console.log('📝 File already exists. Updating...\n');
      
      // Update existing file
      await drive.files.update({
        fileId: fileId,
        media: {
          mimeType: 'text/markdown',
          body: fs.createReadStream(FILE_PATH)
        }
      });
      
      console.log('✅ Successfully updated COMPREHENSIVE_TOOLS_INVENTORY.md\n');
    } else {
      console.log('📤 Uploading new file...\n');
      
      // Upload new file
      const file = await drive.files.create({
        requestBody: {
          name: 'COMPREHENSIVE_TOOLS_INVENTORY.md',
          parents: [folderId]
        },
        media: {
          mimeType: 'text/markdown',
          body: fs.createReadStream(FILE_PATH)
        },
        fields: 'id'
      });
      
      fileId = file.data.id;
      console.log('✅ Successfully uploaded COMPREHENSIVE_TOOLS_INVENTORY.md\n');
    }

    // Get shareable link
    const fileInfo = await drive.files.get({
      fileId: fileId,
      fields: 'webViewLink'
    });

    console.log('='.repeat(80));
    console.log('✅ UPLOAD COMPLETE\n');
    console.log(`📂 Folder: ER Simulator Dev`);
    console.log(`📄 File: COMPREHENSIVE_TOOLS_INVENTORY.md`);
    console.log(`🔗 Link: ${fileInfo.data.webViewLink}\n`);
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nIf you see permission errors, re-authorize with:');
    console.log('   node scripts/authGoogleDrive.cjs\n');
  }
}

uploadToolsInventory().catch(console.error);
