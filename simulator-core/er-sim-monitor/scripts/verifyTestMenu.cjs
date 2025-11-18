#!/usr/bin/env node

/**
 * VERIFY TEST MENU EXISTS
 * Check if onOpen() function exists in TEST spreadsheet
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

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
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('\n🔍 CHECKING TEST SPREADSHEET FOR MENU\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    console.log('📋 Files in TEST spreadsheet:\n');
    project.data.files.forEach((file, index) => {
      if (file.type === 'SERVER_JS') {
        const sizeKB = Math.round(file.source.length / 1024);
        console.log(`${index + 1}. ${file.name}.gs (${sizeKB} KB)`);

        // Check for onOpen function
        if (file.source.includes('function onOpen()') || file.source.includes('function onOpen(')) {
          console.log('   ✅ Contains onOpen() - Creates menu');
        }

        // Check for TEST Tools menu
        if (file.source.includes('TEST Tools') || file.source.includes('addItem(\'💾 Pre-Cache')) {
          console.log('   ✅ Contains TEST Tools menu items');
        }
      }
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Search for onOpen in all files
    const filesWithOnOpen = project.data.files.filter(f =>
      f.type === 'SERVER_JS' && (f.source.includes('function onOpen()') || f.source.includes('function onOpen('))
    );

    if (filesWithOnOpen.length === 0) {
      console.log('❌ NO onOpen() FUNCTION FOUND!\n');
      console.log('This means the TEST Tools menu will not appear.\n');
      console.log('The onOpen() function was likely in Code.gs which we preserved from TEST.\n');
      console.log('We need to check if Code.gs has the menu function.\n');
    } else {
      console.log(`✅ Found onOpen() in ${filesWithOnOpen.length} file(s)\n`);
      filesWithOnOpen.forEach(f => {
        console.log(`   • ${f.name}.gs`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

verify();
