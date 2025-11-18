#!/usr/bin/env node

/**
 * Create a complete backup snapshot of current state
 * before making any changes
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const STANDALONE_PROJECT_ID = '1Bkbm2MNA-YmXQEoMsIlC-VgEgHiQHO2EuMXR-yyxy9lYWl3eNcEHk_S-';

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

async function backup() {
  console.log('\n💾 CREATING BACKUP OF CURRENT STATE\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    console.log('📥 Fetching current standalone project...\n');

    const project = await script.projects.getContent({
      scriptId: STANDALONE_PROJECT_ID
    });

    // Create backup directory with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, `../backups/apps-script-${timestamp}`);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`📁 Backup directory: ${backupDir}\n`);

    // Save each file
    project.data.files.forEach(file => {
      const filename = file.name === 'appsscript' ? 'appsscript.json' : `${file.name}.gs`;
      const filepath = path.join(backupDir, filename);

      fs.writeFileSync(filepath, file.source);

      const size = Math.round(file.source.length / 1024);
      console.log(`✅ Saved: ${filename} (${size} KB)`);
    });

    // Save project metadata
    const metadata = {
      projectId: STANDALONE_PROJECT_ID,
      projectName: 'ER Sim - ATSR Tool (Standalone)',
      backupDate: new Date().toISOString(),
      files: project.data.files.map(f => ({
        name: f.name,
        type: f.type,
        size: f.source.length
      }))
    };

    fs.writeFileSync(
      path.join(backupDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ BACKUP COMPLETE!\n');
    console.log(`📦 Location: ${backupDir}\n`);
    console.log('This backup can be used to restore if anything goes wrong.\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    return backupDir;

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

backup().catch(console.error);
