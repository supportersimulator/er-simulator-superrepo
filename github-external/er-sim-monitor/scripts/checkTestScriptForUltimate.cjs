#!/usr/bin/env node

/**
 * Check the TEST script project for ULTIMATE ATSR code
 */

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

async function check() {
  console.log('\n🔍 CHECKING TEST SCRIPT FOR ULTIMATE ATSR\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  // Load ULTIMATE code for comparison
  const ultimatePath = path.join(__dirname, 'Code_ULTIMATE_ATSR_FROM_DRIVE.gs');
  const ultimateCode = fs.existsSync(ultimatePath) ? fs.readFileSync(ultimatePath, 'utf8') : null;

  try {
    console.log('📥 Fetching TEST script project...\n');
    console.log(`   ID: ${TEST_SCRIPT_ID}\n`);

    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    console.log('📋 Files in project:\n');
    project.data.files.forEach(f => console.log(`   • ${f.name}`));
    console.log('');

    // Check each file for ATSR
    const atsrFile = project.data.files.find(f =>
      f.source && (f.source.includes('runATSRTitleGenerator') || f.name.includes('ATSR'))
    );

    if (!atsrFile) {
      console.log('❌ No ATSR code found in this project\n');
      console.log('This project has Categories & Pathways and Cache, but NO ATSR.\n');
      return;
    }

    const codeSize = Math.round(atsrFile.source.length / 1024);
    console.log(`✅ Found ATSR in file: ${atsrFile.name}`);
    console.log(`   Size: ${codeSize} KB\n`);

    // Compare with ULTIMATE
    if (ultimateCode) {
      if (atsrFile.source === ultimateCode) {
        console.log('🎯 EXACT MATCH with Code_ULTIMATE_ATSR.gs!\n');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('✅ FOUND IT! The ULTIMATE ATSR is in the TEST script project.\n');
        console.log(`   Project ID: ${TEST_SCRIPT_ID}\n`);
        console.log('═══════════════════════════════════════════════════════════════\n');
      } else {
        const ultimateSize = Math.round(ultimateCode.length / 1024);
        console.log(`⚠️  Different from Code_ULTIMATE_ATSR.gs\n`);
        console.log(`   This file: ${codeSize} KB`);
        console.log(`   ULTIMATE: ${ultimateSize} KB`);
        console.log(`   Difference: ${codeSize - ultimateSize} KB\n`);
      }
    }

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

check().catch(console.error);
