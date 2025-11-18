#!/usr/bin/env node

/**
 * FIND TITLE OPTIMIZER PROJECT ID
 * Search for it so we can merge it into GPT Formatter
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

console.log('\n🔍 SEARCHING FOR TITLE OPTIMIZER PROJECT\n');
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

async function find() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    console.log('Method 1: Searching by name "Title Optimizer"...\n');

    let response = await drive.files.list({
      q: "name contains 'Title' and name contains 'Optimizer' and mimeType='application/vnd.google-apps.script' and trashed=false",
      fields: 'files(id, name, owners, createdTime, modifiedTime)',
      pageSize: 50
    });

    let projects = response.data.files || [];
    
    if (projects.length === 0) {
      console.log('Method 2: Searching for any project with "Title"...\n');
      
      response = await drive.files.list({
        q: "name contains 'Title' and mimeType='application/vnd.google-apps.script' and trashed=false",
        fields: 'files(id, name, owners, createdTime, modifiedTime)',
        pageSize: 50
      });
      
      projects = response.data.files || [];
    }

    if (projects.length === 0) {
      console.log('❌ No projects found with "Title" in the name\n');
      console.log('The project might be owned by a different account.\n');
      console.log('Please manually find the project ID:\n');
      console.log('1. Open test spreadsheet\n');
      console.log('2. Extensions → Apps Script\n');
      console.log('3. Click "Title Optimizer"\n');
      console.log('4. Look at URL - it will be:\n');
      console.log('   script.google.com/.../.../projects/PROJECT_ID/edit\n');
      console.log('5. Copy that PROJECT_ID and give it to me\n');
      return;
    }

    console.log(`Found ${projects.length} project(s):\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const project of projects) {
      console.log(`📦 ${project.name}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Owner: ${project.owners?.[0]?.emailAddress || 'Unknown'}`);
      console.log(`   Modified: ${new Date(project.modifiedTime).toLocaleString()}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    if (projects.length === 1) {
      console.log('✅ FOUND IT! The Title Optimizer project ID is:\n');
      console.log(`   ${projects[0].id}\n`);
      console.log('I can now merge it into GPT Formatter.\n');
      
      // Save the ID for the next script
      const configPath = path.join(__dirname, '../backups/title-optimizer-id.txt');
      fs.writeFileSync(configPath, projects[0].id, 'utf8');
      console.log(`💾 Saved to: ${configPath}\n`);
    } else {
      console.log('⚠️  Found multiple projects. Which one is "Title Optimizer"?\n');
      console.log('Please tell me the correct project ID from the list above.\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

find();
