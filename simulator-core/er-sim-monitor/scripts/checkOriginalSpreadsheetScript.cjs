#!/usr/bin/env node

/**
 * Check what script is bound to the ORIGINAL/MAIN spreadsheet
 * This will tell us what the working menu looks like
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

async function check() {
  console.log('\n🔍 CHECKING ORIGINAL/MAIN SPREADSHEET SCRIPT\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`Spreadsheet: Convert_Master_Sim_CSV_Template_with_Input`);
  console.log(`ID: ${MAIN_SPREADSHEET_ID}\n`);

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Try to get script using spreadsheet ID (works for container-bound)
    console.log('📥 Checking for container-bound script...\n');

    try {
      const project = await script.projects.getContent({ scriptId: MAIN_SPREADSHEET_ID });

      console.log('✅ Found container-bound script!\n');

      const codeFile = project.data.files.find(f => f.name === 'Code');

      if (codeFile) {
        const code = codeFile.source;
        const size = Math.round(code.length / 1024);

        console.log(`💾 Code size: ${size} KB\n`);

        // Extract onOpen function
        console.log('📋 onOpen() function:\n');
        console.log('─────────────────────────────────────────────────────────────');
        const onOpenMatch = code.match(/function onOpen\(\)[^{]*\{[\s\S]*?\n\}/);
        if (onOpenMatch) {
          console.log(onOpenMatch[0]);
        } else {
          console.log('❌ No onOpen function found');
        }
        console.log('─────────────────────────────────────────────────────────────\n');

        // Find all menu creation
        console.log('📋 All menu creation lines:\n');
        const menuMatches = code.match(/\.createMenu\(['"](.*?)['"]\)/g);
        if (menuMatches) {
          menuMatches.forEach(match => console.log(`   ${match}`));
        } else {
          console.log('   ❌ No createMenu calls found');
        }
        console.log('');

        // Find all addItem calls near menu creation
        console.log('📋 Menu items:\n');
        const menuItemMatches = code.match(/\.addItem\(['"](.*?)['"]/g);
        if (menuItemMatches) {
          menuItemMatches.slice(0, 10).forEach(match => console.log(`   ${match}`));
          if (menuItemMatches.length > 10) {
            console.log(`   ... and ${menuItemMatches.length - 10} more items`);
          }
        } else {
          console.log('   ❌ No addItem calls found');
        }
        console.log('');

        // Check for ATSR
        const hasATSR = code.includes('runATSRTitleGenerator');
        console.log(`ATSR function: ${hasATSR ? '✅' : '❌'}\n`);

      } else {
        console.log('❌ No Code file in project\n');
      }

    } catch (e) {
      console.log('❌ No container-bound script found\n');
      console.log(`   Error: ${e.message}\n`);
      console.log('The MAIN spreadsheet might use a standalone project instead.\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

check().catch(console.error);
