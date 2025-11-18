#!/usr/bin/env node

/**
 * DELETE ALL CONTAINER-BOUND SCRIPTS EXCEPT GPT FORMATTER
 * This will remove all extra menus
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';
const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n🗑️  DELETING ALL SCRIPTS EXCEPT GPT FORMATTER\n');
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

async function deleteOthers() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });
    const script = google.script({ version: 'v1', auth });

    console.log('🔍 Finding all Apps Script projects in your account...\n');

    // Search ALL Apps Script projects
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.script' and trashed=false",
      fields: 'files(id, name, parents, createdTime, modifiedTime)',
      pageSize: 200
    });

    const allProjects = response.data.files || [];
    console.log(`Found ${allProjects.length} total Apps Script projects\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    const toDelete = [];
    let keptCount = 0;

    for (const project of allProjects) {
      // Check if bound to test spreadsheet
      const isBoundToTest = project.parents && project.parents.includes(TEST_SPREADSHEET_ID);
      const isGPTFormatter = project.id === GPT_FORMATTER_ID;

      console.log(`📦 ${project.name}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Modified: ${new Date(project.modifiedTime).toLocaleString()}`);
      
      if (isBoundToTest) {
        console.log(`   📎 Bound to TEST spreadsheet`);
      }

      if (isGPTFormatter) {
        console.log(`   ✅ KEEP - This is GPT Formatter\n`);
        keptCount++;
      } else if (isBoundToTest) {
        console.log(`   🗑️  DELETE - Extra bound script\n`);
        toDelete.push(project);
      } else {
        console.log(`   ⏭️  Skip - Not related to test spreadsheet\n`);
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 SUMMARY:\n');
    console.log(`   Projects to KEEP: ${keptCount}`);
    console.log(`   Projects to DELETE: ${toDelete.length}\n`);

    if (toDelete.length > 0) {
      console.log('🗑️  DELETING PROJECTS:\n');
      
      for (const project of toDelete) {
        console.log(`   Deleting: ${project.name}...`);
        
        try {
          await drive.files.delete({
            fileId: project.id
          });
          console.log(`   ✅ Deleted successfully\n`);
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}\n`);
        }
      }

      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('✅ CLEANUP COMPLETE!\n');
      console.log('   Only GPT Formatter remains bound to test spreadsheet.\n');
      console.log('   Refresh spreadsheet - should see only "🧠 Sim Builder" menu.\n');
    } else {
      console.log('✅ No extra projects found to delete!\n');
      console.log('   The extra menus might be from browser cache.\n');
      console.log('   Try hard refresh (Cmd+Shift+R) or incognito window.\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deleteOthers();
