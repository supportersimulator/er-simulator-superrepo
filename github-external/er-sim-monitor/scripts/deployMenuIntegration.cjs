#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i';

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
  console.log('\n🔧 DEPLOYING MENU INTEGRATION FOR PATHWAY CHAIN BUILDER\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  // Read updated ATSR feature file (now with menu integration)
  const atsrPath = path.join(__dirname, '../apps-script-deployable/ATSR_Title_Generator_Feature.gs');
  const atsrCode = fs.readFileSync(atsrPath, 'utf8');

  console.log('📄 Files loaded:');
  console.log(`   ATSR_Title_Generator_Feature.gs: ${(atsrCode.length / 1024).toFixed(1)} KB\n`);

  // Get current project
  const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

  // Update ATSR file with new menu
  const files = project.data.files.map(f => {
    if (f.name === 'ATSR_Title_Generator_Feature') {
      console.log('   ✅ Updating ATSR_Title_Generator_Feature.gs (with new menu)');
      return {
        name: f.name,
        type: f.type,
        source: atsrCode
      };
    }
    return f;
  });

  // Deploy
  await script.projects.updateContent({
    scriptId: TEST_SCRIPT_ID,
    requestBody: {
      files: files
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ MENU INTEGRATION DEPLOYMENT COMPLETE\n');
  console.log('📋 What was updated:');
  console.log('   • ATSR menu now includes Pathway Chain Builder');
  console.log('   • Menu item: "🧩 Pathway Chain Builder"');
  console.log('   • Function: runPathwayChainBuilder()\n');
  console.log('🔧 How to use:');
  console.log('   1. Open Google Sheet');
  console.log('   2. Refresh the page (F5)');
  console.log('   3. Look for "🧪 TEST Tools" menu at top');
  console.log('   4. Click "🧩 Pathway Chain Builder"');
  console.log('   5. Bird\'s eye view will open automatically\n');
  console.log('💡 Note: You must refresh the Google Sheet page for the menu to appear.\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

deploy().catch(console.error);
