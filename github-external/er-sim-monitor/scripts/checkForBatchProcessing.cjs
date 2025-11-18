#!/usr/bin/env node

/**
 * CHECK IF GPT FORMATTER HAS BATCH PROCESSING
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n🔍 CHECKING FOR BATCH PROCESSING IN GPT FORMATTER\n');
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

async function check() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading GPT Formatter code...\n');

    const content = await script.projects.getContent({
      scriptId: GPT_FORMATTER_ID
    });

    const code = content.data.files.find(f => f.name === 'Code').source;

    console.log(`📦 Size: ${(code.length / 1024).toFixed(1)} KB\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Check for batch processing functions
    const batchFunctions = [
      'openSimSidebar',
      'startBatchFromSidebar',
      'runSingleStepBatch',
      'finishBatchAndReport',
      'runSingleCaseFromSidebar',
      'processOneInputRow_',
      'getNext25InputRows_',
      'getAllInputRows_',
      'getSpecificInputRows_',
      'stopBatch',
      'ensureBatchReportsSheet_',
      'getSidebarLogs',
      'clearSidebarLogs'
    ];

    console.log('🔍 BATCH PROCESSING FUNCTIONS:\n');

    let hasAll = true;
    batchFunctions.forEach(func => {
      const has = code.includes(`function ${func}`);
      console.log(`   ${has ? '✅' : '❌'} ${func}()`);
      if (!has) hasAll = false;
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    if (hasAll) {
      console.log('✅ GPT FORMATTER HAS ALL BATCH PROCESSING FUNCTIONS!\n');
      console.log('   Safe to DELETE "Core Batch Processing & Quality" project.\n');
      console.log('   Everything is already in GPT Formatter.\n');
    } else {
      console.log('⚠️  GPT Formatter is MISSING some batch functions.\n');
      console.log('   Need to find and merge the Core Batch Processing project.\n');
      console.log('\n   Please find the project ID:\n');
      console.log('   1. Extensions → Apps Script\n');
      console.log('   2. Click "Core Batch Processing & Quality"\n');
      console.log('   3. Copy the project ID from the URL\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

check();
