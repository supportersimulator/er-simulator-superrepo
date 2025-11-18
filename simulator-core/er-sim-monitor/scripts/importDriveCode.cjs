#!/usr/bin/env node
/**
 * Import Drive Code Files
 * Downloads and organizes code files from Google Drive
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN_PATH = path.join(__dirname, '..', 'config', 'token.json');
const INVENTORY_PATH = path.join(__dirname, '..', '..', '..', 'tmp', 'drive-inventory.json');
const BASE_OUTPUT_DIR = path.join(__dirname, '..', '..', '..');

async function authenticateDrive() {
  const credentials = {
    installed: {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uris: ['http://localhost']
    }
  };

  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (!fs.existsSync(TOKEN_PATH)) {
    console.error('❌ Token file not found at:', TOKEN_PATH);
    process.exit(1);
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  oAuth2Client.setCredentials(token);

  return oAuth2Client;
}

function categorizeCodeFile(file) {
  const name = file.name.toLowerCase();
  const subcategory = file.subcategory;

  // Determine destination folder
  let destFolder = 'google-drive-code/misc';
  let isLegacy = false;

  // Check if it's a dated backup (legacy)
  if (name.match(/\d{4}-\d{2}-\d{2}/) || name.includes('backup') || name.includes('archive')) {
    isLegacy = true;
  }

  // Categorize by subcategory
  if (subcategory === 'apps-script-tools') {
    destFolder = isLegacy ? 'legacy-apps-script/atsr-tools' : 'google-drive-code/atsr-tools';
  } else if (subcategory === 'sim-builder') {
    destFolder = isLegacy ? 'legacy-apps-script/sim-builder' : 'google-drive-code/sim-builder';
  } else if (subcategory === 'apps-script') {
    destFolder = isLegacy ? 'legacy-apps-script/general' : 'google-drive-code/apps-script';
  } else {
    // General code (JS, JSON, HTML utilities)
    if (name.includes('sync') || name.includes('fetch') || name.includes('live')) {
      destFolder = 'google-drive-code/utilities';
    } else if (name.includes('manifest') || name.includes('metadata')) {
      destFolder = isLegacy ? 'legacy-apps-script/manifests' : 'google-drive-code/manifests';
    } else {
      destFolder = isLegacy ? 'legacy-apps-script/misc' : 'google-drive-code/misc';
    }
  }

  return destFolder;
}

async function downloadFile(drive, fileId, destPath) {
  try {
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'text' }
    );
    return response.data;
  } catch (error) {
    console.error(`   ❌ Error downloading file: ${error.message}`);
    return null;
  }
}

async function importCodeFiles(drive) {
  console.log('💾 Importing Code Files from Drive...\n');

  // Load inventory
  if (!fs.existsSync(INVENTORY_PATH)) {
    console.error('❌ Inventory file not found. Run discoverDriveFiles.cjs first.');
    process.exit(1);
  }

  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8'));
  const codeFiles = inventory.code;

  console.log(`📦 Found ${codeFiles.length} code files to import\n`);

  const stats = {
    total: codeFiles.length,
    downloaded: 0,
    skipped: 0,
    failed: 0,
    byCategory: {}
  };

  for (const file of codeFiles) {
    const destFolder = categorizeCodeFile(file);
    const destDir = path.join(BASE_OUTPUT_DIR, destFolder);

    // Create directory if needed
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Download file
    console.log(`📥 ${file.name}`);
    console.log(`   → ${destFolder}/`);

    const content = await downloadFile(drive, file.id, destDir);

    if (content !== null) {
      const filePath = path.join(destDir, file.name);
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`   ✅ Saved`);
      stats.downloaded++;

      // Track by category
      if (!stats.byCategory[destFolder]) {
        stats.byCategory[destFolder] = 0;
      }
      stats.byCategory[destFolder]++;
    } else {
      console.log(`   ❌ Failed to download`);
      stats.failed++;
    }

    console.log('');
  }

  // Save import report
  const reportPath = path.join(BASE_OUTPUT_DIR, 'tmp', 'code-import-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(stats, null, 2));

  console.log('\n📊 IMPORT SUMMARY:\n');
  console.log(`Total files: ${stats.total}`);
  console.log(`✅ Downloaded: ${stats.downloaded}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`\nBy Category:`);
  Object.entries(stats.byCategory).forEach(([category, count]) => {
    console.log(`  - ${category}: ${count} files`);
  });

  console.log(`\n📋 Report saved: ${reportPath}\n`);

  return stats;
}

async function main() {
  try {
    const auth = await authenticateDrive();
    const drive = google.drive({ version: 'v3', auth });
    const stats = await importCodeFiles(drive);
    console.log(`✅ Code import complete! ${stats.downloaded} files downloaded.`);
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

main();
