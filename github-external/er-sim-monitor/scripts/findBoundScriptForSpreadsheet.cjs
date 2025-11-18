#!/usr/bin/env node

/**
 * Find the container-bound Apps Script project for a specific spreadsheet
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';

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

async function findBoundScript() {
  console.log('\n🔍 FINDING CONTAINER-BOUND SCRIPT\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });
  const script = google.script({ version: 'v1', auth });

  try {
    // Method 1: Search Drive for Apps Script files with this spreadsheet as parent
    console.log('🔎 Method 1: Searching Drive API for bound scripts...\n');

    const driveResponse = await drive.files.list({
      q: `'${SPREADSHEET_ID}' in parents and mimeType='application/vnd.google-apps.script'`,
      fields: 'files(id, name, mimeType)',
      spaces: 'drive'
    });

    if (driveResponse.data.files && driveResponse.data.files.length > 0) {
      console.log('✅ Found bound script(s):\n');
      driveResponse.data.files.forEach(file => {
        console.log(`   📄 ${file.name}`);
        console.log(`   🆔 Script ID: ${file.id}\n`);
      });

      // Use the first one found
      const boundScriptId = driveResponse.data.files[0].id;

      // Verify it has content
      console.log('🔍 Verifying script content...\n');
      const project = await script.projects.getContent({ scriptId: boundScriptId });

      console.log('📋 Files in bound script:\n');
      project.data.files.forEach(f => console.log(`   • ${f.name}`));
      console.log('');

      // Check if onOpen exists
      const codeFile = project.data.files.find(f => f.name === 'Code');
      if (codeFile) {
        const hasOnOpen = codeFile.source.includes('function onOpen()');
        const hasTestMenu = codeFile.source.includes('TEST');

        console.log('📊 Analysis:\n');
        console.log(`   onOpen() function exists: ${hasOnOpen ? '✅' : '❌'}`);
        console.log(`   TEST menu found: ${hasTestMenu ? '✅' : '❌'}\n`);

        if (!hasTestMenu) {
          console.log('⚠️  TEST menu NOT in bound script - needs deployment!\n');
        }
      }

      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`✅ BOUND SCRIPT FOUND: ${boundScriptId}\n`);
      console.log('This is the script that controls the spreadsheet menus.\n');
      console.log('═══════════════════════════════════════════════════════════════\n');

      return boundScriptId;

    } else {
      console.log('⚠️  No bound script found via Drive API\n');

      // Method 2: Try to get it from spreadsheet metadata
      console.log('🔎 Method 2: Checking spreadsheet metadata...\n');

      const sheets = google.sheets({ version: 'v4', auth });
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID
      });

      console.log(`📊 Spreadsheet: ${spreadsheet.data.properties.title}\n`);
      console.log('⚠️  Could not determine bound script from metadata\n');

      console.log('═══════════════════════════════════════════════════════════════');
      console.log('❌ NO BOUND SCRIPT FOUND\n');
      console.log('Possible reasons:\n');
      console.log('   • Spreadsheet uses standalone script (not container-bound)\n');
      console.log('   • Script is in a different Google account\n');
      console.log('   • Permissions issue preventing script access\n');
      console.log('═══════════════════════════════════════════════════════════════\n');

      return null;
    }

  } catch (e) {
    console.log('\n❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
    return null;
  }
}

findBoundScript().catch(console.error);
