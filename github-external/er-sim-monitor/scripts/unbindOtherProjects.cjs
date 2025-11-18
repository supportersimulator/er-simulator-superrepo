#!/usr/bin/env node

/**
 * UNBIND ALL PROJECTS EXCEPT GPT FORMATTER FROM TEST SPREADSHEET
 * Keep only GPT Formatter bound, unbind all others
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';
const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n🔧 UNBINDING PROJECTS FROM TEST SPREADSHEET\n');
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

async function unbindProjects() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    console.log(`🎯 Test Spreadsheet: ${TEST_SPREADSHEET_ID}`);
    console.log(`✅ Keeping: GPT Formatter (${GPT_FORMATTER_ID})\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Find all bound Apps Script projects
    console.log('📋 Finding all bound Apps Script projects...\n');

    const driveFiles = await drive.files.list({
      q: `'${TEST_SPREADSHEET_ID}' in parents and mimeType='application/vnd.google-apps.script'`,
      fields: 'files(id, name)',
      pageSize: 100
    });

    console.log(`Found ${driveFiles.data.files.length} bound project(s):\n`);

    for (const file of driveFiles.data.files) {
      console.log(`📦 ${file.name} (${file.id})`);

      if (file.id === GPT_FORMATTER_ID) {
        console.log(`   ✅ KEEPING - This is GPT Formatter\n`);
      } else {
        console.log(`   🗑️  UNBINDING - Not GPT Formatter`);

        try {
          // Remove the parent (unbind from spreadsheet)
          await drive.files.update({
            fileId: file.id,
            removeParents: TEST_SPREADSHEET_ID,
            fields: 'id, name'
          });

          console.log(`   ✅ Successfully unbound from spreadsheet\n`);
        } catch (error) {
          console.log(`   ❌ Error unbinding: ${error.message}\n`);
        }
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Verify final state
    console.log('🔍 Verifying final state...\n');

    const finalCheck = await drive.files.list({
      q: `'${TEST_SPREADSHEET_ID}' in parents and mimeType='application/vnd.google-apps.script'`,
      fields: 'files(id, name)',
      pageSize: 100
    });

    console.log(`Bound projects remaining: ${finalCheck.data.files.length}\n`);

    if (finalCheck.data.files.length === 1 && finalCheck.data.files[0].id === GPT_FORMATTER_ID) {
      console.log('✅ SUCCESS!\n');
      console.log('   Only GPT Formatter is now bound to the test spreadsheet.\n');
      console.log('   The mystery button should now work when you:\n');
      console.log('   1. Refresh the spreadsheet\n');
      console.log('   2. Click "🧠 Sim Builder" → "ATSR Titles Optimizer"\n');
      console.log('═══════════════════════════════════════════════════════════════\n');
    } else if (finalCheck.data.files.length === 0) {
      console.log('⚠️  WARNING: No bound projects remaining!\n');
      console.log('   GPT Formatter might have been accidentally unbound.\n');
      console.log('   You may need to rebind it manually.\n');
    } else {
      console.log('⚠️  Multiple projects still bound:\n');
      finalCheck.data.files.forEach(file => {
        console.log(`   - ${file.name} (${file.id})`);
      });
      console.log('\n   Some projects could not be unbound.\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

unbindProjects();
