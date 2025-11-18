#!/usr/bin/env node

/**
 * CHECK PROJECT BINDING
 * Verify which project is bound to the test spreadsheet
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';
const TITLE_OPTIMIZER_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

console.log('\n🔍 CHECKING PROJECT BINDING\n');
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

async function checkBinding() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    console.log(`📊 Test Spreadsheet ID: ${TEST_SPREADSHEET_ID}\n`);
    console.log(`🎯 Title Optimizer Project ID: ${TITLE_OPTIMIZER_ID}\n`);

    // Get spreadsheet metadata
    const spreadsheet = await drive.files.get({
      fileId: TEST_SPREADSHEET_ID,
      fields: 'id,name,properties'
    });

    console.log(`✅ Found spreadsheet: ${spreadsheet.data.name}\n`);

    // List all Apps Script projects to find which one is bound to this spreadsheet
    console.log('🔍 Searching for bound Apps Script project...\n');

    const script = google.script({ version: 'v1', auth });

    // Get the Title Optimizer project info
    const titleOptimizerProject = await script.projects.get({
      scriptId: TITLE_OPTIMIZER_ID
    });

    console.log('📋 Title Optimizer Project:\n');
    console.log(`   Name: ${titleOptimizerProject.data.title}`);
    console.log(`   Project ID: ${TITLE_OPTIMIZER_ID}`);
    console.log(`   Parent ID: ${titleOptimizerProject.data.parentId || 'NONE'}\n`);

    if (titleOptimizerProject.data.parentId === TEST_SPREADSHEET_ID) {
      console.log('✅ CORRECT: Title Optimizer IS bound to the test spreadsheet!\n');
    } else if (titleOptimizerProject.data.parentId) {
      console.log('❌ WRONG: Title Optimizer is bound to a DIFFERENT spreadsheet!\n');
      console.log(`   It's bound to: ${titleOptimizerProject.data.parentId}\n`);
      console.log(`   We need it bound to: ${TEST_SPREADSHEET_ID}\n`);
    } else {
      console.log('❌ STANDALONE: Title Optimizer is NOT bound to any spreadsheet!\n');
      console.log('   It needs to be bound to the test spreadsheet.\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Try to find what IS bound to the test spreadsheet
    console.log('🔎 Checking what Apps Script project IS bound to test spreadsheet...\n');

    try {
      // List files that are children of this spreadsheet
      const children = await drive.files.list({
        q: `'${TEST_SPREADSHEET_ID}' in parents and mimeType='application/vnd.google-apps.script'`,
        fields: 'files(id,name,mimeType)'
      });

      if (children.data.files && children.data.files.length > 0) {
        console.log(`✅ Found ${children.data.files.length} Apps Script project(s) bound to test spreadsheet:\n`);
        for (const file of children.data.files) {
          console.log(`   • ${file.name}`);
          console.log(`     Project ID: ${file.id}\n`);
        }
      } else {
        console.log('❌ NO Apps Script projects are bound to this test spreadsheet!\n');
      }
    } catch (error) {
      console.log('⚠️  Could not list bound projects:', error.message, '\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

checkBinding();
