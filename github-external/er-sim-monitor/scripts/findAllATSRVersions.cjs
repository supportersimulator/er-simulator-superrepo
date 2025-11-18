#!/usr/bin/env node

/**
 * Find ALL ATSR/Title Optimizer versions with dates
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

async function findAll() {
  console.log('\n🔍 FINDING ALL ATSR/TITLE OPTIMIZER VERSIONS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });
  const script = google.script({ version: 'v1', auth });

  try {
    // Search Google Drive with broader criteria
    console.log('📂 Searching Google Drive...\n');

    const response = await drive.files.list({
      q: "(name contains 'ATSR' or name contains 'Title' or name contains 'Optimizer' or name contains 'ER Sim') and trashed=false",
      fields: 'files(id, name, modifiedTime, createdTime, mimeType, parents)',
      orderBy: 'modifiedTime desc',
      pageSize: 50
    });

    console.log(`✅ Found ${response.data.files.length} files:\n`);

    const versions = [];

    for (const file of response.data.files) {
      const modifiedDate = new Date(file.modifiedTime);
      const createdDate = new Date(file.createdTime);

      const version = {
        name: file.name,
        id: file.id,
        modified: modifiedDate,
        created: createdDate,
        type: file.mimeType,
        isScript: file.mimeType === 'application/vnd.google-apps.script'
      };

      // If it's an Apps Script, try to get more details
      if (version.isScript) {
        try {
          const project = await script.projects.get({ scriptId: file.id });
          version.title = project.data.title;

          // Get file list
          const content = await script.projects.getContent({ scriptId: file.id });
          version.files = content.data.files.map(f => f.name);
          version.hasATSR = content.data.files.some(f =>
            f.source && (f.source.includes('runATSRTitleGenerator') || f.source.includes('ATSR'))
          );
        } catch (e) {
          // Skip if can't access
        }
      }

      versions.push(version);
    }

    // Sort by date (newest first)
    versions.sort((a, b) => b.modified - a.modified);

    console.log('📋 ALL VERSIONS (sorted by date):\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    versions.forEach((v, index) => {
      console.log(`${index + 1}. ${v.name}`);
      console.log(`   📅 Modified: ${v.modified.toLocaleString()}`);
      console.log(`   🎂 Created: ${v.created.toLocaleString()}`);
      console.log(`   🆔 ID: ${v.id}`);

      if (v.isScript) {
        console.log(`   📜 Type: Apps Script Project`);
        if (v.files) {
          console.log(`   📋 Files: ${v.files.join(', ')}`);
        }
        if (v.hasATSR !== undefined) {
          console.log(`   ${v.hasATSR ? '✅' : '❌'} Has ATSR functionality`);
        }
      } else {
        console.log(`   📄 Type: ${v.type.split('.').pop()}`);
      }
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\n💡 APPS SCRIPT PROJECTS WITH ATSR:\n');

    const scriptsWithATSR = versions.filter(v => v.isScript && v.hasATSR);

    if (scriptsWithATSR.length > 0) {
      scriptsWithATSR.forEach((v, index) => {
        console.log(`${index + 1}. ${v.name}`);
        console.log(`   📅 ${v.modified.toLocaleString()}`);
        console.log(`   🆔 ${v.id}\n`);
      });
    } else {
      console.log('   (None found)\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

findAll().catch(console.error);
