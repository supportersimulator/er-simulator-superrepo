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
  console.log('\n🔧 DEPLOYING SPACE OPTIMIZATION FOR 6+ CARDS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  // Read updated Phase2 file (now with space optimizations)
  const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
  const phase2Code = fs.readFileSync(phase2Path, 'utf8');

  console.log('📄 Files loaded:');
  console.log(`   Categories_Pathways_Feature_Phase2.gs: ${(phase2Code.length / 1024).toFixed(1)} KB\n`);

  // Get current project
  const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

  // Update Phase2 file
  const files = project.data.files.map(f => {
    if (f.name === 'Categories_Pathways_Feature_Phase2') {
      console.log('   ✅ Updating Categories_Pathways_Feature_Phase2.gs (space optimizations)');
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
  console.log('✅ SPACE OPTIMIZATION DEPLOYED\n');
  console.log('📋 Changes made:');
  console.log('   • Container gap: 40px → 6px (85% reduction)');
  console.log('   • Container padding: 32px → 4px horizontal (87% reduction)');
  console.log('   • Rationale text: Hidden by default, shows on hover');
  console.log('   • Hover tooltip: Beautiful blue popup with full rationale\n');
  console.log('🎯 Space savings:');
  console.log('   • Card width: 140px (already deployed)');
  console.log('   • Gap between cards/arrows: 6px');
  console.log('   • Left/right padding: 4px each');
  console.log('   • Estimated cards visible: 6-8 cards\n');
  console.log('🔧 How to test:');
  console.log('   1. Open Google Sheet');
  console.log('   2. Refresh the page (F5)');
  console.log('   3. Open "🧪 TEST Tools" → "🧩 Pathway Chain Builder"');
  console.log('   4. Select a pathway and logic type');
  console.log('   5. Count how many cards are visible');
  console.log('   6. Hover over a card to see rationale tooltip\n');
  console.log('💡 Expected: 6+ cards should now be visible on screen!\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

deploy().catch(console.error);
