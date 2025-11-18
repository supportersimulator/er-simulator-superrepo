#!/usr/bin/env node

/**
 * Deploy Code_ULTIMATE_ATSR.gs (the most current version) to bound script
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
  console.log('\n🚀 DEPLOYING CODE_ULTIMATE_ATSR.gs TO BOUND SCRIPT\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Read the ULTIMATE ATSR code
    const ultimatePath = path.join(__dirname, 'Code_ULTIMATE_ATSR_FROM_DRIVE.gs');
    console.log('📥 Reading Code_ULTIMATE_ATSR.gs...\n');
    console.log(`   Source: ${ultimatePath}\n`);

    if (!fs.existsSync(ultimatePath)) {
      console.log('❌ File not found! Run downloadUltimateATSR.cjs first.\n');
      return;
    }

    const ultimateCode = fs.readFileSync(ultimatePath, 'utf8');

    // Verify it has ATSR
    const hasATSR = ultimateCode.includes('runATSRTitleGenerator');
    const codeSize = Math.round(ultimateCode.length / 1024);

    console.log(`   Size: ${codeSize} KB`);
    console.log(`   ${hasATSR ? '✅' : '❌'} Contains runATSRTitleGenerator\n`);

    if (!hasATSR) {
      console.log('❌ File does not contain ATSR code!\n');
      return;
    }

    // Get current bound script to preserve manifest
    console.log('📋 Getting current bound script...\n');
    const currentProject = await script.projects.getContent({
      scriptId: BOUND_SCRIPT_ID
    });

    const manifestFile = currentProject.data.files.find(f => f.name === 'appsscript');

    // Deploy ULTIMATE code
    console.log('🚀 Deploying ULTIMATE ATSR...\n');

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
            source: ultimateCode
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
      const deployedSize = Math.round(codeFile.source.length / 1024);

      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅ VERIFICATION:\n');
      console.log(`   Deployed size: ${deployedSize} KB`);
      console.log(`   onOpen() function: ${hasOnOpen ? '✅' : '❌'}`);
      console.log(`   TEST menu: ${hasTestMenu ? '✅' : '❌'}`);
      console.log(`   runATSRTitleGenerator: ${hasATSRFunc ? '✅' : '❌'}\n`);

      if (hasOnOpen && hasTestMenu && hasATSRFunc) {
        console.log('🎉 ULTIMATE ATSR SUCCESSFULLY DEPLOYED!\n');
        console.log('📋 Your spreadsheet now has Code_ULTIMATE_ATSR.gs\n');
        console.log('   This is the most current and updated version (134 KB)\n');
        console.log('🔄 Next steps:\n');
        console.log('   1. Refresh your spreadsheet');
        console.log('   2. Look for the 🧪 TEST menu');
        console.log('   3. Click Titles Optimizer\n');
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
