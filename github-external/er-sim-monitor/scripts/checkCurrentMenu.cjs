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

async function check() {
  console.log('\n🔍 CHECKING CURRENT MENU STRUCTURE\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    
    // Find files that might contain menu code
    const menuFiles = project.data.files.filter(f => 
      f.source && (
        f.source.includes('createMenu') || 
        f.source.includes('TEST') ||
        f.source.includes('onOpen')
      )
    );

    console.log(`📋 Found ${menuFiles.length} files with menu code:\n`);

    menuFiles.forEach(file => {
      console.log(`\n📄 ${file.name}:\n`);
      
      // Find onOpen functions
      const onOpenMatches = file.source.match(/function\s+onOpen\s*\([^)]*\)\s*\{[^}]*\}/g);
      if (onOpenMatches) {
        console.log('   ✅ Has onOpen() function');
      }
      
      // Find menu creation
      const menuMatches = file.source.match(/\.createMenu\(['"](.*?)['"]\)/g);
      if (menuMatches) {
        console.log('   📝 Menus created:');
        menuMatches.forEach(match => {
          const menuName = match.match(/createMenu\(['"](.*?)['"]\)/)[1];
          console.log(`      • "${menuName}"`);
        });
      }
      
      // Find TEST menu specifically
      const testMenuMatch = file.source.match(/createMenu\(['"](.*TEST.*?)['"]\)([\s\S]*?)\.addToUi\(\)/i);
      if (testMenuMatch) {
        console.log('\n   🎯 TEST MENU STRUCTURE:');
        const testMenuCode = testMenuMatch[0];
        
        // Find all addItem calls
        const items = testMenuCode.match(/\.addItem\(['"](.*?)['"],\s*['"](.*?)['"]\)/g);
        if (items) {
          console.log('   Menu Items:');
          items.forEach(item => {
            const parts = item.match(/addItem\(['"](.*?)['"],\s*['"](.*?)['"]\)/);
            console.log(`      • ${parts[1]} → ${parts[2]}()`);
          });
        }
        
        // Find addSubMenu calls
        const submenus = testMenuCode.match(/\.addSubMenu\((\w+)\)/g);
        if (submenus) {
          console.log('   Submenus:');
          submenus.forEach(sub => console.log(`      • ${sub}`));
        }
      }
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Failed: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

check().catch(console.error);
