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

async function deployFix() {
  try {
    const accessToken = getAccessToken();
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const script = google.script({ version: 'v1', auth: oauth2Client });

    console.log('📖 Reading fixed file...');
    const fixedCode = fs.readFileSync(
      '/Users/aarontjomsland/er-sim-monitor/backups/Apps_Script_Backup_2025-11-13T04-18-16/Ultimate_Categorization_Tool_Complete.gs',
      'utf8'
    );

    console.log('📥 Getting current project content...');
    const response = await script.projects.getContent({ scriptId: SCRIPT_ID });
    const files = response.data.files;

    // Find and update the Ultimate_Categorization_Tool_Complete file
    const fileToUpdate = files.find(f => 
      f.name === 'Ultimate_Categorization_Tool_Complete'
    );

    if (!fileToUpdate) {
      console.log('❌ File not found in project');
      console.log('Available files:', files.map(f => f.name).join(', '));
      return;
    }

    console.log('✅ Found file:', fileToUpdate.name);
    console.log('📝 Updating with fix...');

    // Update the file content
    fileToUpdate.source = fixedCode;

    // Push the update
    const updateResponse = await script.projects.updateContent({
      scriptId: SCRIPT_ID,
      requestBody: {
        files: files
      }
    });

    console.log('✅ Fix deployed successfully!');
    console.log('📋 Updated file:', fileToUpdate.name);
    console.log('🔧 Fix: Changed line 1525 to use suggestedSymptomName');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

deployFix();
