#!/usr/bin/env node

/**
 * Check which spreadsheet the script 1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf is bound to
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

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

async function check() {
  console.log('\n🔍 CHECKING WHICH SPREADSHEET HAS THIS SCRIPT\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`Script ID: ${SCRIPT_ID}\n`);

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });

  try {
    // Get the script project
    const project = await script.projects.get({ scriptId: SCRIPT_ID });

    console.log(`📜 Script Title: ${project.data.title}\n`);

    // For container-bound scripts, the parent ID is the spreadsheet ID
    if (project.data.parentId) {
      console.log(`✅ This is a CONTAINER-BOUND script\n`);
      console.log(`   Parent (Spreadsheet) ID: ${project.data.parentId}\n`);

      // Get spreadsheet info
      try {
        const file = await drive.files.get({
          fileId: project.data.parentId,
          fields: 'id, name, modifiedTime'
        });

        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`📊 BOUND TO SPREADSHEET:\n`);
        console.log(`   Name: ${file.data.name}`);
        console.log(`   ID: ${file.data.id}`);
        console.log(`   Modified: ${new Date(file.data.modifiedTime).toLocaleString()}\n`);

        // Check if it's the TEST spreadsheet
        if (file.data.id === '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI') {
          console.log('✅ This is the TEST SPREADSHEET - Safe to modify!\n');
        } else if (file.data.id === '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM') {
          console.log('⚠️  This is the MAIN/ORIGINAL SPREADSHEET - Should not modify!\n');
        } else {
          console.log('❓ This is a different spreadsheet\n');
        }
        console.log('═══════════════════════════════════════════════════════════════\n');

      } catch (e) {
        console.log(`❌ Could not get spreadsheet info: ${e.message}\n`);
      }

    } else {
      console.log(`❌ This is a STANDALONE script (not bound to a spreadsheet)\n`);
    }

    // Check what code it has
    const content = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const codeFile = content.data.files.find(f => f.name === 'Code');

    if (codeFile) {
      const size = Math.round(codeFile.source.length / 1024);
      const hasATSR = codeFile.source.includes('runATSRTitleGenerator');
      const hasTestMenu = codeFile.source.includes('TEST');

      console.log('📝 Current Code:\n');
      console.log(`   Size: ${size} KB`);
      console.log(`   ATSR: ${hasATSR ? '✅' : '❌'}`);
      console.log(`   TEST menu: ${hasTestMenu ? '✅' : '❌'}\n`);
    }

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

check().catch(console.error);
