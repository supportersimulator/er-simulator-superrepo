#!/usr/bin/env node

/**
 * Find the correct Apps Script project ID for your Google Sheet
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function findScriptId() {
  try {
    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');

    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
    const script = google.script({ version: 'v1', auth: oAuth2Client });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    console.log('🔍 Finding Apps Script project for your Google Sheet...\n');
    console.log(`   Spreadsheet ID: ${spreadsheetId}\n`);

    // Get spreadsheet metadata
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });

    console.log(`   ✅ Spreadsheet: "${spreadsheet.data.properties.title}"\n`);

    // Search for container-bound scripts
    console.log('📋 Searching for Apps Script projects...\n');

    // Method 1: Search Drive for scripts
    const driveResponse = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.script'",
      fields: 'files(id, name, description, createdTime, modifiedTime, parents)',
      pageSize: 50,
      orderBy: 'modifiedTime desc'
    });

    if (driveResponse.data.files.length > 0) {
      console.log(`Found ${driveResponse.data.files.length} Apps Script projects:\n`);

      for (const file of driveResponse.data.files) {
        console.log(`\n📄 ${file.name}`);
        console.log(`   ID: ${file.id}`);
        console.log(`   Modified: ${file.modifiedTime}`);
        if (file.description) {
          console.log(`   Description: ${file.description}`);
        }

        // Try to get content
        try {
          const content = await script.projects.getContent({
            scriptId: file.id
          });

          console.log(`   ✅ Accessible! Files in project:`);
          content.data.files.forEach(f => {
            console.log(`      - ${f.name} (${f.type})`);
          });

          // Check if this looks like our production script
          const hasCode = content.data.files.some(f => f.name === 'Code');
          const hasPhase2 = content.data.files.some(f => f.name.includes('Phase2'));

          if (hasCode) {
            console.log(`   🎯 This appears to be a bound script (has Code.gs)`);

            if (hasPhase2) {
              console.log(`   ⚠️  Already has Phase2 files - may be previously deployed`);
            } else {
              console.log(`   ✨ CANDIDATE FOR DEPLOYMENT - No Phase2 files yet`);
            }
          }

        } catch (error) {
          console.log(`   ❌ Cannot access: ${error.message}`);
        }
      }
    } else {
      console.log('No Apps Script projects found');
    }

    // Try the ID from .env
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('🔍 Testing script ID from .env file...\n');

    const envScriptId = process.env.APPS_SCRIPT_ID;
    if (envScriptId) {
      console.log(`   Script ID: ${envScriptId}\n`);

      try {
        const content = await script.projects.getContent({
          scriptId: envScriptId
        });

        console.log('   ✅ SUCCESS! This script ID works.\n');
        console.log('   Files in project:');
        content.data.files.forEach(f => {
          console.log(`      - ${f.name} (${f.type})`);
        });

        // Check for Phase2 files
        const hasPhase2 = content.data.files.some(f => f.name.includes('Phase2'));
        if (hasPhase2) {
          console.log('\n   ⚠️  Phase2 files already present! Deployment may have already happened.');
        } else {
          console.log('\n   ✅ Ready for Phase2 deployment - no Phase2 files detected.');
        }

      } catch (error) {
        console.log(`   ❌ FAILED: ${error.message}`);
        console.log('\n   This script ID is incorrect or inaccessible.');
        console.log('   Use one of the working IDs from the list above.\n');
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

findScriptId();
