#!/usr/bin/env node

/**
 * Get the container-bound Apps Script project ID from the spreadsheet
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function getSheetBoundScript() {
  try {
    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');

    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    console.log('🔍 Finding container-bound Apps Script project...\n');
    console.log(`   Spreadsheet ID: ${spreadsheetId}\n`);

    // Get the spreadsheet file from Drive
    const spreadsheet = await drive.files.get({
      fileId: spreadsheetId,
      fields: 'id, name, parents'
    });

    console.log(`   ✅ Spreadsheet: "${spreadsheet.data.name}"\n`);

    // Search for children of this spreadsheet (container-bound scripts are stored as children)
    const children = await drive.files.list({
      q: `'${spreadsheetId}' in parents and mimeType='application/vnd.google-apps.script'`,
      fields: 'files(id, name, mimeType, parents)',
      pageSize: 10
    });

    if (children.data.files.length > 0) {
      console.log(`   ✅ Found ${children.data.files.length} bound script(s):\n`);

      children.data.files.forEach(file => {
        console.log(`   📄 ${file.name}`);
        console.log(`      Script ID: ${file.id}`);
        console.log(`      Type: Container-bound script\n`);
      });

      const scriptId = children.data.files[0].id;

      // Test access
      const script = google.script({ version: 'v1', auth: oAuth2Client });
      try {
        const content = await script.projects.getContent({
          scriptId: scriptId
        });

        console.log(`   ✅ Successfully accessed script!\n`);
        console.log(`   Files in project (${content.data.files.length}):`);
        content.data.files.forEach(f => {
          console.log(`      - ${f.name} (${f.type})`);
        });

        // Check for Phase2 files
        const hasPhase2 = content.data.files.some(f => f.name.includes('Phase2'));

        console.log('\n   ═══════════════════════════════════════════════════════════════');
        console.log('   🎯 CORRECT SCRIPT ID FOUND!');
        console.log('   ═══════════════════════════════════════════════════════════════\n');
        console.log(`   Script ID: ${scriptId}\n`);

        if (hasPhase2) {
          console.log('   ⚠️  Phase2 files already present - deployment may have occurred.');
        } else {
          console.log('   ✅ Ready for Phase2 deployment - no Phase2 files detected.');
        }

        console.log('\n   Update your .env file:');
        console.log(`   APPS_SCRIPT_ID=${scriptId}\n`);

        // Save to a file for easy reference
        const envPath = path.join(__dirname, '../.env');
        let envContent = fs.readFileSync(envPath, 'utf8');

        if (envContent.includes('APPS_SCRIPT_ID=')) {
          // Replace existing
          envContent = envContent.replace(/APPS_SCRIPT_ID=.+/, `APPS_SCRIPT_ID=${scriptId}`);
          console.log('   📝 Would update .env with new script ID');
          console.log('   (Run with --update flag to apply)\n');
        }

        return scriptId;

      } catch (error) {
        console.log(`   ❌ Cannot access script: ${error.message}`);
        console.log(`   You may need additional permissions.\n`);
      }

    } else {
      console.log('   ❌ No bound script found for this spreadsheet.');
      console.log('\n   Possible reasons:');
      console.log('   1. Script is standalone (not bound to sheet)');
      console.log('   2. Script is in a different project');
      console.log('   3. You need to open Extensions → Apps Script in the sheet first\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === 404) {
      console.log('\nSpreadsheet not found. Check GOOGLE_SHEET_ID in .env file.');
    }
  }
}

getSheetBoundScript();
