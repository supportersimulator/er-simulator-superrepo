#!/usr/bin/env node

/**
 * Find Google Drive Backup Location
 *
 * Uses existing drive.readonly scope to locate backup folders
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '../config/token.json');
const CREDS_PATH = path.join(__dirname, '../config/credentials.json');

async function findBackupLocation() {
  try {
    console.log('\n🔍 SEARCHING GOOGLE DRIVE FOR BACKUP LOCATIONS\n');
    console.log('='.repeat(80) + '\n');

    // Load credentials
    const credentials = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
    const { client_id, client_secret } = credentials.installed || credentials.web;
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
    oauth2Client.setCredentials(token);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Search for "ER Simulator" or "Backups" folders
    console.log('📁 Searching for existing backup folders...\n');

    const searchQueries = [
      "name contains 'ER Simulator' and mimeType='application/vnd.google-apps.folder'",
      "name contains 'Backup' and mimeType='application/vnd.google-apps.folder'",
      "name contains 'er-sim' and mimeType='application/vnd.google-apps.folder'"
    ];

    let foundFolders = [];

    for (const query of searchQueries) {
      const response = await drive.files.list({
        q: query + " and trashed=false",
        fields: 'files(id, name, parents, createdTime, webViewLink)',
        spaces: 'drive'
      });

      if (response.data.files.length > 0) {
        foundFolders = foundFolders.concat(response.data.files);
      }
    }

    // Remove duplicates
    const uniqueFolders = Array.from(new Map(foundFolders.map(f => [f.id, f])).values());

    if (uniqueFolders.length > 0) {
      console.log(`✅ Found ${uniqueFolders.length} potential backup folder(s):\n`);
      uniqueFolders.forEach((folder, idx) => {
        console.log(`${idx + 1}. ${folder.name}`);
        console.log(`   ID: ${folder.id}`);
        console.log(`   Link: ${folder.webViewLink}`);
        console.log(`   Created: ${folder.createdTime}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No existing backup folders found');
      console.log('   Will need to create "ER Simulator Backups" folder\n');
    }

    console.log('='.repeat(80));
    console.log('📊 BACKUP STATUS SUMMARY');
    console.log('='.repeat(80) + '\n');

    console.log('✅ Local backup complete:');
    console.log('   /Users/aarontjomsland/er-sim-monitor/backups/tools/ecg-to-svg-converter/');
    console.log('   ecg-to-svg-converter_backup_2025-11-03.html (130KB)\n');

    console.log('⚠️  Google Drive upload requires:');
    console.log('   - drive.file scope (create files)');
    console.log('   - drive scope (full access)');
    console.log('   - Current token only has: drive.readonly\n');

    console.log('🔧 NEXT STEPS:\n');
    console.log('Since we need expanded scopes, you have two options:\n');
    console.log('Option A - Re-authorize with Drive write access:');
    console.log('   Run: node scripts/authGoogleDrive.cjs');
    console.log('   (Opens browser for authorization)\n');
    console.log('Option B - Manual upload:');
    console.log('   1. Open Google Drive in browser');
    console.log('   2. Create folder: "ER Simulator Backups/Tools"');
    console.log('   3. Upload from: backups/tools/ecg-to-svg-converter/\n');

  } catch (error) {
    console.error('\n❌ ERROR searching Drive:');
    console.error(error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

findBackupLocation();
