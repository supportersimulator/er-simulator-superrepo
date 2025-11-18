#!/usr/bin/env node

/**
 * FIX getColumnIndexByHeader_() TO USE CACHED_MERGED_KEYS
 *
 * Problem: getColumnIndexByHeader_() searches for FULL names (Case_Organization_Case_ID)
 *          in CACHED_HEADER2 which contains SHORT names (Case_ID)
 *
 * Solution: Change it to use CACHED_MERGED_KEYS which has FULL flattened names
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

    console.log('🔧 Fixing getColumnIndexByHeader_() to use CACHED_MERGED_KEYS...\n');

    // Find the function
    const funcStart = code.indexOf('function getColumnIndexByHeader_(tier2Name, fallbackIndex) {');
    if (funcStart === -1) {
      console.log('❌ Could not find getColumnIndexByHeader_() function\n');
      process.exit(1);
    }

    // Find end of function
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

    // New version using CACHED_MERGED_KEYS
    const newFunc = `function getColumnIndexByHeader_(fullFieldName, fallbackIndex) {
  try {
    const docProps = PropertiesService.getDocumentProperties();
    const cachedMergedKeys = docProps.getProperty('CACHED_MERGED_KEYS');
    
    if (cachedMergedKeys) {
      const headers = JSON.parse(cachedMergedKeys);
      const index = headers.indexOf(fullFieldName);
      
      if (index !== -1) {
        if (index !== fallbackIndex) {
          Logger.log('🔄 Header "' + fullFieldName + '" moved: ' + fallbackIndex + ' → ' + index);
        }
        return index;
      }
    }
  } catch (e) {
    Logger.log('⚠️  Could not read cached headers: ' + e.message);
  }
  
  return fallbackIndex;
}`;

    code = code.substring(0, funcStart) + newFunc + code.substring(funcEnd);

    console.log('✅ Fixed function\n');

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
    console.log('✅ FIXED - COLUMN INDEX RESOLUTION NOW USES CORRECT FORMAT!\n');
    console.log('\nWhat changed:\n');
    console.log('  BEFORE: const cachedHeader2 = docProps.getProperty(\'CACHED_HEADER2\');');
    console.log('          const headers = JSON.parse(cachedHeader2);');
    console.log('          const index = headers.indexOf(tier2Name);');
    console.log('          ❌ Searched for "Case_Organization_Case_ID" in ["Case_ID", ...]\n');
    console.log('  AFTER:  const cachedMergedKeys = docProps.getProperty(\'CACHED_MERGED_KEYS\');');
    console.log('          const headers = JSON.parse(cachedMergedKeys);');
    console.log('          const index = headers.indexOf(fullFieldName);');
    console.log('          ✅ Searches for "Case_Organization_Case_ID" in ["Case_Organization_Case_ID", ...]\n');
    console.log('Now dynamic column resolution will actually work!\n');
    console.log('If you reorder columns, the system will find them correctly.\n');
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
