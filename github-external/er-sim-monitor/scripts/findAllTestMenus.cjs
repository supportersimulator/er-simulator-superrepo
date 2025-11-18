#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

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

async function findMenus() {
  console.log('\n🔍 SEARCHING ALL PROJECTS FOR TEST TOOLS MENU\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });
  const drive = google.drive({ version: 'v3', auth });

  try {
    // List all Apps Script projects
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.script'",
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: 50
    });

    console.log(`📋 Checking ${response.data.files.length} Apps Script projects...\n`);

    let foundMenus = [];

    for (const file of response.data.files) {
      try {
        const project = await script.projects.getContent({ scriptId: file.id });
        
        // Search for TEST menu in any file
        for (const codeFile of project.data.files) {
          if (!codeFile.source) continue;
          
          const code = codeFile.source;
          
          // Look for TEST menu patterns
          const testMenuMatch = code.match(/createMenu\(['"](.*?TEST.*?)['"]\)([\s\S]*?)\.addToUi\(\)/gi);
          
          if (testMenuMatch) {
            console.log(`✅ FOUND TEST MENU in: ${file.name}`);
            console.log(`   Script ID: ${file.id}`);
            console.log(`   File: ${codeFile.name}\n`);
            
            // Extract menu items
            testMenuMatch.forEach(menuBlock => {
              console.log('   📋 Menu structure:');
              const menuName = menuBlock.match(/createMenu\(['"](.*?)['"]\)/i)?.[1];
              console.log(`      Menu: "${menuName}"\n`);
              
              const items = menuBlock.match(/\.addItem\(['"](.*?)['"],\s*['"](.*?)['"]\)/g);
              if (items) {
                console.log('      Items:');
                items.forEach(item => {
                  const parts = item.match(/addItem\(['"](.*?)['"],\s*['"](.*?)['"]\)/);
                  if (parts) {
                    console.log(`         • ${parts[1]} → ${parts[2]}()`);
                  }
                });
              }
              console.log('');
            });
            
            foundMenus.push({
              projectName: file.name,
              scriptId: file.id,
              fileName: codeFile.name,
              menuBlock: testMenuMatch[0]
            });
          }
        }
        
      } catch (e) {
        // Skip projects we can't access
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    
    if (foundMenus.length > 0) {
      console.log(`✅ FOUND ${foundMenus.length} TEST MENU(S)\n`);
      foundMenus.forEach((menu, i) => {
        console.log(`${i + 1}. ${menu.projectName}`);
        console.log(`   Script ID: ${menu.scriptId}\n`);
      });
    } else {
      console.log('❌ NO TEST MENUS FOUND\n');
      console.log('The TEST Tools menu may have been removed or is in a project\n');
      console.log('that we don\'t have access to.\n');
    }
    
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Failed: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

findMenus().catch(console.error);
