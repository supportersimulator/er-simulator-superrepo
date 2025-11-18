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

async function check() {
  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

  console.log('\n🔍 SEARCHING FOR DUPLICATE ATSR FUNCTIONS\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📁 Files in project:');
  project.data.files.forEach(f => {
    if (f.type === 'SERVER_JS') {
      console.log(`   ${f.name}.gs (${(f.source.length / 1024).toFixed(1)} KB)`);
    }
  });
  console.log('');

  // Check for runATSRTitleGenerator in each file
  console.log('🔎 Searching for runATSRTitleGenerator function:\n');

  const atsrFunctions = [];

  project.data.files.forEach(f => {
    if (f.type === 'SERVER_JS') {
      const hasRunATSR = f.source.includes('function runATSRTitleGenerator');
      const hasBuildUI = f.source.includes('function buildATSRUltimateUI_');
      const hasSparkTitles = f.source.includes('Spark Titles (Pre-Sim Mystery)');

      if (hasRunATSR || hasBuildUI || hasSparkTitles) {
        atsrFunctions.push({
          file: f.name,
          hasRunATSR,
          hasBuildUI,
          hasSparkTitles,
          size: f.source.length
        });

        console.log(`📄 ${f.name}.gs:`);
        console.log(`   ${hasRunATSR ? '✅' : '❌'} runATSRTitleGenerator()`);
        console.log(`   ${hasBuildUI ? '✅' : '❌'} buildATSRUltimateUI_()`);
        console.log(`   ${hasSparkTitles ? '✅' : '❌'} Spark Titles UI`);
        console.log('');
      }
    }
  });

  console.log('═══════════════════════════════════════════════════════════════');

  if (atsrFunctions.length === 0) {
    console.log('❌ NO ATSR FUNCTIONS FOUND!');
  } else if (atsrFunctions.length === 1) {
    console.log('✅ ATSR functions found in ONLY ONE file (correct)');
    console.log(`   File: ${atsrFunctions[0].file}.gs`);
  } else {
    console.log('⚠️  DUPLICATE ATSR FUNCTIONS DETECTED!');
    console.log(`   Found in ${atsrFunctions.length} files:`);
    atsrFunctions.forEach(f => {
      console.log(`   - ${f.file}.gs`);
    });
  }

  console.log('═══════════════════════════════════════════════════════════════\n');
}

check().catch(console.error);
