#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function listProjects() {
  try {
    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');

    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

    console.log('📋 Searching for Apps Script projects...\n');

    // Search for Apps Script files in Drive
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.script'",
      fields: 'files(id, name, createdTime, modifiedTime)',
      pageSize: 20
    });

    if (response.data.files.length === 0) {
      console.log('No Apps Script projects found');
      return;
    }

    console.log(`Found ${response.data.files.length} Apps Script projects:\n`);

    response.data.files.forEach((file, idx) => {
      console.log(`${idx + 1}. ${file.name}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   Modified: ${file.modifiedTime}\n`);
    });

    // Try to get content from the APPS_SCRIPT_ID in .env
    const envScriptId = process.env.APPS_SCRIPT_ID;
    if (envScriptId) {
      console.log(`\n🔍 Trying to access project from .env: ${envScriptId}\n`);
      try {
        const content = await script.projects.getContent({
          scriptId: envScriptId
        });
        console.log(`✅ Successfully accessed! Files in project:`);
        content.data.files.forEach(f => {
          console.log(`   - ${f.name} (${f.type})`);
        });
      } catch (error) {
        console.log(`❌ Cannot access: ${error.message}`);
        console.log(`\nThis project ID may be incorrect or you may need additional scopes.`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('insufficient authentication scopes')) {
      console.log('\n⚠️  Missing required scopes. You may need to re-authenticate with Apps Script API scope.');
      console.log('   Required scope: https://www.googleapis.com/auth/script.projects');
    }
  }
}

listProjects();
