#!/usr/bin/env node

/**
 * CHECK PRODUCTION FOR DUPLICATE ATSR CODE
 * Downloads current production code and checks for duplicate function declarations
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw';

console.log('\n🔍 CHECKING PRODUCTION FOR DUPLICATE ATSR CODE\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

async function checkProduction() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`🎯 Production Project ID: ${PRODUCTION_PROJECT_ID}\n`);
    console.log('📥 Downloading current production code...\n');

    const project = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = project.data.files.find(f => f.name === 'Code');

    if (!codeFile) {
      throw new Error('Could not find Code.gs file');
    }

    const code = codeFile.source;
    console.log(`✅ Downloaded code: ${(code.length / 1024).toFixed(1)} KB\n`);

    // Save current production code
    const currentCodePath = path.join(__dirname, '../backups/production-current-live-2025-11-06.gs');
    fs.writeFileSync(currentCodePath, code, 'utf8');
    console.log(`💾 Saved current production code: ${currentCodePath}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔍 SEARCHING FOR DUPLICATE ATSR FUNCTIONS:\n');

    // Search for all critical ATSR functions
    const functionsToCheck = [
      'runATSRTitleGenerator',
      'generateMysteriousSparkTitles',
      'buildATSRUltimateUI_',
      'saveATSRData'
    ];

    const results = {};

    functionsToCheck.forEach(funcName => {
      const regex = new RegExp(`function ${funcName}`, 'g');
      const matches = code.match(regex);
      const count = matches ? matches.length : 0;

      results[funcName] = {
        count,
        status: count === 1 ? '✅ OK' : count === 0 ? '⚠️  MISSING' : '❌ DUPLICATE'
      };

      console.log(`${results[funcName].status} ${funcName}: Found ${count} occurrence(s)`);
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Check for mystery button feature
    console.log('🔍 CHECKING FOR MYSTERY BUTTON FEATURE:\n');

    const mysteryButtonHTML = code.includes('Make More Mysterious');
    const mysteryButtonFunction = code.includes('function regenerateMoreMysterious');
    const mysteryButtonCall = code.includes('onclick="regenerateMoreMysterious()"');

    console.log(`${mysteryButtonHTML ? '✅' : '❌'} Mystery button HTML: ${mysteryButtonHTML ? 'FOUND' : 'MISSING'}`);
    console.log(`${mysteryButtonFunction ? '✅' : '❌'} regenerateMoreMysterious() function: ${mysteryButtonFunction ? 'FOUND' : 'MISSING'}`);
    console.log(`${mysteryButtonCall ? '✅' : '❌'} onclick handler: ${mysteryButtonCall ? 'FOUND' : 'MISSING'}`);

    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('📊 SUMMARY:\n');

    const hasDuplicates = Object.values(results).some(r => r.status === '❌ DUPLICATE');
    const hasMissing = Object.values(results).some(r => r.status === '⚠️  MISSING');

    if (hasDuplicates) {
      console.log('❌ PROBLEM: Duplicate ATSR functions found!\n');
      console.log('   This explains why the mystery button isn\'t showing.\n');
      console.log('   The old ATSR implementation is being called instead of the new one.\n');
    } else if (hasMissing) {
      console.log('⚠️  PROBLEM: Some ATSR functions are missing!\n');
    } else {
      console.log('✅ All ATSR functions appear exactly once.\n');

      if (mysteryButtonHTML && mysteryButtonFunction && mysteryButtonCall) {
        console.log('✅ Mystery button feature is fully present in code.\n');
        console.log('   If the user still can\'t see it, the issue may be:\n');
        console.log('   1. Browser cache (hard refresh needed)\n');
        console.log('   2. Script not reloaded (close/reopen spreadsheet)\n');
        console.log('   3. Different spreadsheet being viewed\n');
      } else {
        console.log('❌ Mystery button feature is INCOMPLETE or MISSING.\n');
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

    // If duplicates found, show line numbers
    if (hasDuplicates) {
      console.log('📍 DUPLICATE FUNCTION LOCATIONS:\n');

      functionsToCheck.forEach(funcName => {
        if (results[funcName].count > 1) {
          const lines = code.split('\n');
          const locations = [];

          lines.forEach((line, index) => {
            if (line.includes(`function ${funcName}`)) {
              locations.push(index + 1);
            }
          });

          console.log(`${funcName} found at lines: ${locations.join(', ')}`);
        }
      });

      console.log('\n═══════════════════════════════════════════════════════════════\n');
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

checkProduction();
