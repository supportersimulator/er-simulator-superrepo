#!/usr/bin/env node

/**
 * Find the most recent Title Optimizer / ATSR backup from Google Drive
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

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

async function findBackup() {
  console.log('\n🔍 FINDING LATEST TITLE OPTIMIZER / ATSR BACKUP\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });

  try {
    // Search for ATSR-related files in Google Drive
    console.log('📂 Searching Google Drive for ATSR backups...\n');

    const response = await drive.files.list({
      q: "(name contains 'ATSR' or name contains 'Title' or name contains 'Optimizer') and (name contains '.gs' or mimeType='application/vnd.google-apps.script')",
      fields: 'files(id, name, modifiedTime, mimeType, parents)',
      orderBy: 'modifiedTime desc',
      pageSize: 20
    });

    if (response.data.files.length === 0) {
      console.log('❌ No ATSR backups found in Drive\n');
      return;
    }

    console.log(`✅ Found ${response.data.files.length} potential backups:\n`);

    response.data.files.forEach((file, index) => {
      const modifiedDate = new Date(file.modifiedTime);
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   📅 Modified: ${modifiedDate.toLocaleString()}`);
      console.log(`   🆔 ID: ${file.id}`);
      console.log(`   📄 Type: ${file.mimeType}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('💡 MOST RECENT FILE:\n');
    const latest = response.data.files[0];
    console.log(`📄 ${latest.name}`);
    console.log(`📅 ${new Date(latest.modifiedTime).toLocaleString()}`);
    console.log(`🆔 ${latest.id}\n`);

    // If it's a Google Apps Script, try to get its content
    if (latest.mimeType === 'application/vnd.google-apps.script') {
      console.log('🔧 This is an Apps Script project.\n');
      console.log('To get its content, use the Apps Script API with this script ID.\n');
    } else {
      // Try to download if it's a regular file
      console.log('📥 Attempting to download...\n');
      const content = await drive.files.get({
        fileId: latest.id,
        alt: 'media'
      }, { responseType: 'text' });

      const outputPath = path.join(__dirname, `LATEST_${latest.name}`);
      fs.writeFileSync(outputPath, content.data);
      console.log(`✅ Downloaded to: ${outputPath}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

findBackup().catch(console.error);
