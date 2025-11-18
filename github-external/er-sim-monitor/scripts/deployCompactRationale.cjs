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
  console.log('\n🔧 DEPLOYING COMPACT RATIONALE TEXT\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  // Read updated Phase2 file (now with compact rationale)
  const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
  const phase2Code = fs.readFileSync(phase2Path, 'utf8');

  console.log('📄 Files loaded:');
  console.log(`   Categories_Pathways_Feature_Phase2.gs: ${(phase2Code.length / 1024).toFixed(1)} KB\n`);

  // Get current project
  const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

  // Update Phase2 file
  const files = project.data.files.map(f => {
    if (f.name === 'Categories_Pathways_Feature_Phase2') {
      console.log('   ✅ Updating Categories_Pathways_Feature_Phase2.gs (compact rationale)');
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
  console.log('✅ COMPACT RATIONALE TEXT DEPLOYED\n');
  console.log('📋 What changed:');
  console.log('   • Reduced rationale font size from 12px → 8px');
  console.log('   • Limited to 2 lines with ellipsis overflow');
  console.log('   • Tighter line height (1.1) and spacing');
  console.log('   • Maximum height constraint (18px total)\n');
  console.log('🎯 Expected result:');
  console.log('   • Much less vertical space per card');
  console.log('   • Should fit 6+ cards on screen now');
  console.log('   • Rationale still readable but compact\n');
  console.log('🔧 How to test:');
  console.log('   1. Open Google Sheet');
  console.log('   2. Refresh the page (F5)');
  console.log('   3. Open "🧪 TEST Tools" → "🧩 Pathway Chain Builder"');
  console.log('   4. Select a pathway and logic type');
  console.log('   5. Count how many cards are now visible\n');
  console.log('💡 The rationale text should now be tiny but still readable\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

deploy().catch(console.error);
