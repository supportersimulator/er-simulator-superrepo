#!/usr/bin/env node

/**
 * FIX: Use CACHED_MERGED_KEYS for allFields (NOT CACHED_HEADER2)
 *
 * Problem: getFieldSelectorRoughDraft() reads CACHED_HEADER2 (object with short keys)
 *          But the 35 defaults use full Row 2 format
 *
 * Solution: Change allFields to come from CACHED_MERGED_KEYS (matches Row 2)
 *           Keep the EXACT same 35 defaults (they're already correct!)
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

    console.log('🔧 Fixing getFieldSelectorRoughDraft() to use CACHED_MERGED_KEYS...\n');

    // Find the OLD code that uses CACHED_HEADER2
    const oldPattern = /var cachedHeader2 = docProps\.getProperty\('CACHED_HEADER2'\);[\s\S]*?var allFields = Object\.keys\(header2Data\);/;

    if (!oldPattern.test(code)) {
      console.log('❌ Could not find the old CACHED_HEADER2 pattern\n');
      console.log('Looking for this pattern:');
      console.log('  var cachedHeader2 = docProps.getProperty(\'CACHED_HEADER2\');');
      console.log('  ...');
      console.log('  var allFields = Object.keys(header2Data);\n');
      process.exit(1);
    }

    // Replace with CACHED_MERGED_KEYS version
    const newCode = `var cachedMergedKeys = docProps.getProperty('CACHED_MERGED_KEYS');
  if (!cachedMergedKeys) {
    Logger.log('⚠️ Headers not cached - refreshing...');
    refreshHeaders();
    cachedMergedKeys = docProps.getProperty('CACHED_MERGED_KEYS');
  }

  var allFields = JSON.parse(cachedMergedKeys);`;

    code = code.replace(oldPattern, newCode);

    console.log('✅ Fixed to use CACHED_MERGED_KEYS\n');

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
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ FIXED - NOW USING CACHED_MERGED_KEYS!\n');
    console.log('\nWhat changed:\n');
    console.log('  BEFORE: var cachedHeader2 = docProps.getProperty(\'CACHED_HEADER2\');');
    console.log('          var header2Data = JSON.parse(cachedHeader2);');
    console.log('          var allFields = Object.keys(header2Data);');
    console.log('          ❌ This gave SHORT names like "Case_ID"\n');
    console.log('  AFTER:  var cachedMergedKeys = docProps.getProperty(\'CACHED_MERGED_KEYS\');');
    console.log('          var allFields = JSON.parse(cachedMergedKeys);');
    console.log('          ✅ This gives FULL names like "Case_Organization_Case_ID"\n');
    console.log('The 35 defaults stayed the SAME (they were already correct!)\n');
    console.log('Now allFields and selected use the SAME format from Row 2!\n');
    console.log('Try now - refresh Google Sheet and click cache button!\n');
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
