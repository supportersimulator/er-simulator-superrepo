#!/usr/bin/env node
/**
 * Import Drive Documentation Files
 * Downloads and organizes documentation from Google Drive
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

function categorizeDocFile(file) {
  const name = file.name.toLowerCase();

  // Determine destination folder
  let destFolder = 'docs/drive-imports/misc';

  // Categorize by content type
  if (name.includes('deploy') || name.includes('deployment')) {
    destFolder = 'docs/drive-imports/deployment';
  } else if (name.includes('test') || name.includes('testing')) {
    destFolder = 'docs/drive-imports/testing';
  } else if (name.includes('cache') || name.includes('fix')) {
    destFolder = 'docs/drive-imports/technical';
  } else if (name.includes('tool') || name.includes('workflow') || name.includes('inventory')) {
    destFolder = 'docs/drive-imports/tools';
  } else if (name.includes('legacy') || name.includes('v3.7')) {
    destFolder = 'docs/drive-imports/legacy';
  } else if (name.includes('readme') || name.includes('guide') || name.includes('documentation')) {
    destFolder = 'docs/drive-imports/guides';
  } else if (name.endsWith('.cjs') || name.endsWith('.js')) {
    // These are actually scripts, not docs
    destFolder = 'google-drive-code/utilities';
  }

  return destFolder;
}

async function downloadFile(drive, fileId) {
  try {
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'text' }
    );
    return response.data;
  } catch (error) {
    console.error(`   ❌ Error downloading: ${error.message}`);
    return null;
  }
}

async function importDocFiles(drive) {
  console.log('📝 Importing Documentation Files from Drive...\n');

  // Load inventory
  if (!fs.existsSync(INVENTORY_PATH)) {
    console.error('❌ Inventory file not found. Run discoverDriveFiles.cjs first.');
    process.exit(1);
  }

  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf-8'));
  const docFiles = inventory.docs;

  console.log(`📦 Found ${docFiles.length} documentation files to import\n`);

  const stats = {
    total: docFiles.length,
    downloaded: 0,
    skipped: 0,
    failed: 0,
    byCategory: {}
  };

  for (const file of docFiles) {
    const destFolder = categorizeDocFile(file);
    const destDir = path.join(BASE_OUTPUT_DIR, destFolder);

    // Create directory if needed
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Download file
    console.log(`📥 ${file.name}`);
    console.log(`   → ${destFolder}/`);

    const content = await downloadFile(drive, file.id);

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
  const reportPath = path.join(BASE_OUTPUT_DIR, 'tmp', 'docs-import-report.json');
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
    const stats = await importDocFiles(drive);
    console.log(`✅ Documentation import complete! ${stats.downloaded} files downloaded.`);
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

main();
