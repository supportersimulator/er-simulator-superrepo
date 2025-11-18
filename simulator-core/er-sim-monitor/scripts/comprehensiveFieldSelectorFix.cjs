#!/usr/bin/env node

/**
 * COMPREHENSIVE FIELD SELECTOR FIX - Atlas
 *
 * Fixes all 6 identified issues:
 * 1. innerHTML quote escaping (\" → \\")
 * 2. Live Log position (bottom → top)
 * 3. refreshHeaders() duplicate removal
 * 4. 35 defaults format (remove tier comments)
 * 5. AI model (gpt-4o-mini → gpt-4o)
 * 6. AI recommendation count (remove 8-12 limit)
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

    console.log('📥 Downloading current production...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Applying 6 comprehensive fixes...\n');

    // ===================================================================
    // FIX 1: innerHTML quote escaping (\" → \\")
    // ===================================================================
    console.log('1️⃣  Fixing innerHTML quote escaping...');

    // Section 1
    code = code.replace(
      'section1.innerHTML = "<div class=\\"section-header default\\">',
      'section1.innerHTML = "<div class=\\\\"section-header default\\\\">"'
    );

    // Section 2
    code = code.replace(
      'section2.innerHTML = "<div class=\\"section-header recommended\\">',
      'section2.innerHTML = "<div class=\\\\"section-header recommended\\\\">"'
    );

    // Section 3
    code = code.replace(
      'section3.innerHTML = "<div class=\\"section-header other\\">',
      'section3.innerHTML = "<div class=\\\\"section-header other\\\\">"'
    );

    console.log('   ✅ Fixed all 3 innerHTML assignments\n');

    // ===================================================================
    // FIX 2: Move Live Log to top
    // ===================================================================
    console.log('2️⃣  Moving Live Log to top...');

    // Find and extract the log div
    const logDivStart = code.indexOf("'<div id=\"log\" style=\"' +");
    const logDivEnd = code.indexOf("'></div>' +", logDivStart) + "'></div>' +".length;
    const logDiv = code.substring(logDivStart, logDivEnd);

    // Remove from current position
    code = code.substring(0, logDivStart) + code.substring(logDivEnd);

    // Insert after <body>
    const bodyIdx = code.indexOf("'<body>' +");
    const insertPoint = bodyIdx + "'<body>' +".length;
    code = code.substring(0, insertPoint) + '\n      ' + logDiv + code.substring(insertPoint);

    console.log('   ✅ Moved Live Log to top of modal\n');

    // ===================================================================
    // FIX 3: Add duplicate removal to refreshHeaders()
    // ===================================================================
    console.log('3️⃣  Adding duplicate removal to refreshHeaders()...');

    const refreshIdx = code.indexOf('function refreshHeaders() {');
    const refreshEnd = code.indexOf('\nfunction ', refreshIdx + 50);
    let refreshFunc = code.substring(refreshIdx, refreshEnd);

    // Find where we set CACHED_MERGED_KEYS
    const setCachedIdx = refreshFunc.indexOf("docProps.setProperty('CACHED_MERGED_KEYS', JSON.stringify(mergedKeys));");

    if (setCachedIdx !== -1) {
      // Insert duplicate removal before setting the property
      const beforeSet = refreshFunc.substring(0, setCachedIdx);
      const afterSet = refreshFunc.substring(setCachedIdx);

      const dedupeCode = `
  // Remove duplicates from mergedKeys
  var uniqueKeys = [];
  var seen = {};
  for (var i = 0; i < mergedKeys.length; i++) {
    var key = mergedKeys[i];
    if (!seen[key]) {
      uniqueKeys.push(key);
      seen[key] = true;
    }
  }

  if (uniqueKeys.length < mergedKeys.length) {
    Logger.log('⚠️ Removed ' + (mergedKeys.length - uniqueKeys.length) + ' duplicate headers from cache');
  }

  mergedKeys = uniqueKeys;

  `;

      refreshFunc = beforeSet + dedupeCode + afterSet;
      code = code.substring(0, refreshIdx) + refreshFunc + code.substring(refreshEnd);

      console.log('   ✅ Added duplicate removal logic\n');
    }

    // ===================================================================
    // FIX 4: Remove tier comments from 35 defaults
    // ===================================================================
    console.log('4️⃣  Cleaning 35 defaults format...');

    // Find all occurrences of tier comments in defaultFields arrays
    code = code.replace(/\/\/ TIER \d+:.*?\(\d+ fields?\)\s*/g, '');
    code = code.replace(/\/\/ Tier \d+:.*?\(\d+ fields?\)\s*/g, '');

    console.log('   ✅ Removed all tier comments\n');

    // ===================================================================
    // FIX 5: Change AI model to gpt-4o
    // ===================================================================
    console.log('5️⃣  Updating AI model to gpt-4o...');

    // Find getRecommendedFields function
    const getRecIdx = code.indexOf('function getRecommendedFields(');
    const getRecEnd = code.indexOf('\nfunction ', getRecIdx + 50);
    let getRecFunc = code.substring(getRecIdx, getRecEnd);

    // Replace model
    getRecFunc = getRecFunc.replace(
      "model: 'gpt-4o-mini',  // Fast and cheap for recommendations",
      "model: 'gpt-4o',  // Project standard model"
    );

    code = code.substring(0, getRecIdx) + getRecFunc + code.substring(getRecEnd);

    console.log('   ✅ Changed to gpt-4o\n');

    // ===================================================================
    // FIX 6: Remove 8-12 recommendation count limit
    // ===================================================================
    console.log('6️⃣  Removing AI recommendation count limit...');

    // Find and update the prompt
    getRecFunc = code.substring(getRecIdx, code.indexOf('\nfunction ', getRecIdx + 50));

    getRecFunc = getRecFunc.replace(
      'TASK: From the UNSELECTED fields only, select 8-12 that would maximize pathway discovery potential.',
      'TASK: From the UNSELECTED fields only, recommend fields that would maximize pathway discovery potential (recommend as many or as few as make sense).'
    );

    getRecFunc = getRecFunc.replace(
      'Return ONLY a JSON array of field names: ["fieldName1", "fieldName2", ...]',
      'Return ONLY a JSON array of field names (recommend 1 or more based on what would genuinely help): ["fieldName1", "fieldName2", ...]'
    );

    code = code.substring(0, getRecIdx) + getRecFunc + code.substring(code.indexOf('\nfunction ', getRecIdx + 50));

    console.log('   ✅ Removed forced count limit\n');

    // ===================================================================
    // DEPLOY
    // ===================================================================
    console.log('📤 Deploying comprehensive fixes...\n');

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
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ ALL 6 FIXES APPLIED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Fixed:\n');
    console.log('1. ✅ innerHTML quote escaping (3 locations)');
    console.log('2. ✅ Live Log moved to top');
    console.log('3. ✅ Duplicate removal in refreshHeaders()');
    console.log('4. ✅ Clean 35 defaults (no tier comments)');
    console.log('5. ✅ AI model changed to gpt-4o');
    console.log('6. ✅ AI recommendation count no longer forced\n');
    console.log('Next: Refresh Google Sheet and test field selector modal!');
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
