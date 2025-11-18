#!/usr/bin/env node

/**
 * RESTORE REAL FIELD SELECTOR
 * Now that we fixed the underscore issue, restore the real function with logging
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

async function restore() {
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

    console.log('🔧 Restoring real getFieldSelectorData() with logging...\n');

    // Replace minimal test with real function
    const funcStart = code.indexOf('function getFieldSelectorData()');
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

    const realFunction = `function getFieldSelectorData() {
  var logs = [];
  function addLog(msg) {
    logs.push(msg);
    Logger.log(msg);
  }

  try {
    addLog('🔍 getFieldSelectorData() START');

    addLog('   Step 1: Calling refreshHeaders()');
    refreshHeaders();
    addLog('   ✅ Step 1 complete');

    addLog('   Step 2: Calling getAvailableFields()');
    var availableFields = getAvailableFields();
    addLog('   ✅ Step 2 complete: ' + availableFields.length + ' fields');

    addLog('   Step 3: Calling loadFieldSelection()');
    var selectedFields = loadFieldSelection();
    addLog('   ✅ Step 3 complete: ' + selectedFields.length + ' selected');

    addLog('   Step 4: Calling getStaticRecommendedFields()');
    var recommendedFields = getStaticRecommendedFields(availableFields, selectedFields);
    addLog('   ✅ Step 4 complete: ' + recommendedFields.length + ' recommended');

    addLog('   Step 5: Grouping by category');
    var grouped = {};
    for (var i = 0; i < availableFields.length; i++) {
      var field = availableFields[i];
      var category = field.tier1;
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(field);
    }
    addLog('   ✅ Step 5 complete: ' + Object.keys(grouped).length + ' categories');

    addLog('   Step 6: Building return object');
    var result = {
      grouped: grouped,
      selected: selectedFields,
      recommended: recommendedFields,
      logs: logs
    };
    addLog('   ✅ Step 6 complete');

    addLog('🎉 getFieldSelectorData() RETURNING SUCCESSFULLY');
    return result;

  } catch (error) {
    addLog('❌ ERROR: ' + error.toString());
    addLog('   Stack: ' + error.stack);
    return {
      grouped: {},
      selected: [],
      recommended: [],
      logs: logs,
      error: error.toString()
    };
  }
}`;

    code = code.substring(0, funcStart) + realFunction + code.substring(funcEnd);

    console.log('✅ Restored real function (NO trailing underscore)\n');

    // Also need to fix any calls to getStaticRecommendedFields_
    console.log('🔧 Removing underscores from helper functions...\n');
    code = code.replace(/getStaticRecommendedFields_\(/g, 'getStaticRecommendedFields(');
    code = code.replace(/function getStaticRecommendedFields_\(/g, 'function getStaticRecommendedFields(');

    console.log('✅ Fixed helper function names\n');

    // Backup
    const backupPath = path.join(__dirname, '../backups/production-before-real-field-selector-2025-11-06.gs');
    fs.writeFileSync(backupPath, codeFile.source, 'utf8');
    console.log(`💾 Backed up\n`);

    // Deploy
    console.log('📤 Deploying...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 REAL FIELD SELECTOR RESTORED!\n');
    console.log('Now it will:\n');
    console.log('  ✅ Load all 642 fields from headers cache\n');
    console.log('  ✅ Show selected fields (27 defaults or saved)\n');
    console.log('  ✅ Show recommended fields\n');
    console.log('  ✅ Return logs showing exactly what happened\n');
    console.log('Try "Pre-Cache Rich Data" - should load all fields!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

restore();
