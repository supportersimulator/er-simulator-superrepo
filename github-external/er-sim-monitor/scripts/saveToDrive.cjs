#!/usr/bin/env node

/**
 * Save current production code to Google Drive with timestamp
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

async function saveToDrive() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    console.log('📥 Downloading current production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');

    // Create timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const filename = `field-selector-complete-${timestamp}.gs`;

    // Save locally first
    const backupPath = path.join(__dirname, '../backups', filename);
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`✅ Saved locally: ${backupPath}\n`);

    // Create summary document
    const summary = `FIELD SELECTOR MODAL - PRODUCTION BACKUP
Date: ${now.toLocaleString()}
Commit: 10392d6

BREAKTHROUGH ACHIEVEMENT:
Fixed field selector modal that was stuck on "Loading..." for weeks.

KEY TECHNICAL SOLUTION:
- Moved <script> to <head> with DOMContentLoaded listener
- Used data attributes + event listeners instead of inline handlers
- Built incrementally (4 steps) to isolate rendering issues

FEATURES IMPLEMENTED:
✅ Live Log panel at top (green terminal, copy button)
✅ 3-section layout: DEFAULT, RECOMMENDED, OTHER
✅ Interactive checkboxes with live count
✅ GPT-4 AI recommendations integration
✅ Smart badge system: ✨ AI badges for approved defaults
✅ Save to DocumentProperties
✅ Auto-close after save

PRODUCTION STATUS:
Fully functional and deployed.

FILE CONTENTS BELOW:
${'='.repeat(80)}

${codeFile.source}
`;

    // Upload to Google Drive
    console.log('📤 Uploading to Google Drive...\n');

    const fileMetadata = {
      name: filename,
      mimeType: 'text/plain',
      parents: ['root'] // You can specify a folder ID if you want
    };

    const media = {
      mimeType: 'text/plain',
      body: summary
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink'
    });

    console.log('✅ Uploaded to Google Drive!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📁 BACKUP SAVED TO GOOGLE DRIVE');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`File: ${file.data.name}`);
    console.log(`ID: ${file.data.id}`);
    if (file.data.webViewLink) {
      console.log(`Link: ${file.data.webViewLink}`);
    }
    console.log(`\nLocal backup: ${backupPath}`);
    console.log(`\nTimestamp: ${now.toLocaleString()}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

saveToDrive();
