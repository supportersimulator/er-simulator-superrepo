#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SCRIPT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

function getAccessToken() {
  const clasprcPath = path.join(process.env.HOME, '.clasprc.json');
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

    console.log('✅ Project fetched');
    console.log('📁 Files:', getResponse.data.files.map(f => f.name).join(', '));

    const targetFile = getResponse.data.files.find(f => 
      f.name === 'Ultimate_Categorization_Tool_Complete'
    );

    if (!targetFile) {
      console.log('❌ Target file not found');
      return;
    }

    console.log(`\n🎯 Found: ${targetFile.name}`);
    console.log('📝 Reading fixed code...');

    const fixedCode = fs.readFileSync(
      '/Users/aarontjomsland/er-sim-monitor/backups/Apps_Script_Backup_2025-11-13T04-18-16/Ultimate_Categorization_Tool_Complete.gs',
      'utf8'
    );

    console.log('✏️  Updating...');
    targetFile.source = fixedCode;

    console.log('📤 Pushing to Apps Script...');
    await script.projects.updateContent({
      scriptId: SCRIPT_ID,
      requestBody: {
        files: getResponse.data.files
      }
    });

    console.log('\n✅ SUCCESS!');
    console.log('🔧 Fixes applied:');
    console.log('   - Line 1525: suggestedSymptomName (column M fix)');
    console.log('   - Fallback for missing symptom names');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

updateFile();
