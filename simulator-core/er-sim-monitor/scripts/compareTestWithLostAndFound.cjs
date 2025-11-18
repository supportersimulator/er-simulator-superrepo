#!/usr/bin/env node

/**
 * Compare what's currently live in TEST with lost-and-found version
 * to see if we lost important work
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

async function compare() {
  console.log('\n🔍 COMPARING TEST (current) vs LOST-AND-FOUND (yesterday evening)\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    // Pull current TEST
    console.log('📥 Pulling current TEST Code.gs...\n');
    const testProject = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const testCode = testProject.data.files.find(f => f.name === 'Code');

    const testPath = '/tmp/current_test.gs';
    fs.writeFileSync(testPath, testCode.source, 'utf8');
    console.log(`   ✅ Current TEST: ${Math.round(testCode.source.length / 1024)} KB\n`);

    // Lost-and-found version
    const lostAndFoundPath = '/Users/aarontjomsland/er-sim-monitor/backups/lost-and-found-20251105-203821/Code_ULTIMATE_ATSR_FROM_DRIVE.gs';
    const lostAndFoundSize = Math.round(fs.statSync(lostAndFoundPath).size / 1024);
    console.log(`   📁 Lost-and-found: ${lostAndFoundSize} KB\n`);

    // Compare critical functions
    console.log('🔬 Comparing critical batch processing functions:\n');

    const functions = ['tryParseJSON', 'validateVitalsFields_', 'processOneInputRow_', 'applyClinicalDefaults_'];

    let hasDifferences = false;

    for (const func of functions) {
      try {
        // Extract from TEST
        execSync(`awk "/function ${func}/,/^}/" ${testPath} > /tmp/test_${func}.txt`, { stdio: 'ignore' });

        // Extract from lost-and-found
        execSync(`awk "/function ${func}/,/^}/" "${lostAndFoundPath}" > /tmp/laf_${func}.txt`, { stdio: 'ignore' });

        // Compare
        try {
          execSync(`diff -q /tmp/test_${func}.txt /tmp/laf_${func}.txt`, { stdio: 'ignore' });
          console.log(`   ✅ ${func}: IDENTICAL`);
        } catch (e) {
          console.log(`   ❌ ${func}: DIFFERENT`);
          hasDifferences = true;

          // Show snippet of difference
          try {
            const diffOutput = execSync(`diff -u /tmp/test_${func}.txt /tmp/laf_${func}.txt | head -15`).toString();
            console.log('      First few lines of diff:');
            diffOutput.split('\n').forEach(line => console.log('        ' + line));
          } catch (e) {}
        }
      } catch (e) {
        console.log(`   ⚠️  ${func}: Could not compare`);
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════');

    if (hasDifferences) {
      console.log('⚠️  DIFFERENCES FOUND!\n');
      console.log('📋 RECOMMENDATION:\n');
      console.log('   The lost-and-found version (from yesterday 8:38 PM) has');
      console.log('   NEWER code than what we just deployed.\n');
      console.log('   Should restore from lost-and-found to get latest work.\n');
    } else {
      console.log('✅ ALL CRITICAL FUNCTIONS IDENTICAL\n');
      console.log('   Current TEST deployment has same code as lost-and-found.\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('❌ Error: ' + e.message + '\n');
    if (e.stack) console.log(e.stack);
  }
}

compare().catch(console.error);
