#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CREDS_PATH = path.join(__dirname, '../config/credentials.json');
const TOKEN_PATH = path.join(__dirname, '../config/token.json');
const ER_SIM_DEV_FOLDER_ID = '1LjQcTA1U3TNwNchKqBs5GkvqLmDD6hh9';

/**
 * Organize ER Simulator Dev folder structure
 *
 * Creates the following folder hierarchy:
 *
 * ER Simulator Dev/
 * ├── 📚 Documentation/
 * │   ├── Architecture & Planning/
 * │   ├── System Documentation/
 * │   ├── Session Summaries/
 * │   └── User Guides/
 * ├── 🛠️ Tools & Utilities/
 * │   ├── ECG Processing/
 * │   ├── Waveform Management/
 * │   └── Batch Processing/
 * ├── 📊 Reports & Analytics/
 * │   ├── Quality Reports/
 * │   ├── Batch Reports/
 * │   └── Dashboards/
 * ├── 💾 Backups/
 * │   ├── Code Backups/
 * │   ├── Data Backups/
 * │   └── Configuration Backups/
 * ├── 🎯 Project Management/
 * │   ├── Roadmaps/
 * │   ├── Requirements/
 * │   └── Decision Logs/
 * └── 📦 Deliverables/
 *     ├── Production Releases/
 *     └── Client Deliverables/
 */

async function organizeDriveStructure() {
  console.log('\n📁 ORGANIZING ER SIMULATOR DEV FOLDER STRUCTURE\n');
  console.log('='.repeat(80) + '\n');

  try {
    // Load credentials
    const credentials = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
    const { client_id, client_secret } = credentials.installed || credentials.web;
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
    oauth2Client.setCredentials(token);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Define folder structure
    const folderStructure = {
      '📚 Documentation': {
        folders: [
          'Architecture & Planning',
          'System Documentation',
          'Session Summaries',
          'User Guides'
        ]
      },
      '🛠️ Tools & Utilities': {
        folders: [
          'ECG Processing',
          'Waveform Management',
          'Batch Processing'
        ]
      },
      '📊 Reports & Analytics': {
        folders: [
          'Quality Reports',
          'Batch Reports',
          'Dashboards'
        ]
      },
      '💾 Backups': {
        folders: [
          'Code Backups',
          'Data Backups',
          'Configuration Backups'
        ]
      },
      '🎯 Project Management': {
        folders: [
          'Roadmaps',
          'Requirements',
          'Decision Logs'
        ]
      },
      '📦 Deliverables': {
        folders: [
          'Production Releases',
          'Client Deliverables'
        ]
      }
    };

    console.log('🏗️  Creating folder structure in "ER Simulator Dev"...\n');

    const createdFolders = {};

    // Create top-level folders
    for (const [folderName, config] of Object.entries(folderStructure)) {
      console.log(`📁 Creating: ${folderName}`);

      const folder = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [ER_SIM_DEV_FOLDER_ID]
        },
        fields: 'id, name'
      });

      const folderId = folder.data.id;
      createdFolders[folderName] = folderId;
      console.log(`   ✅ Created (ID: ${folderId})`);

      // Create subfolders
      if (config.folders && config.folders.length > 0) {
        for (const subfolderName of config.folders) {
          console.log(`   📂 Creating subfolder: ${subfolderName}`);

          const subfolder = await drive.files.create({
            requestBody: {
              name: subfolderName,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [folderId]
            },
            fields: 'id, name'
          });

          console.log(`      ✅ Created (ID: ${subfolder.data.id})`);
        }
      }

      console.log('');
    }

    console.log('='.repeat(80));
    console.log('✅ FOLDER STRUCTURE CREATED SUCCESSFULLY\n');

    // Save folder mapping for future reference
    const folderMapping = {
      rootFolderId: ER_SIM_DEV_FOLDER_ID,
      rootFolderName: 'ER Simulator Dev',
      structure: createdFolders,
      created: new Date().toISOString()
    };

    const mappingPath = path.join(__dirname, '../config/drive-folders.json');
    fs.writeFileSync(mappingPath, JSON.stringify(folderMapping, null, 2));
    console.log(`📄 Folder mapping saved to: ${mappingPath}\n`);

    console.log('📋 FOLDER SUMMARY:\n');
    Object.entries(createdFolders).forEach(([name, id]) => {
      console.log(`   ${name}`);
      console.log(`   └─ ID: ${id}`);
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('🎯 Next Steps:\n');
    console.log('1. Move existing files to appropriate folders');
    console.log('2. Upload documentation to Documentation folders');
    console.log('3. Set up automated backups to Backups folders');
    console.log('4. Generate reports to Reports & Analytics folders\n');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('insufficient authentication')) {
      console.log('\n⚠️  OAuth token needs refresh. Run:');
      console.log('   node scripts/authGoogleDrive.cjs\n');
    }
  }
}

organizeDriveStructure().catch(console.error);
