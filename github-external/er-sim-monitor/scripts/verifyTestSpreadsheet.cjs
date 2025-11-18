#!/usr/bin/env node

/**
 * VERIFY TEST SPREADSHEET
 *
 * Verifies which spreadsheet the TEST_SCRIPT_ID belongs to
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

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

async function verify() {
  console.log('\n🔍 VERIFYING TEST SPREADSHEET\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });

  try {
    // Get project info
    console.log('📖 Fetching project info...\n');
    const projectInfo = await script.projects.get({
      scriptId: TEST_SCRIPT_ID
    });

    console.log('✅ Project found!\n');
    console.log('Project Info:');
    console.log(`   Title: ${projectInfo.data.title}`);
    console.log(`   Script ID: ${TEST_SCRIPT_ID}\n`);

    // Get parent spreadsheet if it's a bound script
    if (projectInfo.data.parentId) {
      console.log('📊 Getting parent spreadsheet info...\n');
      const spreadsheetInfo = await drive.files.get({
        fileId: projectInfo.data.parentId,
        fields: 'id, name, webViewLink'
      });

      console.log('✅ Parent Spreadsheet:\n');
      console.log(`   Name: ${spreadsheetInfo.data.name}`);
      console.log(`   ID: ${spreadsheetInfo.data.id}`);
      console.log(`   URL: ${spreadsheetInfo.data.webViewLink}\n`);

      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('✅ VERIFICATION COMPLETE\n');
      console.log('This is the TEST spreadsheet where field selector was deployed.\n');
      console.log(`Open it here: ${spreadsheetInfo.data.webViewLink}\n`);
    } else {
      console.log('⚠️  This is a standalone script (not bound to a spreadsheet)\n');
    }

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED!\n');
    console.error('Error:', error.message);
    if (error.response && error.response.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

verify().catch(error => {
  process.exit(1);
});
