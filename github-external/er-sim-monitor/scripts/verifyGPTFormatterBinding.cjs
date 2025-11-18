#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';
const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n🔍 VERIFYING GPT FORMATTER BINDING\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

async function verify() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`Checking GPT Formatter: ${GPT_FORMATTER_ID}\n`);

    const details = await script.projects.get({
      scriptId: GPT_FORMATTER_ID
    });

    console.log(`Project Title: ${details.data.title}`);
    console.log(`Parent ID: ${details.data.parentId || 'None'}\n`);

    if (details.data.parentId === TEST_SPREADSHEET_ID) {
      console.log('✅ GPT FORMATTER IS CORRECTLY BOUND TO TEST SPREADSHEET!\n');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('📝 NEXT STEPS:\n');
      console.log('1. Refresh the test spreadsheet in your browser\n');
      console.log('2. Click Extensions → Apps Script\n');
      console.log('3. It should open GPT Formatter directly (no selection menu)\n');
      console.log('4. Run "🧠 Sim Builder" → "ATSR Titles Optimizer"\n');
      console.log('5. Mystery button should now appear! 🎭\n');
      console.log('═══════════════════════════════════════════════════════════════\n');
    } else {
      console.log('❌ GPT FORMATTER IS NOT BOUND TO TEST SPREADSHEET\n');
      console.log(`   Current parent: ${details.data.parentId || 'None'}\n`);
      console.log(`   Expected: ${TEST_SPREADSHEET_ID}\n`);
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

verify();
