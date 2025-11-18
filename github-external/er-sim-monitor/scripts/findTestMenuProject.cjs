#!/usr/bin/env node

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

async function findProject() {
  console.log('\n🔍 SEARCHING ALL APPS SCRIPT PROJECTS FOR TEST MENU\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });

  try {
    // List all Apps Script projects
    console.log('📋 Listing all Apps Script projects...\n');
    
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.script'",
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 50
    });

    console.log(`Found ${response.data.files.length} Apps Script projects\n`);

    // Check each project for TEST menu
    for (const file of response.data.files) {
      try {
        console.log(`\n🔍 Checking: ${file.name}`);
        console.log(`   Script ID: ${file.id}`);
        
        const project = await script.projects.getContent({ scriptId: file.id });
        
        // Check if any file contains TEST menu code
        const hasTestMenu = project.data.files.some(f => 
          f.source && (
            f.source.includes('TEST') && 
            f.source.includes('createMenu') &&
            (f.source.includes('Titles Optimizer') || f.source.includes('Categories'))
          )
        );

        if (hasTestMenu) {
          console.log('   ✅ FOUND TEST MENU!\n');
          console.log('═══════════════════════════════════════════════════════════════');
          console.log('🎯 PRODUCTION SCRIPT FOUND:\n');
          console.log(`   Name: ${file.name}`);
          console.log(`   Script ID: ${file.id}\n`);
          
          // List all files in this project
          console.log('📄 Files in this project:');
          project.data.files.forEach(f => {
            console.log(`   • ${f.name}`);
            if (f.source && f.source.includes('onOpen')) {
              console.log('     ✅ Contains onOpen()');
            }
            if (f.source && f.source.includes('TEST')) {
              console.log('     ✅ Contains TEST menu');
            }
          });
          
          console.log('\n═══════════════════════════════════════════════════════════════\n');
          return file.id;
        } else {
          console.log('   ⏭️  No TEST menu found');
        }
        
      } catch (e) {
        console.log(`   ⚠️  Could not access: ${e.message}`);
      }
    }

    console.log('\n❌ Could not find project with TEST menu\n');
    return null;

  } catch (e) {
    console.log('\n❌ Failed: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
    return null;
  }
}

findProject().catch(console.error);
