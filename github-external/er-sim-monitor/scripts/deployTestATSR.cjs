#!/usr/bin/env node

/**
 * Deploy ATSR_Title_Generator_Feature.gs with TEST menu to TEST spreadsheet
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

async function deploy() {
  console.log('\n🚀 DEPLOYING TEST ATSR TO TEST SPREADSHEET\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Read the TEST ATSR code
    const testATSRPath = path.join(__dirname, '../apps-script-deployable/ATSR_Title_Generator_Feature.gs');
    console.log('📥 Reading ATSR_Title_Generator_Feature.gs...\n');

    if (!fs.existsSync(testATSRPath)) {
      console.log('❌ File not found!\n');
      return;
    }

    const testATSRCode = fs.readFileSync(testATSRPath, 'utf8');
    const codeSize = Math.round(testATSRCode.length / 1024);

    console.log(`   Size: ${codeSize} KB`);
    console.log(`   ${testATSRCode.includes('TEST Tools') ? '✅' : '❌'} Contains TEST Tools menu`);
    console.log(`   ${testATSRCode.includes('runATSRTitleGenerator') ? '✅' : '❌'} Contains runATSRTitleGenerator\n`);

    // Get current script to preserve manifest
    console.log('📋 Getting current script...\n');
    const currentProject = await script.projects.getContent({
      scriptId: TEST_SCRIPT_ID
    });

    const manifestFile = currentProject.data.files.find(f => f.name === 'appsscript');

    // Deploy TEST ATSR
    console.log('🚀 Deploying TEST ATSR...\n');

    await script.projects.updateContent({
      scriptId: TEST_SCRIPT_ID,
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
            source: testATSRCode
          }
        ]
      }
    });

    console.log('✅ Successfully deployed!\n');

    // Verify
    const updatedProject = await script.projects.getContent({
      scriptId: TEST_SCRIPT_ID
    });

    const codeFile = updatedProject.data.files.find(f => f.name === 'Code');
    if (codeFile) {
      const hasOnOpen = codeFile.source.includes('function onOpen()');
      const hasTestMenu = codeFile.source.includes('TEST Tools');
      const hasATSRFunc = codeFile.source.includes('runATSRTitleGenerator');
      const deployedSize = Math.round(codeFile.source.length / 1024);

      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅ VERIFICATION:\n');
      console.log(`   Deployed size: ${deployedSize} KB`);
      console.log(`   onOpen() function: ${hasOnOpen ? '✅' : '❌'}`);
      console.log(`   🧪 TEST Tools menu: ${hasTestMenu ? '✅' : '❌'}`);
      console.log(`   runATSRTitleGenerator: ${hasATSRFunc ? '✅' : '❌'}\n`);

      if (hasOnOpen && hasTestMenu && hasATSRFunc) {
        console.log('🎉 TEST ATSR SUCCESSFULLY DEPLOYED!\n');
        console.log('📋 TEST spreadsheet now has:\n');
        console.log('   🧪 TEST Tools menu with:');
        console.log('      - 🎨 ATSR Titles Optimizer (v2)');
        console.log('      - 🧩 Pathway Chain Builder\n');
        console.log('🔄 Next steps:\n');
        console.log('   1. Refresh TEST_Convert_Master_Sim_CSV_Template_with_Input');
        console.log('   2. Look for the 🧪 TEST Tools menu');
        console.log('   3. Click "ATSR Titles Optimizer (v2)"\n');
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
