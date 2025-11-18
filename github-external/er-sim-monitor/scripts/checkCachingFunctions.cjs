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

async function check() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const code = content.data.files.find(f => f.name === 'Code').source;

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('CACHING FUNCTIONS CHECK');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Looking for caching-related functions...\n');

    const cacheFuncs = [
      'cacheFieldData',
      'cacheRow',
      'cacheSelectedFields',
      'cacheAllLayers',
      'cachePatientData',
      'cacheMergedData',
      'cacheNext25Rows',
      'getFieldSelectorData'
    ];

    cacheFuncs.forEach(funcName => {
      if (code.includes('function ' + funcName)) {
        console.log(`✅ Found: ${funcName}()`);
        const idx = code.indexOf('function ' + funcName);
        console.log(`   Line ~${code.substring(0, idx).split('\n').length}`);
      } else {
        console.log(`❌ Not found: ${funcName}()`);
      }
    });

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('getCacheStatus() function:');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const cacheStatusIdx = code.indexOf('function getCacheStatus(');
    if (cacheStatusIdx !== -1) {
      const endIdx = code.indexOf('\nfunction ', cacheStatusIdx + 50);
      const func = code.substring(cacheStatusIdx, endIdx > cacheStatusIdx ? endIdx : cacheStatusIdx + 1500);
      console.log(func.substring(0, 1000));
      console.log('\n...\n');
    } else {
      console.log('❌ getCacheStatus() not found\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

check();
