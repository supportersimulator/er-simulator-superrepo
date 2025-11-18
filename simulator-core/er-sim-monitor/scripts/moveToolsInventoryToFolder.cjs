#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CREDS_PATH = path.join(__dirname, '../config/credentials.json');
const TOKEN_PATH = path.join(__dirname, '../config/token.json');

async function moveToolsInventory() {
  console.log('\n📦 MOVING TOOLS INVENTORY TO DOCUMENTATION FOLDER\n');

  try {
    const credentials = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
    const { client_id, client_secret } = credentials.installed || credentials.web;
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
    oauth2Client.setCredentials(token);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Get folder mapping
    const mappingPath = path.join(__dirname, '../config/drive-folders.json');
    const folderMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

    // Find Documentation folder ID
    const docsFolderId = folderMapping.structure['📚 Documentation'];

    // Find the tools inventory file
    const fileSearch = await drive.files.list({
      q: "name='COMPREHENSIVE_TOOLS_INVENTORY.md'",
      fields: 'files(id, name, parents)',
      spaces: 'drive'
    });

    if (!fileSearch.data.files || fileSearch.data.files.length === 0) {
      console.log('❌ Tools inventory file not found in Drive');
      return;
    }

    const file = fileSearch.data.files[0];
    const fileId = file.id;
    const currentParents = file.parents.join(',');

    console.log(`📄 Found: ${file.name} (ID: ${fileId})`);
    console.log(`📁 Moving to: 📚 Documentation (ID: ${docsFolderId})\n`);

    // Move file to Documentation folder
    await drive.files.update({
      fileId: fileId,
      addParents: docsFolderId,
      removeParents: currentParents,
      fields: 'id, parents, webViewLink'
    });

    console.log('✅ File moved successfully!\n');
    console.log(`🔗 New location: https://drive.google.com/file/d/${fileId}/view\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

moveToolsInventory().catch(console.error);
