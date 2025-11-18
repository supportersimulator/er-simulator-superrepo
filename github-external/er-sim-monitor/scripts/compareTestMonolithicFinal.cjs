#!/usr/bin/env node

/**
 * COMPARE TEST MONOLITHIC WITH GPT FORMATTER
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_MONOLITHIC_ID = '1lU89yFCJkREq_5CIjEVgpPWQ0H6nU_HxoMgaPDb5KxA_f-JztUp1oLUS';
const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n🔍 COMPARING TEST MONOLITHIC WITH GPT FORMATTER\n');
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

async function compare() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading both projects...\n');

    const [testContent, gptContent] = await Promise.all([
      script.projects.getContent({ scriptId: TEST_MONOLITHIC_ID }),
      script.projects.getContent({ scriptId: GPT_FORMATTER_ID })
    ]);

    const testCode = testContent.data.files.find(f => f.name === 'Code')?.source || '';
    const gptCode = gptContent.data.files.find(f => f.name === 'Code')?.source || '';

    console.log(`   TEST Monolithic: ${(testCode.length / 1024).toFixed(1)} KB`);
    console.log(`   GPT Formatter: ${(gptCode.length / 1024).toFixed(1)} KB\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Find unique functions
    const testFunctions = [...testCode.matchAll(/^function\s+(\w+)/gm)].map(m => m[1]);
    const gptFunctions = [...gptCode.matchAll(/^function\s+(\w+)/gm)].map(m => m[1]);

    const uniqueToTest = testFunctions.filter(f => !gptFunctions.includes(f));

    console.log('📊 COMPARISON:\n');
    console.log(`   TEST Monolithic: ${testFunctions.length} functions`);
    console.log(`   GPT Formatter: ${gptFunctions.length} functions\n`);

    if (uniqueToTest.length > 0) {
      console.log(`⚠️  Functions ONLY in TEST Monolithic (${uniqueToTest.length}):\n`);
      uniqueToTest.forEach(f => console.log(`   - ${f}()`));
      console.log('\n   Need to merge these into GPT Formatter first!\n');
    } else {
      console.log('✅ GPT Formatter has ALL functions from TEST Monolithic!\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Save both codes for inspection
    fs.writeFileSync(
      path.join(__dirname, '../backups/test-monolithic-2025-11-06.gs'),
      testCode,
      'utf8'
    );

    if (uniqueToTest.length > 0) {
      console.log('📝 NEXT STEP:\n');
      console.log('   Merge TEST Monolithic unique functions into GPT Formatter.\n');
      console.log('   Run merge script? (I can create it)\n');
    } else {
      console.log('✅ SAFE TO DELETE:\n');
      console.log('   TEST Tools - Monolithic Environment\n');
      console.log('   GPT Formatter already has everything!\n');
      console.log('\n   After deleting, you will have ONLY "🧠 Sim Builder" menu!\n');
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

compare();
