#!/usr/bin/env node

/**
 * DEBUG PATTERN MATCHING
 * Add logging to show which patterns match and which don't
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

async function debug() {
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

    console.log('🔧 Adding debug logging to pattern matching...\n');

    // Find the pattern matching loop
    const loopStart = code.indexOf('for (var i = 0; i < priorityPatterns.length && selectedFields.length < 27; i++)');

    if (loopStart === -1) {
      console.log('❌ Could not find pattern matching loop\n');
      return;
    }

    // Replace the loop with one that logs each pattern
    const oldLoop = `for (var i = 0; i < priorityPatterns.length && selectedFields.length < 27; i++) {
        var pattern = priorityPatterns[i];
        for (var j = 0; j < availableFields.length; j++) {
          if (availableFields[j].name.indexOf(pattern) !== -1 && selectedFields.indexOf(availableFields[j].name) === -1) {
            selectedFields.push(availableFields[j].name);
            break; // Take first match for each pattern
          }
        }
      }`;

    const newLoop = `for (var i = 0; i < priorityPatterns.length && selectedFields.length < 27; i++) {
        var pattern = priorityPatterns[i];
        var found = false;
        for (var j = 0; j < availableFields.length; j++) {
          if (availableFields[j].name.indexOf(pattern) !== -1 && selectedFields.indexOf(availableFields[j].name) === -1) {
            selectedFields.push(availableFields[j].name);
            addLog('         ✅ "' + pattern + '" → ' + availableFields[j].name);
            found = true;
            break; // Take first match for each pattern
          }
        }
        if (!found) {
          addLog('         ❌ "' + pattern + '" → NO MATCH');
        }
      }`;

    code = code.replace(oldLoop, newLoop);

    console.log('✅ Added pattern matching debug logs\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 PATTERN MATCHING DEBUG LOGGING ADDED!\n');
    console.log('Now you can see which patterns match and which fail\n');
    console.log('Try "Pre-Cache Rich Data" and check the logs!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

debug();
