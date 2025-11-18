#!/usr/bin/env node

/**
 * Review existing batch caching implementation
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

async function review() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const code = content.data.files.find(f => f.name === 'Code').source;

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('BATCH CACHING FUNCTIONS REVIEW');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Check for cacheNext25Rows
    const cacheNext25Idx = code.indexOf('function cacheNext25Rows');
    if (cacheNext25Idx !== -1) {
      console.log('✅ cacheNext25Rows() EXISTS\n');
      const endIdx = code.indexOf('\nfunction ', cacheNext25Idx + 50);
      const func = code.substring(cacheNext25Idx, endIdx > cacheNext25Idx ? endIdx : cacheNext25Idx + 2000);
      console.log('First 1500 chars:\n');
      console.log(func.substring(0, 1500));
      console.log('\n...\n');
    } else {
      console.log('❌ cacheNext25Rows() NOT FOUND\n');
    }

    // Check for cache-related functions
    console.log('Looking for other cache functions...\n');

    const cacheFuncs = [
      'cacheAllRows',
      'cacheSpecificRows',
      'cacheFieldData',
      'getCacheStatus',
      'clearCache'
    ];

    cacheFuncs.forEach(funcName => {
      if (code.includes('function ' + funcName)) {
        console.log(`✅ ${funcName}() exists`);
      } else {
        console.log(`❌ ${funcName}() not found`);
      }
    });

    console.log('\n');

    // Check for properties used
    console.log('Checking for property keys used...\n');
    const propKeys = [
      'CACHED_MERGED_KEYS',
      'SELECTED_FIELDS',
      'CACHE_PROGRESS',
      'LAST_CACHED_ROW'
    ];

    propKeys.forEach(key => {
      if (code.includes(key)) {
        console.log(`✅ Uses property: ${key}`);
      }
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

review();
