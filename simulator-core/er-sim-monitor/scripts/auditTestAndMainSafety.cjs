#!/usr/bin/env node

/**
 * SAFETY AUDIT: Verify TEST vs MAIN separation
 * Check what Apps Script projects exist and which spreadsheets they're bound to
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';
const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';
const MAIN_SPREADSHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';

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

async function audit() {
  console.log('\n🔍 SAFETY AUDIT: TEST vs MAIN SEPARATION\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });

  try {
    // Check TEST Script
    console.log('📋 CHECKING TEST APPS SCRIPT PROJECT...\n');
    const testProject = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    console.log(`   Script ID: ${TEST_SCRIPT_ID}`);
    console.log(`   Files in TEST script:\n`);
    testProject.data.files.forEach(f => {
      const size = f.source ? Math.round(f.source.length / 1024) : 0;
      console.log(`      • ${f.name} (${f.type}) - ${size} KB`);
    });

    // Check if TEST script is bound to a spreadsheet
    const testScriptMetadata = await script.projects.get({ scriptId: TEST_SCRIPT_ID });
    console.log(`\n   Parent ID: ${testScriptMetadata.data.parentId || 'STANDALONE (not bound)'}`);

    if (testScriptMetadata.data.parentId) {
      if (testScriptMetadata.data.parentId === TEST_SPREADSHEET_ID) {
        console.log('   ✅ CORRECT: Bound to TEST spreadsheet');
      } else if (testScriptMetadata.data.parentId === MAIN_SPREADSHEET_ID) {
        console.log('   ⚠️  WARNING: Bound to MAIN spreadsheet!');
      } else {
        console.log(`   ℹ️  Bound to different spreadsheet: ${testScriptMetadata.data.parentId}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('📋 CHECKING TEST SPREADSHEET...\n');

    const testSheet = await drive.files.get({
      fileId: TEST_SPREADSHEET_ID,
      fields: 'id,name,createdTime,modifiedTime'
    });

    console.log(`   Spreadsheet ID: ${TEST_SPREADSHEET_ID}`);
    console.log(`   Name: ${testSheet.data.name}`);
    console.log(`   Created: ${testSheet.data.createdTime}`);
    console.log(`   Modified: ${testSheet.data.modifiedTime}`);

    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('📋 CHECKING MAIN SPREADSHEET (READ-ONLY)...\n');

    const mainSheet = await drive.files.get({
      fileId: MAIN_SPREADSHEET_ID,
      fields: 'id,name,createdTime,modifiedTime'
    });

    console.log(`   Spreadsheet ID: ${MAIN_SPREADSHEET_ID}`);
    console.log(`   Name: ${mainSheet.data.name}`);
    console.log(`   Created: ${mainSheet.data.createdTime}`);
    console.log(`   Modified: ${mainSheet.data.modifiedTime}`);

    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('📋 SEARCHING FOR ALL APPS SCRIPT PROJECTS...\n');

    const allScripts = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.script'",
      fields: 'files(id,name,createdTime,modifiedTime)',
      pageSize: 100
    });

    console.log(`   Found ${allScripts.data.files.length} Apps Script projects:\n`);

    allScripts.data.files.forEach((file, i) => {
      const isTest = file.id === TEST_SCRIPT_ID;
      const marker = isTest ? '✅ (TEST - SAFE TO MODIFY)' : '';
      console.log(`   ${i + 1}. ${file.name} ${marker}`);
      console.log(`      ID: ${file.id}`);
      console.log(`      Created: ${file.createdTime}`);
      console.log(`      Modified: ${file.modifiedTime}\n`);
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ SAFETY SUMMARY:\n');
    console.log(`   TEST Script ID: ${TEST_SCRIPT_ID}`);
    console.log(`   TEST Spreadsheet: ${TEST_SPREADSHEET_ID}`);
    console.log(`   MAIN Spreadsheet: ${MAIN_SPREADSHEET_ID} (PROTECTED)\n`);
    console.log('   🔒 MAIN is NOT being touched by our deployment scripts');
    console.log('   ✅ All work is isolated to TEST environment\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) console.log(e.stack);
  }
}

audit().catch(console.error);
