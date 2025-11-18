#!/usr/bin/env node

/**
 * TEST MINIMAL RETURN
 * Replace getFieldSelectorData_() with absolute minimum to test if it returns at all
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

async function test() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    // Replace getFieldSelectorData_ with absolute minimum
    const funcStart = code.indexOf('function getFieldSelectorData_()');
    let braceCount = 0;
    let inFunction = false;
    let funcEnd = funcStart;

    for (let i = funcStart; i < code.length; i++) {
      if (code[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (code[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          funcEnd = i + 1;
          break;
        }
      }
    }

    const minimalFunction = `function getFieldSelectorData_() {
  Logger.log('🔍 MINIMAL TEST - Function called');

  var result = {
    grouped: { 'Test': [{ name: 'Field1', tier1: 'Test', tier2: 'F1' }] },
    selected: ['Field1'],
    recommended: [],
    logs: ['Server function executed successfully!', 'This is a minimal test']
  };

  Logger.log('🔍 MINIMAL TEST - Returning result');
  return result;
}`;

    code = code.substring(0, funcStart) + minimalFunction + code.substring(funcEnd);

    console.log('✅ Replaced with minimal test function\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🧪 MINIMAL TEST DEPLOYED\n');
    console.log('This just returns a simple object immediately.\n');
    console.log('If this works: The mechanism is fine, issue is in real function\n');
    console.log('If this fails: There is a permission or timeout issue\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

test();
