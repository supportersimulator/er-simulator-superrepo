#!/usr/bin/env node

/**
 * Deploy the PRODUCTION ATSR from apps-script-backup/Code.gs to bound script
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const BOUND_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

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

async function deploy() {
  console.log('\n🚀 DEPLOYING PRODUCTION ATSR TO BOUND SCRIPT\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Read the production code from backup
    const backupPath = path.join(__dirname, '../apps-script-backup/Code.gs');
    console.log('📥 Reading production ATSR from backup...\n');
    console.log(`   Source: ${backupPath}\n`);

    if (!fs.existsSync(backupPath)) {
      console.log('❌ Backup file not found!\n');
      return;
    }

    const productionCode = fs.readFileSync(backupPath, 'utf8');

    // Verify it has ATSR
    const hasATSR = productionCode.includes('runATSRTitleGenerator');
    console.log(`   ${hasATSR ? '✅' : '❌'} Contains ATSR Title Generator\n`);

    if (!hasATSR) {
      console.log('❌ Backup file does not contain ATSR code!\n');
      return;
    }

    // Get current bound script to preserve manifest
    console.log('📋 Getting current bound script...\n');
    const currentProject = await script.projects.getContent({
      scriptId: BOUND_SCRIPT_ID
    });

    const manifestFile = currentProject.data.files.find(f => f.name === 'appsscript');

    // Deploy production code
    console.log('🚀 Deploying production ATSR...\n');

    await script.projects.updateContent({
      scriptId: BOUND_SCRIPT_ID,
      requestBody: {
        files: [
          {
            name: 'appsscript',
            type: 'JSON',
            source: manifestFile ? manifestFile.source : JSON.stringify({
              timeZone: "America/New_York",
              dependencies: {},
              exceptionLogging: "STACKDRIVER"
            }, null, 2)
          },
          {
            name: 'Code',
            type: 'SERVER_JS',
            source: productionCode
          }
        ]
      }
    });

    console.log('✅ Successfully deployed!\n');

    // Verify
    const updatedProject = await script.projects.getContent({
      scriptId: BOUND_SCRIPT_ID
    });

    const codeFile = updatedProject.data.files.find(f => f.name === 'Code');
    if (codeFile) {
      const hasOnOpen = codeFile.source.includes('function onOpen()');
      const hasATSRFunc = codeFile.source.includes('runATSRTitleGenerator');
      const hasTestMenu = codeFile.source.includes('TEST');

      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅ VERIFICATION:\n');
      console.log(`   onOpen() function: ${hasOnOpen ? '✅' : '❌'}`);
      console.log(`   TEST menu: ${hasTestMenu ? '✅' : '❌'}`);
      console.log(`   runATSRTitleGenerator: ${hasATSRFunc ? '✅' : '❌'}\n`);

      if (hasOnOpen && hasTestMenu && hasATSRFunc) {
        console.log('🎉 PRODUCTION ATSR SUCCESSFULLY DEPLOYED!\n');
        console.log('📋 Your spreadsheet now has the working Title Optimizer.\n');
        console.log('🔄 Next steps:\n');
        console.log('   1. Refresh your spreadsheet');
        console.log('   2. Look for the 🧪 TEST menu');
        console.log('   3. Click Titles Optimizer to use it\n');
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

deploy().catch(console.error);
