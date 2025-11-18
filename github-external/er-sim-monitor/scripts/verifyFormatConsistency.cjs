#!/usr/bin/env node

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

async function verify() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current production...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const code = content.data.files.find(f => f.name === 'Code').source;

    console.log('🔍 FORMAT CONSISTENCY CHECK\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const functions = [
      'refreshHeaders',
      'getFieldSelectorRoughDraft',
      'getAvailableFields',
      'getColumnIndexByHeader_',
      'getStaticRecommendedFields_',
      'getRecommendedFields'
    ];

    functions.forEach(funcName => {
      const funcPattern = 'function ' + funcName;
      const idx = code.indexOf(funcPattern);

      if (idx !== -1) {
        const snippet = code.substring(idx, idx + 1500);
        const usesMergedKeys = snippet.includes('CACHED_MERGED_KEYS');
        const usesHeader2Object = snippet.includes('Object.keys(header2Data)');
        const usesHeader2Array = snippet.includes('CACHED_HEADER2') && !usesHeader2Object;

        console.log(`${funcName}():`);
        console.log(`  ✅ Uses CACHED_MERGED_KEYS: ${usesMergedKeys}`);
        console.log(`  ⚠️  Uses CACHED_HEADER2 (array): ${usesHeader2Array}`);
        console.log(`  ❌ Uses CACHED_HEADER2 (object): ${usesHeader2Object}`);
        console.log();
      } else {
        console.log(`❌ ${funcName}() NOT FOUND`);
        console.log();
      }
    });

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('EXPECTED FORMAT:\n');
    console.log('CACHED_MERGED_KEYS = ["Case_Organization_Case_ID", ...]');
    console.log('  → Array of exact Row 2 header names');
    console.log('  → Used by: getFieldSelectorRoughDraft, getAvailableFields, getColumnIndexByHeader_\n');
    console.log('CACHED_HEADER1 = ["Case_Organization", ...]');
    console.log('  → Array of tier1 values (for backward compat)');
    console.log();
    console.log('CACHED_HEADER2 = ["Case_ID", ...]');
    console.log('  → Array of tier2 values (for backward compat)\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

verify();
