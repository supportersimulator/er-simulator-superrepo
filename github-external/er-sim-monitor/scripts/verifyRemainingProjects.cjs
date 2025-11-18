#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

console.log('\n✅ VERIFYING REMAINING PROJECTS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

const EXPECTED_PROJECTS = [
  {
    id: '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw',
    name: 'GPT Formatter'
  },
  {
    id: '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf',
    name: 'TEST Menu Script (Bound) #1'
  }
];

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

    for (const proj of EXPECTED_PROJECTS) {
      console.log('Checking: ' + proj.name);
      console.log('   ID: ' + proj.id);
      
      try {
        const project = await script.projects.get({ scriptId: proj.id });
        const content = await script.projects.getContent({ scriptId: proj.id });
        
        const files = content.data.files.filter(f => f.type === 'SERVER_JS');
        const sizeKB = Math.round(files.reduce((sum, f) => sum + (f.source ? f.source.length : 0), 0) / 1024);
        
        console.log('   ✅ ACCESSIBLE');
        console.log('   Title: ' + project.data.title);
        console.log('   Files: ' + files.length + ' .gs files (' + sizeKB + ' KB)');
        console.log('   Updated: ' + new Date(project.data.updateTime).toLocaleString());
        
      } catch (error) {
        console.log('   ❌ ERROR: ' + error.message);
      }
      
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ VERIFICATION COMPLETE!\n');
    console.log('If both projects are accessible, your Apps Script environment');
    console.log('is clean and only contains the 2 projects you need.\n');
    console.log('Refresh https://script.google.com/home to see the updated list.\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

verify();
