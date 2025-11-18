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

async function find() {
  console.log('\n🔍 FINDING MENU FILE\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    
    console.log(`📋 Total files in project: ${project.data.files.length}\n`);
    
    // List all files
    project.data.files.forEach(file => {
      console.log(`   • ${file.name} (${file.type})`);
    });
    
    console.log('\n🔍 Searching for ATSR_Title_Generator_Feature file...\n');
    
    const atsrFile = project.data.files.find(f => f.name === 'ATSR_Title_Generator_Feature');
    
    if (atsrFile) {
      console.log('✅ Found ATSR_Title_Generator_Feature\n');
      
      // Check for onOpen function
      if (atsrFile.source.includes('function onOpen')) {
        console.log('✅ Has onOpen() function\n');
        
        // Extract onOpen function
        const onOpenMatch = atsrFile.source.match(/function onOpen\(\) \{[\s\S]*?\n\}/);
        if (onOpenMatch) {
          console.log('📝 onOpen() function:\n');
          console.log(onOpenMatch[0].substring(0, 1000));
          console.log('\n...\n');
        }
      } else {
        console.log('⚠️  No onOpen() function found\n');
      }
      
      // Check for TEST menu
      if (atsrFile.source.includes('TEST')) {
        console.log('✅ Contains "TEST" string\n');
        
        const testMenuMatch = atsrFile.source.match(/createMenu\(['"](.*?TEST.*?)['"]\)/i);
        if (testMenuMatch) {
          console.log(`✅ Found TEST menu: "${testMenuMatch[1]}"\n`);
        }
      } else {
        console.log('⚠️  No TEST menu found\n');
      }
      
    } else {
      console.log('❌ ATSR_Title_Generator_Feature file not found\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (e) {
    console.log('\n❌ Failed: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

find().catch(console.error);
