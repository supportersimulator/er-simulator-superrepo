#!/usr/bin/env node

/**
 * FIND WHICH SPREADSHEET IS BOUND TO TEST PROJECT
 * This will tell us the exact spreadsheet URL
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_PROJECT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

console.log('\n🔍 FINDING SPREADSHEET BOUND TO TEST PROJECT\n');
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

async function findSpreadsheet() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    console.log(`🎯 TEST Project ID: ${TEST_PROJECT_ID}\n`);

    // Get project metadata
    console.log('📥 Getting project metadata...\n');
    const project = await script.projects.get({
      scriptId: TEST_PROJECT_ID
    });

    console.log(`✅ Project Title: ${project.data.title}\n`);
    console.log(`📝 Parent ID: ${project.data.parentId || 'None (standalone)'}\n`);

    if (project.data.parentId) {
      console.log('🔍 This is a CONTAINER-BOUND script!\n');
      console.log('📥 Getting parent spreadsheet info...\n');

      try {
        const file = await drive.files.get({
          fileId: project.data.parentId,
          fields: 'id,name,webViewLink,mimeType'
        });

        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log('✅ FOUND THE SPREADSHEET!\n');
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log(`📊 Spreadsheet Name: ${file.data.name}\n`);
        console.log(`🆔 Spreadsheet ID: ${file.data.id}\n`);
        console.log(`🔗 URL: ${file.data.webViewLink}\n`);
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log('🎯 THIS IS THE SPREADSHEET YOU SHOULD OPEN!\n');
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log(`Copy and paste this URL:\n${file.data.webViewLink}\n`);
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Open it in browser
        const { exec } = require('child_process');
        exec(`open "${file.data.webViewLink}"`);
        console.log('🌐 Opening spreadsheet in your default browser...\n');

      } catch (error) {
        console.error('❌ ERROR getting spreadsheet info:', error.message);
      }
    } else {
      console.log('⚠️  This is a STANDALONE script (not bound to a spreadsheet)\n');
      console.log('This shouldn\'t happen - the test project should be container-bound!\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

findSpreadsheet();
