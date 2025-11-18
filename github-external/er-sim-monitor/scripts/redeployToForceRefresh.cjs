#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const PROD_SCRIPT_ID = '1Bkbm2MNA-YmXQEoMsIlC-VgEgHiQHO2EuMXR-yyxy9lYWl3eNcEHk_S-';

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

async function redeploy() {
  console.log('\n🔄 REDEPLOYING TO FORCE MENU REFRESH\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Get current content
    const project = await script.projects.getContent({ scriptId: PROD_SCRIPT_ID });
    
    console.log('📥 Retrieved current project content\n');
    console.log('📤 Redeploying (triggers onOpen refresh)...\n');
    
    // Redeploy exactly as-is (this forces Apps Script to re-register triggers)
    await script.projects.updateContent({
      scriptId: PROD_SCRIPT_ID,
      requestBody: {
        files: project.data.files
      }
    });

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ REDEPLOYMENT COMPLETE\n');
    console.log('🎯 This forces Apps Script to re-register the onOpen() trigger\n');
    console.log('📋 NEXT STEPS:\n');
    console.log('   1. Close your Google Sheet completely (close the browser tab)');
    console.log('   2. Reopen the spreadsheet from Google Drive');
    console.log('   3. Wait for menus to load (may take 5-10 seconds)');
    console.log('   4. You should see both menus:');
    console.log('      • 🧠 Sim Builder');
    console.log('      • 🧪 TEST\n');
    console.log('💡 If still not showing:');
    console.log('   • Check execution log: Extensions → Apps Script → Executions');
    console.log('   • Look for onOpen() executions and any errors\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Failed: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

redeploy().catch(console.error);
