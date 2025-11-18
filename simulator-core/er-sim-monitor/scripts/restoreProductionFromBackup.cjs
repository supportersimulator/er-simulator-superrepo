#!/usr/bin/env node

/**
 * EMERGENCY: Restore production from backup before broken batch caching deployment
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

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

async function restore() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Reading backup file...\n');

    const backupPath = path.join(__dirname, '../backups/current-production-2025-11-08T04-54-48.gs');
    const backupCode = fs.readFileSync(backupPath, 'utf8');

    console.log('✅ Backup loaded (' + backupCode.length + ' characters)\n');

    console.log('📥 Downloading current manifest...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    console.log('📤 Restoring production code...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: backupCode },
          manifestFile
        ]
      }
    });

    console.log('✅ PRODUCTION RESTORED FROM BACKUP!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Production is now back to working state');
    console.log('Backup: field-selector-complete-2025-11-08T03-11-29.gs');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

restore();
