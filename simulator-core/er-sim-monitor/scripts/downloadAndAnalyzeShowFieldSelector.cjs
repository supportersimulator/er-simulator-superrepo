#!/usr/bin/env node

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

async function analyze() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current production code...\\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const code = content.data.files.find(f => f.name === 'Code').source;

    // Save to file for manual inspection
    const savePath = path.join(__dirname, '..//tmp/current_production_code_2025-11-07.gs');
    fs.writeFileSync(savePath, code, 'utf8');

    console.log('✅ Saved current code to: ' + savePath + '\\n');

    // Find showFieldSelector
    const funcStart = code.indexOf('function showFieldSelector()');
    if (funcStart === -1) {
      console.log('❌ showFieldSelector() not found\\n');
      return;
    }

    // Find end of function
    let funcEnd = funcStart;
    let braceCount = 0;
    let foundStart = false;

    for (let i = funcStart; i < code.length; i++) {
      if (code[i] === '{') {
        braceCount++;
        foundStart = true;
      } else if (code[i] === '}') {
        braceCount--;
        if (foundStart && braceCount === 0) {
          funcEnd = i + 1;
          break;
        }
      }
    }

    const funcCode = code.substring(funcStart, funcEnd);
    const funcPath = path.join(__dirname, '..//tmp/showFieldSelector_function.gs');
    fs.writeFileSync(funcPath, funcCode, 'utf8');

    console.log('✅ Saved showFieldSelector() to: ' + funcPath + '\\n');
    console.log('Function length: ' + funcCode.length + ' characters\\n');
    console.log('Function lines: ' + funcCode.split('\\n').length + ' lines\\n');

    // Count total lines
    console.log('Total code lines: ' + code.split('\\n').length + '\\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

analyze();
