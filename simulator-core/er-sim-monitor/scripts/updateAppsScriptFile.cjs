#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SCRIPT_ID = '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i';

function getAccessToken() {
  const clasprcPath = path.join(process.env.HOME, '.clasprc.json');
  if (!fs.existsSync(clasprcPath)) {
    throw new Error('No .clasprc.json found');
  }
  const clasprc = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));
  return clasprc.tokens?.default?.access_token || clasprc.token?.access_token;
}

async function updateFile() {
  try {
    console.log('🔑 Getting access token...');
    const accessToken = getAccessToken();
    
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const script = google.script({ version: 'v1', auth: oauth2Client });

    console.log('📥 Fetching current project...');
    
    const getResponse = await script.projects.getContent({
      scriptId: SCRIPT_ID
    });

    console.log('✅ Project fetched successfully');
    console.log('📁 Files in project:');
    getResponse.data.files.forEach(f => {
      console.log(`   - ${f.name} (${f.type})`);
    });

    // Find the file to update
    const targetFile = getResponse.data.files.find(f => 
      f.name === 'Ultimate_Categorization_Tool_Complete'
    );

    if (!targetFile) {
      console.log('❌ Target file not found');
      return;
    }

    console.log(`\n🎯 Found target file: ${targetFile.name}`);
    console.log('📝 Reading fixed code...');

    const fixedCode = fs.readFileSync(
      '/Users/aarontjomsland/er-sim-monitor/backups/Apps_Script_Backup_2025-11-13T04-18-16/Ultimate_Categorization_Tool_Complete.gs',
      'utf8'
    );

    console.log('✏️  Updating file content...');
    targetFile.source = fixedCode;

    console.log('📤 Pushing update to Apps Script...');
    await script.projects.updateContent({
      scriptId: SCRIPT_ID,
      requestBody: {
        files: getResponse.data.files
      }
    });

    console.log('✅ SUCCESS! File updated in Apps Script');
    console.log('🔧 Fix applied: Line 1525 now uses suggestedSymptomName');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Details:', error.response.data);
    }
  }
}

updateFile();
