#!/usr/bin/env node

/**
 * Find the production spreadsheet with working Title Optimizer
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris} = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function find() {
  console.log('\n🔍 FINDING PRODUCTION SPREADSHEET WITH TITLE OPTIMIZER\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });
  const script = google.script({ version: 'v1', auth });

  try {
    // Search for ER Sim spreadsheets
    console.log('📂 Searching for ER Sim spreadsheets...\n');

    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and (name contains 'ER Sim' or name contains 'Convert' or name contains 'Master') and trashed=false",
      fields: 'files(id, name, modifiedTime, createdTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 20
    });

    console.log(`✅ Found ${response.data.files.length} spreadsheets:\n`);

    for (const file of response.data.files) {
      const modifiedDate = new Date(file.modifiedTime);

      console.log(`📊 ${file.name}`);
      console.log(`   📅 Modified: ${modifiedDate.toLocaleString()}`);
      console.log(`   🆔 ${file.id}`);

      // Try to find bound script
      const scriptId = file.id;  // Container-bound scripts use spreadsheet ID

      try {
        const project = await script.projects.get({ scriptId });
        console.log(`   ✅ Has container-bound script!`);
        console.log(`   📜 Script: ${project.data.title || 'Untitled'}`);

        // Get content
        const content = await script.projects.getContent({ scriptId });
        const hasATSR = content.data.files.some(f =>
          f.source && (f.source.includes('runATSRTitleGenerator') || f.source.includes('ATSR'))
        );
        const hasTestMenu = content.data.files.some(f =>
          f.source && f.source.includes('TEST') && f.source.includes('createMenu')
        );

        console.log(`   ${hasATSR ? '✅' : '❌'} ATSR functionality`);
        console.log(`   ${hasTestMenu ? '✅' : '❌'} TEST menu`);

      } catch (e) {
        console.log(`   ❌ No container-bound script`);
      }

      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

find().catch(console.error);
