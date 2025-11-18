#!/usr/bin/env node

/**
 * BIND GPT FORMATTER TO PRODUCTION SPREADSHEET
 * Makes GPT Formatter the container-bound script for production
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_SPREADSHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';
const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n🔗 BINDING GPT FORMATTER TO PRODUCTION SPREADSHEET\n');
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
    const script = google.script({ version: 'v1', auth });

    console.log(`📊 Production Spreadsheet: ${PRODUCTION_SPREADSHEET_ID}`);
    console.log(`📦 GPT Formatter Project: ${GPT_FORMATTER_ID}\n`);

    // Check current binding
    console.log('🔍 Checking current project binding...\n');

    const projectDetails = await script.projects.get({
      scriptId: GPT_FORMATTER_ID
    });

    const currentParent = projectDetails.data.parentId;
    console.log(`Current parent: ${currentParent || 'None (standalone)'}\n`);

    if (currentParent === PRODUCTION_SPREADSHEET_ID) {
      console.log('✅ GPT Formatter is already bound to production spreadsheet!\n');
      console.log('The menu should appear. Try:\n');
      console.log('   1. Hard refresh the spreadsheet (Cmd+Shift+R)\n');
      console.log('   2. Wait 10-15 seconds\n');
      console.log('   3. Check for "🧠 Sim Builder" menu\n');
      return;
    }

    // Bind project to production spreadsheet
    console.log('🔗 Binding GPT Formatter to production spreadsheet...\n');

    await drive.files.update({
      fileId: GPT_FORMATTER_ID,
      addParents: PRODUCTION_SPREADSHEET_ID,
      removeParents: currentParent || undefined,
      fields: 'id, name, parents'
    });

    console.log('✅ Successfully bound GPT Formatter to production!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 COMPLETE!\n');
    console.log('Next steps:\n');
    console.log('   1. Refresh production spreadsheet\n');
    console.log('   2. Wait 10-15 seconds for onOpen() to trigger\n');
    console.log('   3. Look for "🧠 Sim Builder" menu in menu bar\n');
    console.log('   4. Test ATSR Titles Optimizer (should have mystery button)\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

bindProject();
