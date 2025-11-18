#!/usr/bin/env node

/**
 * LIST ALL PROJECTS BOUND TO TEST SPREADSHEET
 * Shows exactly what Apps Script projects are attached
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

console.log('\n📋 LISTING ALL BOUND PROJECTS\n');
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

async function listBoundProjects() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    console.log(`📊 Test Spreadsheet ID: ${TEST_SPREADSHEET_ID}\n`);
    console.log('🔍 Finding ALL Apps Script projects bound to this spreadsheet...\n');

    // Find all Apps Script projects that are children of this spreadsheet
    const children = await drive.files.list({
      q: `'${TEST_SPREADSHEET_ID}' in parents and mimeType='application/vnd.google-apps.script'`,
      fields: 'files(id,name,mimeType,createdTime,modifiedTime)'
    });

    if (!children.data.files || children.data.files.length === 0) {
      console.log('❌ NO Apps Script projects are bound to this spreadsheet!\n');
      console.log('This is strange - you should have at least the new project we just created.\n');
      console.log('Try these steps:\n');
      console.log('   1. In your spreadsheet, click Extensions → Apps Script\n');
      console.log('   2. Note the project name at the top\n');
      console.log('   3. Look for "Project Settings" (gear icon) on the left\n');
      console.log('   4. Check the "Script ID" - does it match:\n');
      console.log('      1lU89yFCJkREq_5CIjEVgpPWQ0H6nU_HxoMgaPDb5KxA_f-JztUp1oLUS\n');
      return;
    }

    console.log(`✅ Found ${children.data.files.length} bound project(s):\n`);

    for (let i = 0; i < children.data.files.length; i++) {
      const file = children.data.files[i];
      console.log(`${i + 1}. ${file.name}`);
      console.log(`   Project ID: ${file.id}`);
      console.log(`   Created: ${new Date(file.createdTime).toLocaleString()}`);
      console.log(`   Modified: ${new Date(file.modifiedTime).toLocaleString()}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    if (children.data.files.length > 1) {
      console.log('⚠️  WARNING: Multiple projects are bound!\n');
      console.log('This is likely why the menu isn\'t appearing correctly.\n');
      console.log('The "ER Simulator" and "Sim Builder" menus you see are from\n');
      console.log('other projects, not the new "TEST Tools" monolithic project.\n\n');
      console.log('RECOMMENDATION: Unbind the old projects to let the new one work.\n');
    } else {
      const projectId = children.data.files[0].id;
      const expectedId = '1lU89yFCJkREq_5CIjEVgpPWQ0H6nU_HxoMgaPDb5KxA_f-JztUp1oLUS';

      if (projectId === expectedId) {
        console.log('✅ CORRECT: The new monolithic project is the only bound project!\n');
        console.log('The menu should appear. Try:\n');
        console.log('   1. Hard refresh: Cmd+Shift+R (or Ctrl+Shift+R)\n');
        console.log('   2. Wait 10-15 seconds\n');
        console.log('   3. Check the menu bar again\n');
      } else {
        console.log('⚠️  WRONG PROJECT: A different project is bound!\n');
        console.log(`Expected: ${expectedId}\n`);
        console.log(`Actual:   ${projectId}\n\n`);
        console.log('This is why the TEST Tools menu isn\'t appearing.\n');
      }
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

listBoundProjects();
