#!/usr/bin/env node

/**
 * VERIFY NEW PROJECT STATUS
 * Checks if the project we created actually exists and what its parent is
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const NEW_PROJECT_ID = '1lU89yFCJkREq_5CIjEVgpPWQ0H6nU_HxoMgaPDb5KxA_f-JztUp1oLUS';
const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

console.log('\n🔍 VERIFYING NEW PROJECT STATUS\n');
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

async function verifyProject() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`🎯 New Project ID: ${NEW_PROJECT_ID}\n`);
    console.log(`📊 Expected Parent: ${TEST_SPREADSHEET_ID}\n`);

    console.log('🔍 Fetching project metadata...\n');

    const project = await script.projects.get({
      scriptId: NEW_PROJECT_ID
    });

    console.log('✅ Project EXISTS!\n');
    console.log(`Project Details:`);
    console.log(`   Title: ${project.data.title}`);
    console.log(`   Script ID: ${project.data.scriptId}`);
    console.log(`   Parent ID: ${project.data.parentId || 'NONE (standalone project!)'}`);
    console.log(`   Create Time: ${project.data.createTime}`);
    console.log(`   Update Time: ${project.data.updateTime}\n`);

    if (!project.data.parentId) {
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('❌ PROBLEM FOUND: Project is STANDALONE (not container-bound)!\n');
      console.log('This is why the menu isn\'t appearing in your spreadsheet.\n');
      console.log('The Apps Script API must have failed to set the parentId during creation.\n\n');
      console.log('SOLUTION: We need to manually update the onOpen() function in the\n');
      console.log('spreadsheet\'s script editor OR try a different approach.\n');
      return;
    }

    if (project.data.parentId !== TEST_SPREADSHEET_ID) {
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log(`⚠️  WARNING: Project is bound to WRONG spreadsheet!\n`);
      console.log(`   Expected: ${TEST_SPREADSHEET_ID}`);
      console.log(`   Actual:   ${project.data.parentId}\n`);
      return;
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ PROJECT IS CORRECTLY BOUND TO TEST SPREADSHEET!\n');
    console.log('The binding is correct. Let\'s check the code...\n');

    // Get the project content
    const content = await script.projects.getContent({
      scriptId: NEW_PROJECT_ID
    });

    console.log(`📄 Project has ${content.data.files.length} files:\n`);

    for (const file of content.data.files) {
      console.log(`   ${file.name} (${file.type})`);
      if (file.type === 'SERVER_JS') {
        console.log(`      Size: ${(file.source.length / 1024).toFixed(1)} KB`);

        // Check if onOpen() exists
        if (file.source.includes('function onOpen()')) {
          console.log(`      ✅ Contains onOpen() function`);

          // Check if it has TEST Tools menu
          if (file.source.includes('🧪 TEST Tools')) {
            console.log(`      ✅ Creates "🧪 TEST Tools" menu`);
          } else {
            console.log(`      ❌ Does NOT create "🧪 TEST Tools" menu`);
          }
        } else {
          console.log(`      ❌ Missing onOpen() function!`);
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('📝 DIAGNOSIS:\n');

    if (project.data.parentId === TEST_SPREADSHEET_ID) {
      console.log('The project IS correctly bound to your spreadsheet.\n');
      console.log('If the menu isn\'t appearing, try:\n');
      console.log('   1. Close the spreadsheet completely (all tabs)\n');
      console.log('   2. Wait 10 seconds\n');
      console.log('   3. Open the spreadsheet fresh:\n');
      console.log(`      https://docs.google.com/spreadsheets/d/${TEST_SPREADSHEET_ID}\n`);
      console.log('   4. Wait 15 seconds for scripts to fully load\n');
      console.log('   5. Check the menu bar\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

verifyProject();
