#!/usr/bin/env node

/**
 * CHECK PRODUCTION PROJECT FOR BATCH PROCESSING FUNCTIONS
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

console.log('\n🔍 CHECKING PRODUCTION FOR BATCH PROCESSING\n');
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

async function checkBatchProcessing() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`📦 Production Project: ${PRODUCTION_PROJECT_ID}\n`);

    // Download code
    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');

    if (!codeFile) {
      console.log('❌ No Code file found!\n');
      return;
    }

    const code = codeFile.source;
    const codeSize = (code.length / 1024).toFixed(1);
    console.log(`📊 Code size: ${codeSize} KB\n`);

    // Check for batch processing functions
    console.log('🔍 Checking for Batch Processing functions:\n');

    const batchFunctions = {
      'openSimSidebar': code.includes('function openSimSidebar('),
      'startBatchFromSidebar': code.includes('function startBatchFromSidebar('),
      'processBatch': code.includes('function processBatch('),
      'processNextBatch': code.includes('function processNextBatch('),
      'launchBatchEngine': code.includes('function launchBatchEngine('),
      'startBatchProcessingEngine': code.includes('function startBatchProcessingEngine('),
      'queueBatchRows': code.includes('function queueBatchRows('),
      'processQueuedBatch': code.includes('function processQueuedBatch('),
      'Batch Sidebar HTML': code.includes('SimulatorBatchSidebar')
    };

    let hasAnyBatch = false;
    for (const [funcName, present] of Object.entries(batchFunctions)) {
      console.log(`   ${present ? '✅' : '❌'} ${funcName}`);
      if (present) hasAnyBatch = true;
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    if (hasAnyBatch) {
      console.log('✅ BATCH PROCESSING FUNCTIONS FOUND!\n');
      console.log('The batch processing system is present in production.\n');
      console.log('To add it to the menu:\n');
      console.log('   1. I need to update the onOpen() menu\n');
      console.log('   2. Add "🚀 Batch Processing" menu item\n');
      console.log('   3. Point it to openSimSidebar() function\n');
      console.log('\nShould I add this to the menu?\n');
    } else {
      console.log('❌ NO BATCH PROCESSING FUNCTIONS FOUND!\n');
      console.log('The batch processing code was not included.\n');
      console.log('I can add it from the original Title Optimizer backup.\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

checkBatchProcessing();
