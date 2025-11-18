#!/usr/bin/env node

/**
 * VERIFY DEPLOYED PHASE2 IN TEST
 *
 * Pull currently deployed code and check if our changes are actually there
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

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
  console.log('\n🔍 VERIFYING DEPLOYED CODE IN TEST\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    console.log('📥 Pulling currently deployed code from TEST...\n');
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });

    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');

    if (!phase2File) {
      console.log('❌ Categories_Pathways_Feature_Phase2.gs NOT FOUND in TEST!\n');
      console.log('Available files:');
      project.data.files.forEach(f => console.log(`   - ${f.name}`));
      return;
    }

    const code = phase2File.source;
    const sizeKB = Math.round(code.length / 1024);
    const lineCount = code.split('\n').length;

    console.log(`✅ Found Categories_Pathways_Feature_Phase2.gs: ${sizeKB} KB (${lineCount} lines)\n`);

    // Check for our changes
    console.log('🔍 Checking for deployed changes:\n');

    const checks = {
      'testHello function': code.includes('function testHello()'),
      'performHolisticAnalysis with 27 fields': code.includes('// BASIC INFO (3 fields)'),
      'tryParseVitals helper': code.includes('function tryParseVitals_'),
      'truncateField helper': code.includes('function truncateField_'),
      'BATCH_SIZE = 25': code.includes('const BATCH_SIZE = 25'),
      'batch progress logging': code.includes('Logger.log(\'🔄 Batch'),
      'fieldsPerCase: 27': code.includes('fieldsPerCase: 27')
    };

    let allPresent = true;
    for (const [check, present] of Object.entries(checks)) {
      const status = present ? '✅' : '❌';
      console.log(`   ${status} ${check}`);
      if (!present) allPresent = false;
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    if (allPresent) {
      console.log('✅ ALL CHANGES DEPLOYED SUCCESSFULLY!\n');
      console.log('The code in TEST has all our fixes. The issue must be elsewhere.\n');

      // Check if performCacheWithProgress exists
      if (code.includes('function performCacheWithProgress()')) {
        console.log('✅ performCacheWithProgress() exists\n');

        // Check what it does
        const funcMatch = code.match(/function performCacheWithProgress\(\)[^]*?^}/m);
        if (funcMatch) {
          const funcCode = funcMatch[0];
          console.log('📋 performCacheWithProgress() implementation:\n');
          console.log(funcCode.split('\n').slice(0, 20).join('\n'));
          console.log('   ...\n');
        }
      } else {
        console.log('❌ performCacheWithProgress() NOT FOUND\n');
      }

      // Check if preCacheRichData exists
      if (code.includes('function preCacheRichData()')) {
        console.log('✅ preCacheRichData() exists (opens modal)\n');
      } else {
        console.log('❌ preCacheRichData() NOT FOUND\n');
      }

    } else {
      console.log('⚠️  SOME CHANGES MISSING FROM DEPLOYMENT\n');
      console.log('This means our deployment did not fully succeed.');
      console.log('Need to redeploy with all changes.\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Save deployed code for inspection
    const deployedPath = '/tmp/deployed_phase2_check.gs';
    fs.writeFileSync(deployedPath, code, 'utf8');
    console.log(`💾 Deployed code saved to: ${deployedPath}\n`);

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) console.log(e.stack);
  }
}

verify().catch(console.error);
