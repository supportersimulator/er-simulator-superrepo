#!/usr/bin/env node

/**
 * Create a container-bound script for the spreadsheet with TEST menu
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';
const STANDALONE_SCRIPT_ID = '1Bkbm2MNA-YmXQEoMsIlC-VgEgHiQHO2EuMXR-yyxy9lYWl3eNcEHk_S-';

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

async function createBoundScript() {
  console.log('\n🔧 CREATING CONTAINER-BOUND SCRIPT WITH TEST MENU\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });

  try {
    // Step 1: Get the menu code from standalone script
    console.log('📥 Fetching TEST menu code from standalone script...\n');

    const standaloneProject = await script.projects.getContent({
      scriptId: STANDALONE_SCRIPT_ID
    });

    const codeFile = standaloneProject.data.files.find(f => f.name === 'Code');
    if (!codeFile) {
      console.log('❌ Could not find Code file in standalone script\n');
      return;
    }

    const menuCode = codeFile.source;
    console.log('✅ Retrieved menu code\n');

    // Step 2: Create a new bound script for the spreadsheet
    console.log('🆕 Creating new container-bound script...\n');

    const newProject = await script.projects.create({
      requestBody: {
        title: 'TEST Menu Script (Bound)',
        parentId: SPREADSHEET_ID
      }
    });

    const newScriptId = newProject.data.scriptId;
    console.log(`✅ Created script: ${newScriptId}\n`);

    // Step 3: Get the manifest from standalone script
    const manifestFile = standaloneProject.data.files.find(f => f.name === 'appsscript');
    const manifest = manifestFile ? manifestFile.source : JSON.stringify({
      timeZone: "America/New_York",
      dependencies: {},
      exceptionLogging: "STACKDRIVER"
    }, null, 2);

    // Step 4: Update the script with the menu code AND manifest
    console.log('📝 Deploying TEST menu code with manifest...\n');

    await script.projects.updateContent({
      scriptId: newScriptId,
      requestBody: {
        files: [
          {
            name: 'appsscript',
            type: 'JSON',
            source: manifest
          },
          {
            name: 'Code',
            type: 'SERVER_JS',
            source: menuCode
          }
        ]
      }
    });

    console.log('✅ Deployed menu code\n');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ SUCCESS - CONTAINER-BOUND SCRIPT CREATED\n');
    console.log(`🆔 Script ID: ${newScriptId}\n`);
    console.log('📋 NEXT STEPS:\n');
    console.log('1. Close and reopen the spreadsheet');
    console.log('2. The TEST menu should now appear at the top');
    console.log('3. If not, refresh the page (Cmd+R)\n');
    console.log('The script is now properly bound to your spreadsheet.\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');

    if (e.message.includes('User does not have permission')) {
      console.log('⚠️  PERMISSIONS ISSUE\n');
      console.log('The API may not have permission to create container-bound scripts.\n');
      console.log('ALTERNATIVE APPROACH:\n');
      console.log('1. Open the spreadsheet in browser');
      console.log('2. Go to Extensions → Apps Script');
      console.log('3. This will create a bound script automatically');
      console.log('4. Copy the menu code and paste it there\n');
      console.log('I can prepare the code for you to paste manually.\n');
    }

    if (e.stack) {
      console.log(e.stack);
    }
  }
}

createBoundScript().catch(console.error);
