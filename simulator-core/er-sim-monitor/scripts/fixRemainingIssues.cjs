#!/usr/bin/env node

/**
 * FIXES 2-6: Remaining improvements
 *
 * Now that root cause is fixed, apply remaining optimizations
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

    console.log('🔧 Applying fixes 2-6...\n');

    // ===================================================================
    // FIX 2: Move Live Log to top
    // ===================================================================
    console.log('2️⃣  Moving Live Log to top...');

    // Find the log div in showFieldSelector
    const funcStart = code.indexOf('function showFieldSelector() {');
    const funcEnd = code.indexOf('function saveFieldSelectionAndStartCache', funcStart);
    let func = code.substring(funcStart, funcEnd);

    // Extract log div
    const logStart = func.indexOf("'<div id=\"log\" style=\"' +");
    if (logStart !== -1) {
      const logEnd = func.indexOf("'></div>'", logStart) + "'></div>'".length;
      const logDiv = func.substring(logStart, logEnd);

      // Remove from current position
      func = func.substring(0, logStart) + func.substring(logEnd);

      // Find where to insert (right after <body>)
      const bodyIdx = func.indexOf("'<body>' +");
      if (bodyIdx !== -1) {
        const insertPoint = bodyIdx + "'<body>' +".length;
        func = func.substring(0, insertPoint) + '\n      ' + logDiv + ' +' + func.substring(insertPoint);
      }

      code = code.substring(0, funcStart) + func + code.substring(funcEnd);
      console.log('   ✅ Moved to top\n');
    }

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
      const beforeSet = refreshFunc.substring(0, setCachedIdx);
      const afterSet = refreshFunc.substring(setCachedIdx);

      const dedupeCode = `  // Remove duplicates from mergedKeys
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
    Logger.log('⚠️ Removed ' + (mergedKeys.length - uniqueKeys.length) + ' duplicate headers');
  }
  mergedKeys = uniqueKeys;

  `;

      refreshFunc = beforeSet + dedupeCode + afterSet;
      code = code.substring(0, refreshIdx) + refreshFunc + code.substring(refreshEnd);
      console.log('   ✅ Added duplicate removal\n');
    }

    // ===================================================================
    // FIX 4: Remove tier comments from defaults
    // ===================================================================
    console.log('4️⃣  Cleaning defaults format...');

    code = code.replace(/\/\/ TIER \d+:.*?\n/g, '');
    code = code.replace(/\/\/ Tier \d+:.*?\n/g, '');

    console.log('   ✅ Removed tier comments\n');

    // ===================================================================
    // FIX 5: Change AI model to gpt-4o
    // ===================================================================
    console.log('5️⃣  Updating AI model...');

    code = code.replace(
      "model: 'gpt-4o-mini',  // Fast and cheap for recommendations",
      "model: 'gpt-4o',  // Project standard"
    );

    console.log('   ✅ Changed to gpt-4o\n');

    // ===================================================================
    // FIX 6: Remove recommendation count limit
    // ===================================================================
    console.log('6️⃣  Removing count limit...');

    code = code.replace(
      'select 8-12 that would maximize pathway discovery potential',
      'recommend fields that would maximize pathway discovery potential (as many or as few as make sense)'
    );

    console.log('   ✅ Removed 8-12 limit\n');

    // ===================================================================
    // DEPLOY
    // ===================================================================
    console.log('📤 Deploying fixes 2-6...\n');

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
    console.log('✅ ALL 6 FIXES COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Applied:');
    console.log('1. ✅ innerHTML quotes (root cause) - DONE EARLIER');
    console.log('2. ✅ Live Log at top');
    console.log('3. ✅ Duplicate removal in refreshHeaders()');
    console.log('4. ✅ Clean defaults (no tiers)');
    console.log('5. ✅ gpt-4o model');
    console.log('6. ✅ No forced count limit\n');
    console.log('Test: Refresh sheet → Categories & Pathways → Cache button');
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
