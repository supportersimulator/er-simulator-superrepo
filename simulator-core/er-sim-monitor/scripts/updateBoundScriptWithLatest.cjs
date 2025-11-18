#!/usr/bin/env node

/**
 * Update the bound script with the latest ATSR code from standalone script
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const STANDALONE_SCRIPT_ID = '1Bkbm2MNA-YmXQEoMsIlC-VgEgHiQHO2EuMXR-yyxy9lYWl3eNcEHk_S-'; // Most recent (Nov 5, 2:26 AM)
const BOUND_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf'; // Just created

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

async function update() {
  console.log('\n🔄 UPDATING BOUND SCRIPT WITH LATEST ATSR CODE\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Get latest code from standalone script
    console.log('📥 Fetching latest code from standalone script...\n');
    console.log(`   Source: ER Sim - ATSR Tool (Standalone)`);
    console.log(`   Modified: Nov 5, 2025 at 2:26 AM\n`);

    const standaloneProject = await script.projects.getContent({
      scriptId: STANDALONE_SCRIPT_ID
    });

    console.log('📋 Files in standalone script:\n');
    standaloneProject.data.files.forEach(f => console.log(`   • ${f.name}`));
    console.log('');

    // Deploy to bound script
    console.log('🚀 Deploying to bound script...\n');

    await script.projects.updateContent({
      scriptId: BOUND_SCRIPT_ID,
      requestBody: {
        files: standaloneProject.data.files
      }
    });

    console.log('✅ Successfully updated!\n');

    // Verify
    const boundProject = await script.projects.getContent({
      scriptId: BOUND_SCRIPT_ID
    });

    const codeFile = boundProject.data.files.find(f => f.name === 'Code');
    if (codeFile) {
      const hasOnOpen = codeFile.source.includes('function onOpen()');
      const hasATSR = codeFile.source.includes('runATSRTitleGenerator') || codeFile.source.includes('ATSR');
      const hasTestMenu = codeFile.source.includes('TEST');

      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅ VERIFICATION:\n');
      console.log(`   onOpen() function: ${hasOnOpen ? '✅' : '❌'}`);
      console.log(`   TEST menu: ${hasTestMenu ? '✅' : '❌'}`);
      console.log(`   ATSR functionality: ${hasATSR ? '✅' : '❌'}\n`);

      if (hasOnOpen && hasTestMenu && hasATSR) {
        console.log('🎉 ALL CHECKS PASSED!\n');
        console.log('📋 Your bound script now has the latest Title Optimizer code.\n');
        console.log('🔄 Next steps:\n');
        console.log('   1. Refresh your spreadsheet');
        console.log('   2. Look for the 🧪 TEST menu');
        console.log('   3. Click it to see Titles Optimizer option\n');
      } else {
        console.log('⚠️  Some functionality may be missing\n');
      }
      console.log('═══════════════════════════════════════════════════════════════\n');
    }

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

update().catch(console.error);
