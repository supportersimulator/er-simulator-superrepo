#!/usr/bin/env node

/**
 * FINAL VERSION - Add batch caching without breaking existing code
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

    // STEP 1: Add server functions
    console.log('🔧 Step 1: Adding server functions...\\n');

    const serverFunctions = `
function cacheNext25RowsWithFields() {
  Logger.log('🔄 START cacheNext25RowsWithFields');
  var docProps = PropertiesService.getDocumentProperties();
  var selectedFieldsJson = docProps.getProperty('SELECTED_FIELDS');
  if (!selectedFieldsJson) throw new Error('No fields selected');
  var selectedFields = JSON.parse(selectedFieldsJson);
  var lastCachedRow = parseInt(docProps.getProperty('LAST_CACHED_ROW') || '2', 10);
  var nextRow = lastCachedRow + 1;
  var sheet = pickMasterSheet_();
  var data = sheet.getDataRange().getValues();
  var cachedMergedKeys = docProps.getProperty('CACHED_MERGED_KEYS');
  if (!cachedMergedKeys) throw new Error('Headers not cached');
  var headers = JSON.parse(cachedMergedKeys);
  var totalRows = data.length - 2;
  var endRow = Math.min(nextRow + 24, data.length - 1);
  if (nextRow >= data.length) return { complete: true, totalCached: totalRows, totalRows: totalRows, percentComplete: 100 };
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
  Logger.log('✅ Cached rows ' + nextRow + '-' + endRow);
  return { complete: endRow >= data.length - 1, startRow: nextRow, endRow: endRow, totalCached: cachedCount, totalRows: totalRows, percentComplete: percentComplete, rowsInBatch: endRow - nextRow + 1 };
}

function resetCacheProgress() {
  PropertiesService.getDocumentProperties().deleteProperty('LAST_CACHED_ROW');
  return { success: true };
}

`;

    const showFieldSelectorStart = code.indexOf('function showFieldSelector()');
    code = code.substring(0, showFieldSelectorStart) + serverFunctions + code.substring(showFieldSelectorStart);

    console.log('✅ Server functions added\\n');

    // STEP 2: Add client functions (NO \\n - just add directly)
    console.log('🔧 Step 2: Adding client functions...\\n');

    const cachingFunctions = `    html += '';
    html += 'var cachingInProgress = false;';
    html += '';
    html += 'function startCaching() {';
    html += '  if (cachingInProgress) return;';
    html += '  cachingInProgress = true;';
    html += '  document.getElementById("cache-btn").disabled = true;';
    html += '  log("🚀 Starting batch cache");';
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
    html += '      log("❌ Error: " + e.message);';
    html += '      cachingInProgress = false;';
    html += '      document.getElementById("cache-btn").disabled = false;';
    html += '    })';
    html += '    .saveFieldSelection(selected);';
    html += '}';
    html += '';
    html += 'function cacheNext25() {';
    html += '  log("⏳ Caching next 25 rows");';
    html += '  google.script.run';
    html += '    .withSuccessHandler(function(r) {';
    html += '      log("✅ Batch complete");';
    html += '      log("📊 Progress: " + r.percentComplete + "%");';
    html += '      if (r.complete) {';
    html += '        log("🎉 ALL ROWS CACHED!");';
    html += '        cachingInProgress = false;';
    html += '        document.getElementById("cache-btn").textContent = "✅ Done!";';
    html += '        document.getElementById("cache-btn").style.background = "#0d652d";';
    html += '      } else {';
    html += '        setTimeout(cacheNext25, 1500);';
    html += '      }';
    html += '    })';
    html += '    .withFailureHandler(function(e) {';
    html += '      log("❌ Error: " + e.message);';
    html += '      cachingInProgress = false;';
    html += '      document.getElementById("cache-btn").disabled = false;';
    html += '    })';
    html += '    .cacheNext25RowsWithFields();';
    html += '}';
    html += '';
`;

    // Find insertion point
    const saveSelectionEnd = code.indexOf("    html += '}';", code.indexOf("html += 'function saveSelection()"));
    const insertPoint = saveSelectionEnd + "    html += '}';".length;

    // Insert WITHOUT newline character
    code = code.substring(0, insertPoint) + cachingFunctions + code.substring(insertPoint);

    console.log('✅ Client functions added\\n');

    // STEP 3: Add cache button
    console.log('🔧 Step 3: Adding cache button...\\n');

    const saveButtonLine = "    html += '<button class=\"btn btn-primary\" onclick=\"saveSelection()\">💾 Save Selection</button>';";
    const cacheButton = "    html += '<button class=\"btn btn-primary\" id=\"cache-btn\" onclick=\"startCaching()\" style=\"background: #ea8600; margin-left: 10px;\">🔄 Cache Selected Fields</button>';";

    const saveButtonIdx = code.indexOf(saveButtonLine);
    code = code.substring(0, saveButtonIdx + saveButtonLine.length) + "\\n" + cacheButton + code.substring(saveButtonIdx + saveButtonLine.length);

    console.log('✅ Cache button added\\n');

    // DEPLOY
    console.log('📤 Deploying...\\n');

    await script.projects.updateContent({
      scriptId: PRODUCTION_PROJECT_ID,
      requestBody: {
        files: [
          { name: 'Code', type: 'SERVER_JS', source: code },
          manifestFile
        ]
      }
    });

    console.log('\\n✅ DEPLOYMENT SUCCESSFUL!\\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ BATCH CACHING SUCCESSFULLY ADDED');
    console.log('═══════════════════════════════════════════════════════════════\\n');
    console.log('Test it:');
    console.log('  1. Refresh Google Sheet (F5)');
    console.log('  2. Open field selector modal');
    console.log('  3. Click "🔄 Cache Selected Fields"');
    console.log('  4. Watch Live Log for batch progress!\\n');
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
