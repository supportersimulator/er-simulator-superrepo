#!/usr/bin/env node

/**
 * FIX 3: Add duplicate removal to refreshHeaders()
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

    console.log('📥 Downloading...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Adding duplicate removal to refreshHeaders()...\n');

    // Find refreshHeaders
    const refreshIdx = code.indexOf('function refreshHeaders()');
    const refreshEnd = code.indexOf('\nfunction ', refreshIdx + 50);
    let refreshFunc = code.substring(refreshIdx, refreshEnd);

    // Find the line where we create mergedKeys
    const mergedKeysLine = "  const mergedKeys = flattenedHeaders";
    const mergedKeysIdx = refreshFunc.indexOf(mergedKeysLine);

    if (mergedKeysIdx !== -1 && !refreshFunc.includes('// Remove duplicates')) {
      // Find the end of the mergedKeys creation (ends with semicolon)
      const afterMergedKeys = refreshFunc.indexOf(';', mergedKeysIdx + mergedKeysLine.length) + 1;

      const beforeDedupe = refreshFunc.substring(0, afterMergedKeys);
      const afterDedupe = refreshFunc.substring(afterMergedKeys);

      const dedupeCode = `

  // Remove duplicates from mergedKeys
  const uniqueKeys = [];
  const seen = {};
  for (let i = 0; i < mergedKeys.length; i++) {
    if (!seen[mergedKeys[i]]) {
      uniqueKeys.push(mergedKeys[i]);
      seen[mergedKeys[i]] = true;
    }
  }
  if (uniqueKeys.length < mergedKeys.length) {
    Logger.log('⚠️ Removed ' + (mergedKeys.length - uniqueKeys.length) + ' duplicate headers');
  }
  const finalKeys = uniqueKeys;
`;

      // Replace mergedKeys with finalKeys in the cache line
      const updatedAfter = afterDedupe.replace(
        "setProp('CACHED_MERGED_KEYS', JSON.stringify(mergedKeys));",
        "setProp('CACHED_MERGED_KEYS', JSON.stringify(finalKeys));"
      );

      refreshFunc = beforeDedupe + dedupeCode + updatedAfter;
      code = code.substring(0, refreshIdx) + refreshFunc + code.substring(refreshEnd);

      console.log('✅ Added duplicate removal\n');
    } else {
      console.log('⏭️  Already present or pattern not found\n');
    }

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
    console.log('✅ DUPLICATE REMOVAL ADDED TO refreshHeaders()');
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
