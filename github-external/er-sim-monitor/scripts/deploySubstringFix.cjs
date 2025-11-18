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
  console.log('\n🔧 DEPLOYING SUBSTRING FIX\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  const phase2Path = path.join(__dirname, '../apps-script-deployable/Categories_Pathways_Feature_Phase2.gs');
  const phase2Code = fs.readFileSync(phase2Path, 'utf8');

  console.log('📄 Files loaded:');
  console.log(`   Categories_Pathways_Feature_Phase2.gs: ${(phase2Code.length / 1024).toFixed(1)} KB\n`);

  const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

  const files = project.data.files.map(f => {
    if (f.name === 'Categories_Pathways_Feature_Phase2') {
      console.log('   ✅ Updating Categories_Pathways_Feature_Phase2.gs (substring fix)');
      return {
        name: f.name,
        type: f.type,
        source: phase2Code
      };
    }
    return f;
  });

  await script.projects.updateContent({
    scriptId: TEST_SCRIPT_ID,
    requestBody: {
      files: files
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ SUBSTRING FIX DEPLOYED\n');
  console.log('📋 What was fixed:');
  console.log('   • Added null/undefined checks for diagnosis field');
  console.log('   • Added null/undefined checks for learningOutcomes field');
  console.log('   • Now uses (field || \'\') before calling .substring()');
  console.log('   • Prevents "Cannot read properties of undefined" error\n');
  console.log('🔧 This fixes the error you saw when clicking cards!\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

deploy().catch(console.error);
