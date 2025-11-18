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
  console.log('\n🔧 DEPLOYING SIMPLIFIED TAB SWITCHING\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  // Read updated Phase2 file (now with simplified tab switching)
  const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
  const phase2Code = fs.readFileSync(phase2Path, 'utf8');

  console.log('📄 Files loaded:');
  console.log(`   Categories_Pathways_Feature_Phase2.gs: ${(phase2Code.length / 1024).toFixed(1)} KB\n`);

  // Get current project
  const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

  // Update Phase2 file
  const files = project.data.files.map(f => {
    if (f.name === 'Categories_Pathways_Feature_Phase2') {
      console.log('   ✅ Updating Categories_Pathways_Feature_Phase2.gs (simplified tab switching)');
      return {
        name: f.name,
        type: f.type,
        source: phase2Code
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
  console.log('✅ SIMPLIFIED TAB SWITCHING DEPLOYED\n');
  console.log('📋 What changed:');
  console.log('   • Replaced switchTab(event, tabName) with separate functions');
  console.log('   • Added showCategories() function');
  console.log('   • Added showPathways() function');
  console.log('   • Removed event parameter complexity\n');
  console.log('🔧 How to test:');
  console.log('   1. Open Google Sheet');
  console.log('   2. Refresh the page (F5)');
  console.log('   3. Open "🧪 TEST Tools" → "🧩 Pathway Chain Builder"');
  console.log('   4. Click "📁 Categories" tab - should show system cards');
  console.log('   5. Click "🧩 Pathways" tab - should show pathway opportunities\n');
  console.log('💡 Simplified approach: No event parameters, direct DOM manipulation\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

deploy().catch(console.error);
