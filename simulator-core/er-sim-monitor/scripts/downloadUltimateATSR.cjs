#!/usr/bin/env node

/**
 * Download Code_ULTIMATE_ATSR.gs from Google Drive
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

async function download() {
  console.log('\n📥 DOWNLOADING Code_ULTIMATE_ATSR.gs FROM GOOGLE DRIVE\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });

  try {
    // Find the file
    console.log('🔍 Searching for Code_ULTIMATE_ATSR.gs...\n');

    const response = await drive.files.list({
      q: "name='Code_ULTIMATE_ATSR.gs' and trashed=false",
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 10
    });

    if (response.data.files.length === 0) {
      console.log('❌ File not found in Drive\n');
      return;
    }

    console.log(`✅ Found ${response.data.files.length} version(s):\n`);

    response.data.files.forEach((file, index) => {
      const modifiedDate = new Date(file.modifiedTime);
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   📅 Modified: ${modifiedDate.toLocaleString()}`);
      console.log(`   🆔 ID: ${file.id}\n`);
    });

    // Download the most recent one
    const latestFile = response.data.files[0];
    console.log(`📥 Downloading most recent version...\n`);

    const content = await drive.files.get({
      fileId: latestFile.id,
      alt: 'media'
    }, { responseType: 'text' });

    const outputPath = path.join(__dirname, 'Code_ULTIMATE_ATSR_FROM_DRIVE.gs');
    fs.writeFileSync(outputPath, content.data);

    console.log(`✅ Downloaded to: ${outputPath}\n`);

    // Quick analysis
    const code = content.data;
    const hasATSR = code.includes('runATSRTitleGenerator');
    const hasOnOpen = code.includes('function onOpen()');
    const hasTestMenu = code.includes('TEST') && code.includes('createMenu');
    const codeSize = Math.round(code.length / 1024);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 FILE ANALYSIS:\n');
    console.log(`   Size: ${codeSize} KB`);
    console.log(`   onOpen() function: ${hasOnOpen ? '✅' : '❌'}`);
    console.log(`   TEST menu: ${hasTestMenu ? '✅' : '❌'}`);
    console.log(`   runATSRTitleGenerator: ${hasATSR ? '✅' : '❌'}\n`);

    // Compare with local backup
    const backupPath = path.join(__dirname, '../apps-script-backup/Code.gs');
    if (fs.existsSync(backupPath)) {
      const backupCode = fs.readFileSync(backupPath, 'utf8');
      const backupSize = Math.round(backupCode.length / 1024);

      console.log('📋 COMPARISON WITH apps-script-backup/Code.gs:\n');
      console.log(`   Drive version: ${codeSize} KB`);
      console.log(`   Backup version: ${backupSize} KB`);
      console.log(`   Difference: ${codeSize - backupSize > 0 ? '+' : ''}${codeSize - backupSize} KB\n`);

      if (code === backupCode) {
        console.log('   ✅ Files are IDENTICAL\n');
      } else {
        console.log('   ⚠️  Files are DIFFERENT\n');
        console.log('   The Drive version is newer/different from the backup.\n');
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

download().catch(console.error);
