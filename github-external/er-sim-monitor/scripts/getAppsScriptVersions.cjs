#!/usr/bin/env node

/**
 * Get Apps Script Version History
 * Fetch all versions to find the old working version
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SCRIPT_ID = '1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6';

async function getVersionHistory() {
  console.log('🕰️  Fetching Apps Script Version History\n');
  console.log('════════════════════════════════════════════════════\n');

  // Authenticate
  console.log('🔑 Authenticating...');
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);
  console.log('   ✅ Authenticated\n');

  const script = google.script({version: 'v1', auth: oAuth2Client});

  // Get versions
  console.log('📜 Fetching version history...');
  const versions = await script.projects.versions.list({scriptId: SCRIPT_ID});

  console.log(`   ✅ Found ${versions.data.versions.length} versions\n`);

  console.log('════════════════════════════════════════════════════');
  console.log('VERSION HISTORY');
  console.log('════════════════════════════════════════════════════\n');

  versions.data.versions.reverse().forEach((v, idx) => {
    const date = new Date(v.createTime);
    const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    console.log(`${idx + 1}. Version ${v.versionNumber}`);
    console.log(`   Created: ${dateStr}`);
    console.log(`   Description: ${v.description || '(no description)'}\n`);
  });

  console.log('════════════════════════════════════════════════════');
  console.log('💡 Which version was working well?');
  console.log('════════════════════════════════════════════════════\n');

  console.log('To restore an old version:');
  console.log('1. Note the version number above');
  console.log('2. Open Apps Script editor');
  console.log('3. Click: File → Version history');
  console.log('4. Select the working version');
  console.log('5. Click "Restore this version"\n');

  // Save version list to file
  const outputPath = path.join(__dirname, '../apps-script-backup/version-history.json');
  fs.writeFileSync(outputPath, JSON.stringify(versions.data, null, 2));
  console.log(`📝 Full version history saved to:`);
  console.log(`   ${outputPath}\n`);
}

getVersionHistory().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
