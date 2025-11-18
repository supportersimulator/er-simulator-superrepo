#!/usr/bin/env node

/**
 * COMPARE TEST TOOLS - MONOLITHIC WITH GPT FORMATTER
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n🔍 FINDING TEST TOOLS - MONOLITHIC PROJECT\n');
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
    const drive = google.drive({ version: 'v3', auth });
    const script = google.script({ version: 'v1', auth });

    console.log('🔍 Searching for "TEST Tools - Monolithic" project...\n');

    const response = await drive.files.list({
      q: "name contains 'TEST' and name contains 'Monolithic' and mimeType='application/vnd.google-apps.script' and trashed=false",
      fields: 'files(id, name, modifiedTime)',
      pageSize: 10
    });

    const projects = response.data.files || [];

    if (projects.length === 0) {
      console.log('❌ Could not find project via Drive API\n');
      console.log('Please provide the project ID:\n');
      console.log('1. Click "TEST Tools - Monolithic Environment"\n');
      console.log('2. Copy project ID from URL\n');
      return;
    }

    const testProject = projects[0];
    console.log(`📦 Found: ${testProject.name}`);
    console.log(`   ID: ${testProject.id}\n`);

    console.log('📥 Downloading both projects...\n');

    const [testContent, gptContent] = await Promise.all([
      script.projects.getContent({ scriptId: testProject.id }),
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
    const uniqueToGPT = gptFunctions.filter(f => !testFunctions.includes(f));

    console.log('📊 COMPARISON:\n');
    console.log(`   TEST Monolithic has ${testFunctions.length} functions`);
    console.log(`   GPT Formatter has ${gptFunctions.length} functions\n`);

    if (uniqueToTest.length > 0) {
      console.log(`⚠️  Functions ONLY in TEST Monolithic (${uniqueToTest.length}):\n`);
      uniqueToTest.slice(0, 20).forEach(f => console.log(`   - ${f}()`));
      if (uniqueToTest.length > 20) {
        console.log(`   ... and ${uniqueToTest.length - 20} more\n`);
      }
      console.log('\n   We should merge these into GPT Formatter!\n');
    } else {
      console.log('✅ GPT Formatter has ALL functions from TEST Monolithic\n');
    }

    if (uniqueToGPT.length > 0) {
      console.log(`ℹ️  Functions ONLY in GPT Formatter (${uniqueToGPT.length}):\n`);
      uniqueToGPT.slice(0, 10).forEach(f => console.log(`   - ${f}()`));
      if (uniqueToGPT.length > 10) {
        console.log(`   ... and ${uniqueToGPT.length - 10} more\n`);
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Save project ID for merging
    fs.writeFileSync(
      path.join(__dirname, '../backups/test-monolithic-id.txt'),
      testProject.id,
      'utf8'
    );

    if (uniqueToTest.length > 0) {
      console.log('📝 RECOMMENDATION:\n');
      console.log('   Merge TEST Monolithic into GPT Formatter first,\n');
      console.log('   then delete TEST Monolithic project.\n');
    } else {
      console.log('✅ SAFE TO DELETE:\n');
      console.log('   TEST Tools - Monolithic Environment\n');
      console.log('   GPT Formatter already has everything!\n');
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
