#!/usr/bin/env node

/**
 * Add batch caching to field selector using the proven HEAD pattern
 *
 * Adds caching functions BEFORE DOMContentLoaded (after saveSelection)
 * Adds cache button in footer
 * Uses perfect headers cache system (CACHED_MERGED_KEYS)
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

    console.log('📥 Downloading current production code...\\n');

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const codeFile = content.data.files.find(f => f.name === 'Code');
    const manifestFile = content.data.files.find(f => f.name === 'appsscript');

    let code = codeFile.source;

    // STEP 1: Add server-side functions BEFORE showFieldSelector
    console.log('🔧 Step 1: Adding server-side batch caching functions...\\n');

    const serverFunctions = `
/**
 * Cache next 25 rows with selected fields using perfect headers cache
 */
function cacheNext25RowsWithFields() {
  Logger.log('🔄 cacheNext25RowsWithFields() START');

  var docProps = PropertiesService.getDocumentProperties();
  var selectedFieldsJson = docProps.getProperty('SELECTED_FIELDS');

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
    throw new Error('Headers not cached. Run refreshHeaders() first.');
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
    var headerRow = ['Row', 'Timestamp'].concat(selectedFields);
    cacheSheet.appendRow(headerRow);
  }

  var timestamp = new Date().toISOString();

  for (var i = nextRow; i <= endRow; i++) {
    var rowArray = [i, timestamp];

    for (var j = 0; j < selectedFields.length; j++) {
      var fieldName = selectedFields[j];
      var colIdx = headers.indexOf(fieldName);
      rowArray.push(colIdx !== -1 ? data[i][colIdx] : 'N/A');
    }

    cacheSheet.appendRow(rowArray);
  }

  docProps.setProperty('LAST_CACHED_ROW', endRow.toString());

  var cachedCount = endRow - 2;
  var percentComplete = Math.round((cachedCount / totalRows) * 100);

  Logger.log('✅ Cached rows ' + nextRow + '-' + endRow + ' (' + percentComplete + '%)');

  return {
    complete: endRow >= data.length - 1,
    startRow: nextRow,
    endRow: endRow,
    totalCached: cachedCount,
    totalRows: totalRows,
    percentComplete: percentComplete,
    rowsInBatch: endRow - nextRow + 1
  };
}

function resetCacheProgress() {
  PropertiesService.getDocumentProperties().deleteProperty('LAST_CACHED_ROW');
  return { success: true };
}

`;

    const showFieldSelectorStart = code.indexOf('function showFieldSelector()');
    code = code.substring(0, showFieldSelectorStart) + serverFunctions + code.substring(showFieldSelectorStart);

    console.log('✅ Server functions added\\n');

    // STEP 2: Add client-side caching functions AFTER saveSelection, BEFORE DOMContentLoaded
    console.log('🔧 Step 2: Adding client-side caching functions...\\n');

    const cachingFunctions = `    html += '';
    html += 'var cachingInProgress = false;';
    html += '';
    html += 'function startCaching() {';
    html += '  if (cachingInProgress) return;';
    html += '  cachingInProgress = true;';
    html += '  document.getElementById("cache-btn").disabled = true;';
    html += '  log("🚀 Starting batch cache...");';
    html += '  var selected = [];';
    html += '  for (var field in currentSelection) {';
    html += '    if (currentSelection[field]) selected.push(field);';
    html += '  }';
    html += '  google.script.run';
    html += '    .withSuccessHandler(function() {';
    html += '      log("✅ Fields saved");';
    html += '      cacheNext25();';
    html += '    })';
    html += '    .withFailureHandler(function(e) {';
    html += '      log("❌ " + e.message);';
    html += '      cachingInProgress = false;';
    html += '      document.getElementById("cache-btn").disabled = false;';
    html += '    })';
    html += '    .saveFieldSelection(selected);';
    html += '}';
    html += '';
    html += 'function cacheNext25() {';
    html += '  log("⏳ Caching next 25 rows...");';
    html += '  google.script.run';
    html += '    .withSuccessHandler(function(r) {';
    html += '      log("✅ Rows " + r.startRow + "-" + r.endRow + " cached (" + r.percentComplete + "%)");';
    html += '      if (r.complete) {';
    html += '        log("🎉 COMPLETE! " + r.totalRows + " rows cached");';
    html += '        cachingInProgress = false;';
    html += '        document.getElementById("cache-btn").textContent = "✅ Done!";';
    html += '        document.getElementById("cache-btn").style.background = "#0d652d";';
    html += '      } else {';
    html += '        setTimeout(cacheNext25, 1500);';
    html += '      }';
    html += '    })';
    html += '    .withFailureHandler(function(e) {';
    html += '      log("❌ " + e.message);';
    html += '      cachingInProgress = false;';
    html += '      document.getElementById("cache-btn").disabled = false;';
    html += '    })';
    html += '    .cacheNext25RowsWithFields();';
    html += '}';
    html += '';
`;

    // Find where to insert (after saveSelection closes, before DOMContentLoaded)
    const saveSelectionEnd = code.indexOf("    html += '}';", code.indexOf("html += 'function saveSelection()"));
    const insertPoint = saveSelectionEnd + "    html += '}';".length + 1;

    code = code.substring(0, insertPoint) + '\\n' + cachingFunctions + code.substring(insertPoint);

    console.log('✅ Client functions added\\n');

    // STEP 3: Add cache button in footer
    console.log('🔧 Step 3: Adding cache button to footer...\\n');

    const saveButtonLine = "    html += '<button class=\"btn btn-primary\" onclick=\"saveSelection()\">💾 Save Selection</button>';";
    const cacheButton = "\\n    html += '<button class=\"btn btn-primary\" id=\"cache-btn\" onclick=\"startCaching()\" style=\"background: #ea8600; margin-left: 10px;\">🔄 Cache Selected Fields</button>';";

    const saveButtonIdx = code.indexOf(saveButtonLine);
    code = code.substring(0, saveButtonIdx + saveButtonLine.length) + cacheButton + code.substring(saveButtonIdx + saveButtonLine.length);

    console.log('✅ Cache button added\\n');

    // STEP 4: Deploy
    console.log('📤 Deploying to production...\\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('✅ DEPLOYMENT COMPLETE!\\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ BATCH CACHING ADDED TO FIELD SELECTOR');
    console.log('═══════════════════════════════════════════════════════════════\\n');
    console.log('Server-side:');
    console.log('  ✅ cacheNext25RowsWithFields() - Process 25 rows');
    console.log('  ✅ resetCacheProgress() - Reset to start\\n');
    console.log('Client-side:');
    console.log('  ✅ startCaching() - Initiate batch cache');
    console.log('  ✅ cacheNext25() - Process batches with live updates');
    console.log('  ✅ Cache button in footer\\n');
    console.log('Features:');
    console.log('  ✅ Uses perfect headers cache (CACHED_MERGED_KEYS)');
    console.log('  ✅ Live progress in Live Log panel');
    console.log('  ✅ 25 rows per batch (1.5s delay between batches)');
    console.log('  ✅ Saves to Field_Cache_Incremental sheet');
    console.log('  ✅ Auto-complete detection\\n');
    console.log('Test it:');
    console.log('  1. Open Google Sheet');
    console.log('  2. Refresh (F5)');
    console.log('  3. Open field selector modal');
    console.log('  4. Click "🔄 Cache Selected Fields" button');
    console.log('  5. Watch Live Log for progress!');
    console.log('═══════════════════════════════════════════════════════════════\\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

deploy();
