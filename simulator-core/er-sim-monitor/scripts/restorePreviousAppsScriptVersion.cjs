#!/usr/bin/env node

/**
 * List and Restore Previous Apps Script Versions
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const SCRIPT_ID = '1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6';

async function restore() {
  console.log('🔐 Authenticating...');
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const {client_id, client_secret, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const tokenPath = path.join(__dirname, '../config/token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  oAuth2Client.setCredentials(token);

  const script = google.script({version: 'v1', auth: oAuth2Client});

  console.log('\n📋 Fetching version history...\n');
  const versions = await script.projects.versions.list({scriptId: SCRIPT_ID});

  if (!versions.data.versions || versions.data.versions.length === 0) {
    console.error('❌ No versions found');
    process.exit(1);
  }

  console.log(`Found ${versions.data.versions.length} versions:\n`);

  versions.data.versions.forEach((v, i) => {
    const date = new Date(v.createTime);
    console.log(`${i + 1}. Version ${v.versionNumber}`);
    console.log(`   Created: ${date.toLocaleString()}`);
    console.log(`   Description: ${v.description || 'No description'}`);
    console.log('');
  });

  console.log(`\n💡 To restore a version, I'll revert to version 2 (the one before today's changes)\n`);

  // Get version 2 content
  const targetVersion = 2;
  console.log(`📥 Fetching version ${targetVersion}...\n`);

  // Unfortunately, Google Apps Script API doesn't support fetching old version content directly
  // We can only list versions, not retrieve their content
  // So instead, let's just rollback by number

  console.log('⚠️  Google Apps Script API does not support restoring old version content programmatically.');
  console.log('📝 You need to restore manually:');
  console.log('');
  console.log('1. Open: https://script.google.com/home/projects/' + SCRIPT_ID);
  console.log('2. Click: File → Version history');
  console.log('3. Find the version from BEFORE today (November 2)');
  console.log('4. Click: "Restore this version"');
  console.log('');
}

restore().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
