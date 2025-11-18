#!/usr/bin/env node

/**
 * COMPARE TITLE OPTIMIZER WITH GPT FORMATTER
 * See if Title Optimizer has anything we're missing
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TITLE_OPTIMIZER_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';
const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n🔍 COMPARING TITLE OPTIMIZER WITH GPT FORMATTER\n');
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

    console.log('📥 Downloading Title Optimizer...\n');

    const titleProject = await script.projects.getContent({
      scriptId: TITLE_OPTIMIZER_ID
    });

    const titleCode = titleProject.data.files.find(f => f.name === 'Code')?.source || '';
    console.log(`   Title Optimizer: ${(titleCode.length / 1024).toFixed(1)} KB\n`);

    console.log('📥 Downloading GPT Formatter...\n');

    const gptProject = await script.projects.getContent({
      scriptId: GPT_FORMATTER_ID
    });

    const gptCode = gptProject.data.files.find(f => f.name === 'Code')?.source || '';
    console.log(`   GPT Formatter: ${(gptCode.length / 1024).toFixed(1)} KB\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 ANALYZING DIFFERENCES:\n');

    // Find all functions in Title Optimizer
    const titleFunctions = [...titleCode.matchAll(/^function\s+(\w+)/gm)].map(m => m[1]);
    const gptFunctions = [...gptCode.matchAll(/^function\s+(\w+)/gm)].map(m => m[1]);

    console.log(`   Title Optimizer has ${titleFunctions.length} functions`);
    console.log(`   GPT Formatter has ${gptFunctions.length} functions\n`);

    // Find functions in Title Optimizer that GPT doesn't have
    const missingFunctions = titleFunctions.filter(f => !gptFunctions.includes(f));

    if (missingFunctions.length > 0) {
      console.log(`⚠️  Functions in Title Optimizer NOT in GPT Formatter:\n`);
      missingFunctions.forEach(f => console.log(`   - ${f}()`));
      console.log('\n   We should add these to GPT Formatter!\n');
    } else {
      console.log('✅ GPT Formatter has ALL functions from Title Optimizer\n');
    }

    // Check menus
    const titleMenus = [...titleCode.matchAll(/createMenu\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
    const gptMenus = [...gptCode.matchAll(/createMenu\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📋 MENUS:\n');
    console.log(`   Title Optimizer: ${titleMenus.join(', ')}`);
    console.log(`   GPT Formatter: ${gptMenus.join(', ')}\n`);

    // Save both for inspection
    const titlePath = path.join(__dirname, '../backups/title-optimizer-code-2025-11-06.gs');
    const gptPath = path.join(__dirname, '../backups/gpt-formatter-code-2025-11-06.gs');

    fs.writeFileSync(titlePath, titleCode, 'utf8');
    fs.writeFileSync(gptPath, gptCode, 'utf8');

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('💾 SAVED FOR COMPARISON:\n');
    console.log(`   Title Optimizer: ${titlePath}`);
    console.log(`   GPT Formatter: ${gptPath}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 RECOMMENDATION:\n');

    if (titleCode.length < gptCode.length && missingFunctions.length === 0) {
      console.log('✅ GPT Formatter is MORE COMPLETE than Title Optimizer!\n');
      console.log('   Safe to DELETE Title Optimizer project.\n');
      console.log('   Everything you need is already in GPT Formatter.\n');
    } else if (missingFunctions.length > 0) {
      console.log('⚠️  Title Optimizer has some unique functions.\n');
      console.log('   We should merge them into GPT Formatter first.\n');
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
