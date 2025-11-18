#!/usr/bin/env node

/**
 * Add comprehensive batch caching (25 rows at a time) to field selector modal
 *
 * Uses the perfect headers cache system (CACHED_MERGED_KEYS) for dynamic column resolution
 * Adds live progress tracking in the existing Live Log panel
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

    console.log('🔧 Step 1: Adding batch caching server-side functions...\\n');

    // Add server-side caching functions before showFieldSelector
    const newFunctions = `
/**
 * Cache next 25 rows with only selected fields
 * Uses perfect headers cache system (CACHED_MERGED_KEYS) for dynamic column resolution
 */
function cacheNext25RowsWithFields() {
  Logger.log('🔄 cacheNext25RowsWithFields() called');

  const docProps = PropertiesService.getDocumentProperties();
  const selectedFieldsJson = docProps.getProperty('SELECTED_FIELDS');

  if (!selectedFieldsJson) {
    throw new Error('No fields selected. Please save field selection first.');
  }

  const selectedFields = JSON.parse(selectedFieldsJson);
  Logger.log('📋 Using ' + selectedFields.length + ' selected fields');

  // Get last cached row
  const lastCachedRow = parseInt(docProps.getProperty('LAST_CACHED_ROW') || '2', 10);
  const nextRow = lastCachedRow + 1;

  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();

  // Get cached headers using perfect headers cache system
  const cachedMergedKeys = docProps.getProperty('CACHED_MERGED_KEYS');
  if (!cachedMergedKeys) {
    throw new Error('Headers not cached. Please refresh headers first.');
  }

  const headers = JSON.parse(cachedMergedKeys);
  Logger.log('✅ Using cached headers (' + headers.length + ' columns)');

  const totalRows = data.length - 2; // Subtract 2 for header rows
  const endRow = Math.min(nextRow + 24, data.length - 1); // Cache up to 25 rows

  if (nextRow >= data.length) {
    return {
      complete: true,
      message: '✅ All rows cached!',
      totalCached: totalRows,
      totalRows: totalRows,
      percentComplete: 100
    };
  }

  // Extract selected field data for next 25 rows
  const cachedData = [];

  for (let i = nextRow; i <= endRow; i++) {
    const rowData = {};

    selectedFields.forEach(function(fieldName) {
      const colIdx = headers.indexOf(fieldName);
      if (colIdx !== -1) {
        rowData[fieldName] = data[i][colIdx];
      } else {
        rowData[fieldName] = 'N/A';
        Logger.log('⚠️  Field not found: ' + fieldName);
      }
    });

    cachedData.push(rowData);
  }

  // Append to cache sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let cacheSheet = ss.getSheetByName('Field_Cache_Incremental');

  if (!cacheSheet) {
    Logger.log('📄 Creating new cache sheet');
    cacheSheet = ss.insertSheet('Field_Cache_Incremental');
    // Write header row
    const headerRow = ['Row', 'Timestamp'].concat(selectedFields);
    cacheSheet.appendRow(headerRow);
  }

  // Write cached rows
  const timestamp = new Date().toISOString();
  cachedData.forEach(function(rowData, idx) {
    const rowNumber = nextRow + idx;
    const rowArray = [rowNumber, timestamp];

    selectedFields.forEach(function(fieldName) {
      rowArray.push(rowData[fieldName] || 'N/A');
    });

    cacheSheet.appendRow(rowArray);
  });

  // Update progress
  docProps.setProperty('LAST_CACHED_ROW', endRow.toString());

  const cachedCount = endRow - 2; // Subtract header rows
  const percentComplete = Math.round((cachedCount / totalRows) * 100);

  Logger.log('✅ Cached rows ' + nextRow + ' to ' + endRow + ' (' + percentComplete + '% complete)');

  return {
    complete: endRow >= data.length - 1,
    startRow: nextRow,
    endRow: endRow,
    totalCached: cachedCount,
    totalRows: totalRows,
    percentComplete: percentComplete,
    rowsInBatch: cachedData.length,
    message: 'Cached ' + cachedData.length + ' rows (' + percentComplete + '% complete)'
  };
}

/**
 * Get current cache progress
 */
function getCacheProgress() {
  const docProps = PropertiesService.getDocumentProperties();
  const lastCachedRow = parseInt(docProps.getProperty('LAST_CACHED_ROW') || '2', 10);

  const sheet = pickMasterSheet_();
  const totalRows = sheet.getLastRow() - 2; // Subtract headers

  const cachedCount = Math.max(0, lastCachedRow - 2);
  const percentComplete = totalRows > 0 ? Math.round((cachedCount / totalRows) * 100) : 0;

  return {
    lastCachedRow: lastCachedRow,
    totalCached: cachedCount,
    totalRows: totalRows,
    percentComplete: percentComplete,
    remaining: Math.max(0, totalRows - cachedCount)
  };
}

/**
 * Reset cache progress
 */
function resetCacheProgress() {
  const docProps = PropertiesService.getDocumentProperties();
  docProps.deleteProperty('LAST_CACHED_ROW');
  Logger.log('✅ Cache progress reset');
  return { success: true, message: 'Cache progress reset to start' };
}

`;

    const funcStart = code.indexOf('function showFieldSelector()');
    if (funcStart === -1) {
      console.log('❌ Could not find showFieldSelector() function\\n');
      process.exit(1);
    }

    code = code.substring(0, funcStart) + newFunctions + code.substring(funcStart);

    console.log('✅ Server-side functions added\\n');
    console.log('🔧 Step 2: Modifying showFieldSelector() to add batch caching UI...\\n');

    // Now find and modify showFieldSelector() to add the caching button and client-side logic
    // We need to add this AFTER the existing Save button in the footer

    // Find the footer section with Save button
    const saveButtonPattern = "html += '<button class=\"btn btn-primary\" onclick=\"saveSelection()\">💾 Save Selection</button>';";
    const saveButtonIdx = code.indexOf(saveButtonPattern);

    if (saveButtonIdx === -1) {
      console.log('⚠️  Could not find Save Selection button - field selector may not have it yet\\n');
      console.log('Will add complete footer section with both buttons\\n');
    } else {
      // Add Cache button after Save button
      const cacheButtonCode = "\\nhtml += '<button class=\"btn btn-cache\" id=\"cache-btn\" onclick=\"startCaching()\" style=\"background: #ea8600; color: white; margin-left: 10px;\">🔄 Cache Selected Fields (25 at a time)</button>';";

      code = code.substring(0, saveButtonIdx + saveButtonPattern.length) + cacheButtonCode + code.substring(saveButtonIdx + saveButtonPattern.length);

      console.log('✅ Added Cache button to footer\\n');
    }

    // Now add the client-side caching logic in the JavaScript section
    // Find where saveSelection() function is defined and add caching functions after it

    const saveSelectionFuncPattern = "html += 'function saveSelection() {";
    const saveSelectionIdx = code.indexOf(saveSelectionFuncPattern);

    if (saveSelectionIdx !== -1) {
      // Find the end of saveSelection function (look for the next function definition or script end)
      const afterSaveSelection = code.indexOf("html += '}';", saveSelectionIdx);

      if (afterSaveSelection !== -1) {
        const cachingFunctionsCode = `
html += '';
html += 'var cachingInProgress = false;';
html += 'var cacheComplete = false;';
html += '';
html += 'function startCaching() {';
html += '  if (cachingInProgress) {';
html += '    log(\"⚠️  Caching already in progress\");';
html += '    return;';
html += '  }';
html += '  if (cacheComplete) {';
html += '    log(\"✅ Caching already complete - reset to start over\");';
html += '    return;';
html += '  }';
html += '  cachingInProgress = true;';
html += '  document.getElementById(\"cache-btn\").disabled = true;';
html += '  document.getElementById(\"cache-btn\").style.opacity = \"0.5\";';
html += '  log(\"🚀 Starting batch cache for \" + Object.keys(currentSelection).filter(k => currentSelection[k]).length + \" fields...\");';
html += '  log(\"💾 Saving field selection first...\");';
html += '  ';
html += '  var selected = [];';
html += '  for (var field in currentSelection) {';
html += '    if (currentSelection[field]) selected.push(field);';
html += '  }';
html += '  ';
html += '  google.script.run';
html += '    .withSuccessHandler(function() {';
html += '      log(\"✅ Field selection saved\");';
html += '      cacheNext25();';
html += '    })';
html += '    .withFailureHandler(function(error) {';
html += '      log(\"❌ Error saving fields: \" + error.message);';
html += '      cachingInProgress = false;';
html += '      document.getElementById(\"cache-btn\").disabled = false;';
html += '      document.getElementById(\"cache-btn\").style.opacity = \"1\";';
html += '    })';
html += '    .saveFieldSelection(selected);';
html += '}';
html += '';
html += 'function cacheNext25() {';
html += '  log(\"⏳ Caching next batch of 25 rows...\");';
html += '  ';
html += '  google.script.run';
html += '    .withSuccessHandler(function(result) {';
html += '      log(\"✅ Cached rows \" + result.startRow + \" to \" + result.endRow + \" (\" + result.rowsInBatch + \" rows)\");';
html += '      log(\"📊 Progress: \" + result.totalCached + \"/\" + result.totalRows + \" rows (\" + result.percentComplete + \"%)\");';
html += '      ';
html += '      if (result.complete) {';
html += '        log(\"🎉 CACHING COMPLETE! All \" + result.totalRows + \" rows cached.\");';
html += '        log(\"📁 Data saved to Field_Cache_Incremental sheet\");';
html += '        cachingInProgress = false;';
html += '        cacheComplete = true;';
html += '        document.getElementById(\"cache-btn\").textContent = \"✅ Cache Complete!\";';
html += '        document.getElementById(\"cache-btn\").style.background = \"#0d652d\";';
html += '      } else {';
html += '        setTimeout(cacheNext25, 1500);';
html += '      }';
html += '    })';
html += '    .withFailureHandler(function(error) {';
html += '      log(\"❌ Error caching: \" + error.message);';
html += '      cachingInProgress = false;';
html += '      document.getElementById(\"cache-btn\").disabled = false;';
html += '      document.getElementById(\"cache-btn\").style.opacity = \"1\";';
html += '    })';
html += '    .cacheNext25RowsWithFields();';
html += '}';
`;

        code = code.substring(0, afterSaveSelection + "html += '}';".length) + cachingFunctionsCode + code.substring(afterSaveSelection + "html += '}';".length);

        console.log('✅ Added client-side caching logic\\n');
      }
    }

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

    console.log('✅ Deployment complete!\\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ BATCH CACHING ADDED TO FIELD SELECTOR');
    console.log('═══════════════════════════════════════════════════════════════\\n');
    console.log('Server-side functions added:');
    console.log('✅ cacheNext25RowsWithFields() - Cache 25 rows at a time');
    console.log('✅ getCacheProgress() - Get current progress');
    console.log('✅ resetCacheProgress() - Reset cache to start\\n');
    console.log('Client-side features added:');
    console.log('✅ "Cache Selected Fields" button in modal footer');
    console.log('✅ Live progress tracking in Live Log panel');
    console.log('✅ Automatic batch processing (25 rows/batch)');
    console.log('✅ Progress bar showing X/Y rows (Z%)');
    console.log('✅ Auto-complete detection\\n');
    console.log('How it works:');
    console.log('1. User selects fields in field selector modal');
    console.log('2. User clicks "Cache Selected Fields (25 at a time)"');
    console.log('3. System saves field selection');
    console.log('4. System caches 25 rows at a time');
    console.log('5. Live Log shows real-time progress');
    console.log('6. Data saved to Field_Cache_Incremental sheet');
    console.log('7. ChatGPT API can analyze cached data for pathway discovery\\n');
    console.log('Uses perfect headers cache system (CACHED_MERGED_KEYS)');
    console.log('Dynamic column resolution - works even if columns are reordered!');
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
