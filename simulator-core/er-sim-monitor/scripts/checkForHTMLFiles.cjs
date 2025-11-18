#!/usr/bin/env node

/**
 * CHECK FOR SEPARATE HTML FILES IN TEST PROJECT
 * Maybe there's an HTML file we're not updating?
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_PROJECT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

console.log('\n📁 CHECKING FOR SEPARATE HTML FILES IN TEST PROJECT\n');
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

async function checkForHTMLFiles() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`🎯 TEST Project ID: ${TEST_PROJECT_ID}\n`);
    console.log('📥 Downloading project files...\n');

    const project = await script.projects.getContent({
      scriptId: TEST_PROJECT_ID
    });

    console.log('📂 ALL FILES IN TEST PROJECT:\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    project.data.files.forEach((file, index) => {
      const size = file.source ? (file.source.length / 1024).toFixed(1) : '0.0';
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   Type: ${file.type}`);
      console.log(`   Size: ${size} KB`);

      if (file.name.toLowerCase().includes('atsr') || file.name.toLowerCase().includes('html')) {
        console.log(`   ⚠️  POTENTIAL ATSR FILE!`);
      }

      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`📊 TOTAL FILES: ${project.data.files.length}\n`);

    // Save all files
    console.log('💾 Saving all files locally...\n');
    const saveDir = path.join(__dirname, '../backups/test-all-files-2025-11-06');
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }

    project.data.files.forEach(file => {
      if (file.source) {
        const ext = file.type === 'HTML' ? '.html' : file.type === 'JSON' ? '.json' : '.gs';
        const filePath = path.join(saveDir, file.name + ext);
        fs.writeFileSync(filePath, file.source, 'utf8');
        console.log(`   Saved: ${file.name}${ext}`);
      }
    });

    console.log(`\n✅ All files saved to: ${saveDir}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

checkForHTMLFiles();
