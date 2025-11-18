#!/usr/bin/env node

/**
 * RESTORE showFieldSelector() FUNCTION
 *
 * This function was accidentally deleted by cleanupDuplicateCode.cjs
 * but it's actually the correct function that's being called from the PathwaysUI!
 *
 * Restoring from backup: current-production-2025-11-07T21-07-30.gs
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

    console.log('📥 Reading backup file...\n');
    const backupPath = path.join(__dirname, '../backups/current-production-2025-11-07T21-07-30.gs');
    const backup = fs.readFileSync(backupPath, 'utf8');

    // Extract showFieldSelector from backup
    const funcStart = backup.indexOf('function showFieldSelector() {');
    const funcEnd = backup.indexOf('function saveFieldSelectionAndStartCache(', funcStart);
    const showFieldSelectorFunc = backup.substring(funcStart, funcEnd).trim();

    console.log('✅ Extracted showFieldSelector() from backup\n');
    console.log('Function size:', (showFieldSelectorFunc.length / 1024).toFixed(1), 'KB\n');

    // Find where to insert (after showSavedFieldSelection)
    const insertAfter = code.indexOf('function showSavedFieldSelection() {');
    if (insertAfter === -1) {
      console.log('❌ Could not find insertion point\n');
      process.exit(1);
    }

    // Find end of showSavedFieldSelection
    let insertPos = insertAfter;
    let braceCount = 0;
    let foundStart = false;

    for (let i = insertAfter; i < code.length; i++) {
      if (code[i] === '{') {
        braceCount++;
        foundStart = true;
      } else if (code[i] === '}') {
        braceCount--;
        if (foundStart && braceCount === 0) {
          insertPos = i + 1;
          break;
        }
      }
    }

    // Insert the function
    code = code.substring(0, insertPos) + '\n\n' + showFieldSelectorFunc + '\n\n' + code.substring(insertPos);

    console.log('✅ Function restored\n');
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
    console.log('✅ RESTORED showFieldSelector() FUNCTION!\n');
    console.log('\nSorry for deleting it - it was the correct function all along!\n');
    console.log('Now try clicking the cache button from Pathways UI again.\n');
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
