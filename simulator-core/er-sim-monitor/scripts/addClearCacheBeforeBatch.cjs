#!/usr/bin/env node

/**
 * Add function to clear cache before starting new batch
 * This ensures clean slate every time user clicks Cache button
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

async function deploy() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log('📥 Downloading current production code...\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    console.log('🔧 Step 1: Adding clearCacheSheet() server function...\n');

    // Add server-side function to clear cache sheet
    const clearCacheFunction = `
/**
 * Clear the Field_Cache_Incremental sheet to start fresh
 */
function clearCacheSheet() {
  Logger.log('🗑️ Clearing Field_Cache_Incremental sheet');
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cacheSheet = ss.getSheetByName('Field_Cache_Incremental');
  
  if (cacheSheet) {
    ss.deleteSheet(cacheSheet);
    Logger.log('✅ Cache sheet deleted');
  }
  
  PropertiesService.getDocumentProperties().deleteProperty('LAST_CACHED_ROW');
  Logger.log('✅ Progress counter reset');
  
  return { success: true };
}

`;

    // Insert before cacheNext25RowsWithFields
    const insertBeforePattern = '/**\n * Cache next 25 rows with selected fields using perfect headers cache\n */\nfunction cacheNext25RowsWithFields() {';
    code = code.replace(insertBeforePattern, clearCacheFunction + insertBeforePattern);

    console.log('✅ Server function added\n');

    console.log('🔧 Step 2: Modifying startCaching() to clear cache first...\n');

    // Replace startCaching() to call clearCacheSheet first
    const oldStartCaching = `    html += 'function startCaching() {';
    html += '  if (cachingInProgress) return;';
    html += '  cachingInProgress = true;';
    html += '  document.getElementById("cache-btn").disabled = true;';
    html += '  log("Starting batch cache");';`;

    const newStartCaching = `    html += 'function startCaching() {';
    html += '  if (cachingInProgress) return;';
    html += '  cachingInProgress = true;';
    html += '  document.getElementById("cache-btn").disabled = true;';
    html += '  log("Clearing previous cache...");';
    html += '  google.script.run';
    html += '    .withSuccessHandler(function() {';
    html += '      log("Cache cleared");';
    html += '      log("Starting batch cache");';
    html += '      saveFieldsAndCache();';
    html += '    })';
    html += '    .withFailureHandler(function(e) {';
    html += '      log("Error clearing cache: " + e.message);';
    html += '      cachingInProgress = false;';
    html += '      document.getElementById("cache-btn").disabled = false;';
    html += '    })';
    html += '    .clearCacheSheet();';
    html += '}';
    html += '';
    html += 'function saveFieldsAndCache() {';`;

    code = code.replace(oldStartCaching, newStartCaching);

    console.log('✅ Client function updated\n');

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

    console.log('✅ DEPLOYMENT SUCCESSFUL!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ CACHE CLEARING ADDED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('New behavior:');
    console.log('  1. User clicks "🔄 Cache Selected Fields"');
    console.log('  2. System deletes Field_Cache_Incremental sheet');
    console.log('  3. System resets LAST_CACHED_ROW counter');
    console.log('  4. System saves field selection');
    console.log('  5. System starts fresh batch cache from row 3\n');
    console.log('Result: Every cache run starts from scratch (no duplicates!)');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deploy();
