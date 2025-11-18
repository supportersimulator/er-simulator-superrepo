#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const GPT_FORMATTER_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n🔍 CHECKING GPT FORMATTER FOR DUPLICATE MENUS\n');
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

async function check() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading GPT Formatter code...\n');

    const content = await script.projects.getContent({
      scriptId: GPT_FORMATTER_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    
    if (!codeFile) {
      console.log('❌ No Code.gs file found!\n');
      return;
    }

    const code = codeFile.source;
    
    // Count onOpen functions
    const onOpenMatches = [...code.matchAll(/^function onOpen\(\)/gm)];
    console.log(`📊 Found ${onOpenMatches.length} onOpen() function(s)\n`);

    if (onOpenMatches.length > 1) {
      console.log('⚠️  MULTIPLE onOpen() FUNCTIONS FOUND!\n');
      console.log('   This will cause multiple menus to appear.\n');
      console.log('   Only the LAST onOpen() function will execute.\n\n');
    }

    // Find all createMenu calls
    const menuMatches = [...code.matchAll(/createMenu\(['"]([^'"]+)['"]\)/g)];
    console.log(`📋 Found ${menuMatches.length} createMenu() call(s):\n`);
    
    menuMatches.forEach((match, index) => {
      console.log(`   ${index + 1}. "${match[1]}"`);
    });
    console.log('');

    // Save current code for inspection
    const savePath = path.join(__dirname, '../backups/gpt-formatter-current-2025-11-06.gs');
    fs.writeFileSync(savePath, code, 'utf8');
    console.log(`💾 Saved current code to: ${savePath}\n`);
    console.log(`   Size: ${(code.length / 1024).toFixed(1)} KB\n`);

    // Check for duplicate function names
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 Checking for duplicate menu-creating functions...\n');

    const functionCounts = {};
    const functionMatches = [...code.matchAll(/^function\s+(\w+)/gm)];
    
    functionMatches.forEach(match => {
      const funcName = match[1];
      functionCounts[funcName] = (functionCounts[funcName] || 0) + 1;
    });

    const duplicates = Object.entries(functionCounts).filter(([name, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log('⚠️  DUPLICATE FUNCTIONS FOUND:\n');
      duplicates.forEach(([name, count]) => {
        console.log(`   - ${name}() appears ${count} times`);
      });
      console.log('\n   JavaScript will use the LAST declaration!\n');
    } else {
      console.log('✅ No duplicate functions found\n');
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

check();
