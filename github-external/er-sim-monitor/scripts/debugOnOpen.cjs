#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const PROD_SCRIPT_ID = '1Bkbm2MNA-YmXQEoMsIlC-VgEgHiQHO2EuMXR-yyxy9lYWl3eNcEHk_S-';

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

async function debug() {
  console.log('\n🔍 DEBUGGING onOpen() FUNCTION\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const project = await script.projects.getContent({ scriptId: PROD_SCRIPT_ID });
    const codeFile = project.data.files.find(f => f.name === 'Code');

    if (!codeFile) {
      console.log('❌ Code file not found\n');
      return;
    }

    const code = codeFile.source;

    // Find onOpen function
    const onOpenMatch = code.match(/function onOpen\(\) \{[\s\S]*?\n\}/);
    
    if (onOpenMatch) {
      console.log('✅ Found onOpen() function\n');
      console.log('📋 COMPLETE onOpen() CODE:\n');
      console.log('─────────────────────────────────────────────────────────────');
      console.log(onOpenMatch[0]);
      console.log('─────────────────────────────────────────────────────────────\n');
      
      // Count menus
      const menuCount = (onOpenMatch[0].match(/createMenu\(/g) || []).length;
      console.log(`📊 Analysis:`);
      console.log(`   • Number of menus: ${menuCount}`);
      
      // Find all createMenu calls
      const allMenus = onOpenMatch[0].match(/createMenu\(['"](.*?)['"]\)/g);
      if (allMenus) {
        console.log(`   • Menus being created:`);
        allMenus.forEach(menu => {
          const name = menu.match(/createMenu\(['"](.*?)['"]\)/)[1];
          console.log(`      - "${name}"`);
        });
      }
      
      // Check if TEST menu exists
      if (onOpenMatch[0].includes('TEST')) {
        console.log(`\n   ✅ TEST menu code found in onOpen()`);
      } else {
        console.log(`\n   ❌ TEST menu code NOT found in onOpen()`);
      }
      
    } else {
      console.log('❌ No onOpen() function found\n');
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Failed: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

debug().catch(console.error);
