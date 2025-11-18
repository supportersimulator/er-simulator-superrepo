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

async function save() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    let code = content.data.files.find(f => f.name === 'Code').source;

    // Do the same transformations as the deployment script
    const serverFunctions = `
function cacheNext25RowsWithFields() {
  Logger.log('test');
  return { complete: true };
}
`;

    const showFieldSelectorStart = code.indexOf('function showFieldSelector()');
    code = code.substring(0, showFieldSelectorStart) + serverFunctions + code.substring(showFieldSelectorStart);

    const cachingFunctions = `    html += '';
    html += 'function testFunc() { log("test"); }';
    html += '';
`;

    const saveSelectionEnd = code.indexOf("    html += '}';", code.indexOf("html += 'function saveSelection()"));
    const insertPoint = saveSelectionEnd + "    html += '}';".length + 1;

    code = code.substring(0, insertPoint) + '\\n' + cachingFunctions + code.substring(insertPoint);

    // Save to file
    fs.writeFileSync('/tmp/generated_code_line312.gs', code, 'utf8');

    const lines = code.split('\\n');
    console.log('Total lines: ' + lines.length);
    console.log('\\nLine 310-315:');
    for (let i = 309; i < 315 && i < lines.length; i++) {
      console.log((i + 1) + ': ' + lines[i]);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

save();
