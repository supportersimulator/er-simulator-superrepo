#!/usr/bin/env node

/**
 * ADD DETAILED SERVER LOGGING
 * Add extensive logging to getFieldSelectorData_() to see where it fails
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

async function addLogging() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    // Replace getFieldSelectorData_ with heavily logged version
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

    const loggedFunction = `function getFieldSelectorData_() {
  try {
    Logger.log('🔍 getFieldSelectorData_() START');

    Logger.log('   Step 1: About to call refreshHeaders()');
    refreshHeaders();
    Logger.log('   ✅ Step 1 complete');

    Logger.log('   Step 2: About to call getAvailableFields()');
    var availableFields = getAvailableFields();
    Logger.log('   ✅ Step 2 complete: ' + availableFields.length + ' fields');

    Logger.log('   Step 3: About to call loadFieldSelection()');
    var selectedFields = loadFieldSelection();
    Logger.log('   ✅ Step 3 complete: ' + selectedFields.length + ' selected');

    Logger.log('   Step 4: About to call getStaticRecommendedFields_()');
    var recommendedFields = getStaticRecommendedFields_(availableFields, selectedFields);
    Logger.log('   ✅ Step 4 complete: ' + recommendedFields.length + ' recommended');

    Logger.log('   Step 5: About to group by category');
    var grouped = {};
    for (var i = 0; i < availableFields.length; i++) {
      var field = availableFields[i];
      var category = field.tier1;
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(field);
    }
    Logger.log('   ✅ Step 5 complete: ' + Object.keys(grouped).length + ' categories');

    Logger.log('   Step 6: Building return object');
    var result = {
      grouped: grouped,
      selected: selectedFields,
      recommended: recommendedFields
    };
    Logger.log('   ✅ Step 6 complete');

    Logger.log('🎉 getFieldSelectorData_() RETURNING SUCCESSFULLY');
    return result;

  } catch (error) {
    Logger.log('❌ ERROR in getFieldSelectorData_(): ' + error.toString());
    Logger.log('   Stack: ' + error.stack);
    throw error;
  }
}`;

    code = code.substring(0, funcStart) + loggedFunction + code.substring(funcEnd);

    console.log('✅ Added detailed server logging\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: { files: [
        { name: 'Code', type: 'SERVER_JS', source: code },
        manifestFile
      ]}
    });

    console.log('✅ Deployed!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 DETAILED SERVER LOGGING ENABLED\n');
    console.log('Now we will see EXACTLY where the function fails.\n');
    console.log('After clicking "Pre-Cache Rich Data":\n');
    console.log('1. Go to Extensions → Apps Script\n');
    console.log('2. Click "Executions" in left sidebar\n');
    console.log('3. Find the most recent execution\n');
    console.log('4. Look at the logs to see which step failed\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

addLogging();
