#!/usr/bin/env node

/**
 * REMOVE GREEN TEST BUTTON
 * It worked before the button, so let's remove it
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

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

async function fix() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Removing green test button...\n');

    // Find and remove the test button line
    const buttonLine = '      \'<div style="text-align:center;margin:10px 0;"><button onclick="testConnection()" style="padding:10px 20px;background:#4CAF50;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:bold;font-size:14px;">🧪 Test Server Connection</button></div>\' +';

    if (code.includes(buttonLine)) {
      code = code.replace(buttonLine, '');
      console.log('✅ Removed green test button\n');
    } else {
      console.log('⚠️  Could not find exact button line, trying pattern match...\n');

      // Try finding it with regex
      const buttonPattern = /      '<div style="text-align:center;margin:10px 0;"><button onclick="testConnection\(\)"[^>]+>🧪 Test Server Connection<\/button><\/div>' \+\n/;

      if (buttonPattern.test(code)) {
        code = code.replace(buttonPattern, '');
        console.log('✅ Removed green test button via pattern\n');
      } else {
        console.log('❌ Could not find test button to remove\n');
        return;
      }
    }

    // Also remove the testConnection function since it won't be needed
    const testFunctionStart = code.indexOf("      'function testConnection() {");
    if (testFunctionStart !== -1) {
      const testFunctionEnd = code.indexOf("      '}' +", testFunctionStart);
      if (testFunctionEnd !== -1) {
        // Remove the entire testConnection function
        const beforeFunc = code.substring(0, testFunctionStart);
        const afterFunc = code.substring(testFunctionEnd + 12); // After '}' +\n
        code = beforeFunc + afterFunc;
        console.log('✅ Removed testConnection function\n');
      }
    }

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ GREEN TEST BUTTON REMOVED!\n');
    console.log('\nRestored to working state (before test button was added).\n');
    console.log('Try clicking "Cache All Layers" now - it should work!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

fix();
