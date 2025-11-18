#!/usr/bin/env node

/**
 * DIAGNOSE WHY MULTIPLE MENUS ARE APPEARING
 * Check all bound projects and their menus
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

console.log('\n🔍 DIAGNOSING MULTIPLE MENUS ISSUE\n');
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

async function diagnose() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    console.log(`🎯 Test Spreadsheet: ${TEST_SPREADSHEET_ID}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Method 1: Find all Apps Script projects that are children of spreadsheet
    console.log('📋 METHOD 1: Drive API - Finding child Apps Script projects...\n');

    const driveFiles = await drive.files.list({
      q: `'${TEST_SPREADSHEET_ID}' in parents and mimeType='application/vnd.google-apps.script'`,
      fields: 'files(id, name, createdTime, modifiedTime)',
      pageSize: 100
    });

    console.log(`Found ${driveFiles.data.files.length} bound project(s):\n`);

    for (const file of driveFiles.data.files) {
      console.log(`📦 ${file.name}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   Modified: ${new Date(file.modifiedTime).toLocaleString()}\n`);

      // Download and check for onOpen menu
      try {
        const content = await script.projects.getContent({
          scriptId: file.id
        });

        const codeFile = content.data.files.find(f => f.name === 'Code');
        if (codeFile) {
          // Find all createMenu calls
          const menuMatches = [...codeFile.source.matchAll(/createMenu\(['"]([^'"]+)['"]\)/g)];
          
          if (menuMatches.length > 0) {
            console.log(`   📋 Menus Created:\n`);
            menuMatches.forEach(match => {
              console.log(`      - "${match[1]}"`);
            });
            console.log('');
          } else {
            console.log(`   ✅ No menus created\n`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Can't read code: ${error.message}\n`);
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Method 2: Check GPT Formatter specifically
    console.log('📋 METHOD 2: Checking GPT Formatter (expected bound project)...\n');

    const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

    try {
      const details = await script.projects.get({
        scriptId: GPT_FORMATTER_ID
      });

      console.log(`   Project: ${details.data.title}`);
      console.log(`   Parent ID: ${details.data.parentId || 'None'}\n`);

      if (details.data.parentId === TEST_SPREADSHEET_ID) {
        console.log(`   ✅ GPT Formatter IS bound to test spreadsheet\n`);
      } else {
        console.log(`   ❌ GPT Formatter is NOT bound to test spreadsheet!\n`);
        console.log(`   Expected parent: ${TEST_SPREADSHEET_ID}`);
        console.log(`   Actual parent: ${details.data.parentId || 'None'}\n`);
      }

      // Check menus in GPT Formatter
      const content = await script.projects.getContent({
        scriptId: GPT_FORMATTER_ID
      });

      const codeFile = content.data.files.find(f => f.name === 'Code');
      if (codeFile) {
        const menuMatches = [...codeFile.source.matchAll(/createMenu\(['"]([^'"]+)['"]\)/g)];
        
        console.log(`   Menus in GPT Formatter:\n`);
        if (menuMatches.length > 0) {
          menuMatches.forEach(match => {
            console.log(`      - "${match[1]}"`);
          });
        } else {
          console.log(`      - None found`);
        }
        console.log('');
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 DIAGNOSIS:\n');

    if (driveFiles.data.files.length === 0) {
      console.log('❌ NO bound projects found via Drive API\n');
      console.log('   This means Google Sheets doesn\'t recognize any bound script.\n');
      console.log('   The menus might be coming from:\n');
      console.log('   1. Browser cache (old menus)\n');
      console.log('   2. Add-ons\n');
      console.log('   3. Apps Script attached at document level (not project level)\n');
    } else if (driveFiles.data.files.length === 1) {
      console.log(`✅ ONE bound project: ${driveFiles.data.files[0].name}\n`);
      console.log('   This is correct. All menus should come from this one project.\n');
      console.log('   If you see multiple menus, try:\n');
      console.log('   1. Hard refresh (Cmd+Shift+R)\n');
      console.log('   2. Open in incognito/private window\n');
      console.log('   3. Clear Google Sheets cache\n');
    } else {
      console.log(`⚠️  MULTIPLE BOUND PROJECTS (${driveFiles.data.files.length}):\n`);
      driveFiles.data.files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${file.id})`);
      });
      console.log('\n   🔴 THIS IS THE PROBLEM!\n');
      console.log('   Each bound project can create its own menus.\n');
      console.log('   We need to unbind all except one.\n');
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

diagnose();
