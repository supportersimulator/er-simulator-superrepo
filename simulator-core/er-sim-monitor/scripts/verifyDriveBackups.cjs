#!/usr/bin/env node

/**
 * VERIFY GOOGLE DRIVE BACKUPS
 *
 * Checks the lost-and-found-20251105-203821 folder on Google Drive
 * to ensure all critical files are backed up
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

console.log('\n🔍 VERIFYING GOOGLE DRIVE BACKUPS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const LOST_AND_FOUND_FOLDER_NAME = 'lost-and-found-20251105-203821';

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

async function verify() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    console.log(`📁 Searching for folder: ${LOST_AND_FOUND_FOLDER_NAME}\n`);

    // Search for lost-and-found folder
    const folderSearch = await drive.files.list({
      q: `name='${LOST_AND_FOUND_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, createdTime)',
      spaces: 'drive'
    });

    if (!folderSearch.data.files || folderSearch.data.files.length === 0) {
      console.log('❌ Lost-and-found folder not found!\n');
      console.log('This is concerning - backups may not exist.\n');
      return;
    }

    const folder = folderSearch.data.files[0];
    console.log(`✅ Found folder: ${folder.name}`);
    console.log(`   ID: ${folder.id}`);
    console.log(`   Created: ${folder.createdTime}\n`);

    // List all files in the folder
    console.log('📋 Files in lost-and-found folder:\n');

    const filesSearch = await drive.files.list({
      q: `'${folder.id}' in parents and trashed=false`,
      fields: 'files(id, name, size, createdTime, mimeType)',
      orderBy: 'name',
      pageSize: 100
    });

    if (!filesSearch.data.files || filesSearch.data.files.length === 0) {
      console.log('⚠️  Folder is empty!\n');
      return;
    }

    const files = filesSearch.data.files;
    console.log(`Found ${files.length} files:\n`);

    // Critical files to check for
    const criticalFiles = [
      'Code.gs',
      'ATSR_Title_Generator_Feature.gs',
      'Categories_Pathways_Feature_Phase2.gs',
      'Categories_Pathways_Feature.gs'
    ];

    const foundFiles = {};

    files.forEach((file, index) => {
      const sizeKB = file.size ? Math.round(file.size / 1024) : 'N/A';
      const created = new Date(file.createdTime).toLocaleString();

      console.log(`${index + 1}. ${file.name}`);
      console.log(`   Size: ${sizeKB} KB`);
      console.log(`   Created: ${created}`);
      console.log(`   Type: ${file.mimeType}`);
      console.log('');

      // Track critical files
      criticalFiles.forEach(criticalFile => {
        if (file.name.includes(criticalFile) || file.name === criticalFile) {
          foundFiles[criticalFile] = true;
        }
      });
    });

    // Check if all critical files are backed up
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 CRITICAL FILES CHECK:\n');

    let allCriticalFound = true;
    criticalFiles.forEach(criticalFile => {
      if (foundFiles[criticalFile]) {
        console.log(`✅ ${criticalFile} - BACKED UP`);
      } else {
        console.log(`❌ ${criticalFile} - NOT FOUND IN BACKUPS`);
        allCriticalFound = false;
      }
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    if (allCriticalFound) {
      console.log('✅ ALL CRITICAL FILES ARE BACKED UP!\n');
      console.log('Your work is safe. All important files have backups.\n');
    } else {
      console.log('⚠️  SOME CRITICAL FILES ARE MISSING FROM BACKUPS!\n');
      console.log('Consider creating additional backups of missing files.\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

verify();
