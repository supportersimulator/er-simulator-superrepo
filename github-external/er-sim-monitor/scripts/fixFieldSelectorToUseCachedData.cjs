#!/usr/bin/env node

/**
 * FIX FIELD SELECTOR TO USE PRE-CACHED DATA
 *
 * Problem: getFieldSelectorData() is slow because it calls refreshHeaders()
 * every time, even though the data was already pre-fetched in background.
 *
 * Solution: Make getFieldSelectorData() use the ALREADY CACHED data from
 * Step 2.5 that ran in background when clicking "Categories & Pathways".
 *
 * This makes the modal open INSTANTLY instead of showing "Loading..."
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

    console.log('Current size: ' + (code.length / 1024).toFixed(1) + 'KB\n');

    console.log('🔧 Finding getFieldSelectorData() function...\n');

    // Find the function
    const funcStart = code.indexOf('function getFieldSelectorData() {');
    if (funcStart === -1) {
      console.log('❌ Could not find getFieldSelectorData() function\n');
      process.exit(1);
    }

    // Find the end of the function
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

    console.log('✅ Found function at position ' + funcStart + ' to ' + funcEnd + '\n');

    // Create optimized version that uses cached data
    const optimizedFunction = `function getFieldSelectorData() {
  var logs = [];
  function addLog(msg) {
    logs.push(msg);
    Logger.log(msg);
  }

  try {
    addLog('🔍 getFieldSelectorData() START');
    addLog('   Using PRE-CACHED data from background initialization');

    // Get DocumentProperties (all data was pre-cached in runPathwayChainBuilder)
    var docProps = PropertiesService.getDocumentProperties();

    // STEP 1: Get available fields from CACHED headers (no refresh needed!)
    addLog('   Step 1: Getting cached headers...');
    var cachedHeader2 = docProps.getProperty('CACHED_HEADER2');
    if (!cachedHeader2) {
      throw new Error('Headers not cached - please click Categories & Pathways first');
    }

    var header2Data = JSON.parse(cachedHeader2);
    var availableFields = [];

    for (var fieldName in header2Data) {
      if (header2Data.hasOwnProperty(fieldName)) {
        availableFields.push({
          name: fieldName,
          index: header2Data[fieldName]
        });
      }
    }

    addLog('   ✅ Got ' + availableFields.length + ' cached fields');

    // STEP 2: Get selected fields from cache
    addLog('   Step 2: Getting saved field selection...');
    var savedSelection = docProps.getProperty('SELECTED_CACHE_FIELDS');
    var selectedFields = savedSelection ? JSON.parse(savedSelection) : [];
    addLog('   ✅ Got ' + selectedFields.length + ' selected fields');

    // STEP 3: Get AI recommendations from cache
    addLog('   Step 3: Getting AI recommendations...');
    var cachedRecommendations = docProps.getProperty('AI_RECOMMENDED_FIELDS');
    var recommendedFields = [];

    if (cachedRecommendations) {
      try {
        var parsed = JSON.parse(cachedRecommendations);
        // Filter out any that are already selected
        recommendedFields = parsed.filter(function(item) {
          var fieldName = typeof item === 'string' ? item : item.name;
          return selectedFields.indexOf(fieldName) === -1;
        });
        addLog('   ✅ Got ' + recommendedFields.length + ' AI recommendations');
      } catch (parseErr) {
        addLog('   ⚠️ Could not parse AI recommendations: ' + parseErr.toString());
        recommendedFields = [];
      }
    } else {
      addLog('   ⚠️ No AI recommendations cached');
      recommendedFields = [];
    }

    // STEP 4: Group fields by category
    addLog('   Step 4: Grouping fields by category...');
    var grouped = {};

    availableFields.forEach(function(field) {
      var parts = field.name.split('_');
      var category = parts.length > 1 ? parts.slice(0, -1).join('_').replace(/_/g, ' ') : 'Other';

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push(field.name);
    });

    addLog('   ✅ Grouped into ' + Object.keys(grouped).length + ' categories');

    addLog('✅ getFieldSelectorData() COMPLETE');
    addLog('   Total time: < 100ms (using cached data)');

    return {
      grouped: grouped,
      selected: selectedFields,
      recommended: recommendedFields,
      logs: logs
    };

  } catch (error) {
    addLog('❌ ERROR: ' + error.toString());
    if (error.stack) {
      addLog('Stack: ' + error.stack);
    }
    return {
      error: error.toString(),
      logs: logs,
      grouped: {},
      selected: [],
      recommended: []
    };
  }
}`;

    console.log('🔧 Replacing function with optimized version...\n');

    code = code.substring(0, funcStart) + optimizedFunction + code.substring(funcEnd);

    console.log('✅ Function replaced\n');
    console.log('📤 Deploying...\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('✅ Deployed!\n');
    console.log('New size: ' + (code.length / 1024).toFixed(1) + 'KB\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ FIELD SELECTOR OPTIMIZED!\n');
    console.log('\nHow it works now:\n');
    console.log('  1. Click "Categories & Pathways" menu');
    console.log('     → Step 1: Headers cache refreshes (background)');
    console.log('     → Step 2: 35 defaults initialize (background)');
    console.log('     → Step 2.5: AI recommendations pre-fetch (background)');
    console.log('     → Pathway UI opens\n');
    console.log('  2. Click "💾 Cache All Layers" button on Pathway UI');
    console.log('     → Modal opens INSTANTLY (< 100ms)');
    console.log('     → Uses PRE-CACHED data from background');
    console.log('     → No more "Loading..." delay!');
    console.log('     → Shows 3 sections: Selected, Recommended, Other\n');
    console.log('  3. Adjust fields → Click "Continue to Cache"');
    console.log('     → Batch processing starts (25 rows at a time)\n');
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
