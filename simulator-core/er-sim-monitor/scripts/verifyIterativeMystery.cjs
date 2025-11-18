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

async function verify() {
  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
  const atsrFile = project.data.files.find(f => f.name === 'ATSR_Title_Generator_Feature');

  if (!atsrFile) {
    console.log('❌ ATSR file not found!');
    return;
  }

  console.log('\n🔍 ITERATIVE MYSTERY FEATURE VERIFICATION\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const checks = [
    { name: 'Mystery button', pattern: /btn-mystery/ },
    { name: 'Collect current titles', pattern: /const currentTitles = Array\.from\(textInputs\)\.map\(input => input\.value\)/ },
    { name: 'Pass currentTitles to server', pattern: /generateMysteriousSparkTitles\(\$\{row\}, mysteryLevel, currentTitles\)/ },
    { name: 'Server accepts currentTitles param', pattern: /function generateMysteriousSparkTitles\(row, mysteryLevel, currentTitles\)/ },
    { name: 'Iterative mode check', pattern: /if \(currentTitles && currentTitles\.length > 0\)/ },
    { name: 'Patient context in iteration', pattern: /\*\*Patient Context \(to maintain relevance\):\*\*/ },
    { name: 'Demographic extraction', pattern: /const demographicMatch = currentSparkTitle\.match/ },
    { name: 'Format requirement in prompt', pattern: /\*\*FORMAT REQUIREMENT:\*\*/ },
    { name: 'Demographic in examples', pattern: /Grandpa\\'s Not Acting Right.*Family Concerned/ },
    { name: 'Mystery level counter', pattern: /let mysteryLevel = 1/ },
    { name: 'Progressive emoji change', pattern: /const levelEmojis = \['🎭', '🕵️', '❓', '🌫️', '👻'\]/ },
    { name: 'Cache bust v7', pattern: /v7_demographic_format/ }
  ];

  let allPassed = true;

  checks.forEach(check => {
    const match = atsrFile.source.match(check.pattern);
    if (match) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
      allPassed = false;
    }
  });

  console.log('\n═══════════════════════════════════════════════════════════════');

  if (allPassed) {
    console.log('✅ ALL ITERATIVE MYSTERY FEATURES VERIFIED');
    console.log('\n📋 How it works:');
    console.log('   1. Extracts demographic (58 M) from current Spark Title');
    console.log('   2. Button collects current titles from UI text inputs');
    console.log('   3. Passes them to server with mystery level');
    console.log('   4. Server detects iterative mode (currentTitles array exists)');
    console.log('   5. AI makes those specific titles MORE mysterious');
    console.log('   6. PRESERVES demographic formatting: "Title (58 M): Description"');
    console.log('   7. Maintains patient context throughout iterations');
    console.log('   8. Mystery level increases with each click (🎭→🕵️→❓→🌫️→👻)');
  } else {
    console.log('⚠️  SOME FEATURES MISSING - Check deployment');
  }

  console.log('═══════════════════════════════════════════════════════════════\n');
}

verify().catch(console.error);
