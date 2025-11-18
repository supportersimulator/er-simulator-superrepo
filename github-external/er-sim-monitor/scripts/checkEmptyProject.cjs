#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const EMPTY_PROJECT_ID = '1bwLs70zTwQsJxtAqA_yNJfyANjAW5x39YEY0VJhFPMamgDwb100qtqJD';

console.log('\n🔍 CHECKING EMPTY PROJECT\n');
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

async function checkProject() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    // Get project metadata from Drive
    console.log('📥 Reading project metadata...\n');
    
    const driveFile = await drive.files.get({
      fileId: EMPTY_PROJECT_ID,
      fields: 'id, name, createdTime, modifiedTime, owners'
    });

    console.log('Project Name: ' + driveFile.data.name);
    console.log('Project ID: ' + driveFile.data.id);
    console.log('Created: ' + new Date(driveFile.data.createdTime).toLocaleString());
    console.log('Modified: ' + new Date(driveFile.data.modifiedTime).toLocaleString());
    console.log('');

    // Get project content from Apps Script API
    console.log('📄 Reading project contents...\n');
    
    const project = await script.projects.getContent({
      scriptId: EMPTY_PROJECT_ID
    });

    const files = project.data.files || [];
    
    console.log('Number of files: ' + files.length);
    
    if (files.length === 0) {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('✅ CONFIRMED: This project is EMPTY (0 files)\n');
      console.log('📋 RECOMMENDATION: SAFE TO DELETE\n');
      console.log('Why:\n');
      console.log('   • No code files present');
      console.log('   • Not being used for anything');
      console.log('   • Likely created by accident or as test\n');
      console.log('How to delete:\n');
      console.log('   1. Go to https://script.google.com/home');
      console.log('   2. Find "' + driveFile.data.name + '"');
      console.log('   3. Click ⋮ menu → Move to trash\n');
      console.log('Or run: node scripts/deleteEmptyProject.cjs\n');
      console.log('═══════════════════════════════════════════════════════════════\n');
    } else {
      console.log('\nFiles in project:\n');
      files.forEach((file, index) => {
        const sizeKB = file.source ? Math.round(file.source.length / 1024) : 0;
        console.log((index + 1) + '. ' + file.name + ' (' + file.type + ') - ' + sizeKB + ' KB');
        if (file.source && file.source.trim().length === 0) {
          console.log('   ⚠️  File is empty (no code)');
        }
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

checkProject();
