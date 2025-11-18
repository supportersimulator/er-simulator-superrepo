#!/usr/bin/env node

/**
 * Verify the TEST menu code is present and show exactly what it looks like
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

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
  console.log('\n🔍 VERIFYING TEST MENU IN CODE\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const codeFile = project.data.files.find(f => f.name === 'Code');

    if (!codeFile) {
      console.log('❌ No Code file found!\n');
      return;
    }

    const code = codeFile.source;

    // Check for onOpen function
    console.log('📋 Checking for onOpen() function...\n');
    const onOpenMatch = code.match(/function onOpen\(\)[^{]*\{[^}]*\}/);

    if (onOpenMatch) {
      console.log('✅ Found onOpen() function:\n');
      console.log('─────────────────────────────────────────────────────────────');
      console.log(onOpenMatch[0]);
      console.log('─────────────────────────────────────────────────────────────\n');
    } else {
      console.log('❌ No onOpen() function found!\n');
    }

    // Check for TEST menu creation
    console.log('📋 Checking for TEST menu creation...\n');
    const testMenuMatches = code.match(/\.addMenu\(['"].*TEST.*['"]/g);

    if (testMenuMatches && testMenuMatches.length > 0) {
      console.log('✅ Found TEST menu creation:\n');
      testMenuMatches.forEach(match => {
        console.log(`   ${match}`);
      });
      console.log('');
    } else {
      console.log('❌ No TEST menu creation found!\n');

      // Look for any menu creation
      const anyMenuMatches = code.match(/\.addMenu\(['"](.*?)['"]/g);
      if (anyMenuMatches && anyMenuMatches.length > 0) {
        console.log('⚠️  But found other menu creation:\n');
        anyMenuMatches.forEach(match => {
          console.log(`   ${match}`);
        });
        console.log('');
      }
    }

    // Check for runATSRTitleGenerator
    console.log('📋 Checking for ATSR function...\n');
    if (code.includes('runATSRTitleGenerator')) {
      console.log('✅ runATSRTitleGenerator function exists\n');
    } else {
      console.log('❌ runATSRTitleGenerator function NOT found\n');
    }

    // Check manifest for triggers
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📋 Checking appsscript.json manifest...\n');

    const manifestFile = project.data.files.find(f => f.name === 'appsscript');
    if (manifestFile) {
      const manifest = JSON.parse(manifestFile.source);
      console.log(JSON.stringify(manifest, null, 2));
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('💡 NEXT STEPS:\n');
    console.log('If the menu code exists but menu not showing:\n');
    console.log('   1. Try refreshing the spreadsheet (hard refresh: Cmd+Shift+R)\n');
    console.log('   2. Try closing and reopening the spreadsheet\n');
    console.log('   3. Check if you need to manually run the onOpen trigger:\n');
    console.log('      - In spreadsheet: Extensions → Apps Script\n');
    console.log('      - Run → Select "onOpen"\n');
    console.log('      - Click Run\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

verify().catch(console.error);
