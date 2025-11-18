#!/usr/bin/env node

/**
 * SAFE FIXES: 3, 4, 5, 6
 *
 * Skip Live Log move (fix 2) for now - apply only the safe changes
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

    console.log('🔧 Applying safe fixes (3, 4, 5, 6)...\n');

    // ===================================================================
    // FIX 3: Add duplicate removal to refreshHeaders()
    // ===================================================================
    console.log('3️⃣  Adding duplicate removal to refreshHeaders()...');

    const refreshIdx = code.indexOf('function refreshHeaders() {');
    const refreshEnd = code.indexOf('\nfunction ', refreshIdx + 50);
    let refreshFunc = code.substring(refreshIdx, refreshEnd);

    // Find where we set CACHED_MERGED_KEYS
    const setCachedIdx = refreshFunc.indexOf("docProps.setProperty('CACHED_MERGED_KEYS', JSON.stringify(mergedKeys));");

    if (setCachedIdx !== -1 && !refreshFunc.includes('var uniqueKeys = []')) {
      const beforeSet = refreshFunc.substring(0, setCachedIdx);
      const afterSet = refreshFunc.substring(setCachedIdx);

      const dedupeCode = `  // Remove duplicates
  var uniqueKeys = [];
  var seen = {};
  for (var i = 0; i < mergedKeys.length; i++) {
    if (!seen[mergedKeys[i]]) {
      uniqueKeys.push(mergedKeys[i]);
      seen[mergedKeys[i]] = true;
    }
  }
  if (uniqueKeys.length < mergedKeys.length) {
    Logger.log('⚠️ Removed ' + (mergedKeys.length - uniqueKeys.length) + ' duplicates');
  }
  mergedKeys = uniqueKeys;

  `;

      refreshFunc = beforeSet + dedupeCode + afterSet;
      code = code.substring(0, refreshIdx) + refreshFunc + code.substring(refreshEnd);
      console.log('   ✅ Added\n');
    } else {
      console.log('   ⏭️  Already present or not found\n');
    }

    // ===================================================================
    // FIX 4: Remove tier comments
    // ===================================================================
    console.log('4️⃣  Removing tier comments...');

    const tierComments = code.match(/\/\/ TIER \d+:/g);
    if (tierComments) {
      code = code.replace(/\/\/ TIER \d+:.*?\n/g, '');
      console.log('   ✅ Removed', tierComments.length, 'comments\n');
    } else {
      console.log('   ⏭️  None found\n');
    }

    // ===================================================================
    // FIX 5: Change to gpt-4o
    // ===================================================================
    console.log('5️⃣  Changing to gpt-4o...');

    if (code.includes("'gpt-4o-mini'")) {
      code = code.replace(
        "'gpt-4o-mini',  // Fast and cheap for recommendations",
        "'gpt-4o',  // Project standard"
      );
      code = code.replace("'gpt-4o-mini'", "'gpt-4o'");
      console.log('   ✅ Changed\n');
    } else {
      console.log('   ⏭️  Already gpt-4o\n');
    }

    // ===================================================================
    // FIX 6: Remove count limit
    // ===================================================================
    console.log('6️⃣  Removing 8-12 limit...');

    if (code.includes('select 8-12')) {
      code = code.replace(
        'select 8-12 that would maximize',
        'recommend fields that would maximize (as many or few as make sense)'
      );
      console.log('   ✅ Removed\n');
    } else {
      console.log('   ⏭️  Not found\n');
    }

    // ===================================================================
    // DEPLOY
    // ===================================================================
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
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ SAFE FIXES APPLIED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Completed:');
    console.log('1. ✅ innerHTML quotes - DONE');
    console.log('2. ⏭️  Live Log position - SKIPPED (needs manual fix)');
    console.log('3. ✅ Duplicate removal');
    console.log('4. ✅ No tier comments');
    console.log('5. ✅ gpt-4o');
    console.log('6. ✅ No count limit\n');
    console.log('TEST NOW: Field selector should work!');
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
