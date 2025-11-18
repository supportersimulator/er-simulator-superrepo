#!/usr/bin/env node

/**
 * DEDUPLICATE RENDERING
 * Only add each field name ONCE to selectedFields array
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

    console.log('🔧 Adding deduplication to rendering loop...\n');

    // Find the rendering loop
    const oldLoop = `'    data.grouped[category].forEach(function(field) {' +
      '      var isSelected = data.selected.indexOf(field.name) !== -1;' +
      '      var isRecommended = data.recommended.indexOf(field.name) !== -1;' +
      '      if (isSelected) {' +
      '        selectedFields.push(field);' +
      '      } else if (isRecommended && !isSelected) {' +
      '        recommendedFields.push(field);' +
      '      } else if (!isSelected && !isRecommended) {' +
      '        otherFields.push(field);' +
      '      }' +
      '    });`;

    const newLoop = `'    data.grouped[category].forEach(function(field) {' +
      '      var isSelected = data.selected.indexOf(field.name) !== -1;' +
      '      var isRecommended = data.recommended.indexOf(field.name) !== -1;' +
      '      ' +
      '      // Check if we already added this field (deduplicate by name)' +
      '      var alreadyAdded = selectedFields.some(function(f) { return f.name === field.name; }) || ' +
      '                         recommendedFields.some(function(f) { return f.name === field.name; }) || ' +
      '                         otherFields.some(function(f) { return f.name === field.name; });' +
      '      ' +
      '      if (alreadyAdded) {' +
      '        return; // Skip duplicates' +
      '      }' +
      '      ' +
      '      if (isSelected) {' +
      '        selectedFields.push(field);' +
      '      } else if (isRecommended && !isSelected) {' +
      '        recommendedFields.push(field);' +
      '      } else if (!isSelected && !isRecommended) {' +
      '        otherFields.push(field);' +
      '      }' +
      '    });`;

    code = code.replace(oldLoop, newLoop);

    console.log('✅ Added deduplication logic\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ DEDUPLICATION ADDED TO RENDERING!\n');
    console.log('\nNow each field name will only appear ONCE\n');
    console.log('Should show 35 selected fields (not 228!)\n');
    console.log('Try "Categories & Pathways" again!\n');
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
