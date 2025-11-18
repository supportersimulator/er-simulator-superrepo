#!/usr/bin/env node

/**
 * VERIFY PRODUCTION HAS MENU CONFIGURED
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '1NXjFvH2Wo117saCyqmNDfCqZ1iQ9vykxa0-kHUhFAYDuhthgql5Ru_P6';
const PRODUCTION_SPREADSHEET_ID = '1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM';

console.log('\n🔍 VERIFYING PRODUCTION MENU\n');
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

async function verify() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Checking production project...\n');

    // Check project details
    const details = await script.projects.get({
      scriptId: PRODUCTION_PROJECT_ID
    });

    console.log(`   Project: ${details.data.title}`);
    console.log(`   Parent: ${details.data.parentId || 'None (standalone)'}\n`);

    if (details.data.parentId !== PRODUCTION_SPREADSHEET_ID) {
      console.log('🔴 PROBLEM: Project is NOT bound to production spreadsheet!\n');
      console.log(`   Expected parent: ${PRODUCTION_SPREADSHEET_ID}`);
      console.log(`   Actual parent: ${details.data.parentId}\n`);
      console.log('   This is why the menu doesn\'t appear!\n');
    } else {
      console.log('✅ Project IS bound to production spreadsheet\n');
    }

    // Check code
    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const code = content.data.files.find(f => f.name === 'Code')?.source || '';

    console.log(`   Code size: ${(code.length / 1024).toFixed(1)} KB\n`);

    // Check for onOpen
    const hasOnOpen = code.includes('function onOpen()');
    console.log(`   Has onOpen(): ${hasOnOpen ? '✅ YES' : '❌ NO'}\n`);

    if (hasOnOpen) {
      // Extract menu code
      const onOpenMatch = code.match(/function onOpen\(\)[^{]*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
      if (onOpenMatch) {
        const menuCode = onOpenMatch[0];
        const menus = [...menuCode.matchAll(/createMenu\(['"]([^'"]+)['"]\)/g)];
        
        console.log('   Menus in onOpen():\n');
        menus.forEach(m => console.log(`      - ${m[1]}`));
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    if (!details.data.parentId) {
      console.log('📝 DIAGNOSIS:\n');
      console.log('   The project is STANDALONE (not container-bound).\n');
      console.log('   Container-bound scripts automatically run onOpen().\n');
      console.log('   Standalone scripts do NOT run onOpen() automatically.\n\n');
      console.log('   SOLUTION:\n');
      console.log('   We need to create a trigger to run onOpen() on spreadsheet open.\n');
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

verify();
