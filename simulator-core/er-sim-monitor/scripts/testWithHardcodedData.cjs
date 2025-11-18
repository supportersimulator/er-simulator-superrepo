#!/usr/bin/env node

/**
 * TEST WITH HARDCODED DATA
 * Return minimal hardcoded data to test if client-server communication works
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

    // Find and replace getFieldSelectorData_
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

    const hardcodedFunction = `function getFieldSelectorData_() {
  Logger.log('TEST: Returning hardcoded data');

  // Return minimal test data
  return {
    grouped: {
      'Test_Category': [
        { name: 'Test_Field_1', tier1: 'Test_Category', tier2: 'Field_1' },
        { name: 'Test_Field_2', tier1: 'Test_Category', tier2: 'Field_2' },
        { name: 'Test_Field_3', tier1: 'Test_Category', tier2: 'Field_3' }
      ]
    },
    selected: ['Test_Field_1'],
    recommended: ['Test_Field_2']
  };
}`;

    code = code.substring(0, funcStart) + hardcodedFunction + code.substring(funcEnd);

    console.log('✅ Replaced with hardcoded test data\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🧪 HARDCODED TEST DATA DEPLOYED!\n');
    console.log('This returns just 3 test fields.\n');
    console.log('If this works: Client-server communication is fine\n');
    console.log('If this fails: There is a deeper issue\n\n');
    console.log('Try "Pre-Cache Rich Data" now.\n');
    console.log('You should see 3 test fields render!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

test();
