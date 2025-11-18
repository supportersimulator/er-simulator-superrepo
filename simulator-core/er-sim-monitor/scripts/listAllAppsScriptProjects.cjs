#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n📋 LISTING ALL APPS SCRIPT PROJECTS\n');
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

async function listAll() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    console.log('🔍 Searching for ALL Apps Script projects...\n');

    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.script'",
      fields: 'files(id, name, createdTime, modifiedTime)',
      pageSize: 100,
      orderBy: 'modifiedTime desc'
    });

    const projects = response.data.files || [];

    console.log(`Found ${projects.length} Apps Script project(s):\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    const toDelete = [];

    for (const project of projects) {
      console.log(`📦 ${project.name}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Modified: ${new Date(project.modifiedTime).toLocaleString()}`);

      if (project.id === GPT_FORMATTER_ID) {
        console.log(`   ✅ KEEP - GPT Formatter (unified menu)\n`);
      } else {
        console.log(`   🗑️  Can delete\n`);
        toDelete.push(project);
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    if (toDelete.length > 0) {
      console.log(`Found ${toDelete.length} projects that can be deleted:\n`);
      
      // Save deletion list
      const deletionScript = toDelete.map(p => ({
        id: p.id,
        name: p.name,
        modified: p.modifiedTime
      }));

      const scriptPath = path.join(__dirname, '../backups/projects-to-delete.json');
      fs.writeFileSync(scriptPath, JSON.stringify(deletionScript, null, 2), 'utf8');
      
      console.log(`💾 Saved list to: ${scriptPath}\n`);
      console.log('Run deletion? (we can create a script to delete them)\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

listAll();
