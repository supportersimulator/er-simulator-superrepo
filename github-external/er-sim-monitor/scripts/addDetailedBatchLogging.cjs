#!/usr/bin/env node

/**
 * ADD DETAILED BATCH LOGGING
 *
 * Add comprehensive logging to cacheNext25RowsWithFields() to diagnose why batching stops
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

    console.log('🔧 Adding detailed logging to cacheNext25RowsWithFields()...\n');

    const oldFunc = `function cacheNext25RowsWithFields() {
  Logger.log('START cacheNext25RowsWithFields');

  var docProps = PropertiesService.getDocumentProperties();
  var selectedFieldsJson = docProps.getProperty('SELECTED_CACHE_FIELDS');

  if (!selectedFieldsJson) {
    throw new Error('No fields selected');
  }

  var selectedFields = JSON.parse(selectedFieldsJson);
  var lastCachedRow = parseInt(docProps.getProperty('LAST_CACHED_ROW') || '2', 10);
  var nextRow = lastCachedRow + 1;

  var sheet = pickMasterSheet_();
  var data = sheet.getDataRange().getValues();

  var cachedMergedKeys = docProps.getProperty('CACHED_MERGED_KEYS');
  if (!cachedMergedKeys) {
    throw new Error('Headers not cached');
  }

  var headers = JSON.parse(cachedMergedKeys);
  var totalRows = data.length - 2;
  var endRow = Math.min(nextRow + 24, data.length - 1);

  if (nextRow >= data.length) {
    return { complete: true, totalCached: totalRows, totalRows: totalRows, percentComplete: 100 };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cacheSheet = ss.getSheetByName('Field_Cache_Incremental');

  if (!cacheSheet) {
    cacheSheet = ss.insertSheet('Field_Cache_Incremental');
    cacheSheet.appendRow(['Row', 'Timestamp'].concat(selectedFields));
  }

  var timestamp = new Date().toISOString();

  for (var i = nextRow; i <= endRow; i++) {
    var rowArray = [i, timestamp];

    for (var j = 0; j < selectedFields.length; j++) {
      var colIdx = headers.indexOf(selectedFields[j]);
      rowArray.push(colIdx !== -1 ? data[i][colIdx] : 'N/A');
    }

    cacheSheet.appendRow(rowArray);
  }

  docProps.setProperty('LAST_CACHED_ROW', endRow.toString());

  var cachedCount = endRow - 2;
  var percentComplete = Math.round((cachedCount / totalRows) * 100);

  Logger.log('Cached rows ' + nextRow + '-' + endRow);

  return {
    complete: endRow >= data.length - 1,
    startRow: nextRow,
    endRow: endRow,
    totalCached: cachedCount,
    totalRows: totalRows,
    percentComplete: percentComplete,
    rowsInBatch: endRow - nextRow + 1
  };
}`;

    const newFunc = `function cacheNext25RowsWithFields() {
  Logger.log('🔄 START cacheNext25RowsWithFields');

  var docProps = PropertiesService.getDocumentProperties();
  var selectedFieldsJson = docProps.getProperty('SELECTED_CACHE_FIELDS');

  Logger.log('📋 Selected fields property: ' + (selectedFieldsJson ? 'EXISTS' : 'NULL'));

  if (!selectedFieldsJson) {
    Logger.log('❌ ERROR: No SELECTED_CACHE_FIELDS property found!');
    throw new Error('No fields selected in SELECTED_CACHE_FIELDS');
  }

  var selectedFields = JSON.parse(selectedFieldsJson);
  Logger.log('✅ Parsed ' + selectedFields.length + ' selected fields');

  var lastCachedRow = parseInt(docProps.getProperty('LAST_CACHED_ROW') || '2', 10);
  Logger.log('📍 Last cached row: ' + lastCachedRow);

  var nextRow = lastCachedRow + 1;
  Logger.log('📍 Next row to cache: ' + nextRow);

  var sheet = pickMasterSheet_();
  var data = sheet.getDataRange().getValues();
  Logger.log('📊 Total data rows (including headers): ' + data.length);

  var cachedMergedKeys = docProps.getProperty('CACHED_MERGED_KEYS');
  if (!cachedMergedKeys) {
    Logger.log('❌ ERROR: Headers not cached!');
    throw new Error('Headers not cached');
  }

  var headers = JSON.parse(cachedMergedKeys);
  Logger.log('✅ Loaded ' + headers.length + ' header columns');

  var totalRows = data.length - 2;
  Logger.log('📊 Total data rows (excluding 2 headers): ' + totalRows);

  var endRow = Math.min(nextRow + 24, data.length - 1);
  Logger.log('📍 End row for this batch: ' + endRow);
  Logger.log('📍 Rows in this batch: ' + (endRow - nextRow + 1));

  if (nextRow >= data.length) {
    Logger.log('✅ ALL COMPLETE - nextRow (' + nextRow + ') >= data.length (' + data.length + ')');
    return { complete: true, totalCached: totalRows, totalRows: totalRows, percentComplete: 100 };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cacheSheet = ss.getSheetByName('Field_Cache_Incremental');

  if (!cacheSheet) {
    Logger.log('📝 Creating new Field_Cache_Incremental sheet');
    cacheSheet = ss.insertSheet('Field_Cache_Incremental');
    cacheSheet.appendRow(['Row', 'Timestamp'].concat(selectedFields));
    Logger.log('✅ Sheet created with headers');
  } else {
    Logger.log('✅ Using existing Field_Cache_Incremental sheet');
  }

  var timestamp = new Date().toISOString();
  Logger.log('⏰ Timestamp: ' + timestamp);
  Logger.log('🔄 Writing rows ' + nextRow + ' to ' + endRow + '...');

  for (var i = nextRow; i <= endRow; i++) {
    var rowArray = [i, timestamp];

    for (var j = 0; j < selectedFields.length; j++) {
      var colIdx = headers.indexOf(selectedFields[j]);
      rowArray.push(colIdx !== -1 ? data[i][colIdx] : 'N/A');
    }

    cacheSheet.appendRow(rowArray);
  }

  Logger.log('✅ Wrote ' + (endRow - nextRow + 1) + ' rows to cache sheet');

  docProps.setProperty('LAST_CACHED_ROW', endRow.toString());
  Logger.log('✅ Updated LAST_CACHED_ROW to ' + endRow);

  var cachedCount = endRow - 2;
  var percentComplete = Math.round((cachedCount / totalRows) * 100);

  var isComplete = endRow >= data.length - 1;
  Logger.log('🏁 Completion check: endRow=' + endRow + ', data.length-1=' + (data.length - 1) + ', complete=' + isComplete);

  var result = {
    complete: isComplete,
    startRow: nextRow,
    endRow: endRow,
    totalCached: cachedCount,
    totalRows: totalRows,
    percentComplete: percentComplete,
    rowsInBatch: endRow - nextRow + 1
  };

  Logger.log('📊 Returning: ' + JSON.stringify(result));
  Logger.log('✅ END cacheNext25RowsWithFields');

  return result;
}`;

    code = code.replace(oldFunc, newFunc);

    console.log('✅ Added detailed logging\n');
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
    console.log('✅ ADDED DETAILED BATCH LOGGING!\n');
    console.log('\nNow when you run batch caching:\n');
    console.log('1. Check View → Execution log in Google Sheets');
    console.log('2. You\'ll see every step: property reads, row counts, completion checks');
    console.log('3. This will show exactly where it\'s failing\n');
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
