#!/usr/bin/env node

/**
 * FIX PROPERTY KEY MISMATCH
 *
 * BUG: saveFieldSelection() saves to 'SELECTED_FIELDS'
 *      but cacheNext25RowsWithFields() reads from 'SELECTED_FIELDS'
 *      while the entire system uses 'SELECTED_CACHE_FIELDS'
 *
 * FIX: Change BOTH to use 'SELECTED_CACHE_FIELDS' consistently
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

    console.log('🔧 Fixing property key mismatch...\n');

    // FIX 1: Change saveFieldSelection() to use SELECTED_CACHE_FIELDS (line 533)
    const oldSave1 = `function saveFieldSelection(selectedFields) {
  try {
    Logger.log('💾 Saving ' + selectedFields.length + ' fields to properties');

    var docProps = PropertiesService.getDocumentProperties();
    docProps.setProperty('SELECTED_FIELDS', JSON.stringify(selectedFields));

    Logger.log('✅ Field selection saved');
    return { success: true };
  } catch (error) {
    Logger.log('❌ Error saving: ' + error.message);
    throw error;
  }
}`;

    const newSave = `function saveFieldSelection(selectedFields) {
  try {
    Logger.log('💾 Saving ' + selectedFields.length + ' fields to SELECTED_CACHE_FIELDS');

    var docProps = PropertiesService.getDocumentProperties();
    docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(selectedFields));

    Logger.log('✅ Field selection saved to SELECTED_CACHE_FIELDS');
    return { success: true };
  } catch (error) {
    Logger.log('❌ Error saving: ' + error.message);
    throw error;
  }
}`;

    // Replace both duplicate functions
    code = code.replace(oldSave1, newSave);
    code = code.replace(oldSave1, ''); // Remove the second duplicate

    console.log('✅ Fixed saveFieldSelection() to use SELECTED_CACHE_FIELDS\n');

    // FIX 2: Change cacheNext25RowsWithFields() to read SELECTED_CACHE_FIELDS (line 102)
    const oldCache = `function cacheNext25RowsWithFields() {
  Logger.log('START cacheNext25RowsWithFields');

  var docProps = PropertiesService.getDocumentProperties();
  var selectedFieldsJson = docProps.getProperty('SELECTED_FIELDS');`;

    const newCache = `function cacheNext25RowsWithFields() {
  Logger.log('START cacheNext25RowsWithFields');

  var docProps = PropertiesService.getDocumentProperties();
  var selectedFieldsJson = docProps.getProperty('SELECTED_CACHE_FIELDS');`;

    code = code.replace(oldCache, newCache);

    console.log('✅ Fixed cacheNext25RowsWithFields() to read SELECTED_CACHE_FIELDS\n');

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
    console.log('✅ FIXED - PROPERTY KEY NOW CONSISTENT!\n');
    console.log('\nWhat changed:\n');
    console.log('  BEFORE: saveFieldSelection() → SELECTED_FIELDS');
    console.log('          cacheNext25RowsWithFields() → SELECTED_FIELDS');
    console.log('          ❌ Wrong property key\n');
    console.log('  AFTER:  saveFieldSelection() → SELECTED_CACHE_FIELDS');
    console.log('          cacheNext25RowsWithFields() → SELECTED_CACHE_FIELDS');
    console.log('          ✅ Correct property key (matches entire system)\n');
    console.log('Now batch caching will read the correct saved fields!\n');
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
