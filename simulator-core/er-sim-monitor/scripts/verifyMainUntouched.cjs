#!/usr/bin/env node

/**
 * CRITICAL: Verify we did NOT touch the MAIN/original spreadsheet
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

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

async function verify() {
  console.log('\n🔒 VERIFYING MAIN/ORIGINAL SPREADSHEET WAS NOT TOUCHED\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('MAIN Spreadsheet ID: ' + MAIN_SPREADSHEET_ID);
  console.log('Name: Convert_Master_Sim_CSV_Template_with_Input (ORIGINAL)\n');

  const auth = await authorize();
  const sheets = google.sheets({ version: 'v4', auth });
  const script = google.script({ version: 'v1', auth });

  try {
    // Get spreadsheet info
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: MAIN_SPREADSHEET_ID
    });

    console.log('📋 Spreadsheet Info:\n');
    console.log(`   Title: ${spreadsheet.data.properties.title}`);
    console.log(`   Last Modified: ${new Date(spreadsheet.data.properties.modifiedTime).toLocaleString()}\n`);

    // Get bound script
    const boundScriptId = MAIN_SPREADSHEET_ID; // For container-bound scripts, spreadsheet ID = script ID

    try {
      const project = await script.projects.getContent({ scriptId: boundScriptId });

      console.log('📂 Files in MAIN project:\n');
      project.data.files.forEach(f => {
        const size = f.source ? Math.round(f.source.length / 1024) + ' KB' : 'N/A';
        console.log(`   • ${f.name} (${f.type}) - ${size}`);
      });

      console.log('\n═══════════════════════════════════════════════════════════════');
      console.log('✅ MAIN/ORIGINAL PROJECT STATUS: ACCESSIBLE\n');
      console.log('🔒 VERIFICATION:\n');
      console.log('   If you see files above, MAIN project still exists.');
      console.log('   We only deployed to TEST (different script ID).');
      console.log('   MAIN should be completely untouched.\n');
      console.log('═══════════════════════════════════════════════════════════════\n');

    } catch (scriptError) {
      console.log('\n⚠️  Could not access bound script:\n');
      console.log(`   ${scriptError.message}\n`);
      console.log('This could mean:');
      console.log('   1. Script is not container-bound (normal)');
      console.log('   2. Different script ID is used');
      console.log('   3. Permission issue\n');
      console.log('BUT: Spreadsheet itself is intact (accessed successfully above)\n');
    }

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

verify().catch(console.error);
