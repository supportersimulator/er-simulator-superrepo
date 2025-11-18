#!/usr/bin/env node

/**
 * BIND TITLE OPTIMIZER TO TEST SPREADSHEET
 * Makes the Title Optimizer project a container-bound script
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_SPREADSHEET_ID = '1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI';
const TITLE_OPTIMIZER_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

console.log('\n🔗 BINDING TITLE OPTIMIZER TO TEST SPREADSHEET\n');
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

async function bindProject() {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    console.log(`📊 Test Spreadsheet: ${TEST_SPREADSHEET_ID}\n`);
    console.log(`🎯 Title Optimizer Project: ${TITLE_OPTIMIZER_ID}\n`);

    console.log('🔍 Checking current binding status...\n');

    // Get current Title Optimizer metadata
    const titleOptimizer = await drive.files.get({
      fileId: TITLE_OPTIMIZER_ID,
      fields: 'id,name,parents'
    });

    console.log(`Current Title Optimizer status:`);
    console.log(`   Name: ${titleOptimizer.data.name}`);
    console.log(`   Parents: ${titleOptimizer.data.parents ? titleOptimizer.data.parents.join(', ') : 'NONE (standalone)'}\n`);

    if (titleOptimizer.data.parents && titleOptimizer.data.parents.includes(TEST_SPREADSHEET_ID)) {
      console.log('✅ Title Optimizer is ALREADY bound to test spreadsheet!\n');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('The binding is correct. The menu issue must be something else.\n');
      console.log('Try these steps:\n');
      console.log('   1. Open test spreadsheet');
      console.log('   2. Press Cmd+R (or F5) to fully refresh');
      console.log('   3. Wait 5-10 seconds for scripts to load');
      console.log('   4. Check for "🧪 TEST Tools" menu\n');
      return;
    }

    console.log('🔗 Binding Title Optimizer to test spreadsheet...\n');

    // Update the parent to bind it to the spreadsheet
    await drive.files.update({
      fileId: TITLE_OPTIMIZER_ID,
      addParents: TEST_SPREADSHEET_ID,
      fields: 'id,name,parents'
    });

    console.log('✅ Successfully bound Title Optimizer to test spreadsheet!\n');

    // Verify the binding
    const updatedProject = await drive.files.get({
      fileId: TITLE_OPTIMIZER_ID,
      fields: 'id,name,parents'
    });

    console.log('Verification:');
    console.log(`   Parents: ${updatedProject.data.parents.join(', ')}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ BINDING COMPLETE!\n');
    console.log('📝 NEXT STEPS:\n');
    console.log('   1. Open your test spreadsheet: https://docs.google.com/spreadsheets/d/' + TEST_SPREADSHEET_ID);
    console.log('   2. Press Cmd+R (or F5) to fully refresh the page');
    console.log('   3. Wait 5-10 seconds for the script to load');
    console.log('   4. Look for "🧪 TEST Tools" menu at the top');
    console.log('   5. The menu should now appear with three options:\n');
    console.log('      • 🎨 ATSR Titles Optimizer');
    console.log('      • 🧩 Categories & Pathways (Phase 2)');
    console.log('      • 🔗 Pathway Chain Builder\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

bindProject();
