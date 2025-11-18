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
  console.log('\n🔧 DEPLOYING DIAGNOSIS & LEARNING OUTCOMES ON CARDS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  // Read updated Phase2 file
  const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
  const phase2Code = fs.readFileSync(phase2Path, 'utf8');

  console.log('📄 Files loaded:');
  console.log(`   Categories_Pathways_Feature_Phase2.gs: ${(phase2Code.length / 1024).toFixed(1)} KB\n`);

  // Get current project
  const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

  // Update Phase2 file
  const files = project.data.files.map(f => {
    if (f.name === 'Categories_Pathways_Feature_Phase2') {
      console.log('   ✅ Updating Categories_Pathways_Feature_Phase2.gs (diagnosis & learning)');
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
  console.log('✅ DIAGNOSIS & LEARNING OUTCOMES DEPLOYED\n');
  console.log('📋 Changes made:');
  console.log('   • Added "Case_Orientation_Actual_Learning_Outcomes" column loading');
  console.log('   • Replaced category with diagnosis on cards');
  console.log('   • Added learning outcomes display on cards');
  console.log('   • Diagnosis: Orange text, truncated to 30 chars');
  console.log('   • Learning: Cyan text, truncated to 40 chars\n');
  console.log('🎨 Card layout now shows:');
  console.log('   • Header: Case ID + Row number');
  console.log('   • Title: Spark Title');
  console.log('   • Dx: Chief Diagnosis (orange)');
  console.log('   • Learning: Actual Learning Outcomes (cyan)');
  console.log('   • Rationale: Hidden, shows on hover\n');
  console.log('🔧 How to test:');
  console.log('   1. Open Google Sheet');
  console.log('   2. Refresh the page (F5)');
  console.log('   3. Open "🧪 TEST Tools" → "🧩 Pathway Chain Builder"');
  console.log('   4. Select a pathway and logic type');
  console.log('   5. Verify cards show diagnosis and learning outcomes');
  console.log('   6. Hover to see full rationale\n');
  console.log('💡 Educational value: Now showing actual medical info!\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

deploy().catch(console.error);
