#!/usr/bin/env node

/**
 * RESTORE PROJECT FROM GOOGLE DRIVE BACKUP
 * Restores the Title Optimizer project from today's backup
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PROJECT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf'; // Title Optimizer
const BACKUP_DIR = path.join(__dirname, '../backups/all-projects-2025-11-06/test1-1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf');

console.log('\n🔄 RESTORING PROJECT FROM BACKUP\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

async function restoreProject() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📂 Reading backup files from:', BACKUP_DIR, '\n');

    // Read all .gs files from backup
    const backupFiles = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.gs') || f.endsWith('.html'));

    console.log(`Found ${backupFiles.length} backup files:\n`);
    backupFiles.forEach(f => console.log(`   - ${f}`));

    const filesToRestore = backupFiles.map(filename => {
      const filePath = path.join(BACKUP_DIR, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      const name = filename.replace(/\.(gs|html)$/, '');
      const type = filename.endsWith('.html') ? 'HTML' : 'SERVER_JS';

      console.log(`\n   Reading ${filename} (${(content.length / 1024).toFixed(1)} KB)`);

      return {
        name,
        type,
        source: content
      };
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('💾 Uploading restored files to Apps Script...\n');

    await script.projects.updateContent({
      scriptId: PROJECT_ID,
      requestBody: {
        files: filesToRestore
      }
    });

    console.log('✅ Successfully restored project from backup!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📋 RESTORED FILES:\n');
    filesToRestore.forEach((file, i) => {
      console.log(`   ${i + 1}. ${file.name} (${file.type})`);
    });
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('🎯 PROJECT RESTORED TO CLEAN STATE\n');
    console.log('All files restored from backup made before the failed modification.\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

restoreProject();
