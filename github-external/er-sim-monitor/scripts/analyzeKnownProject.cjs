#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

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

async function analyze() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    console.log('\n🔍 ANALYZING KNOWN TEST PROJECT\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Get the TEST project
    const project = await script.projects.get({ scriptId: TEST_SCRIPT_ID });
    
    console.log('📦 TEST Project Details:\n');
    console.log('   Title: ' + project.data.title);
    console.log('   Script ID: ' + TEST_SCRIPT_ID);
    console.log('   Created: ' + new Date(project.data.createTime).toLocaleString());
    console.log('   Updated: ' + new Date(project.data.updateTime).toLocaleString());
    
    if (project.data.parentId) {
      console.log('   Parent (Spreadsheet) ID: ' + project.data.parentId);
      
      // Get spreadsheet details
      try {
        const spreadsheet = await drive.files.get({
          fileId: project.data.parentId,
          fields: 'id, name, webViewLink'
        });
        
        console.log('\n📊 Bound to Spreadsheet:\n');
        console.log('   Name: ' + spreadsheet.data.name);
        console.log('   ID: ' + spreadsheet.data.id);
        console.log('   Link: ' + spreadsheet.data.webViewLink);
      } catch (e) {
        console.log('\n⚠️  Could not get parent spreadsheet details');
      }
    }

    console.log('\n\n═══════════════════════════════════════════════════════════════\n');
    console.log('💡 RECOMMENDATION:\n');
    console.log('Since the Drive API is not finding Apps Script projects, they are likely\n');
    console.log('container-bound scripts attached to spreadsheets (not standalone projects).\n\n');
    console.log('To examine all your projects:\n\n');
    console.log('1. Open https://script.google.com/home in your browser\n');
    console.log('2. This will show all Apps Script projects in your account\n');
    console.log('3. Take note of the script IDs for each project you want to examine\n');
    console.log('4. I can then analyze each one individually using the Script API\n\n');
    console.log('The screenshot you showed indicates these projects exist:\n');
    console.log('   • GPT Formatter (original - preserve)\n');
    console.log('   • TEST Menu Script (Bound) - appears twice\n');
    console.log('   • TEST_Feature_Based_Code - appears three times\n\n');
    console.log('To get their script IDs:\n');
    console.log('   1. Click on each project at script.google.com/home\n');
    console.log('   2. The URL will show the script ID\n');
    console.log('   3. Share those IDs and I will analyze each one\n');
    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

analyze();
