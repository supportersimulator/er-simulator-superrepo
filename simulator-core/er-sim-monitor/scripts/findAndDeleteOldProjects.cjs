#!/usr/bin/env node

/**
 * FIND AND DELETE OLD APPS SCRIPT PROJECTS
 * Keep only GPT Formatter, delete all others
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';
const KEEP_PROJECTS = [GPT_FORMATTER_ID];

console.log('\n🗑️  FINDING OLD APPS SCRIPT PROJECTS TO DELETE\n');
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

async function findAndDelete() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    console.log('🔍 Searching for Apps Script projects with ATSR or ER Simulator...\n');

    // Search for Apps Script projects
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.script' and (name contains 'ATSR' or name contains 'ER Simulator' or name contains 'Title' or name contains 'Optimizer')",
      fields: 'files(id, name, createdTime, modifiedTime)',
      pageSize: 100
    });

    const projects = response.data.files || [];

    console.log(`Found ${projects.length} Apps Script project(s):\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    const toDelete = [];
    const toKeep = [];

    for (const project of projects) {
      console.log(`📦 ${project.name}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Created: ${new Date(project.createdTime).toLocaleString()}`);
      console.log(`   Modified: ${new Date(project.modifiedTime).toLocaleString()}`);

      if (project.id === GPT_FORMATTER_ID) {
        console.log(`   ✅ KEEP - This is GPT Formatter (our unified project)\n`);
        toKeep.push(project);
      } else {
        console.log(`   🗑️  DELETE - Not needed anymore\n`);
        toDelete.push(project);
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 SUMMARY:\n');
    console.log(`   Projects to KEEP: ${toKeep.length}`);
    toKeep.forEach(p => console.log(`      ✅ ${p.name}`));
    console.log('');
    console.log(`   Projects to DELETE: ${toDelete.length}`);
    toDelete.forEach(p => console.log(`      🗑️  ${p.name}`));
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    if (toDelete.length === 0) {
      console.log('✅ No projects to delete!\n');
      return;
    }

    console.log('🗑️  DELETING OLD PROJECTS...\n');

    for (const project of toDelete) {
      try {
        await drive.files.delete({
          fileId: project.id
        });
        console.log(`   ✅ Deleted: ${project.name}`);
      } catch (error) {
        console.log(`   ❌ Failed to delete ${project.name}: ${error.message}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('✅ CLEANUP COMPLETE!\n');
    console.log('   Only GPT Formatter remains.\n');
    console.log('   Refresh spreadsheet to see single "🧠 Sim Builder" menu.\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

findAndDelete();
