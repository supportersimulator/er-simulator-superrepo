#!/usr/bin/env node

/**
 * RESTORE PROPER PREPOPULATION SEQUENCE
 *
 * The monolithic backup from 13:21 had the correct full sequence:
 * 1. Refresh headers
 * 2. Initialize 35 defaults (with tier comments)
 * 3. Pre-fetch AI recommendations in background
 * 4. Get holistic analysis
 * 5. Show UI
 *
 * Restoring from: monolithic-complete-2025-11-07-13-21-54.gs
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

async function restore() {
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

    console.log('📥 Reading backup with proper sequence...\n');
    const backupPath = path.join(__dirname, '../backups/monolithic-complete-2025-11-07-13-21-54.gs');
    const backup = fs.readFileSync(backupPath, 'utf8');

    // Extract runPathwayChainBuilder from backup (lines 6346-6454)
    const funcStart = backup.indexOf('function runPathwayChainBuilder() {');
    const funcEnd = backup.indexOf('\n\nfunction buildBirdEyeViewUI_', funcStart);
    const properFunction = backup.substring(funcStart, funcEnd).trim();

    console.log('✅ Extracted proper prepopulation sequence from backup\n');
    console.log('Function size:', (properFunction.length / 1024).toFixed(1), 'KB\n');

    // Find current function
    const currentStart = code.indexOf('function runPathwayChainBuilder() {');
    if (currentStart === -1) {
      console.log('❌ Could not find runPathwayChainBuilder() in current code\n');
      process.exit(1);
    }

    // Find end of current function
    let currentEnd = currentStart;
    let braceCount = 0;
    let foundStart = false;

    for (let i = currentStart; i < code.length; i++) {
      if (code[i] === '{') {
        braceCount++;
        foundStart = true;
      } else if (code[i] === '}') {
        braceCount--;
        if (foundStart && braceCount === 0) {
          currentEnd = i + 1;
          break;
        }
      }
    }

    // Replace with proper version
    code = code.substring(0, currentStart) + properFunction + code.substring(currentEnd);

    console.log('✅ Function replaced with proper sequence\n');
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
    console.log('New size:', (code.length / 1024).toFixed(1), 'KB\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ RESTORED PROPER PREPOPULATION SEQUENCE!\n');
    console.log('\nNow when you click "Categories & Pathways":\n');
    console.log('STEP 1: Refresh headers cache');
    console.log('STEP 2: Initialize 35 intelligent defaults (with tier comments)');
    console.log('STEP 2.5: Pre-fetch AI recommendations in background ⭐');
    console.log('STEP 3: Get or create holistic analysis');
    console.log('STEP 4: Build and show Pathway UI\n');
    console.log('Everything will be ready BEFORE you even see the modal!\n');
    console.log('AI recommendations already cached when you click cache button!\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

restore();
