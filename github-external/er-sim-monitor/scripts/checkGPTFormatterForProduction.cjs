#!/usr/bin/env node

/**
 * CHECK GPT FORMATTER CODE AND CREATE COPY FOR PRODUCTION
 * Verifies GPT Formatter has complete code, then helps create production version
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_SPREADSHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';
const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';
const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n📋 CHECKING GPT FORMATTER CODE FOR PRODUCTION DEPLOYMENT\n');
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

async function checkCode() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    console.log(`📊 Test Spreadsheet: ${TEST_SPREADSHEET_ID}`);
    console.log(`📦 GPT Formatter (TEST): ${GPT_FORMATTER_ID}\n`);

    // Download GPT Formatter code
    console.log('📥 Downloading GPT Formatter code...\n');

    const content = await script.projects.getContent({
      scriptId: GPT_FORMATTER_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    if (!codeFile) {
      console.log('❌ No Code file found in GPT Formatter!\n');
      return;
    }

    const codeSize = (codeFile.source.length / 1024).toFixed(1);
    const functionMatches = codeFile.source.match(/^function\s+\w+/gm);
    const functionCount = functionMatches ? functionMatches.length : 0;

    console.log(`📊 GPT Formatter Stats:`);
    console.log(`   Size: ${codeSize} KB`);
    console.log(`   Functions: ${functionCount}`);
    console.log(`   Lines: ${codeFile.source.split('\n').length.toLocaleString()}\n`);

    // Check for key features
    console.log('🔍 Checking for key features:\n');

    const features = {
      'ATSR Title Generator': codeFile.source.includes('runATSRTitleGenerator'),
      'Mystery Button': codeFile.source.includes('regenerateMoreMysterious'),
      'Categories & Pathways': codeFile.source.includes('runCategoriesPathwaysPanel'),
      'Field Selector': codeFile.source.includes('showFieldSelector'),
      'Cache System': codeFile.source.includes('showCacheAllLayersModal'),
      'Batch Processing': codeFile.source.includes('startBatchFromSidebar'),
      'Pathway Chain Builder': codeFile.source.includes('buildPathwayChain'),
      'Holistic Analysis': codeFile.source.includes('analyzeHolistically'),
      'Sim Builder Menu': codeFile.source.includes('🧠 Sim Builder')
    };

    for (const [feature, present] of Object.entries(features)) {
      console.log(`   ${present ? '✅' : '❌'} ${feature}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Save code for production deployment
    const prodCodePath = path.join(__dirname, '../backups/gpt-formatter-ready-for-production-2025-11-06.gs');
    fs.writeFileSync(prodCodePath, codeFile.source, 'utf8');
    console.log(`💾 Saved production-ready code to:\n   ${prodCodePath}\n`);

    // Check if production spreadsheet has ANY bound scripts
    console.log('🔍 Checking production spreadsheet for bound scripts...\n');

    const prodScripts = await drive.files.list({
      q: `'${PRODUCTION_SPREADSHEET_ID}' in parents and mimeType='application/vnd.google-apps.script'`,
      fields: 'files(id, name, createdTime, modifiedTime)',
      pageSize: 10
    });

    const scripts = prodScripts.data.files || [];

    console.log(`Found ${scripts.length} bound script(s) in production:\n`);

    if (scripts.length === 0) {
      console.log('❌ NO BOUND SCRIPTS IN PRODUCTION!\n');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('📝 SOLUTION:\n');
      console.log('Option 1: Create new container-bound script in production\n');
      console.log('   1. Open production spreadsheet:\n');
      console.log('      https://docs.google.com/spreadsheets/d/1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM\n');
      console.log('   2. Extensions → Apps Script\n');
      console.log('   3. Copy the Script ID from the URL\n');
      console.log('   4. Share the ID so I can deploy the code\n\n');
      console.log('Option 2: I can create a new project programmatically\n');
      console.log('   (requires additional API permissions)\n');
    } else {
      console.log('✅ Found bound script(s):\n');
      scripts.forEach((script, index) => {
        console.log(`${index + 1}. ${script.name}`);
        console.log(`   ID: ${script.id}`);
        console.log(`   Modified: ${new Date(script.modifiedTime).toLocaleString()}\n`);
      });

      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('🎯 I can deploy to the first bound script!\n');
      console.log(`Target: ${scripts[0].name} (${scripts[0].id})\n`);
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

checkCode();
