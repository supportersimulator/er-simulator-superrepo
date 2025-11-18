#!/usr/bin/env node

/**
 * ADD GRACEFUL FIELD FILTERING
 * Filter out any default fields that don't exist in availableFields
 * Don't crash - just use what's available
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

    console.log('🔧 Adding graceful field filtering...\n');

    // Find where we load defaults
    const afterDefaultsLoad = code.indexOf("addLog('      ✅ Loaded ' + selectedFields.length");

    if (afterDefaultsLoad === -1) {
      console.log('❌ Could not find defaults loading section\n');
      return;
    }

    // Add filtering logic right after the defaults array is loaded
    const filteringCode = `
      // Filter defaults to only include fields that actually exist in availableFields
      addLog('      🔍 Filtering defaults against available fields...');
      var availableFieldNames = availableFields.map(function(f) { return f.name; });
      var originalCount = selectedFields.length;
      var filteredDefaults = [];
      var missingDefaults = [];

      for (var i = 0; i < selectedFields.length; i++) {
        var fieldName = selectedFields[i];
        if (availableFieldNames.indexOf(fieldName) !== -1) {
          filteredDefaults.push(fieldName);
        } else {
          missingDefaults.push(fieldName);
        }
      }

      selectedFields = filteredDefaults;

      if (missingDefaults.length > 0) {
        addLog('      ⚠️ ' + missingDefaults.length + ' defaults not found in spreadsheet (skipped gracefully)');
        addLog('      📋 Using ' + selectedFields.length + ' of ' + originalCount + ' defaults');
      }

      addLog('      ✅ Loaded ' + selectedFields.length`;

    // Insert the filtering code before the log message
    code = code.substring(0, afterDefaultsLoad) + filteringCode + code.substring(afterDefaultsLoad + "addLog('      ✅ Loaded ' + selectedFields.length".length);

    console.log('✅ Added graceful filtering logic\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ GRACEFUL FIELD FILTERING ADDED!\n');
    console.log('\nNow the system will:\n');
    console.log('  ✅ Check each default against actual spreadsheet headers');
    console.log('  ✅ Skip any fields that don\'t exist (no crash)');
    console.log('  ✅ Log which fields were skipped');
    console.log('  ✅ Continue with whatever fields ARE available\n');
    console.log('This means:\n');
    console.log('  • Missing vital signs fields? No problem.');
    console.log('  • Field renamed? System adapts.');
    console.log('  • Column removed? System continues.\n');
    console.log('Try "Categories & Pathways" - should handle missing fields gracefully!\n');
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
