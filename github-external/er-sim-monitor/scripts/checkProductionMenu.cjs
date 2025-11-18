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

async function checkMenu() {
  console.log('\n🔍 CHECKING PRODUCTION TEST MENU\n');
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
      console.log('📋 Current onOpen() code:\n');
      console.log(onOpenMatch[0]);
      console.log('\n');
    } else {
      console.log('⚠️  No onOpen() function found\n');
    }

    // Find TEST menu
    const testMenuMatch = code.match(/createMenu\(['"](.*?TEST.*?)['"]\)[\s\S]*?\.addToUi\(\)/i);
    
    if (testMenuMatch) {
      console.log('✅ Found TEST menu\n');
      console.log('📋 TEST Menu structure:\n');
      console.log(testMenuMatch[0].substring(0, 1500));
      console.log('\n...\n');
      
      // Extract menu items
      const items = testMenuMatch[0].match(/\.addItem\(['"](.*?)['"],\s*['"](.*?)['"]\)/g);
      if (items) {
        console.log('\n📝 Current Menu Items:');
        items.forEach(item => {
          const parts = item.match(/addItem\(['"](.*?)['"],\s*['"](.*?)['"]\)/);
          if (parts) {
            console.log(`   • ${parts[1]} → ${parts[2]}()`);
          }
        });
      }
    } else {
      console.log('⚠️  No TEST menu found\n');
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Failed: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

checkMenu().catch(console.error);
