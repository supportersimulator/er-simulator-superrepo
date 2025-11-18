// ═══════════════════════════════════════════════════════════════
// MENU INITIALIZATION
// ═══════════════════════════════════════════════════════════════

function restore35Defaults() {
  var defaults = [
    'Case_Organization_Case_ID',
    'Case_Organization_Spark_Title',
    'Case_Organization_Reveal_Title',
    'Case_Organization_Pathway_or_Course_Name',
    'Case_Organization_Difficulty_Level',
    'Case_Organization_Medical_Category',
    'Patient_Demographics_and_Clinical_Data_Age',
    'Patient_Demographics_and_Clinical_Data_Gender',
    'Patient_Demographics_and_Clinical_Data_Presenting_Complaint',
    'Patient_Demographics_and_Clinical_Data_Past_Medical_History',
    'Patient_Demographics_and_Clinical_Data_Exam_Positive_Findings',
    'Monitor_Vital_Signs_Initial_Vitals',
    'Scenario_Progression_States_Decision_Nodes_JSON',
    'Set_the_Stage_Context_Case_Summary_Concise',
    'CME_and_Educational_Content_CME_Learning_Objective',
    'Set_the_Stage_Context_Educational_Goal',
    'Set_the_Stage_Context_Why_It_Matters',
    'Developer_and_QA_Metadata_Simulation_Quality_Score',
    'Case_Organization_Original_Title',
    'Set_the_Stage_Context_Environment_Type',
    'Set_the_Stage_Context_Environment_Description_for_AI_Image',
    'Situation_and_Environment_Details_Triage_or_SBAR_Note',
    'Situation_and_Environment_Details_Disposition_Plan',
    'Scenario_Progression_States_Branching_Notes',
    'Staff_and_AI_Interaction_Config_Patient_Script',
    'Monitor_Vital_Signs_State1_Vitals',
    'Monitor_Vital_Signs_State2_Vitals',
    'Monitor_Vital_Signs_State3_Vitals',
    'Monitor_Vital_Signs_State4_Vitals',
    'Monitor_Vital_Signs_State5_Vitals',
    'Monitor_Vital_Signs_Vitals_Format',
    'Developer_and_QA_Metadata_AI_Reflection_and_Suggestions',
    'Version_and_Attribution_Full_Attribution_Details',
    'Case_Organization_Pre_Sim_Overview',
    'Case_Organization_Post_Sim_Overview'
  ];
  
  PropertiesService.getDocumentProperties().setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(defaults));
  Logger.log('✅ Restored 35 defaults');
  Browser.msgBox('Success!', '✅ Restored 35 default fields to SELECTED_CACHE_FIELDS property', Browser.Buttons.OK);
}

/**
 * Show currently saved field selection
 */
function showSavedFieldSelection() {
  const ui = getSafeUi_();
  if (!ui) return;

  const docProps = PropertiesService.getDocumentProperties();
  const saved = docProps.getProperty('SELECTED_CACHE_FIELDS');

  if (!saved) {
    ui.alert('No Saved Fields', 'No saved field selection found.\n\nYou can save fields by opening Categories & Pathways and selecting which fields to cache.', ui.ButtonSet.OK);
    return;
  }

  try {
    const fields = JSON.parse(saved);
    const message = 'Found ' + fields.length + ' saved fields:\n\n' + fields.join('\n');
    ui.alert('Saved Field Selection', message, ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('Error', 'Error parsing saved fields: ' + e.message, ui.ButtonSet.OK);
  }
}



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

/**
 * Cache next 25 rows with selected fields using perfect headers cache
 */
function cacheNext25RowsWithFields() {
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
}

function resetCacheProgress() {
  PropertiesService.getDocumentProperties().deleteProperty('LAST_CACHED_ROW');
  return { success: true };
}

function showFieldSelector() {
  Logger.log('🎯 Field Selector with AI Recommendations');

  try {
    var roughDraft = getFieldSelectorRoughDraft();
    var allFields = roughDraft.allFields;
    var selected = roughDraft.selected;

    Logger.log('✅ Got ' + allFields.length + ' fields, ' + selected.length + ' selected');

    var allFieldsJson = JSON.stringify(allFields);
    var selectedJson = JSON.stringify(selected);

    var html = '<!DOCTYPE html><html><head><title>Field Selector</title>';

    html += '<style>';
    html += 'body { font-family: Arial, sans-serif; margin: 0; padding: 0; display: flex; flex-direction: column; height: 100vh; }';
    html += '.live-log-header { background: #1a1a1a; color: #0f0; padding: 5px 10px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }';
    html += '.live-log { background: #000; color: #0f0; font-family: monospace; font-size: 12px; padding: 10px; height: 100px; overflow-y: auto; border-bottom: 3px solid #0f0; }';
    html += '.copy-btn { background: #0f0; color: #000; border: none; padding: 4px 12px; border-radius: 3px; cursor: pointer; font-weight: bold; font-size: 11px; }';
    html += '.copy-btn:hover { background: #0c0; }';
    html += '.main-content { flex: 1; overflow-y: auto; padding: 20px; }';
    html += 'h1 { color: #1a73e8; margin: 0 0 20px 0; }';
    html += '.section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }';
    html += '.section-header { font-size: 16px; font-weight: bold; padding: 8px; margin-bottom: 10px; border-radius: 3px; display: flex; justify-content: space-between; align-items: center; }';
    html += '.section-header.default { background: #0d652d; color: white; }';
    html += '.section-header.recommended { background: #ea8600; color: white; }';
    html += '.section-header.other { background: #5f6368; color: white; }';
    html += '.field-list { max-height: 200px; overflow-y: auto; }';
    html += '.field-item { padding: 8px; margin: 4px 0; background: #f8f9fa; border-radius: 3px; cursor: pointer; }';
    html += '.field-item:hover { background: #e8f0fe; }';
    html += '.field-item input { margin-right: 10px; cursor: pointer; }';
    html += '.field-item label { cursor: pointer; }';
    html += '.field-item.recommended { background: #fff3e0; border-left: 3px solid #ea8600; }';
    html += '.field-item.ai-approved { background: #e8f5e9; border-left: 3px solid #4caf50; }';
    html += '.ai-badge { display: inline-block; background: #4caf50; color: white; font-size: 10px; padding: 2px 6px; border-radius: 3px; margin-left: 8px; font-weight: bold; }';
    html += '.rationale { font-size: 11px; color: #666; margin-left: 30px; font-style: italic; }';
    html += '.footer { padding: 15px; background: #f8f9fa; border-top: 2px solid #ddd; }';
    html += '.btn { padding: 10px 20px; margin-right: 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold; }';
    html += '.btn-primary { background: #1a73e8; color: white; }';
    html += '.btn-primary:hover { background: #1557b0; }';
    html += '.btn-secondary { background: #5f6368; color: white; }';
    html += '.btn-secondary:hover { background: #3c4043; }';
    html += '.btn-ai { background: #ea8600; color: white; padding: 4px 10px; font-size: 12px; }';
    html += '.btn-ai:hover { background: #c77100; }';
    html += '.btn-ai:disabled { background: #ccc; cursor: not-allowed; }';
    html += '.loading { color: #666; font-style: italic; }';
    html += '</style>';

    html += '<script>';
    html += 'var ALL_FIELDS = ' + allFieldsJson + ';';
    html += 'var SELECTED_FIELDS = ' + selectedJson + ';';
    html += 'var currentSelection = {};';
    html += 'var recommendedFields = [];';
    html += '';
    html += 'function log(msg) {';
    html += '  var logDiv = document.getElementById("live-log");';
    html += '  var timestamp = new Date().toLocaleTimeString();';
    html += '  logDiv.innerHTML += "[" + timestamp + "] " + msg + "<br>";';
    html += '  logDiv.scrollTop = logDiv.scrollHeight;';
    html += '}';
    html += '';
    html += 'function copyLog() {';
    html += '  var logDiv = document.getElementById("live-log");';
    html += '  var text = logDiv.innerText;';
    html += '  navigator.clipboard.writeText(text).then(function() {';
    html += '    log("📋 Log copied to clipboard!");';
    html += '  });';
    html += '}';
    html += '';
    html += 'function initSelection() {';
    html += '  for (var i = 0; i < SELECTED_FIELDS.length; i++) {';
    html += '    currentSelection[SELECTED_FIELDS[i]] = true;';
    html += '  }';
    html += '  log("✅ Loaded " + SELECTED_FIELDS.length + " default fields");';
    html += '}';
    html += '';
    html += 'function handleCheckboxChange(event) {';
    html += '  var fieldName = event.target.getAttribute("data-field");';
    html += '  currentSelection[fieldName] = event.target.checked;';
    html += '  updateCounts();';
    html += '}';
    html += '';
    html += 'function updateCounts() {';
    html += '  var count = 0;';
    html += '  for (var field in currentSelection) {';
    html += '    if (currentSelection[field]) count++;';
    html += '  }';
    html += '  document.getElementById("selected-count").textContent = count;';
    html += '}';
    html += '';
    html += 'function getAIRecommendations() {';
    html += '  log("🤖 Requesting AI field recommendations...");';
    html += '  var btn = document.getElementById("ai-btn");';
    html += '  btn.disabled = true;';
    html += '  btn.textContent = "⏳ Loading...";';
    html += '  var section = document.getElementById("recommended-section");';
    html += '  section.innerHTML = "<div class=\\"loading\\">🤖 AI is analyzing your field selection...</div>";';
    html += '';
    html += '  google.script.run';
    html += '    .withSuccessHandler(function(result) {';
    html += '      log("✅ Received " + result.length + " AI recommendations");';
    html += '      recommendedFields = result;';
    html += '      renderRecommendedSection();';
    html += '      btn.textContent = "🔄 Refresh AI";';
    html += '      btn.disabled = false;';
    html += '    })';
    html += '    .withFailureHandler(function(error) {';
    html += '      log("❌ AI request failed: " + error.message);';
    html += '      section.innerHTML = "<div class=\\"loading\\">❌ Error: " + error.message + "</div>";';
    html += '      btn.disabled = false;';
    html += '      btn.textContent = "🤖 Try Again";';
    html += '    })';
    html += '    .getRecommendedFields(ALL_FIELDS, SELECTED_FIELDS);';
    html += '}';
    html += '';
    html += 'function renderRecommendedSection() {';
    html += '  var section = document.getElementById("recommended-section");';
    html += '  if (recommendedFields.length === 0) {';
    html += '    section.innerHTML = "<em>No additional recommendations at this time.</em>";';
    html += '    return;';
    html += '  }';
    html += '';
    html += '  var aiApproved = [];';
    html += '  var newRecommendations = [];';
    html += '';
    html += '  for (var i = 0; i < recommendedFields.length; i++) {';
    html += '    var rec = recommendedFields[i];';
    html += '    var fieldName = rec.field || rec.name || rec;';
    html += '    if (SELECTED_FIELDS.indexOf(fieldName) > -1) {';
    html += '      aiApproved.push({ field: fieldName, rationale: rec.rationale });';
    html += '    } else {';
    html += '      newRecommendations.push(rec);';
    html += '    }';
    html += '  }';
    html += '';
    html += '  log("✨ " + aiApproved.length + " defaults confirmed by AI, " + newRecommendations.length + " new suggestions");';
    html += '';
    html += '  if (aiApproved.length > 0) {';
    html += '    var defaultSection = document.querySelector(".section-header.default");';
    html += '    defaultSection.innerHTML = "✅ DEFAULT (" + SELECTED_FIELDS.length + ") <span class=\\"ai-badge\\">✨ " + aiApproved.length + " AI APPROVED</span>";';
    html += '';
    html += '    for (var i = 0; i < aiApproved.length; i++) {';
    html += '      var fieldName = aiApproved[i].field;';
    html += '      var items = document.querySelectorAll("[data-field=\\"" + fieldName + "\\"]");';
    html += '      for (var j = 0; j < items.length; j++) {';
    html += '        var item = items[j].parentElement;';
    html += '        if (item.classList.contains("field-item")) {';
    html += '          item.classList.add("ai-approved");';
    html += '          var label = item.querySelector("label");';
    html += '          if (!label.querySelector(".ai-badge")) {';
    html += '            label.innerHTML += " <span class=\\"ai-badge\\">✨ AI</span>";';
    html += '          }';
    html += '        }';
    html += '      }';
    html += '    }';
    html += '  }';
    html += '';
    html += '  var html = "";';
    html += '  if (newRecommendations.length === 0) {';
    html += '    html = "<em>No new field recommendations. AI confirms your current selection!</em>";';
    html += '  } else {';
    html += '    for (var i = 0; i < newRecommendations.length; i++) {';
    html += '      var rec = newRecommendations[i];';
    html += '      var fieldName = rec.field || rec.name || rec;';
    html += '      var rationale = rec.rationale || "";';
    html += '      html += "<div class=\\"field-item recommended\\">";';
    html += '      html += "<input type=\\"checkbox\\" data-field=\\"" + fieldName + "\\" class=\\"field-checkbox ai-checkbox\\">";';
    html += '      html += "<label>" + fieldName + "</label>";';
    html += '      if (rationale) {';
    html += '        html += "<div class=\\"rationale\\">💡 " + rationale + "</div>";';
    html += '      }';
    html += '      html += "</div>";';
    html += '    }';
    html += '  }';
    html += '';
    html += '  section.innerHTML = html;';
    html += '  document.querySelector(".section-header.recommended span").textContent = "🎯 RECOMMENDED (" + newRecommendations.length + ")";';
    html += '';
    html += '  var checkboxes = section.querySelectorAll(".ai-checkbox");';
    html += '  for (var i = 0; i < checkboxes.length; i++) {';
    html += '    checkboxes[i].addEventListener("change", handleCheckboxChange);';
    html += '  }';
    html += '}';
    html += '';
    html += 'function saveSelection() {';
    html += '  var selected = [];';
    html += '  for (var field in currentSelection) {';
    html += '    if (currentSelection[field]) selected.push(field);';
    html += '  }';
    html += '  log("💾 Saving " + selected.length + " fields to properties...");';
    html += '  google.script.run';
    html += '    .withSuccessHandler(function() {';
    html += '      log("✅ Selection saved successfully!");';
    html += '      log("🚀 Ready to cache data for these fields");';
    html += '      setTimeout(function() { google.script.host.close(); }, 1500);';
    html += '    })';
    html += '    .withFailureHandler(function(error) {';
    html += '      log("❌ Error saving: " + error.message);';
    html += '    })';
    html += '    .saveFieldSelection(selected);';
    html += '}';
    html += '';
    html += 'var cachingInProgress = false;';
    html += '';
    html += 'function startCaching() {';
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
    html += 'function saveFieldsAndCache() {';
    html += '  var selected = [];';
    html += '  for (var field in currentSelection) {';
    html += '    if (currentSelection[field]) selected.push(field);';
    html += '  }';
    html += '  google.script.run';
    html += '    .withSuccessHandler(function() {';
    html += '      log("Fields saved");';
    html += '      cacheNext25();';
    html += '    })';
    html += '    .withFailureHandler(function(e) {';
    html += '      log("Error: " + e.message);';
    html += '      cachingInProgress = false;';
    html += '      document.getElementById("cache-btn").disabled = false;';
    html += '    })';
    html += '    .saveFieldSelection(selected);';
    html += '}';
    html += '';
    html += 'function cacheNext25() {';
    html += '  log("Caching next 25 rows");';
    html += '  google.script.run';
    html += '    .withSuccessHandler(function(r) {';
    html += '      log("Batch complete: rows " + r.startRow + "-" + r.endRow);';
    html += '      log("Cached " + r.totalCached + " / " + r.totalRows + " rows (" + r.percentComplete + "%)");';
    html += '      log("Complete flag: " + r.complete);';
    html += '      if (r.complete) {';
    html += '        log("ALL ROWS CACHED!");';
    html += '        cachingInProgress = false;';
    html += '        document.getElementById("cache-btn").textContent = "Done!";';
    html += '        document.getElementById("cache-btn").style.background = "#0d652d";';
    html += '      } else {';
    html += '        setTimeout(cacheNext25, 1500);';
    html += '      }';
    html += '    })';
    html += '    .withFailureHandler(function(e) {';
    html += '      log("Error: " + e.message);';
    html += '      cachingInProgress = false;';
    html += '      document.getElementById("cache-btn").disabled = false;';
    html += '    })';
    html += '    .cacheNext25RowsWithFields();';
    html += '}';
    html += '';
    html += 'window.addEventListener("DOMContentLoaded", function() {';
    html += '  log("🎯 Field Selector initialized");';
    html += '  initSelection();';
    html += '';
    html += '  var otherFields = ALL_FIELDS.filter(function(f) {';
    html += '    return SELECTED_FIELDS.indexOf(f) === -1 && recommendedFields.indexOf(f) === -1;';
    html += '  });';
    html += '';
    html += '  var sectionsDiv = document.getElementById("sections");';
    html += '  var html = "";';
    html += '';
    html += '  html += "<div class=\\"section\\">";';
    html += '  html += "<div class=\\"section-header default\\">✅ DEFAULT (" + SELECTED_FIELDS.length + ")</div>";';
    html += '  html += "<div class=\\"field-list\\">";';
    html += '  for (var i = 0; i < SELECTED_FIELDS.length; i++) {';
    html += '    var fieldName = SELECTED_FIELDS[i];';
    html += '    html += "<div class=\\"field-item\\">";';
    html += '    html += "<input type=\\"checkbox\\" checked data-field=\\"" + fieldName + "\\" class=\\"field-checkbox\\">";';
    html += '    html += "<label>" + fieldName + "</label>";';
    html += '    html += "</div>";';
    html += '  }';
    html += '  html += "</div></div>";';
    html += '';
    html += '  html += "<div class=\\"section\\">";';
    html += '  html += "<div class=\\"section-header recommended\\">";';
    html += '  html += "<span>🎯 RECOMMENDED (0)</span>";';
    html += '  html += "<button class=\\"btn-ai\\" id=\\"ai-btn\\" onclick=\\"getAIRecommendations()\\">🤖 Get AI Recommendations</button>";';
    html += '  html += "</div>";';
    html += '  html += "<div class=\\"field-list\\" id=\\"recommended-section\\">";';
    html += '  html += "<em>Click button above to get AI-powered field recommendations</em>";';
    html += '  html += "</div></div>";';
    html += '';
    html += '  html += "<div class=\\"section\\">";';
    html += '  html += "<div class=\\"section-header other\\">📋 OTHER (" + otherFields.length + ")</div>";';
    html += '  html += "<div class=\\"field-list\\">";';
    html += '  for (var i = 0; i < Math.min(otherFields.length, 30); i++) {';
    html += '    var fieldName = otherFields[i];';
    html += '    html += "<div class=\\"field-item\\">";';
    html += '    html += "<input type=\\"checkbox\\" data-field=\\"" + fieldName + "\\" class=\\"field-checkbox\\">";';
    html += '    html += "<label>" + fieldName + "</label>";';
    html += '    html += "</div>";';
    html += '  }';
    html += '  if (otherFields.length > 30) {';
    html += '    html += "<div style=\\"padding: 8px; font-style: italic;\\">... and " + (otherFields.length - 30) + " more</div>";';
    html += '  }';
    html += '  html += "</div></div>";';
    html += '';
    html += '  sectionsDiv.innerHTML = html;';
    html += '';
    html += '  var checkboxes = document.querySelectorAll(".field-checkbox");';
    html += '  for (var i = 0; i < checkboxes.length; i++) {';
    html += '    checkboxes[i].addEventListener("change", handleCheckboxChange);';
    html += '  }';
    html += '';
    html += '  updateCounts();';
    html += '  log("📊 Displaying " + ALL_FIELDS.length + " total fields");';
    html += '});';
    html += '</script>';

    html += '</head><body>';
    html += '<div class="live-log-header">';
    html += '<span>📡 LIVE LOG</span>';
    html += '<button class="copy-btn" onclick="copyLog()">📋 COPY</button>';
    html += '</div>';
    html += '<div class="live-log" id="live-log"></div>';
    html += '<div class="main-content">';
    html += '<h1>🎯 Select Fields to Cache</h1>';
    html += '<div id="sections"></div>';
    html += '</div>';
    html += '<div class="footer">';
    html += '<div style="margin-bottom: 10px;">Selected: <strong><span id="selected-count">0</span></strong> fields</div>';
    html += '<button class="btn btn-primary" onclick="saveSelection()">💾 Save Selection</button>';
    html += '<button class="btn btn-primary" id="cache-btn" onclick="startCaching()" style="background: #ea8600; margin-left: 10px;">🔄 Cache Selected Fields</button>';
    html += '<button class="btn btn-secondary" onclick="google.script.host.close()">Cancel</button>';
    html += '</div>';
    html += '</body></html>';

    var htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(800)
      .setHeight(700);

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🎯 Select Fields to Cache');
    Logger.log('✅ Field selector with AI displayed');

  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
    SpreadsheetApp.getUi().alert('Error', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function saveFieldSelection(selectedFields) {
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
}



function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('🧠 Sim Builder');

  // Core Tools
  menu.addItem('🎨 ATSR Titles Optimizer', 'runATSRTitleGenerator');
  menu.addItem('🧩 Categories & Pathways', 'runPathwayChainBuilder');
  menu.addSeparator();
  menu.addItem('🚀 Batch Processing', 'openSimSidebar');
  menu.addSeparator();

  // Cache Management Submenu
  menu.addSubMenu(ui.createMenu('🗄️ Cache Management')
    .addItem('📦 Cache All Layers', 'showCacheAllLayersModal')
    .addSeparator()
    .addItem('📊 Cache Layer 1: BASIC', 'cacheLayer_basic')
    .addItem('📚 Cache Layer 2: LEARNING', 'cacheLayer_learning')
    .addItem('🏷️ Cache Layer 3: METADATA', 'cacheLayer_metadata')
    .addItem('👤 Cache Layer 4: DEMOGRAPHICS', 'cacheLayer_demographics')
    .addItem('💓 Cache Layer 5: VITALS', 'cacheLayer_vitals')
    .addItem('🩺 Cache Layer 6: CLINICAL', 'cacheLayer_clinical')
    .addItem('🌍 Cache Layer 7: ENVIRONMENT', 'cacheLayer_environment')
    .addSeparator()
    .addItem('📊 View Cache Status', 'showCacheStatus')
    .addItem('🔄 Refresh Headers', 'refreshHeaders')
    .addItem('🧹 Clear All Cache Layers', 'clearAllCacheLayers')
    .addSeparator()
    .addItem('👁️ View Saved Field Selection', 'showSavedFieldSelection')
  );

  menu.addToUi();
}


/**
 * MONOLITHIC TEST ENVIRONMENT
 *
 * Combined from:
 * - Production GPT Formatter (all core batch processing)
 * - Title Optimizer (ATSR features)
 * - Categories/Pathways Phase 2 (27 default headers, Field Selector)
 * - Advanced Cache System (Pathway Chain Builder, 7-layer cache)
 *
 * Generated: 2025-11-06T20:28:08.322Z
 *
 * De-duplicated: Removed duplicate function and const declarations
 * This is a COMPLETE test environment with ALL features working together.
 */

// ==================== PRODUCTION BASELINE ====================
// All core batch processing, quality scoring, and utilities



/**
 * Safe UI helper - only calls getUi() if in UI context
 * Added for web app compatibility
 */
function getSafeUi_() {
  try {
    return SpreadsheetApp.getUi();
  } catch (e) {
    return null;
  }
}


/******************************************************
 * ER_Simulator_Builder.gs — FULL UNIFIED MASTER FILE
 * v3.7 (Dark UI)
 * 
 * Includes:
 *  • Batch Engine (Run All / 25 Rows / Specific Rows) with live log
 *  • Single Case Generator (2-tier aware)
 *  • ATSR Title Generator (Keep & Regenerate, deselect, memory tracker)
 *  • Case Summary Enhancer (auto-bold Dx/Intervention/Takeaway)
 *  • Image Sync Defaults Manager (refresh + editable)
 *  • Settings (API key from Script Properties or Settings sheet, model/prices, header cache)
 *  • Check API Status
 *  • Batch Reports (popup + writes to Batch_Reports sheet)
 *  • Duplicate check (content hash signature)
 *  • Inputs per row: Column A=Formal_Info, B=HTML, C=DOC, D=Extra (any may be blank)
 * 
 * Safe to paste as a full replacement.
 ******************************************************/

// ========== 1) ICONS, KEYS, DEFAULTS ==========

const ICONS = {
  rocket: '🚀', bolt: '⚡', wand: '✨', frame: '🖼', puzzle: '🧩',
  gear: '⚙️', brain: '🧠', clipboard: '📋', stop: '⏹️', shield: '🛡️'
};

const SP_KEYS = {
  USED_MEMORY_ANCHORS: 'used_memory_anchors',
  API_KEY: 'OPENAI_API_KEY',
  MODEL: 'OPENAI_MODEL',
  PRICE_INPUT: 'PRICE_INPUT_PER_1K',
  PRICE_OUTPUT: 'PRICE_OUTPUT_PER_1K',
  USED_MOTIFS: 'USED_CHARACTER_MOTIFS',
  HEADER_CACHE: 'HEADER_CACHE_JSON',
  IMG_SYNC_DEFAULTS: 'IMG_SYNC_DEFAULTS_JSON',
  LAST_INPUT_SHEET: 'LAST_INPUT_SHEET',
  LAST_OUTPUT_SHEET: 'LAST_OUTPUT_SHEET'
};

const DEFAULT_MODEL = 'gpt-4o';
const DEFAULT_PRICE = { input: 0.15, output: 0.60 }; // USD / 1k tokens
const DEFAULT_TEMP_SINGLE = 0.7;
const DEFAULT_TEMP_BATCH  = 0.5; // more schema-sticky
const MAX_TOKENS = 16000; // Premium: Allow comprehensive, detailed scenarios

// Two-tier vitals fields to compactify if needed
const VITAL_KEYS = [
  'Monitor_Vital_Signs:Initial_Vitals',
  'Monitor_Vital_Signs:State1_Vitals',
  'Monitor_Vital_Signs:State2_Vitals',
  'Monitor_Vital_Signs:State3_Vitals',
  'Monitor_Vital_Signs:State4_Vitals',
  'Monitor_Vital_Signs:State5_Vitals'
];


// ========== 2) CORE UTILS ==========

/******************************************************
 * QUALITY ENGINE — scoring, suggestions, audit & cleanup
 * - Auto-ensures columns:
 *   Developer_and_QA_Metadata:Simulation_Quality_Score
 *   Developer_and_QA_Metadata:Simulation_Enhancement_Suggestions
 * - Scores each row using weighted rubric
 * - Generates targeted improvement suggestions
 * - Audit tools for existing rows
 * - Cleanup tool for low-value rows (highlight or delete)
 ******************************************************/

// -- Settings (tweak without changing call sites) --
const QUALITY = {
  // If a row's filled ratio is below this, it’s considered low value
  LOW_VALUE_THRESHOLD: 0.30, // 30%

  // If score below this during audit, row gets highlighted (soft warning)
  HIGHLIGHT_SCORE_LT: 60,

  // Weights for rubric (sum does not need to be 100, we normalize)
  WEIGHTS: {
    coreIdentity: 10,     // Case_ID, Spark_Title, Reveal_Title
    patientBasics: 10,    // Age, Sex, Setting, HPI summary
    vitals: 20,           // Initial + state vitals
    branching: 18,        // Progression states, decision rules
    education: 15,        // Objectives + MCQ
    ordersData: 12,       // Labs/Imaging/ECG presence
    environmentAV: 8,     // Scene/time/ambience/media prompts (URLs can be N/A)
    metaCompleteness: 7   // Reflection + misc developer metadata
  },

  // Targeted suggestions (key regex → human message)
  SUGGESTIONS: [
    { re: /Case_Organization:Reveal_Title/i, msg: 'Add a clear Reveal Title with Dx (Age Sex) and a concise learning focus.' },
    { re: /Case_Organization:Spark_Title/i,  msg: 'Add a Spark Title: “<Symptom> (<Age Sex>): <Spark phrase>”.' },
    { re: /Monitor_Vital_Signs:Initial_Vitals/i, msg: 'Provide Initial Vitals in compact JSON: {"HR":..,"BP":"..","RR":..,"Temp":..,"SpO2":..}.' },
    { re: /Progression_States|Decision_Nodes_JSON/i, msg: 'Add explicit state flow and at least 3 decision rules (branch conditions).' },
    { re: /CME_and_Educational_Content:Learning_Objective/i, msg: 'Write 1–3 focused learning objectives.' },
    { re: /CME_and_Educational_Content:Quiz_Q1/i, msg: 'Include 1 MCQ with 4 options and mark the correct one.' },
    { re: /Labs|Imaging|ECG|Ultrasound/i, msg: 'Add at least one key data artifact (Labs/Imaging/ECG/US) with brief interpretation.' },
    { re: /Scene|Ambient|Time_of_Day|Audio/i, msg: 'Enrich the scene: time, lighting, ambient audio to deepen immersion.' },
    { re: /Developer_and_QA_Metadata:AI_Reflection_and_Suggestions/i, msg: 'Add a 3-part internal reflection (experience, sim improvements, system ideas).' }
  ],

  // Image_Sync columns can be N/A, but penalize if *all* are N/A
  PENALIZE_ALL_IMAGE_SYNC_EMPTY: true
};

// Ensure the two quality columns exist; if missing, append them.
function ensureQualityColumns_(sheet, header1, header2) {
  const mk = (t1, t2) => `${t1}:${t2}`;
  const qTier = 'Developer_and_QA_Metadata';
  const scoreKey = mk(qTier, 'Simulation_Quality_Score');
  const suggKey  = mk(qTier, 'Simulation_Enhancement_Suggestions');

  const mergedNow = header1.map((t1,i)=>mk(t1, header2[i]));
  const hasScore = mergedNow.includes(scoreKey);
  const hasSugg  = mergedNow.includes(suggKey);

  if (hasScore && hasSugg) return { scoreKey, suggKey };

  // Append missing columns at the end with Tier1/Tier2
  const lastCol = sheet.getLastColumn();
  let toAppend = [];
  if (!hasScore) toAppend.push({ t1:qTier, t2:'Simulation_Quality_Score' });
  if (!hasSugg)  toAppend.push({ t1:qTier, t2:'Simulation_Enhancement_Suggestions' });

  if (toAppend.length) {
    sheet.insertColumnsAfter(lastCol, toAppend.length);
    // Row 1 = Tier1, Row 2 = Tier2
    toAppend.forEach((c, k) => {
      sheet.getRange(1, lastCol + k + 1).setValue(c.t1);
      sheet.getRange(2, lastCol + k + 1).setValue(c.t2);
    });
  }

  // Re-read headers to return accurate keys
  const h1 = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const h2 = sheet.getRange(2,1,1,sheet.getLastColumn()).getValues()[0];
  const merged = h1.map((t1,i)=>mk(t1, h2[i]));
  return {
    scoreKey: mk(qTier, 'Simulation_Quality_Score'),
    suggKey:  mk(qTier, 'Simulation_Enhancement_Suggestions'),
    header1: h1,
    header2: h2,
    mergedKeys: merged
  };
}

// Return {score, suggestions[]} using a weighted rubric
function evaluateSimulationQuality(rowValues, mergedKeys) {
  const v = (key) => {
    const idx = mergedKeys.indexOf(key);
    if (idx < 0) return '';
    return String(rowValues[idx] || '').trim();
  };
  const has = (re) => mergedKeys.some((k, i) => re.test(k) && String(rowValues[i]||'').trim() && String(rowValues[i]).trim()!=='N/A');

  // 1) Filled ratio
  const filled = rowValues.filter(x => String(x||'').trim() && String(x).trim()!=='N/A').length;
  const filledRatio = filled / Math.max(1, rowValues.length);

  // 2) Critical presence
  const coreIdentityOk   = has(/Case_Organization:Case_ID/i) && has(/Case_Organization:Spark_Title/i) && has(/Case_Organization:Reveal_Title/i);
  const patientBasicsOk  = has(/Patient_(Age|Sex)|Case_Organization:Spark_Title|Setting/i);
  const vitalsOk         = has(/Monitor_Vital_Signs:Initial_Vitals/i);
  const branchingOk      = has(/Progression_States|Decision_Nodes_JSON/i);
  const educationOk      = has(/CME_and_Educational_Content:(Learning_Objective|Quiz_Q1)/i);
  const ordersDataOk     = has(/Labs|Imaging|ECG|Ultrasound|CT|X[- ]?Ray/i);
  const environmentOk    = has(/Scene|Time_of_Day|Ambient|Audio|Image_Prompt/i);
  const metaOk           = has(/Developer_and_QA_Metadata:AI_Reflection_and_Suggestions/i);

  // 3) Image_Sync penalty if all empty
  let imgSyncPenalty = 0;
  if (QUALITY.PENALIZE_ALL_IMAGE_SYNC_EMPTY) {
    const imgKeys = mergedKeys.filter(k=>/^Image_Sync:/i.test(k));
    const anyFilled = imgKeys.some(k=>{
      const val = rowValues[mergedKeys.indexOf(k)];
      return String(val||'').trim() && String(val).trim()!=='N/A';
    });
    if (!anyFilled && imgKeys.length) imgSyncPenalty = 0.05; // subtract 5%
  }

  // 4) Weighted score
  const w = QUALITY.WEIGHTS;
  const sumW = Object.values(w).reduce((a,b)=>a+b,0);
  let score =
    (coreIdentityOk   ? w.coreIdentity   : 0) +
    (patientBasicsOk  ? w.patientBasics  : 0) +
    (vitalsOk         ? w.vitals         : 0) +
    (branchingOk      ? w.branching      : 0) +
    (educationOk      ? w.education      : 0) +
    (ordersDataOk     ? w.ordersData     : 0) +
    (environmentOk    ? w.environmentAV  : 0) +
    (metaOk           ? w.metaCompleteness:0);

  // Blend in filled ratio (up to +10% bonus scaled by completeness)
  const blendBonus = Math.round(10 * filledRatio);
  score = ((score / sumW) * 100);
  score = Math.min(100, Math.max(0, score + blendBonus - (imgSyncPenalty*100)));

  // 5) Suggestions
  const missingMsgs = [];
  QUALITY.SUGGESTIONS.forEach(sugg => {
    const satisfied = mergedKeys.some((k,i)=>sugg.re.test(k) && String(rowValues[i]||'').trim() && String(rowValues[i]).trim()!=='N/A');
    if (!satisfied) missingMsgs.push(sugg.msg);
  });

  // Vitals sanity (compact JSON)
  const ivKey = mergedKeys.find(k=>/Monitor_Vital_Signs:Initial_Vitals/i.test(k));
  if (ivKey) {
    const raw = v(ivKey);
    if (raw && raw !== 'N/A') {
      try {
        const obj = JSON.parse(raw);
        if (!('HR' in obj) || !('BP' in obj)) {
          missingMsgs.push('Initial Vitals should include HR and BP at minimum.');
        }
      } catch(_) {
        missingMsgs.push('Initial Vitals must be compact JSON (one line).');
      }
    } else {
      missingMsgs.push('Provide Initial Vitals in compact JSON.');
    }
  }

  // Keep suggestions tight
  const suggestionsText = missingMsgs.length ? [...new Set(missingMsgs)].slice(0, 10).join('; ') : 'Excellent completeness.';
  return { score: Math.round(score), suggestionsText };
}

// Write quality fields into rowValues array in-place. If columns missing, they’re created.
function attachQualityToRow_(sheet, rowValues, header1, header2, mergedKeys) {
  const ensured = ensureQualityColumns_(sheet, header1, header2);
  const mk = (t1,t2)=>`${t1}:${t2}`;

  // If ensureQualityColumns_ re-read headers, prefer them
  const mkNow = ensured.mergedKeys || mergedKeys;
  const scoreKey = ensured.scoreKey;
  const suggKey  = ensured.suggKey;

  const quality = evaluateSimulationQuality(rowValues, mkNow);

  const scoreIdx = mkNow.indexOf(scoreKey);
  const suggIdx  = mkNow.indexOf(suggKey);

  // If columns were appended (after we built rowValues), extend rowValues to those columns
  while (rowValues.length < mkNow.length) rowValues.push(''); // pad

  if (scoreIdx >= 0) rowValues[scoreIdx] = quality.score;
  if (suggIdx  >= 0) rowValues[suggIdx]  = quality.suggestionsText;

  return quality; // return in case caller wants to log or use it
}

// ===== Public tools =====

// Re-score all existing rows (or specific list). Adds/updates columns as needed.
function runQualityAudit_AllOrRows() {
  const ss = SpreadsheetApp.getActive();
  const sheet = pickMasterSheet_();
  if (!sheet) { getSafeUi_().alert('❌ Could not find your Master Scenario CSV sheet.'); return; }

  const ui = getSafeUi_();
  const resp = ui.prompt(
    'Quality Audit',
    'Leave blank to audit ALL rows, or enter rows like "4,7,9-12".',
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return;

  const spec = resp.getResponseText().trim();
  const rows = spec ? parseRowSpec_(spec) : null;

  const { header1, header2 } = getCachedHeadersOrRead(sheet);
  const mergedKeys = header1.map((t1,i)=>`${t1}:${header2[i]}`);
  const ensured = ensureQualityColumns_(sheet, header1, header2);
  const mkNow = ensured.mergedKeys || mergedKeys;

  const last = sheet.getLastRow();
  const startRow = 3; // data starts at row 3
  let updated = 0;

  for (let r = startRow; r <= last; r++) {
    if (rows && !rows.includes(r)) continue;

    const rowVals = sheet.getRange(r, 1, 1, sheet.getLastColumn()).getValues()[0];
    // Skip empty lines
    const nonEmpty = rowVals.some(x=>String(x||'').trim());
    if (!nonEmpty) continue;

    const q = evaluateSimulationQuality(rowVals, mkNow);

    // write back
    const scoreIdx = mkNow.indexOf(ensured.scoreKey) + 1;
    const suggIdx  = mkNow.indexOf(ensured.suggKey)  + 1;
    if (scoreIdx > 0) sheet.getRange(r, scoreIdx).setValue(q.score);
    if (suggIdx  > 0) sheet.getRange(r, suggIdx).setValue(q.suggestionsText);

    // Highlight very low scores
    if (q.score < QUALITY.HIGHLIGHT_SCORE_LT) {
      sheet.getRange(r, 1, 1, sheet.getLastColumn()).setBackground('#2b1d1d'); // subtle dark red
    } else {
      sheet.getRange(r, 1, 1, sheet.getLastColumn()).setBackground(null);
    }
    updated++;
  }

  if (ui) { ui.alert(`✅ Quality Audit complete. Updated ${updated} row(s).`); }
}

// Clean up N/A-heavy rows: choose Highlight or Delete
function cleanUpLowValueRows() {
  const ss = SpreadsheetApp.getActive();
  const sheet = pickMasterSheet_();
  if (!sheet) { getSafeUi_().alert('❌ Could not find your Master Scenario CSV sheet.'); return; }

  const last = sheet.getLastRow();
  const startRow = 3;
  const lowRows = [];

  for (let r = startRow; r <= last; r++) {
    const row = sheet.getRange(r,1,1,sheet.getLastColumn()).getValues()[0];
    const nonNA = row.filter(x => String(x||'').trim() && String(x).trim()!=='N/A').length;
    const ratio = nonNA / row.length;
    if (ratio < QUALITY.LOW_VALUE_THRESHOLD) lowRows.push(r);
  }

  if (!lowRows.length) {
    if (getSafeUi_()) { getSafeUi_().alert('✅ No low-value rows found.'); }
    return;
  }

  const ui = getSafeUi_();
  const choice = ui.prompt(
    `Found ${lowRows.length} low-value rows. Type "H" to highlight or "D" to delete them.`,
    ui.ButtonSet.OK_CANCEL
  );
  if (choice.getSelectedButton() !== ui.Button.OK) return;
  const opt = (choice.getResponseText()||'').trim().toUpperCase();

  if (opt === 'D') {
    // Delete bottom-up
    lowRows.reverse().forEach(r => sheet.deleteRow(r));
    if (ui) { ui.alert(`🧹 Deleted ${lowRows.length} row(s).`); }
  } else {
    // Highlight only
    lowRows.forEach(r => sheet.getRange(r,1,1,sheet.getLastColumn()).setBackground('#2b1d1d'));
    if (ui) { ui.alert(`🟧 Highlighted ${lowRows.length} row(s).`); }
  }
}


function getProp(key, fallback) {
  const v = PropertiesService.getDocumentProperties().getProperty(key);
  return (v === null || v === undefined) ? fallback : v;
}
function setProp(key, val) {
  PropertiesService.getDocumentProperties().setProperty(key, val);
}

function estimateTokens(str) {
  if (!str) return 0;
  return Math.max(1, Math.round(String(str).length / 4));
}
function estimateCostUSD(inputText, outputText) {
  const priceIn = parseFloat(getProp(SP_KEYS.PRICE_INPUT, DEFAULT_PRICE.input));
  const priceOut = parseFloat(getProp(SP_KEYS.PRICE_OUTPUT, DEFAULT_PRICE.output));
  const inTok = estimateTokens(inputText);
  const outTok = estimateTokens(outputText);
  return ((inTok / 1000) * priceIn) + ((outTok / 1000) * priceOut);
}

function hashText(text) {
  if (!text) return '';
  let hash = 0;
  for (let i=0; i<text.length; i++) {
    hash = (hash*31 + text.charCodeAt(i)) | 0;
  }
  return ('00000000' + (hash >>> 0).toString(16)).slice(-8);
}

function cleanDuplicateLines(text) {
  if (!text) return text;
  const lines = text.split('\n');
  const out = [];
  let last = '', count = 0;
  for (const l of lines) {
    const t = l.trim();
    if (t === last) {
      count++;
      if (count < 3) out.push(t);
    } else {
      out.push(t);
      last = t; count = 0;
    }
  }
  return out.join('\n').trim();
}

function tryParseJSON(text) {
  try { return JSON.parse(text); } catch(e) {
    const m = text && text.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch(_) {} }
    return null;
  }
}

// ATSR-specific JSON parser that handles markdown code fences
function parseATSRResponse_(text) {
  if (!text) return null;

  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/,'');
  }

  try { return JSON.parse(cleaned); } catch(e) {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch(_) {} }
    return null;
  }
}


/**
 * Validate and normalize any "Vitals" or "Monitor" JSON fields.
 * Used after the AI JSON response is parsed.
 */
function validateVitalsFields_(parsedOutput, headers) {
  if (!parsedOutput || typeof parsedOutput !== 'object') return { valid: false, warnings: [] };

  const warnings = [];
  headers.forEach(h => {
    const headerName = h.toLowerCase();
    if (headerName.includes('vitals') || headerName.includes('monitor')) {
      const value = parsedOutput[h] || parsedOutput[headerName];
      if (value) {
        // If it's a string, try to parse it as JSON
        if (typeof value === 'string') {
          const parsed = tryParseJSON(value);
          if (parsed) parsedOutput[h] = parsed;
          else warnings.push(`⚠️ ${h} field not valid JSON.`);
        }
        // If it's not an object after parse, warn
        else if (typeof value !== 'object') {
          warnings.push(`⚠️ ${h} field expected JSON object, got ${typeof value}.`);
        }
      } else {
        warnings.push(`⚠️ Missing ${h} field.`);
      }
    }
  });

  return { valid: warnings.length === 0, warnings, data: parsedOutput };
}

/**
 * Calls OpenAI with enforced JSON output (for Convert/Batch mode only)
 */
function callOpenAiJson(model, userPrompt) {
  const apiKey = readApiKey_();
  if (!apiKey) throw new Error('Missing API key.');

  const url = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model: model,
    messages: [
      {
        role: "system",
        content: "You are a structured data generator. ALWAYS respond with strict valid JSON — no commentary, markdown, or text outside JSON."
      },
      { role: "user", content: userPrompt }
    ],
    temperature: 0
  };

  const options = {
    method: "post",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const raw = response.getContentText();

  Logger.log('🔍 DEBUG: Raw OpenAI API response: ' + raw.slice(0, 300));

  try {
    // Parse the full API response
    const apiResponse = JSON.parse(raw);

    // Check for API-level errors
    if (apiResponse.error) {
      Logger.log('❌ OpenAI API Error: ' + JSON.stringify(apiResponse.error));
      throw new Error('OpenAI API Error: ' + (apiResponse.error.message || JSON.stringify(apiResponse.error)));
    }

    // Extract the actual content from choices array
    if (!apiResponse.choices || !apiResponse.choices.length) {
      Logger.log('❌ No choices in API response');
      throw new Error('OpenAI returned no choices');
    }

    const content = apiResponse.choices[0].message.content;
    Logger.log('📝 Extracted content length: ' + content.length + ' characters');
    Logger.log('📝 Content preview: ' + content.slice(0, 200));

    // NOW parse the content as JSON (this is the simulation data)
    const parsed = JSON.parse(content);
    Logger.log('✅ Successfully parsed simulation JSON with ' + Object.keys(parsed).length + ' keys');

    return parsed;

  } catch (err) {
    Logger.log("⚠️ JSON parse error: " + err.message);
    Logger.log("Raw response: " + raw.slice(0, 500));
    throw new Error("AI response parse failed: " + err.message);
  }
}

/**
 * Extracts a value from AI JSON output, tolerant of tiered keys.
 * Handles formats like "Tier1:Tier2" or just "Tier2".
 */
function extractValueFromParsed_(parsed, mergedKey) {
  if (!parsed || typeof parsed !== 'object') return 'N/A';

  // Try exact full key match
  if (parsed.hasOwnProperty(mergedKey)) return parsed[mergedKey];

  // Try after colon (Tier 2 only)
  const parts = mergedKey.split(':');
  const shortKey = parts[1] || parts[0];
  if (parsed.hasOwnProperty(shortKey)) return parsed[shortKey];

  // Try case-insensitive match
  const lowerKey = shortKey.toLowerCase();
  for (const k in parsed) {
    if (k.toLowerCase() === lowerKey) return parsed[k];
  }

  // Try to find nested objects like { "Case_Organization": { "Spark_Title": "..." } }
  if (parts.length === 2 && parsed[parts[0]] && typeof parsed[parts[0]] === 'object') {
    const nested = parsed[parts[0]][parts[1]];
    if (nested !== undefined) return nested;
  }

  // If all else fails, return N/A
  return 'N/A';
}

// Settings sheet integration: read API key from a Settings sheet
// Supports either:
//  • A two-column key/value table where first column contains "OPENAI_API_KEY"
//  • Or cell B2 under header "API Key" (fallback)
function syncApiKeyFromSettingsSheet_() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName('Settings');
  if (!sheet) return null;

  try {
    const range = sheet.getDataRange().getValues();
    // Try KV pairs
    for (let r=0; r<range.length; r++) {
      const k = String(range[r][0]||'').trim().toUpperCase();
      const v = String(range[r][1]||'').trim();
      if (k === 'OPENAI_API_KEY' && v) {
        Logger.log('✅ Found OPENAI_API_KEY in Settings sheet');
        return v;
      }
    }
    // Fallback: B2 if row2 has "API Key" label
    const labelB2 = String(sheet.getRange(2,1).getValue()||'').toLowerCase();
    if (labelB2.includes('api')) {
      const apiKey = String(sheet.getRange(2,2).getValue()||'').trim();
      if (apiKey) {
        Logger.log('✅ Found API key in Settings!B2');
        return apiKey;
      }
    }
  } catch(e) {
    Logger.log('⚠️ Error reading Settings sheet: ' + e.message);
  }
  return null;
}

// Reads API key priority:
// 1) Script Properties (saved via Settings panel / sidebar)
// 2) Settings sheet (if present)
// 3) Error
function readApiKey_() {
  // DELETE the cached key to force fresh read
  try {
    PropertiesService.getDocumentProperties().deleteProperty('OPENAI_API_KEY');
    Logger.log('🗑️ Deleted cached API key');
  } catch (e) {
    Logger.log('⚠️ Could not delete cache: ' + e.message);
  }

  // Read fresh from Settings sheet
  const fromSheet = syncApiKeyFromSettingsSheet_();
  if (fromSheet) {
    Logger.log('✅ Read fresh API key from Settings sheet');
    // DON'T cache it - keep reading fresh
    return fromSheet;
  }

  Logger.log('❌ No API key found in Settings sheet');
  return '';
}

function callOpenAI(promptText, temperature) {
  const apiKey = readApiKey_();
  if (!apiKey) throw new Error('❌ Missing API key. Open Settings and save your key (or add it to the Settings sheet).');
  const model = getProp(SP_KEYS.MODEL, DEFAULT_MODEL);

  const url = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model,
    temperature: temperature ?? DEFAULT_TEMP_SINGLE,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'system', content: 'You are a world-class simulation scenario writer and exacting data formatter.' },
      { role: 'user', content: promptText }
    ]
  };
  const options = {
    method: 'post',
    headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type':'application/json' },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const body = response.getContentText();
  const json = JSON.parse(body);
  if (!json.choices || !json.choices.length) {
    throw new Error('⚠️ OpenAI returned no choices:\n' + body);
  }
  return json.choices[0].message.content.trim();
}

// Quick API status check
function checkApiStatus() {
  try {
    const out = callOpenAI('Reply exactly with "OK".', 0.0);
    const ok = /^OK$/i.test(out.trim());
    if (getSafeUi_()) { getSafeUi_().alert(ok ? '🛡️ API is reachable.' : '⚠️ API replied unexpectedly: ' + out); }
  } catch (e) {
    if (getSafeUi_()) { getSafeUi_().alert('❌ API error: ' + e.message); }
  }
}

// Header cache helpers (two-tier)
function readTwoTierHeaders_(sheet) {
  const header1 = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const header2 = sheet.getRange(2,1,1,sheet.getLastColumn()).getValues()[0];
  return { header1, header2 };
}
function mergedKeysFromTwoTiers_(header1, header2) {
  return header1.map((t1,i)=>`${t1}:${header2[i]}`);
}
function cacheHeaders(sheet) {
  const {header1, header2} = readTwoTierHeaders_(sheet);
  setProp(SP_KEYS.HEADER_CACHE, JSON.stringify({header1, header2}));
}
function getCachedHeadersOrRead(sheet) {
  let cached = getProp(SP_KEYS.HEADER_CACHE, '');
  if (cached) try { return JSON.parse(cached); } catch(_){}
  const hh = readTwoTierHeaders_(sheet);
  setProp(SP_KEYS.HEADER_CACHE, JSON.stringify(hh));
  return hh;
}
function clearHeaderCache() {
  PropertiesService.getDocumentProperties().deleteProperty(SP_KEYS.HEADER_CACHE);
  SpreadsheetApp.getActive().toast('🧹 Header cache cleared.');
}

// Ensure Batch_Reports tab exists
function ensureBatchReportsSheet_() {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName('Batch_Reports');
  if (!s) s = ss.insertSheet('Batch_Reports');
  // minimal header
  if (s.getLastRow() === 0) {
    s.appendRow(['Timestamp','Mode','Created','Skipped','Duplicates','Errors','Estimated Cost (USD)','Elapsed']);
  }
  return s;
}


// ========== 3) SIDEBAR (Dark) ==========

function openSimSidebar() {
  const ss = SpreadsheetApp.getActive();
  const allSheets = ss.getSheets().map(s=>s.getName());

  // ⭐ Auto-refresh: ensure Settings!A1 points to a valid Convert sheet
  try {
    const settingsSheet = ss.getSheetByName('Settings');
    const storedOut = settingsSheet ? settingsSheet.getRange('A1').getValue() : '';
    const exists = allSheets.includes(storedOut);
    if (!exists && allSheets.length) {
      const fallback = allSheets.find(n => /convert/i.test(n))
                  || allSheets.find(n => /master scenario csv/i.test(n))
                  || allSheets[0];
      if (settingsSheet) settingsSheet.getRange('A1').setValue(fallback);
    }
  } catch(err) {
    Logger.log('Settings auto-refresh error: ' + err);
  }

  const lastInput  = getProp(SP_KEYS.LAST_INPUT_SHEET, '');
  const lastOutput = getProp(SP_KEYS.LAST_OUTPUT_SHEET, '');
  const savedModel = getProp(SP_KEYS.MODEL, DEFAULT_MODEL);
  const savedApi   = getProp(SP_KEYS.API_KEY, '');

  // ⭐ Dynamic output preference from Settings!A1
  const settingsSheet = ss.getSheetByName('Settings');
  const settingsOut = settingsSheet ? settingsSheet.getRange('A1').getValue() : '';

  // Input = any with "input"; Output = only those with "convert"
  const inputCandidates = allSheets.filter(n => /input/i.test(n));
  const outputCandidates = allSheets.filter(n => /convert/i.test(n));

  // Defaults
  const defaultIn = inputCandidates.includes(lastInput)
    ? lastInput
    : (inputCandidates[0] || allSheets[0]);

  const defaultOut =
    outputCandidates.includes(settingsOut) ? settingsOut :
    outputCandidates.includes(lastOutput) ? lastOutput :
    (outputCandidates[0] || allSheets[0]);

  const modelList = ['gpt-4o','gpt-4o','o4-mini','o3-mini'];
  const modelOptions = modelList.map(m=>`<option value="${m}" ${m===savedModel?'selected':''}>${m}</option>`).join('');
  const inOpts  = inputCandidates.map(n=>`<option value="${n}" ${n===defaultIn?'selected':''}>${n}</option>`).join('');
  const outOpts = outputCandidates.map(n=>`<option value="${n}" ${n===defaultOut?'selected':''}>${n}</option>`).join('');

  const html = HtmlService.createHtmlOutput(`
  <style>
    body{font-family:Arial;margin:0;background:#f5f7fa;color:#2c3e50}
    .bar{padding:14px 16px;background:#1b1f2a;border-bottom:1px solid #dfe3e8}
    h2{margin:0;font-size:16px;letter-spacing:.3px}
    .wrap{padding:16px}
    .card{background:#ffffff;border:1px solid #dfe3e8;border-radius:10px;padding:14px;margin-bottom:12px}
    label{font-size:12px;color:#9aa3b2}
    select,input,textarea{width:100%;background:#f5f7fa;border:1px solid #30384b;color:#2c3e50;border-radius:8px;padding:8px}
    .row{display:flex;gap:10px}
    .col{flex:1}
    button{background:#2357ff;border:0;color:#fff;padding:10px 12px;border-radius:8px;cursor:pointer}
    button.sec{background:#dfe3e8}
    .pill{display:inline-block;background:#dfe3e8;padding:6px 8px;border-radius:999px;font-size:12px}
    .hint{color:#9aa3b2;font-size:12px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .log{height:180px}
  </style>

  <div class="bar"><h2>${ICONS.rocket} Sim Mastery — Batch & Single</h2></div>
  <div class="wrap">
    <div class="card">
      <div class="grid2">
        <div>
          <label>Input Sheet</label>
          <select id="inputSheet">${inOpts}</select>
        </div>
        <div>
          <label>Output Sheet</label>
          <select id="outputSheet">${outOpts}</select>
        </div>
      </div>
      <div class="grid2" style="margin-top:10px;">
        <div>
          <label>Model</label>
          <select id="model">${modelOptions}</select>
        </div>
        <div>
          <label>API Key</label>
          <input id="apiKey" type="password" value="${savedApi ? '••••••••' : ''}" placeholder="sk-..." />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="row">
        <div class="col">
          <label>Run mode</label>
          <select id="runMode">
            <option value="one">Single Case</option>
            <option value="next25">Next 25 unprocessed</option>
            <option value="specific">Specific (e.g. 4,7,9-12)</option>
            <option value="all">All rows</option>
          </select>
        </div>
        <div class="col">
          <label>Specific rows</label>
          <input id="rowsSpec" placeholder="4,7,9-12" />
        </div>
      </div>
      <div style="margin-top:10px;">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox" id="forceReprocess" style="width:auto;" />
          <span style="color:#ff6b6b;">🔄 Force Reprocess (ignore duplicates)</span>
        </label>
        <div class="hint" style="margin-top:4px;">
          ⚠️ When enabled, will regenerate cases even if they already exist in output
        </div>
      </div>
    </div>

        <div class="card">
      <div class="row">
        <button onclick="start()">🚀 Launch Batch Engine</button>
        <button class="sec" onclick="stop()">⏹️ Stop</button>
        <button class="sec" onclick="check()">🛡️ Check API</button>
      </div>
      <div style="margin-top:10px;">
        <span class="pill" id="statusPill">Idle</span>
      </div>
      <div style="margin-top:10px;">
        <textarea id="log" class="log" placeholder="Live log..." readonly></textarea>
      </div>
    </div>

    <div class="card">
      <div class="row" style="justify-content: space-between;">
        <button class="sec" onclick="imgSync()">🖼️ Image Sync Defaults</button>
        <button class="sec" onclick="openSettings()">⚙️ Settings</button>
      </div>
      <div class="hint" style="margin-top:8px;">
        💡 Use “Run mode” to choose between Single Case, First 25, or All Rows.  
        Then click <strong>Launch Batch Engine</strong>.
      </div>
    </div>
  </div>
    <!-- 🪵 Live Logs Panel (NEW) -->
    <div class="card" style="margin-top:12px;">
      <div class="row" style="justify-content: space-between; align-items:center;">
        <strong style="color:#ff82a9;">🪵 Live Logs</strong>
        <div>
          <button id="copyLogsBtn" class="log-btn copy">Copy Logs</button>
          <button id="refreshLogsBtn" class="log-btn">Refresh</button>
          <button id="clearLogsBtn" class="log-btn danger">Clear</button>
        </div>
      </div>
      <pre id="logOutput" class="log-output">No logs yet.</pre>
    </div>

    <style>
      .log-btn {
        background: #1a1a1a;
        color: #0f0;
        border: 1px solid #0f0;
        padding: 2px 8px;
        margin-left: 4px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        transition: all 0.2s ease;
      }
      .log-btn:hover {
        background: #0f0;
        color: #000;
      }
      .log-btn.copy {
        color: #58a6ff;
        border-color: #58a6ff;
      }
      .log-btn.copy:hover {
        background: #58a6ff;
        color: #000;
      }
      .log-btn.danger {
        color: #f55;
        border-color: #f55;
      }
      .log-btn.danger:hover {
        background: #f55;
        color: #000;
      }
      .log-output {
        white-space: pre-wrap;
        background: #000;
        color: #0f0;
        padding: 8px;
        border-radius: 6px;
        margin-top: 4px;
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #222;
      }
      .new-log-line {
        animation: fadeInNew 0.6s ease-out;
      }
      @keyframes fadeInNew {
        from { color: #9aff9a; background-color: rgba(0,255,0,0.05); }
        to { color: #0f0; background-color: transparent; }
      }
    </style>

    <script>
      // === LOG VIEWER HANDLERS ===
      let lastLogs = '';

      function refreshLogs() {
        google.script.run
          .withSuccessHandler((logs) => {
            const output = document.getElementById('logOutput');
            if (logs && logs !== lastLogs) {
              const diff = logs.replace(lastLogs, '').trim();
              if (diff) {
                const newLine = document.createElement('div');
                newLine.textContent = diff;
                newLine.classList.add('new-log-line');
                output.appendChild(newLine);
              } else {
                output.textContent = logs;
              }
              output.scrollTop = output.scrollHeight;
              lastLogs = logs;
            }
            if (!logs) output.textContent = 'No logs yet.';
          })
          .getSidebarLogs();
      }

      function clearLogs() {
        google.script.run
          .withSuccessHandler((msg) => {
            document.getElementById('logOutput').textContent = msg;
            lastLogs = '';
          })
          .clearSidebarLogs();
      }

      function copyLogs() {
        const logText = document.getElementById('logOutput').textContent;
        if (!logText || logText === 'No logs yet.') {
          alert('No logs to copy!');
          return;
        }

        // Copy to clipboard
        navigator.clipboard.writeText(logText).then(() => {
          const btn = document.getElementById('copyLogsBtn');
          const originalText = btn.textContent;
          btn.textContent = '✓ Copied!';
          btn.style.color = '#0f0';
          btn.style.borderColor = '#0f0';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.color = '#58a6ff';
            btn.style.borderColor = '#58a6ff';
          }, 2000);
        }).catch(err => {
          alert('Failed to copy logs: ' + err);
        });
      }

      document.getElementById('copyLogsBtn').addEventListener('click', copyLogs);
      document.getElementById('refreshLogsBtn').addEventListener('click', refreshLogs);
      document.getElementById('clearLogsBtn').addEventListener('click', clearLogs);

      // Auto-refresh every 5 seconds
      setInterval(refreshLogs, 5000);
    </script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      console.log('✅ Sidebar loaded');
    });

    function appendLog(t){ const ta=document.getElementById('log'); ta.value += t + "\\n"; ta.scrollTop = ta.scrollHeight; }
    function setStatus(s){ document.getElementById('statusPill').textContent = s; }

    function persistBasics(){
      const apiRaw = document.getElementById('apiKey').value.trim();
      const outVal = document.getElementById('outputSheet').value;
      google.script.run.saveSidebarBasics(
        document.getElementById('model').value,
        (apiRaw && apiRaw!=='••••••••') ? apiRaw : '',
        '', '',
        document.getElementById('inputSheet').value,
        outVal
      );
      google.script.run.setOutputSheet(outVal);
    }

    function loopStep(){
      // Get next row number from queue
      google.script.run
          .withSuccessHandler(function(report){
            if (report.done){
              setStatus('✅ Complete');
              appendLog(report.msg || '✅ Batch complete!');
              return;
            }

            // ⭐ Call the EXACT same function single mode uses!
            appendLog('📊 Processing row ' + report.row + ' (' + report.remaining + ' remaining)...');

            google.script.run
              .withSuccessHandler(function(result){
                appendLog('✅ Row ' + report.row + ' complete');
                setTimeout(loopStep, 1500); // Next row after 1.5s
              })
              .withFailureHandler(function(e){
                const errorMsg = e && e.message ? e.message : (e ? String(e) : 'Unknown error');
                appendLog('❌ Row ' + report.row + ' error: ' + errorMsg);
                setTimeout(loopStep, 1500); // Continue despite error
              })
              .runSingleCaseFromSidebar(report.inputSheetName, report.outputSheetName, report.row);
          })
          .withFailureHandler(function(e){
            const errorMsg = e && e.message ? e.message : (e ? String(e) : 'Unknown error');
            appendLog('❌ Batch error: ' + errorMsg);
            setStatus('Error');
          })
          .runSingleStepBatch();
    }
    function start(){
  persistBasics();
  setStatus('Running...');
  const mode = document.getElementById('runMode').value;
  const spec = document.getElementById('rowsSpec').value.trim();
  const inputSheet = document.getElementById('inputSheet').value;
  const outputSheet = document.getElementById('outputSheet').value;
  const forceReprocess = document.getElementById('forceReprocess').checked;

  // Log if force reprocess is enabled
  if (forceReprocess) {
    appendLog('⚠️ Force Reprocess enabled - will ignore duplicates');
  }

  // Store force flag in properties for processOneInputRow_ to access
  google.script.run.setProp('FORCE_REPROCESS', forceReprocess ? '1' : '0');

  // Handle single-case mode directly
  if (mode === 'one' || mode === 'single' || mode === 'Single Case') {
    const rowNum = parseInt(spec || prompt('Enter row number to process (>=4):'), 10);
    if (!rowNum) {
      appendLog('⚠️ No row selected, cancelling.');
      setStatus('Idle');
      return;
    }

    google.script.run
      .withSuccessHandler(m => {
        appendLog(m || '✅ Done.');
        setStatus('Idle');
        if (m && m.includes('Error')) alert(m);
      })
      .withFailureHandler(e => {
        appendLog('❌ Single-case error: ' + e.message);
        alert('❌ Single-case error: ' + e.message);
        setStatus('Idle');
      })
      .runSingleCaseFromSidebar(inputSheet, outputSheet, rowNum);

    return; // stop here, no batch loop
  }

  // Otherwise run normal batch flow
  google.script.run
    .withSuccessHandler(msg => {
      appendLog(msg || '✅ Batch started.');
      loopStep(); // begin step loop
    })
    .withFailureHandler(e => {
      appendLog('❌ Batch start error: ' + e.message);
      setStatus('Idle');
    })
    .startBatchFromSidebar(inputSheet, outputSheet, mode, spec);
}

function stop(){
  google.script.run.stopBatch();
  setStatus('Stopping...');
  appendLog('Stop requested.');
}

function imgSync(){ google.script.run.openImageSyncDefaults(); }
function openSettings(){ google.script.run.openSettingsPanel(); }
function check(){ google.script.run.checkApiStatus(); }
  </script>
  `)
  .setWidth(540)
  .setHeight(720)
  .setSandboxMode(HtmlService.SandboxMode.IFRAME);

  getSafeUi_().showSidebar(html);
}

// ⭐ UPDATED HELPERS
function saveSidebarBasics(model, apiKeyMaybe, priceIn, priceOut, inputSheet, outputSheet) {
  if (model) setProp(SP_KEYS.MODEL, model);
  if (apiKeyMaybe) setProp(SP_KEYS.API_KEY, apiKeyMaybe);
  if (inputSheet) setProp(SP_KEYS.LAST_INPUT_SHEET, inputSheet);
  if (outputSheet) {
    setProp(SP_KEYS.LAST_OUTPUT_SHEET, outputSheet);
    setOutputSheet(outputSheet);
  }
}



function logLong(label, text) {
  try {
    const chunkSize = 8000; // safe for Apps Script logs
    if (!text) {
      appendLogSafe(`(no text to log for ${label})`);
      return;
    }
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.substring(i, i + chunkSize);
      appendLogSafe(`${label} [${i / chunkSize + 1}]:\n${chunk}`);
    }
  } catch (err) {
    appendLogSafe(`logLong error: ${err}`);
  }
}

// ⭐ Debug helper: safely log very long AI outputs in chunks

function getSidebarLogs() {
  try {
    const logs = PropertiesService.getDocumentProperties().getProperty('Sidebar_Logs') || '';
    return logs;
  } catch (err) {
    return 'Error retrieving logs: ' + err;
  }
}

function clearSidebarLogs() {
  try {
    PropertiesService.getDocumentProperties().deleteProperty('Sidebar_Logs');
    return '🧹 Logs cleared.';
  } catch (err) {
    return 'Error clearing logs: ' + err;
  }
}

// ⭐ NEW: Writes chosen output sheet to Settings!A1
function setOutputSheet(sheetName) {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
  if (!s) throw new Error('Settings sheet not found.');
  s.getRange('A1').setValue(sheetName);
}

// ⭐ Helper for saving property values

// ========== 4) BATCH QUEUE & ENGINE ==========

function stopBatch() { setProp('BATCH_STOP','1'); }

function parseRowSpec_(spec) {
  const out = new Set();
  if (!spec) return [];
  spec.split(',').map(s=>s.trim()).forEach(token=>{
    if (/^\d+$/.test(token)) out.add(parseInt(token,10));
    else if (/^\d+\-\d+$/.test(token)) {
      const [a,b] = token.split('-').map(n=>parseInt(n,10));
      const lo = Math.min(a,b), hi = Math.max(a,b);
      for (let r=lo; r<=hi; r++) out.add(r);
    }
  });
  return Array.from(out).sort((a,b)=>a-b);
}







// === SMART BATCH: Calculate next 25 rows based on output sheet progress ===
function getNext25InputRows_(inputSheet, outputSheet) {
  appendLogSafe('🔍 Starting robust row detection (Case_ID comparison method)...');

  const inputLast = inputSheet.getLastRow();
  const outputLast = outputSheet.getLastRow();

  appendLogSafe(`📊 Input sheet last row: ${inputLast}`);
  appendLogSafe(`📊 Output sheet last row: ${outputLast}`);

  // Read all Case_IDs from Output sheet (Column A, rows 3+)
  const processedCaseIds = new Set();
  if (outputLast >= 3) {
    const outputCaseIds = outputSheet.getRange(3, 1, outputLast - 2, 1).getValues();
    outputCaseIds.forEach(row => {
      const caseId = String(row[0] || '').trim();
      if (caseId) {
        processedCaseIds.add(caseId);
      }
    });
  }

  appendLogSafe(`✅ Found ${processedCaseIds.size} processed Case_IDs in Output`);

  // IMPORTANT: Input sheet structure
  // Row 1: Tier 1 headers
  // Row 2: Tier 2 headers
  // Row 3+: Data
  //
  // The Input sheet does NOT have Case_ID pre-filled.
  // Case_ID is GENERATED during processing.
  //
  // Strategy: Since we can't predict Case_ID from Input data,
  // we use row position correlation:
  // - Input row 3 → Output row 3 (first data row)
  // - Input row 4 → Output row 4 (second data row)
  // - etc.
  //
  // If Output has N data rows (rows 3 through 3+N-1),
  // then Input rows 3 through 3+N-1 have been processed.
  // Next unprocessed Input row = 3 + N

  const outputDataRows = Math.max(0, outputLast - 2);
  const nextInputRow = 3 + outputDataRows;

  appendLogSafe(`📊 Output has ${outputDataRows} data rows`);
  appendLogSafe(`📊 Next unprocessed Input row: ${nextInputRow}`);

  // Build array of next 25 rows to process
  const availableRows = [];
  for (let r = nextInputRow; r <= inputLast && availableRows.length < 25; r++) {
    availableRows.push(r);
  }

  appendLogSafe(`✅ Found ${availableRows.length} unprocessed rows`);
  if (availableRows.length > 0) {
    appendLogSafe(`📋 Rows to process: [${availableRows.slice(0, 5).join(', ')}${availableRows.length > 5 ? '...' : ''}]`);
  }

  return availableRows;
}
function getAllInputRows_(inputSheet, outputSheet) {
  appendLogSafe('🔍 Starting detection for ALL remaining rows...');

  const inputLast = inputSheet.getLastRow();
  const outputLast = outputSheet.getLastRow();

  appendLogSafe(`📊 Input sheet last row: ${inputLast}`);
  appendLogSafe(`📊 Output sheet last row: ${outputLast}`);

  // Count processed rows
  const outputDataRows = Math.max(0, outputLast - 2);
  const nextInputRow = 3 + outputDataRows;

  appendLogSafe(`📊 Output has ${outputDataRows} processed rows`);
  appendLogSafe(`📊 Next unprocessed Input row: ${nextInputRow}`);

  // Build array of ALL remaining rows
  const availableRows = [];
  for (let r = nextInputRow; r <= inputLast; r++) {
    availableRows.push(r);
  }

  appendLogSafe(`✅ Found ${availableRows.length} unprocessed rows (all remaining)`);
  if (availableRows.length > 0) {
    appendLogSafe(`📋 Will process rows ${availableRows[0]} through ${availableRows[availableRows.length-1]}`);
  }

  return availableRows;
}
function getSpecificInputRows_(inputSheet, outputSheet, spec) {
  appendLogSafe(`🔍 Starting detection for SPECIFIC rows: ${spec}`);

  const outputLast = outputSheet.getLastRow();

  // Build set of already-processed row numbers
  // Since Input row N → Output row N, rows 3 through (outputLast) are processed
  const processedRows = new Set();
  const outputDataRows = Math.max(0, outputLast - 2);

  for (let r = 3; r < 3 + outputDataRows; r++) {
    processedRows.add(r);
  }

  appendLogSafe(`📊 Already processed rows: 3 through ${2 + outputDataRows} (${processedRows.size} total)`);

  // Parse the spec (supports "5,10,15" or "5-10" or mixed "5-10,15,20-25")
  const requestedRows = parseRowSpec(spec);

  appendLogSafe(`📋 Requested rows: [${requestedRows.join(', ')}]`);

  // Filter out already-processed rows
  const availableRows = requestedRows.filter(r => !processedRows.has(r));

  if (availableRows.length < requestedRows.length) {
    const skipped = requestedRows.filter(r => processedRows.has(r));
    appendLogSafe(`⚠️  Skipping already-processed rows: [${skipped.join(', ')}]`);
  }

  appendLogSafe(`✅ Will process ${availableRows.length} rows: [${availableRows.join(', ')}]`);

  return availableRows;
}

function parseRowSpec(spec) {
  const rows = [];
  const parts = spec.split(',');

  parts.forEach(part => {
    part = part.trim();
    if (part.includes('-')) {
      // Range: "5-10"
      const range = part.split('-');
      const start = parseInt(range[0].trim(), 10);
      const end = parseInt(range[1].trim(), 10);
      for (let r = start; r <= end; r++) {
        if (!rows.includes(r)) {
          rows.push(r);
        }
      }
    } else {
      // Single row: "5"
      const r = parseInt(part, 10);
      if (!rows.includes(r)) {
        rows.push(r);
      }
    }
  });

  // Sort numerically
  return rows.sort((a, b) => a - b);
}



function startBatchFromSidebar(inputSheetName, outputSheetName, mode, spec) {
  const ss = SpreadsheetApp.getActive();
  const inSheet = ss.getSheetByName(inputSheetName);
  let outSheet = ss.getSheetByName(outputSheetName);

  // Dynamic output sheet detection (check Settings)
  const settingsSheet = ss.getSheetByName('Settings');
  const settingsOut = settingsSheet ? settingsSheet.getRange('A1').getValue() : '';
  if (settingsOut) {
    outSheet = ss.getSheetByName(settingsOut) || outSheet;
  }

  if (!inSheet || !outSheet) {
    throw new Error('❌ Could not find selected sheets.');
  }

  cacheHeaders(outSheet);

  appendLogSafe('─────────────────────────────────────────');
  appendLogSafe(`📋 Starting batch mode: ${mode}`);
  appendLogSafe('─────────────────────────────────────────');

  let rows;

  if (mode === 'next25') {
    rows = getNext25InputRows_(inSheet, outSheet);
  } else if (mode === 'all') {
    rows = getAllInputRows_(inSheet, outSheet);
  } else if (mode === 'specific') {
    rows = getSpecificInputRows_(inSheet, outSheet, spec);
  } else {
    throw new Error('Unknown batch mode: ' + mode);
  }

  if (!rows || rows.length === 0) {
    appendLogSafe('⚠️  No rows to process.');
    return { success: false, message: 'No unprocessed rows found.' };
  }

  // Save queue to DocumentProperties (separate properties for reliability)
  setProp('BATCH_ROWS', JSON.stringify(rows));
  setProp('BATCH_INPUT_SHEET', inputSheetName);
  setProp('BATCH_OUTPUT_SHEET', outputSheetName);
  setProp('BATCH_MODE', mode);
  setProp('BATCH_SPEC', spec);
  setProp('BATCH_STOP', ''); // Clear stop flag

  // Also save as single queue object for backwards compatibility
  const q = {
    rows: rows,
    inputSheetName: inputSheetName,
    outputSheetName: outputSheetName,
    mode: mode,
    spec: spec
  };
  setProp('BATCH_QUEUE', JSON.stringify(q));

  appendLogSafe(`✅ Batch queued with ${rows.length} row(s)`);
  appendLogSafe(`📋 Rows: [${rows.slice(0, 10).join(', ')}${rows.length > 10 ? '...' : ''}]`);
  appendLogSafe('─────────────────────────────────────────');

  return { success: true, count: rows.length, rows: rows };
}

function runSingleStepBatch() {
  // Try reading from separate properties first (more reliable)
  const rowsJson = getProp('BATCH_ROWS', '[]');
  const rows = JSON.parse(rowsJson);

  // Build queue object from separate properties
  const q = {
    rows: rows,
    inputSheetName: getProp('BATCH_INPUT_SHEET', ''),
    outputSheetName: getProp('BATCH_OUTPUT_SHEET', ''),
    mode: getProp('BATCH_MODE', ''),
    spec: getProp('BATCH_SPEC', '')
  }

  // Check if we have rows left
  if (!q.rows || q.rows.length === 0) {
    return { done: true, msg: '✅ All rows processed!' };
  }

  if (getProp('BATCH_STOP','')) {
    return { done: true, msg: 'Stopped by user.' };
  }

  // ⭐ Just pop and return the row number - don't process it here!
  const nextRow = q.rows.shift();

  // Save updated queue
  // Update the rows property
  setProp('BATCH_ROWS', JSON.stringify(q.rows));
  // Also update full queue for backward compatibility
  setProp('BATCH_QUEUE', JSON.stringify(q));

  // Return the row number and queue data so loopStep can call runSingleCaseFromSidebar
  return {
    done: false,
    row: nextRow,
    remaining: q.rows.length,
    inputSheetName: q.inputSheetName,
    outputSheetName: q.outputSheetName
  };
}
function finishBatchAndReport() {
  const log = JSON.parse(getProp('BATCH_LOG','{}'));
  const elapsedMs = Date.now() - (log.started||Date.now());
  const minutes = (elapsedMs/60000).toFixed(1);
  const report = `
${ICONS.clipboard} Batch Summary Report
Created: ${log.created||0}
Skipped: ${log.skipped||0}
Duplicates: ${log.dupes||0}
Errors: ${log.errors||0}
Elapsed: ${minutes} min
  `.trim();

  const s = ensureBatchReportsSheet_();
  s.appendRow([new Date(), 'Batch', log.created||0, log.skipped||0, log.dupes||0, log.errors||0, '', `${minutes} min`]);

  // Clear force reprocess flag after batch completes
  setProp('FORCE_REPROCESS', '0');

  if (getSafeUi_()) { getSafeUi_().alert(report); }
  return report;
}

// ========== 5) SINGLE CASE GENERATOR (also used by batch) ==========

function runSingleCaseFromSidebar(inputSheetName, outputSheetName, row) {
  const ss = SpreadsheetApp.getActive();

  // Define the input and output sheets first
  const inSheet = ss.getSheetByName(inputSheetName);
  let outSheet = ss.getSheetByName(outputSheetName);

  // ⭐ Dynamic output sheet detection
  const settingsSheet = ss.getSheetByName('Settings');
  const settingsOut = settingsSheet ? settingsSheet.getRange('A1').getValue() : '';
  if (settingsOut) outSheet = ss.getSheetByName(settingsOut) || outSheet;

  // Validate
  if (!inSheet || !outSheet) throw new Error('❌ Could not find selected sheets.');

  cacheHeaders(outSheet);
  const result = processOneInputRow_(inSheet, outSheet, row, /*batchMode*/ false);

  // Note: Toast disabled for sidebar operations - sidebar logs provide feedback
  // if (result.message) {
  //   showToast(result.message, 3);
  // }

  return result.message;
}




// === CLINICAL DEFAULTS: Fill missing vitals with medically realistic values ===
/**
 * Applies clinical defaults to any missing Monitor_Vital_Signs fields.
 * Called during batch processing to ensure every scenario has complete vitals.
 *
 * Strategy:
 * - Baseline vitals: HR 75, BP 120/80, RR 16, Temp 37.0, SpO2 98, EtCO2 35
 * - Critical scenarios (detected by keywords): Elevated baseline
 * - State progression: Gradual improvement from State1 → State5
 * - Metadata: Standard monitoring setup
 */
function applyClinicalDefaults_(parsed, mergedKeys) {
  Logger.log('🩺 Applying clinical defaults for missing vitals...');

  // Baseline vitals (stable adult)
  const BASELINE = {
    HR: 75,
    BP: '120/80',
    RR: 16,
    Temp: 37.0,
    SpO2: 98,
    EtCO2: 35
  };

  // Critical scenario baseline (elevated)
  const CRITICAL_BASELINE = {
    HR: 110,
    BP: '90/60',
    RR: 24,
    Temp: 37.0,
    SpO2: 92,
    EtCO2: 32
  };

  // Check if this is a critical scenario
  const title = (parsed['Case_Organization:Spark_Title'] || '').toLowerCase();
  const category = (parsed['Case_Organization:Category'] || '').toLowerCase();
  const desc = (parsed['Case_Organization:Formal_Description'] || '').toLowerCase();
  const context = title + ' ' + category + ' ' + desc;

  const isCritical = /cardiac|arrest|shock|trauma|sepsis|stroke|critical|emergency|unstable/i.test(context);

  const baseVitals = isCritical ? CRITICAL_BASELINE : BASELINE;

  if (isCritical) {
    Logger.log('  📊 Critical scenario detected - using elevated baseline');
  }

  // Metadata fields (always fill if missing)
  const metadata = {
    'Monitor_Vital_Signs:Vitals_Format': 'Compact JSON (HR, BP, RR, Temp, SpO2, EtCO2)',
    'Monitor_Vital_Signs:Vitals_API_Target': 'resusmonitor.com/api/vitals',
    'Monitor_Vital_Signs:Vitals_Update_Frequency': '5 seconds',
    'Situation_and_Environment_Details:Initial_Monitoring_Status': 'Standard 5-lead ECG, pulse oximetry, NIBP'
  };

  Object.keys(metadata).forEach(function(key) {
    if (!parsed[key] || parsed[key] === 'N/A' || parsed[key] === '') {
      parsed[key] = metadata[key];
      Logger.log('  ✅ Set ' + key);
    }
  });

  // Vitals states with progression
  const vitalsStates = [
    { key: 'Monitor_Vital_Signs:Initial_Vitals', multiplier: 1.0, desc: 'Initial' },
    { key: 'Monitor_Vital_Signs:State1_Vitals', multiplier: 1.1, desc: 'State 1 (worsening)' },
    { key: 'Monitor_Vital_Signs:State2_Vitals', multiplier: 1.05, desc: 'State 2 (stabilizing)' },
    { key: 'Monitor_Vital_Signs:State3_Vitals', multiplier: 0.95, desc: 'State 3 (improving)' },
    { key: 'Monitor_Vital_Signs:State4_Vitals', multiplier: 0.9, desc: 'State 4 (responding)' },
    { key: 'Monitor_Vital_Signs:State5_Vitals', multiplier: 0.85, desc: 'State 5 (resolving)' }
  ];

  vitalsStates.forEach(function(state) {
    if (!parsed[state.key] || parsed[state.key] === 'N/A' || parsed[state.key] === '') {
      // Create vitals object with progression
      var vitals = {
        HR: Math.round(baseVitals.HR * state.multiplier),
        BP: baseVitals.BP,
        RR: baseVitals.RR,
        Temp: baseVitals.Temp,
        SpO2: baseVitals.SpO2,
        EtCO2: baseVitals.EtCO2
      };

      // Adjust other vitals based on HR change
      if (state.multiplier > 1.0) {
        // Worsening: Lower SpO2, higher RR
        vitals.SpO2 = Math.max(88, baseVitals.SpO2 - Math.round((state.multiplier - 1) * 100));
        vitals.RR = baseVitals.RR + Math.round((state.multiplier - 1) * 20);
      } else if (state.multiplier < 1.0) {
        // Improving: Return to baseline
        vitals.SpO2 = Math.min(98, baseVitals.SpO2 + Math.round((1 - state.multiplier) * 20));
        vitals.BP = BASELINE.BP; // Return to normal BP
      }

      // Final state returns to true baseline
      if (state.key.includes('State5')) {
        vitals = {
          HR: BASELINE.HR,
          BP: BASELINE.BP,
          RR: BASELINE.RR,
          Temp: BASELINE.Temp,
          SpO2: BASELINE.SpO2,
          EtCO2: BASELINE.EtCO2
        };
      }

      parsed[state.key] = JSON.stringify(vitals);
      Logger.log('  ✅ Generated ' + state.desc + ': ' + parsed[state.key]);
    }
  });

  Logger.log('✅ Clinical defaults complete');
  return parsed;
}

function processOneInputRow_(inputSheet, outputSheet, inputRow, batchMode) {
  try {
    // --- Read inputs per row: A=Formal_Info, B=HTML, C=DOC, D=Extra (any may be blank) ---
    const formal = String(inputSheet.getRange(inputRow, 1).getValue() || '');
    const html   = String(inputSheet.getRange(inputRow, 2).getValue() || '');
    const docRaw = String(inputSheet.getRange(inputRow, 3).getValue() || '');
    const extra  = String(inputSheet.getRange(inputRow, 4).getValue() || '');

    if (!formal && !html && !docRaw && !extra) {
      return { skipped: true, message: `Row ${inputRow}: no input.` };
    }

    appendLogSafe(`▶️ Starting conversion for Row ${inputRow} (batchMode=${batchMode})`);

    // --- Calculate content signature (always needed for writing) ---
    const sniff = (formal + '\n' + html + '\n' + docRaw + '\n' + extra).slice(0, 1000);
    const sig = hashText(sniff);

    // --- Duplicate check against output content signature (unless force reprocess enabled) ---
    const forceReprocess = getProp('FORCE_REPROCESS', '0') === '1';
    if (!forceReprocess) {
      const allOut = outputSheet.getDataRange().getValues().flat().join('\n');
      if (allOut.indexOf(sig) !== -1) {
        return { skipped: true, duplicate: true, message: `Row ${inputRow}: duplicate (hash match).` };
      }
    } else {
      appendLogSafe(`🔄 Force reprocess enabled - skipping duplicate check for Row ${inputRow}`);
    }

    // --- Clean + setup ---
    const cleanedDoc = cleanDuplicateLines(docRaw);
    const { header1, header2 } = getCachedHeadersOrRead(outputSheet);
    const mergedKeys = mergedKeysFromTwoTiers_(header1, header2);
    const exampleRow = outputSheet.getRange(3, 1, 1, outputSheet.getLastColumn()).getValues()[0];

    const hardReq = `Hard requirement: You must include every key exactly as listed in the header pairs. Use "N/A" only when truly unknown or not applicable. Avoid inventing URLs.`;
        // --- Build AI example context from Rows 3 & 4 (distinct complete simulations) ---
    function buildExampleJSON(rowValues) {
      const obj = {};
      mergedKeys.forEach((key, i) => {
        const val = rowValues[i];
        if (val && val !== 'N/A' && String(val).trim() !== '') {
          obj[key] = val;
        }
      });
      return obj;
    }

    let exampleJson1 = '{}';
    let exampleJson2 = '{}';

    try {
      const exampleRow1 = outputSheet.getRange(3, 1, 1, outputSheet.getLastColumn()).getValues()[0];
      const exampleRow2 = outputSheet.getRange(4, 1, 1, outputSheet.getLastColumn()).getValues()[0];

      const data1 = buildExampleJSON(exampleRow1);
      const data2 = buildExampleJSON(exampleRow2);

      // --- Fallback demo if both are nearly empty ---
      const isEmpty = (obj) => Object.keys(obj).length < 5;
      const demoCase = {
        "Case_Organization:Case_ID": "DEMO001",
        "Case_Organization:Spark_Title": "Chest Pain (45 M): Sudden Tightness",
        "Monitor_Vital_Signs:Initial_Vitals": {"HR":118,"BP":"92/58","RR":28,"Temp":37.9,"SpO2":93},
        "Progression_States": ["Arrival","Oxygen","Stabilization"],
        "Decision_Nodes_JSON": [
          {
            "at_state": "Arrival",
            "decision": "Administer oxygen?",
            "options": [
              {"choice":"Yes","next_state":"Oxygen","rationale":"Improves hypoxia"},
              {"choice":"No","next_state":"Worsening","rationale":"SpO2 continues to drop"}
            ]
          }
        ]
      };

      if (isEmpty(data1)) exampleJson1 = JSON.stringify(demoCase, null, 2);
      else exampleJson1 = JSON.stringify(data1, null, 2);

      if (isEmpty(data2)) exampleJson2 = JSON.stringify(demoCase, null, 2);
      else exampleJson2 = JSON.stringify(data2, null, 2);

    } catch (err) {
      Logger.log('⚠️ Example-row build error: ' + err);
      exampleJson1 = JSON.stringify({
        "Case_Organization:Case_ID": "DEMO_FALLBACK",
        "Monitor_Vital_Signs:Initial_Vitals": {"HR":100,"BP":"110/70","RR":18,"Temp":36.8,"SpO2":98}
      }, null, 2);
      exampleJson2 = exampleJson1;
    }
    const systemPrompt = `
📘 **Sim Mastery AI Prompt for Google Sheet CSV Row Generation**

You are an expert simulation designer helping build **Sim Mastery** — an emotionally resonant, AI-facilitated, high-fidelity emergency-medicine simulation platform.  
This tool is used by clinicians to sharpen real-time decision-making and learn through immersive, branching, lifelike emergencies.

---

💡 **Objective**
Create a **one-row Google Sheet simulation case** that is:
• Unique to the given content  
• Clinically sound  
• Narratively immersive  
• Technically compatible with the Sim Mastery CSV  
• Valuable to the learner both intellectually and emotionally  

---

🧠 **Philosophy**
• Help the learner *feel* what it’s like to manage chaos  
• Give just enough guidance — do not spoon-feed  
• Reflect real-world uncertainty and triumph  
• Be emotionally anchored, educationally sound, and uplifting  

---

🩺 **Vitals Format (Compact JSON)**
\`{"HR":120, "BP":"95/60", "RR":28, "Temp":39.2, "SpO2":94}\`

---

🪄 **Tone & Style**
• Professional but warm  
• Support learner growth through tension and curiosity  
• Fun yet respectful of medicine’s seriousness  
• Use best practices of professional simulation facilitators  

---

🧪 **You Will Output**
• A single JSON object mapping directly to columns of the Google Sheet  
• Use the header1 and header2 context to align structure  
• If a cell value is missing, use "N/A" (especially for any Media_URL field)  
• Do **not** copy prior case content  
Generate a completely new simulation inspired by the HTML and DOC input  

---

✨ **Inputs Provided**
• header1 (Tier-1 categories)  
• header2 (Tier-2 column labels)  
• Example rows for structure only (Rows 3 and 4)  
• New HTML & DOC text as inspiration  

---

🔭 **Simulation Semantics & Branching (Read Carefully)**

1️⃣ **Row-level semantics**  
- Treat this row as ONE complete simulation case.  
- Each row is independent and self-contained (**rows = semantics**).  
- Columns define structure (**headers = schema**).  
- All content must form a single, coherent story for this row.  

2️⃣ **Branching model (state machine)**  
- Define ordered Progression_States and Decision_Nodes_JSON with clinician decisions and outcomes.  
- Each state updates the clinical picture and **vitals** (compact JSON).  
- Example: \`{"HR":110,"BP":"112/68","RR":24,"Temp":38.2,"SpO2":93}\`  

3️⃣ **Coherence & consequences**  
- Decisions must have meaningful effects.  
- Ensure logical paths and realistic values.  

4️⃣ **Data discipline**  
- Use exact merged keys \`Tier1:Tier2\`.  
- Use "N/A" only when truly not applicable.  
- Never invent URLs.  
- Prefer structured JSON for vitals/monitor/decision fields.  

5️⃣ **Inputs to respect**  
- Use only FORMAL INFO, HTML, DOC, and EXTRA NOTES.  
- Anchor physiology and logic to those inputs.  

6️⃣ **Quality guardrails**  
- Pre-diagnosis: exploratory, hypothesis-driven.  
- Post-diagnosis: clear, educational, learning-point focused.  
- Quiz/education columns must align with decision logic and outcomes.  

---

### 🧩 **Example Completed Cases**

Below are two example cases showing the complete structure and style of finished simulations.  
Each is unique and represents its own independent case.

**Example Case 1 (Row 3):**  
${exampleJson1}

**Example Case 2 (Row 4):**  
${exampleJson2}

---

### 🤖 **FUTURE USE CONTEXT (VERY IMPORTANT)**

The data you generate will be consumed by two systems working together:

1. **Sim Mastery Engine**  
   - The core platform that converts this CSV into an interactive, voice-responsive simulation.  
   - It interprets each field as part of a larger, branching clinical scenario.  
   - Clinicians will interact via mobile or desktop, speaking or selecting real-time decisions (e.g., "push epi", "order CT", "intubate").  
   - The system will narrate, animate, and respond dynamically based on your structured output.

2. **ResusVitals API**  
   - A specialized vitals engine that dynamically updates the patient’s physiological parameters during simulation.  
   - It reads from any field containing “Vitals” or “Monitor” and interprets your compact nested JSON (e.g., {"HR":120,"BP":"95/60","RR":28,"Temp":39.2,"SpO2":94}).  
   - Vitals change as states and decisions progress (State0 → State1 → State2, etc.).

Your role:  
• Treat this output as a **modular simulation blueprint**.  
• Each “row” is a self-contained scenario that future AI systems can reconstruct and run dynamically.  
• Each column is a structured data node used for narration, decision trees, vitals, scoring, and learning objectives.  
• Prioritize **machine-readability**, **coherence**, and **educational realism**.  

---
Return your response **strictly as valid JSON** following this structure.  
Do not include commentary, markdown, or text outside the JSON object.  
`.trim();

// --- Generate (force-JSON) & validate ---
const model = getProp(SP_KEYS.MODEL, DEFAULT_MODEL);
appendLogSafe('🤖 Calling OpenAI to generate scenario...');
const aiResp = batchMode
  ? callOpenAiJson(model, systemPrompt)
  : callOpenAI(systemPrompt, DEFAULT_TEMP_SINGLE);
appendLogSafe('✅ Received OpenAI response, processing...');

// --- Extract and sanitize JSON text ---
let aiText = '';

if (batchMode) {
  aiText = JSON.stringify(aiResp);
} else {
  // callOpenAI() returns raw text
  aiText = typeof aiResp === 'string'
    ? aiResp.trim()
    : aiResp?.choices?.[0]?.message?.content?.trim() || '';
}

// Remove markdown fences or stray text before/after JSON
aiText = aiText
  .replace(/^```(?:json)?/i, '')  // remove ```json or ```
  .replace(/```$/i, '')           // remove trailing ```
  .replace(/^[^{[]+/, '')         // remove anything before { or [
  .replace(/[^}\]]+$/, '');       // remove anything after } or ]

const parsed = tryParseJSON(aiText);
appendLogSafe('📝 Parsing AI response and extracting fields...');

// --- Debug helper: split long AI responses safely for logging ---
function logLong_(label, text) {
  const chunkSize = 9000; // avoid truncation in Apps Script logs
  for (let i = 0; i < text.length; i += chunkSize) {
    Logger.log(`${label} [${i / chunkSize + 1}]:\n` + text.slice(i, i + chunkSize));
  }
}

if (!parsed || typeof parsed !== 'object') {
  logLong(`❌ Row ${inputRow} — AI raw output`, typeof aiResp === 'string' ? aiResp : JSON.stringify(aiResp, null, 2));
  appendLogSafe(`❌ Row ${inputRow}: AI JSON parse fail. See full output above.`);
  return { error: true, message: `Row ${inputRow}: AI JSON parse fail.` };
}

appendLogSafe(`🤖 AI response parsed successfully for Row ${inputRow}`);

// --- Validate/normalize vitals across any key containing 'vitals' or 'monitor' ---
const vitalsCheck = validateVitalsFields_(parsed, mergedKeys);
if (!vitalsCheck.valid) {
  const warnText = vitalsCheck.warnings.join(' | ');
  Logger.log('⚠️ Vitals/Monitor validation: ' + warnText);
  appendLogSafe('⚠️ ' + warnText);
}

// Log parsed field count for transparency
Logger.log(`✅ Parsed ${Object.keys(parsed).length} keys for Row ${inputRow}`);

  // --- Apply clinical defaults for missing vitals ---
  applyClinicalDefaults_(parsed, mergedKeys);

  // --- Compact vitals if needed (object -> one-line JSON) ---
mergedKeys.forEach(k => {
  if (/vitals|monitor/i.test(k)) {
    if (parsed[k] && typeof parsed[k] === 'object') parsed[k] = JSON.stringify(parsed[k]);
    if (typeof parsed[k] === 'string') parsed[k] = parsed[k].trim();
  }
});
    // --- Inject Image Sync defaults if empty ---
    const imgDefaults = JSON.parse(getProp(SP_KEYS.IMG_SYNC_DEFAULTS, '{}') || '{}');
    Object.keys(parsed).forEach(k => {
      if (/^Image_Sync:/i.test(k)) {
        const v = parsed[k];
        if (v === undefined || v === null || v === '') {
          if (imgDefaults[k] !== undefined) parsed[k] = imgDefaults[k];
        }
      }
    });

// --- Build output row (intelligent tiered matching) ---
const rowValues = mergedKeys.map(k => {
  const val = extractValueFromParsed_(parsed, k);
  return (val !== undefined && val !== null && String(val).trim() !== '') ? val : 'N/A';
});

// --- Store signature in meta column (if Conversion_Status exists) ---
const metaIdx = header2.indexOf('Conversion_Status');
if (metaIdx > -1) {
  const k = `${header1[metaIdx]}:${header2[metaIdx]}`;
  const idx = mergedKeys.indexOf(k);
  if (idx > -1) {
    rowValues[idx] = (rowValues[idx] && rowValues[idx] !== 'N/A') ? `${rowValues[idx]} | ${sig}` : sig;
  }
}





// --- Append row ---
appendLogSafe(`📤 Writing results for Row ${inputRow} to "${outputSheet.getName()}"`);
appendLogSafe('💾 Writing scenario to Master Scenario Convert...');
outputSheet.appendRow(rowValues);
appendLogSafe('✅ Row created successfully');
appendLogSafe(`✅ Row ${inputRow} successfully written to sheet.`);
// --- Always log parsed keys to sidebar for transparency ---
try {
  const keys = Object.keys(parsed || {});
  const naCount = rowValues.filter(v => v === 'N/A').length;
  const naRatio = naCount / (rowValues.length || 1);
  const missingKeys = mergedKeys.filter(k => !keys.includes(k));
  const preview = JSON.stringify(parsed, null, 2).slice(0, 400); // short snippet

  let message = `📄 Row ${inputRow} summary:\n`;
  message += `Detected keys: ${keys.join(', ') || 'none'}\n`;
  message += missingKeys.length ? `Missing keys: ${missingKeys.join(', ')}\n` : '';
  message += `N/A ratio: ${(naRatio * 100).toFixed(0)}%\n`;
  message += `Preview:\n${preview}`;

  if (typeof appendLog === 'function') appendLog(message);
  Logger.log(message);
} catch (debugErr) {
  Logger.log('Debug logging failed: ' + debugErr);
}

// --- Skip quality scoring if row is empty or all N/A ---
if (!rowValues || rowValues.every(v => v === 'N/A')) {
  Logger.log(`⚠️ Skipping quality scoring for Row ${inputRow}: all N/A`);
  return { created: true, message: `Row ${inputRow}: Created (all N/A)` };
}

    // --- Quality scoring + suggestions ---
    try {
      const { header1, header2 } = getCachedHeadersOrRead(outputSheet);
      const mergedKeys = mergedKeysFromTwoTiers_(header1, header2);
      const newRowIndex = outputSheet.getLastRow();
      const quality = evaluateSimulationQuality(rowValues, mergedKeys);
      attachQualityToRow_(outputSheet, newRowIndex, mergedKeys, rowValues, quality);
    } catch (_) {
      // Non-fatal: quality write is best-effort
    }

    // --- Cost estimate ---
    const cost = estimateCostUSD(systemPrompt, aiText);
    return { created: true, message: `Row ${inputRow}: Created. (~$${cost.toFixed(2)})`, cost };

  } catch (e) {
    return { error: true, message: `Row ${inputRow}: Error — ${e.message}` };
  }
} // closes processOneInputRow_()


// ========== 6) ATSR — Titles & Summary (Keep & Regenerate, Deselect, Memory) ==========

// ══════════════════════════════════════════════════════════════════════════════
// ATSR TITLE OPTIMIZER v2 - COMPLETE IMPLEMENTATION
// Mystery Button Feature + Progressive Title Obscuration
// Updated: 2025-11-06T21:41:37.871Z
// Features: 11/11 (Memory Anchors, Mystery Button, Sim Mastery, Quality Criteria)
// ══════════════════════════════════════════════════════════════════════════════

// ========== 6) ATSR — Titles & Summary (Keep & Regenerate, Deselect, Memory) ==========

// ══════════════════════════════════════════════════════════════════════════════
// ATSR TITLE OPTIMIZER v2 - COMPLETE IMPLEMENTATION
// Mystery Button Feature + Progressive Title Obscuration
// Updated: 2025-11-06T21:48:40.008Z
// Features: 11/11 (Memory Anchors, Mystery Button, Sim Mastery, Quality Criteria)
// ══════════════════════════════════════════════════════════════════════════════

// ========== 6) ATSR — Titles & Summary (Keep & Regenerate, Deselect, Memory) ==========

function runATSRTitleGenerator(continueRow, keepSelections) {
  const ss = SpreadsheetApp.getActive();
  const sheet = pickMasterSheet_();
  if (!sheet) { getSafeUi_().alert('❌ Master Scenario CSV not found.'); return; }

  let row = continueRow;
  const ui = getSafeUi_();
  if (!row) {
    const resp = ui.prompt('Enter the row number for ATSR:', ui.ButtonSet.OK_CANCEL);
    if (resp.getSelectedButton() !== ui.Button.OK) return;
    row = parseInt(resp.getResponseText(),10);
  }
  if (isNaN(row) || row < 3) { ui.alert('Row must be ≥ 3.'); return; }

  const headers = sheet.getRange(2,1,1,sheet.getLastColumn()).getValues()[0];
  const values  = sheet.getRange(row,1,1,sheet.getLastColumn()).getValues()[0];
  const data = Object.fromEntries(headers.map((h,i)=>[h, values[i]]));

  // Limit context to avoid token overflow
  const usedMemory = getProp(SP_KEYS.USED_MOTIFS,'').substring(0, 300);

  // Extract only essential fields for ATSR generation
  const age = data['Patient_Demographics_and_Clinical_Data_Age'] || '';
  const gender = data['Patient_Demographics_and_Clinical_Data_Gender'] || '';
  const presenting = data['Patient_Demographics_and_Clinical_Data_Presenting_Complaint'] || '';
  const vignette = data['Set_the_Stage_Context_Clinical_Vignette'] || '';
  const why = data['Set_the_Stage_Context_Why_It_Matters'] || '';
  const goal = data['Set_the_Stage_Context_Educational_Goal'] || '';

  const caseDataFormatted = `
Age: ${age}
Gender: ${gender}
Chief Complaint: ${presenting}
Clinical Vignette: ${vignette}
Educational Goal: ${goal}
Why It Matters: ${why}`.trim();

  // ========== ENHANCED RICH PROMPT WITH SIM MASTERY PHILOSOPHY ==========
  const prompt = `
📘 **Sim Mastery ATSR — Automated Titles, Summary & Review Generator**

You are an expert simulation designer and marketing genius helping build **Sim Mastery** — an emotionally resonant, AI-facilitated, high-fidelity emergency-medicine simulation platform.

Your task is to create compelling, clinically accurate, and emotionally engaging titles and summaries for a medical simulation case that will be used by emergency medicine clinicians to sharpen their real-time decision-making skills.

---

## 🧠 **Core Philosophy: Sim Mastery Values**

• **Emotionally Resonant**: Help learners *feel* what it's like to manage chaos and experience triumph
• **Clinically Sound**: Every detail must be medically accurate and educationally valuable
• **Narratively Immersive**: Create intrigue, tension, and curiosity
• **Human-Centered**: Focus on the person behind the patient, not just the diagnosis
• **Growth-Oriented**: Support learner development through challenge and success
• **Professionally Warm**: Fun yet respectful of medicine's seriousness

---

## 🎯 **Your Task: Create 4 Components**

### 1. **Spark Titles** (5 variations)
**Purpose**: Pre-sim mystery teaser that sells the learning experience WITHOUT spoiling the diagnosis

**Format**:
\`"<Chief Complaint> (<Age Sex>): <Emotionally Urgent Spark Phrase>"\`

**Examples**:
✅ "Chest Pain (47 M): Dizzy, Sweaty, and Terrified"
✅ "Shortness of Breath (5 F): Gasping After Birthday Cake"
✅ "Abdominal Pain (28 F): Pregnant and Worsening Fast"

**Rules**:
- NO diagnosis mentioned (no "MI", "anaphylaxis", "appendicitis")
- Observable symptoms only (what you see/hear)
- Emotionally urgent language ("terrified", "gasping", "worsening")
- Human details (age, gender, context clues)
- Create intrigue without spoiling the mystery

**Quality Criteria**:
- Would an EM clinician FEEL the urgency?
- Does it create curiosity without revealing the answer?
- Is it specific enough to paint a vivid picture?
- Does it respect the patient's humanity?

---

### 2. **Reveal Titles** (5 variations)
**Purpose**: Post-sim reinforcement that celebrates the diagnosis and learning objective

**Format**:
\`"<Diagnosis> (<Age Sex>): <Key Learning Objective or Clinical Pearl>"\`

**Examples**:
✅ "Acute MI (55 M): Recognizing Atypical Presentations"
✅ "Anaphylaxis (8 M): Epinephrine Technique Saves Lives"
✅ "Ectopic Pregnancy (28 F): The One Test You Can't Skip"

**Rules**:
- Diagnosis IS revealed (this is post-sim)
- Focus on the KEY teaching point or clinical pearl
- Emphasize what the learner will MASTER
- Clinical accuracy is critical
- Actionable takeaway (not just knowledge, but skill)

**Quality Criteria**:
- Does it reinforce the critical learning objective?
- Would the learner feel PROUD to have mastered this?
- Is the clinical pearl specific and actionable?
- Does it emphasize competence and growth?

---



### 3. **Memory Anchors** (10 unique, unforgettable patient identifiers)

**Purpose**: Help clinicians remember patients the way ED doctors naturally do - by distinctive, memorable details.

**Philosophy**: ED doctors don't remember patients by medical details. They remember:
- "The tall skinny guy in overalls"
- "Lady who doesn't like to shave her legs"
- "SVT patient who's actually the sleep medicine doctor at our hospital"
- "Methadone patient with facial tattoos"
- "Kind lady holding a book"
- "Pleasant spouse who stood when I came in"

**Memory Anchor Categories & Examples**:

**A) Visual Appearance**:
- Very sweaty face, pale complexion
- Faded grey shirt with coffee stain
- Unkempt appearance with bag of clothes
- Unusual hair color/style
- Distinctive facial features
- Visible tattoos (location/theme)
- Piercings or jewelry

**B) Apparel & Accessories**:
- AC/DC "Thunderstruck" concert t-shirt
- BYU baseball cap (clearly a die-hard fan)
- Sports team jersey (Lakers, Yankees, etc.)
- Medical scrubs (works in healthcare)
- Business suit (professional)
- Vintage band t-shirt
- Designer purse/bag
- Small dog in carrier

**C) Olfactory (Smell)**:
- Pungent body odor
- Heavy perfume/cologne
- Cigarette smoke smell
- Alcohol on breath
- Fresh coffee smell

**D) Behavioral/Personality**:
- Annoyingly loud 3-year-old screaming in corner
- Quiet and withdrawn, avoiding eye contact
- Extremely talkative
- Constantly on phone
- Reading a specific book
- Doing crossword puzzle
- Nervous hand-wringing

**E) Family/Social Context**:
- Twin kids with patient
- Huge family of 8 in the room
- Daughter is an ER nurse (specify specialty)
- Son translating (language barrier)
- Service dog present
- Worried spouse holding hand
- Teenager rolling eyes

**F) Occupation Clues**:
- Carpenter (sawdust on clothes)
- Teacher (grading papers)
- Chef (kitchen burns on hands)
- Nurse (works at same hospital)
- Construction worker (hard hat)

**G) Contextual/Situational**:
- Came directly from gym
- Still in pajamas at 3pm
- Wearing hiking gear
- Wedding ring tan line (divorced)
- Military uniform/veteran

**Rules for Memory Anchors**:
1. **Highly specific**: "BYU baseball cap" not "wearing a hat"
2. **Memorable**: Strong visual/sensory detail
3. **Diverse**: Mix categories (visual, smell, behavior, context)
4. **Stereotype-aware**: Use stereotypes clinicians naturally use (tall, unkempt, loud, etc.)
5. **Personality-focused**: Adds human dimension to medical encounter
6. **Personality-rich**: Kind, pleasant, annoying, withdrawn, talkative
7. **Unique per patient**: NO reuse of anchors across cases
8. **Culturally varied**: Different ethnicities, backgrounds, professions
9. **Medically neutral**: NOT about the diagnosis itself
10. **Unforgettable**: Would make you say "Oh yeah, I remember that patient!"

**Examples of STRONG Memory Anchors**:
✅ "Very sweaty face, pale complexion, looks terrified"
✅ "Wearing AC/DC 'Thunderstruck' concert t-shirt, vintage 1990"
✅ "Annoyingly loud 3-year-old screaming in corner (mom looks exhausted)"
✅ "Pleasant elderly man who stood up to shake my hand with firm grip"
✅ "Strong smell of cigarette smoke, yellow-stained fingers, smoker's voice"
✅ "Daughter is an ICU nurse at University Hospital (asking detailed questions)"
✅ "Huge family of 8 people crowding tiny room (all talking at once)"
✅ "Small yappy Chihuahua in designer Louis Vuitton purse (won't stop barking)"
✅ "Wearing faded grey 'World's Best Grandpa' shirt with coffee stain"
✅ "BYU baseball cap (clearly die-hard fan, keeps talking about last game)"

**Examples of WEAK Memory Anchors** (avoid these):
❌ "Middle-aged male"
❌ "Overweight"
❌ "Has diabetes"
❌ "Chest pain patient"
❌ "Anxious"

**Output Format**:
Provide 10 Memory Anchors that:
- Are ALL different categories/types
- Are ALL unforgettable
- Are ALL specific and vivid
- Avoid reusing any motifs from: ${usedMemory}
- Create unique, case-appropriate memory anchors based on the case data above

**Quality Check**:
- Would an ED doctor remember this patient by this detail? ✅
- Is it vivid enough to picture in your mind? ✅
- Is it different from the other 9 anchors? ✅
- Does it add personality to the encounter? ✅

---
### 4. **Case Summary** (Structured narrative)
**Purpose**: Concise, compelling summary that sells the value and humanizes the patient

**Components**:

**A) Patient_Summary** (3 sentences - CLINICAL HANDOFF STYLE):
- Write like an ED doctor admitting to a hospitalist
- GET TO THE POINT - diagnosis, presentation, key findings, disposition
- NO mystery, NO drama - just the clinical facts
- Include: chief complaint, vitals/exam findings, workup/diagnosis, management/disposition

**Examples**:
✅ "55M presents with acute substernal chest pain while shoveling snow. EKG shows STEMI, troponin elevated. Cath lab activated, given aspirin/heparin, admitted to CCU."
✅ "8M with anaphylaxis after peanut exposure at birthday party. Presented with facial swelling, stridor, hypotension. IM epi given x2, improved, admitted for observation."
✅ "72F fell at home, hip pain, unable to bear weight. X-ray confirms femoral neck fracture. Orthopedics consulted, scheduled for ORIF in AM."

**B) Key_Intervention** (Short phrase):
- The ONE action that changes the outcome
- Specific, actionable, memorable
- Focus on WHAT to do, not just WHY

**Examples**:
✅ "Immediate epinephrine (correct IM technique)"
✅ "Early aspirin + cath lab activation"
✅ "Surgical consult within 2 hours"

**C) Core_Takeaway** (Short phrase):
- The clinical pearl they'll remember forever
- Specific to THIS case
- Actionable and confidence-building

**Examples**:
✅ "Atypical presentations kill—always consider cardiac"
✅ "Epi first, questions later—timing saves lives"
✅ "Beta-hCG in all women of childbearing age"

**D) Defining_Characteristic_Options** (5 unique, humanizing details):
- Patient descriptors that add humanity and memorability
- Avoid clichés and overused motifs
- Make each case feel REAL and distinct
- Mix physical, emotional, and contextual details

**Examples**:
✅ "Retired firefighter who's 'never been sick a day in his life'"
✅ "Soccer mom rushing from practice still in her coaching gear"
✅ "College student studying for finals, chugging energy drinks"
✅ "Grandmother who walked 3 blocks to the ED because she 'didn't want to bother anyone'"
✅ "Construction worker who delayed coming in because he 'thought it was just heartburn'"

**Rules for Defining Characteristics**:
- Avoid motifs already used: ${usedMemory}
- Each one should paint a distinct picture
- Balance vulnerability with strength
- Include context clues (occupation, activity, mindset)
- Make the learner CARE about the patient

---

## 📋 **Context from This Case**

**Case Data** (Header: Value pairs from Google Sheet):
${caseDataFormatted}

**Motifs Already Used** (avoid these):
${usedMemory || 'None yet'}

---

## 🎨 **Tone & Style Guidelines**

**DO**:
✅ Use emotionally urgent language ("terrified", "gasping", "worsening fast")
✅ Focus on observable symptoms and human context
✅ Create intrigue and tension in Spark Titles
✅ Emphasize mastery and clinical pearls in Reveal Titles
✅ Make every detail clinically accurate and educationally sound
✅ Humanize the patient with specific, memorable details
✅ Paint vivid pictures that make the learner FEEL the scenario
✅ Use professional medical terminology appropriately

**DON'T**:
❌ Spoil the diagnosis in Spark Titles
❌ Use clichés or overused phrases
❌ Include medical jargon that obscures the human story
❌ Create generic, forgettable descriptions
❌ Duplicate existing motifs or patterns
❌ Sacrifice clinical accuracy for drama
❌ Make light of serious medical situations

---

## 🧪 **Quality Checklist**

Before finalizing your output, verify:

**Spark Titles**:
- [ ] NO diagnosis revealed
- [ ] Emotionally urgent and engaging
- [ ] Observable symptoms only
- [ ] Creates curiosity and tension
- [ ] Human context included

**Reveal Titles**:
- [ ] Diagnosis clearly stated
- [ ] Key learning objective emphasized
- [ ] Actionable clinical pearl
- [ ] Reinforces competence and mastery
- [ ] Clinically accurate

**Case IDs**:
- [ ] Correct format (7-8 chars)
- [ ] System prefix matches case
- [ ] Uppercase letters + digits
- [ ] Unique and memorable
- [ ] No duplication

**Case Summary**:
- [ ] Patient_Summary paints vivid picture
- [ ] Key_Intervention is specific and actionable
- [ ] Core_Takeaway is memorable and valuable
- [ ] Defining_Characteristics are unique and humanizing
- [ ] No clichés or overused motifs
- [ ] Emotionally resonant and clinically sound

---

## 📤 **Output Format (JSON)**

{
  "Spark_Titles": [
    "<Symptom> (<Age Sex>): <Spark Phrase>",
    "<Symptom> (<Age Sex>): <Spark Phrase>",
    "<Symptom> (<Age Sex>): <Spark Phrase>",
    "<Symptom> (<Age Sex>): <Spark Phrase>",
    "<Symptom> (<Age Sex>): <Spark Phrase>"
  ],
  "Reveal_Titles": [
    "<Diagnosis> (<Age Sex>): <Learning Objective>",
    "<Diagnosis> (<Age Sex>): <Learning Objective>",
    "<Diagnosis> (<Age Sex>): <Learning Objective>",
    "<Diagnosis> (<Age Sex>): <Learning Objective>",
    "<Diagnosis> (<Age Sex>): <Learning Objective>"
  ],
  "Memory_Anchors": [
    "Unforgettable patient detail #1",
    "Unforgettable patient detail #2",
    "Unforgettable patient detail #3",
    "Unforgettable patient detail #4",
    "Unforgettable patient detail #5",
    "Unforgettable patient detail #6",
    "Unforgettable patient detail #7",
    "Unforgettable patient detail #8",
    "Unforgettable patient detail #9",
    "Unforgettable patient detail #10"
  ],
  "Case_Summary": {
    "Patient_Summary": "A vivid 1-2 sentence description combining clinical urgency with human context, painting a clear picture of the scenario.",
    "Key_Intervention": "The ONE specific action that changes the outcome",
    "Core_Takeaway": "The clinical pearl they'll remember forever",
    "Defining_Characteristic_Options": [
      "Unique humanizing detail #1",
      "Unique humanizing detail #2",
      "Unique humanizing detail #3",
      "Unique humanizing detail #4",
      "Unique humanizing detail #5"
    ]
  }
}

---

## 🎯 **Final Reminder: The Sim Mastery Standard**

You're not just creating titles and summaries—you're crafting learning experiences that will stay with clinicians throughout their careers. Every word matters. Every detail should serve both the educational objective AND the emotional resonance.

Make this case:
• Unforgettable
• Clinically impeccable
• Emotionally powerful
• Educationally transformative

Now create your output. Make it AMAZING. 🚀
`;

  // ========== END OF ENHANCED PROMPT ==========

  Logger.log('📊 Prompt length: ' + prompt.length + ' characters');
  Logger.log('📊 Case data length: ' + caseDataFormatted.length + ' characters');

  const ai = callOpenAI(prompt, 0.7); // Temperature 0.7 for creative but consistent output
  Logger.log('📝 AI response length: ' + ai.length + ' characters');
  Logger.log('📝 AI response preview: ' + ai.substring(0, 500));

  const parsed = parseATSRResponse_(ai);
  if (!parsed) {
    Logger.log('❌ Failed to parse AI response');
    ui.alert('⚠️ ATSR parse error:\n'+ai.substring(0, 1000));
    return;
  }

  Logger.log('✅ Parsed keys: ' + Object.keys(parsed).join(', '));

  const html = buildATSRUltimateUI_(row, parsed, keepSelections, data);
  ui.showModalDialog(HtmlService.createHtmlOutput(html).setWidth(1920).setHeight(1000), '🎨 ATSR Titles Optimizer (v2 - TEST)');
}



// ATSR-specific JSON parser that handles markdown code fences
function parseATSRResponse_(text) {
  if (!text) return null;

  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/,'');
  }

  try { return JSON.parse(cleaned); } catch(e) {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch(_) {} }
    return null;
  }
}





function buildATSRUltimateUI_(row, parsed, keepSelections, data) {
  // Helper: Create editable radio options with text input + show current value first
  const makeEditable = (vals, name, label, currentValue, showMysteryButton = false) => `
    <div class="section">
      <div class="section-header">
        <h3>${label}</h3>
        ${showMysteryButton ? `
        <button class="btn-mystery" onclick="regenerateMoreMysterious()" title="Generate even more mysterious titles that hide the diagnosis">
          🎭 Make More Mysterious
        </button>
        ` : ''}
      </div>
      <div class="options">
        ${currentValue ? `
        <div class="option-row">
          <input type="radio" name="${name}" value="current" id="${name}_current" checked>
          <input type="text" id="${name}_text_current" value="${String(currentValue).replace(/"/g,'&quot;')}" class="edit-field">
        </div>
        <div class="current-label">
          <em>No change, keep current version</em>
        </div>
        ` : ''}
        ${vals.map((v,i)=>`
          <div class="option-row">
            <input type="radio" name="${name}" value="${i}" id="${name}_${i}">
            <input type="text" id="${name}_text_${i}" value="${String(v).replace(/"/g,'&quot;')}" class="edit-field">
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const ps = parsed.Case_Summary?.Patient_Summary || 'A patient was evaluated and managed for an acute condition requiring urgent care.';
  const ki = parsed.Case_Summary?.Key_Intervention || 'N/A';
  const ct = parsed.Case_Summary?.Core_Takeaway || 'N/A';

  // Extract diagnosis from Reveal_Title (before the colon)
  let diagnosis = 'Diagnosis Unknown';
  const revealTitle = data['Case_Organization_Reveal_Title'];
  if (revealTitle) {
    // Format: "Severe Asthma Exacerbation (8 M): Swift Action Required"
    // Extract: "Severe Asthma Exacerbation"
    const match = revealTitle.match(/^([^(]+)/);
    if (match) {
      diagnosis = match[1].trim();
    }
  }

  // Create specific learning outcome from diagnosis and key intervention
  const learningOutcome = ki !== 'N/A'
    ? `Master ${ki.toLowerCase()} as critical decision for ${diagnosis.toLowerCase()}`
    : `Master rapid recognition and treatment of ${diagnosis.toLowerCase()}`;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <!-- Cache bust: v7_demographic_format_${Date.now()} -->
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        margin: 0;
        background: #f5f7fa;
        color: #2c3e50;
        font-size: 14px;
      }
      .container {
        padding: 6px 16px 10px 16px;
        max-width: 1900px;
        margin: 0 auto;
      }
      .summary-card {
        background: #ffffff;
        border: 1px solid #cbd5e0;
        border-radius: 6px;
        padding: 8px 12px;
        margin-bottom: 6px;
        box-shadow: none;
        max-width: 700px;
      }
      .summary-card h2 {
        margin: 0 0 4px 0;
        font-size: 15px;
        color: #1a202c;
        font-weight: 600;
      }
      .summary-text {
        font-size: 13px;
        line-height: 1.4;
        color: #2d3748;
        margin-bottom: 6px;
      }
      .summary-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding: 6px 8px;
        background: #f7fafc;
        border-radius: 4px;
        border-left: 3px solid #3b82f6;
      }
      .detail-item {
        font-size: 11px;
      }
      .detail-item strong {
        color: #1a202c;
        display: block;
        margin-bottom: 2px;
      }
      .grid-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 8px;
        align-items: start;
      }
      .section {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        padding: 6px;
        height: 100%;
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
        padding-bottom: 3px;
        border-bottom: 1px solid #e2e8f0;
      }
      .section h3 {
        margin: 0;
        font-size: 13px;
        font-weight: 600;
        color: #1a202c;
      }
      .btn-mystery {
        padding: 4px 8px;
        font-size: 10px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
      }
      .btn-mystery:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
        background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
      }
      .btn-mystery:active {
        transform: translateY(0);
      }
      .options {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .option-row {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 1px 2px;
        border-radius: 2px;
        transition: background 0.2s;
      }
      .option-row:hover {
        background: #f7fafc;
      }
      .option-row.no-change {
        margin-top: 2px;
        padding-top: 3px;
        border-top: 1px solid #e2e8f0;
      }
      .option-row input[type="radio"] {
        flex-shrink: 0;
        width: 14px;
        height: 14px;
        cursor: pointer;
      }
      .edit-field {
        flex: 1;
        padding: 4px 6px;
        border: 1px solid #e2e8f0;
        border-radius: 3px;
        font-size: 13px;
        background: #ffffff;
        color: #2c3e50;
        transition: border-color 0.2s;
        word-wrap: break-word;
        white-space: normal;
        overflow-wrap: break-word;
        min-height: 24px;
        line-height: 1.3;
      }
      .edit-field:focus {
        outline: none;
        border-color: #3b82f6;
      }
      .current-label {
        padding: 2px 0 4px 18px;
        font-size: 11px;
        color: #64748b;
        font-style: italic;
      }
      .actions {
        background: #ffffff;
        border: 1px solid #cbd5e0;
        border-radius: 8px;
        padding: 20px;
        display: flex;
        gap: 12px;
        justify-content: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      button {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-primary {
        background: #3b82f6;
        color: white;
      }
      .btn-primary:hover {
        background: #2563eb;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      .btn-secondary {
        background: #10b981;
        color: white;
      }
      .btn-secondary:hover {
        background: #059669;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      .btn-tertiary {
        background: #6366f1;
        color: white;
      }
      .btn-tertiary:hover {
        background: #4f46e5;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      .btn-close {
        background: #e2e8f0;
        color: #475569;
      }
      .btn-close:hover {
        background: #cbd5e0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="summary-card">
        <div style="margin-bottom: 4px; font-size: 13px; color: #64748b; font-weight: 500;">Case Summary:</div>
        <div style="font-size: 26px; font-weight: 700; color: #1a202c; margin-bottom: 16px; line-height: 1.2;">${diagnosis}</div>
        <ul style="list-style-type: disc; margin: 0; padding-left: 20px; line-height: 1.7;">
          <li style="margin-bottom: 10px; color: #2d3748; font-size: 14px;">${ps}</li>
          <li style="color: #2d3748; font-size: 14px; font-weight: 600;"><strong>Learning Objective:</strong> ${learningOutcome}</li>
        </ul>
      </div>

      <div class="grid-3">
        ${makeEditable(parsed.Spark_Titles||[], 'spark', '🔥 Spark Titles (Pre-Sim Mystery)', data['Case_Organization_Spark_Title'], true)}
        ${makeEditable(parsed.Reveal_Titles||[], 'reveal', '💎 Reveal Titles (Post-Sim Learning)', data['Case_Organization_Reveal_Title'])}
        ${makeEditable(parsed.Memory_Anchors||[], 'anchor', '🎭 Memory Anchors (Unforgettable Patient Details)', data['Case_Organization_Memory_Anchor'])}
      </div>

      <div class="actions">
        <button class="btn-primary" onclick="apply(false)">✅ Save & Close</button>
        <button class="btn-secondary" onclick="apply(true)">⏭️ Save & Continue</button>
        <button class="btn-tertiary" onclick="keepRegen()">🔁 Keep & Regenerate</button>
        <button class="btn-close" onclick="google.script.host.close()">❌ Close</button>
      </div>
    </div>

    <script>
      function getTxt(name) {
        const selected = document.querySelector('input[name="'+name+'"]:checked');
        if (!selected || selected.value === 'nochange') return 'nochange';
        const idx = selected.value;
        const textField = document.getElementById(name+'_text_'+idx);
        return textField ? textField.value : 'nochange';
      }

      function apply(continueNext) {
        const data = {
          spark: getTxt('spark'),
          reveal: getTxt('reveal'),
          anchor: getTxt('anchor'),
          continueNext: continueNext
        };
        google.script.run
          .withSuccessHandler(()=>{
            if(continueNext) {
              google.script.run.runATSRTitleGenerator(${row+1}, true);
            } else {
              google.script.host.close();
            }
          })
          .saveATSRData(${row}, data);
      }

      function keepRegen() {
        google.script.host.close();
        google.script.run.runATSRTitleGenerator(${row}, true);
      }

      let mysteryLevel = 1; // Track how mysterious we're getting

      function regenerateMoreMysterious() {
        // Show loading state
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '🔄 Level ' + mysteryLevel + '...';

        // Collect current titles from the text inputs
        const sparkContainer = document.querySelector('[name="spark"]').closest('.section').querySelector('.options');
        const textInputs = sparkContainer.querySelectorAll('.edit-field');
        const currentTitles = Array.from(textInputs).map(input => input.value);

        google.script.run
          .withSuccessHandler((newTitles) => {
            // Replace the Spark Titles options with new ultra-mysterious ones
            const sparkContainer = document.querySelector('[name="spark"]').closest('.section').querySelector('.options');

            // Keep the current value option if it exists
            const currentOption = sparkContainer.querySelector('.option-row:first-child');
            const hasCurrentValue = currentOption && currentOption.querySelector('[id$="_current"]');

            // Build new options HTML
            let newHTML = '';
            if (hasCurrentValue) {
              newHTML += currentOption.outerHTML;
              newHTML += sparkContainer.querySelector('.current-label').outerHTML;
            }

            // Add new mysterious titles
            newTitles.forEach((title, i) => {
              newHTML += '<div class="option-row">' +
                '<input type="radio" name="spark" value="' + i + '" id="spark_' + i + '">' +
                '<input type="text" id="spark_text_' + i + '" value="' + title.replace(/"/g,'&quot;') + '" class="edit-field">' +
                '</div>';
            });

            sparkContainer.innerHTML = newHTML;

            // Increment mystery level for next click
            mysteryLevel++;

            // Update button text to show we're going deeper
            const levelEmojis = ['🎭', '🕵️', '❓', '🌫️', '👻'];
            const emoji = levelEmojis[Math.min(mysteryLevel - 1, levelEmojis.length - 1)];
            btn.innerHTML = emoji + ' Even More Mysterious';
            btn.disabled = false;
          })
          .withFailureHandler((error) => {
            alert('Error generating mysterious titles: ' + error);
            btn.disabled = false;
            btn.innerHTML = originalText;
          })
          .generateMysteriousSparkTitles(${row}, mysteryLevel, currentTitles);
      }
    </script>
  </body>
  </html>
  `;
}



// Generate ultra-mysterious Spark Titles that completely hide the diagnosis
function generateMysteriousSparkTitles(row, mysteryLevel, currentTitles) {
  const s = pickMasterSheet_();
  const headers = s.getRange(2,1,1,s.getLastColumn()).getValues()[0];
  const rowData = s.getRange(row, 1, 1, headers.length).getValues()[0];

  // Build data object
  const data = {};
  headers.forEach((h,i) => { data[h] = rowData[i]; });

  // Extract the diagnosis from Reveal Title
  const revealTitle = data['Case_Organization_Reveal_Title'] || '';
  const diagnosisMatch = revealTitle.match(/^([^(]+)/);
  const diagnosis = diagnosisMatch ? diagnosisMatch[1].trim() : 'Unknown';

  // Extract age/gender from current Spark Title (e.g., "Title (58 M): Description")
  const currentSparkTitle = data['Case_Organization_Spark_Title'] || '';
  const demographicMatch = currentSparkTitle.match(/\((\d+\s+[MF])\)/);
  const demographic = demographicMatch ? demographicMatch[1] : null;

  // Get patient summary
  const patientSummary = data['Case_Summary_Patient_Summary'] || 'A patient presents with concerning symptoms.';

  // Adjust mystery level instructions
  const level = mysteryLevel || 1;
  let mysteryInstructions = '';

  if (level === 1) {
    mysteryInstructions = '**MYSTERY LEVEL 1 (Moderate Mystery):**\n' +
      '- Use vague family observations\n' +
      '- Avoid medical terms but can hint at general concern\n' +
      '- Example: "Grandpa\'s Not Acting Right"\n\n';
  } else if (level === 2) {
    mysteryInstructions = '**MYSTERY LEVEL 2 (High Mystery):**\n' +
      '- Even more vague and indirect\n' +
      '- Focus on pure behavioral changes\n' +
      '- Example: "Something\'s Different Today"\n\n';
  } else if (level === 3) {
    mysteryInstructions = '**MYSTERY LEVEL 3 (Maximum Mystery):**\n' +
      '- Extremely vague, almost cryptic\n' +
      '- Pure emotion and concern only\n' +
      '- Example: "I\'m Worried"\n\n';
  } else {
    mysteryInstructions = '**MYSTERY LEVEL ' + level + ' (ULTRA Maximum):**\n' +
      '- Absolutely NO specifics whatsoever\n' +
      '- Pure gut feeling and unease\n' +
      '- Example: "Something\'s Not Right"\n\n';
  }

  // Build the prompt based on whether we have current titles to iterate on
  let prompt = '';

  if (currentTitles && currentTitles.length > 0) {
    // ITERATIVE MODE: Make existing titles MORE mysterious
    const formatInstruction = demographic
      ? '**FORMAT REQUIREMENT:**\nEach title MUST follow this exact format:\n"Title (' + demographic + '): Brief description"\n\nExample: "Grandpa\'s Not Acting Right (' + demographic + '): Family Concerned"\n\n'
      : '';

    prompt = 'You are making existing pre-simulation titles EVEN MORE MYSTERIOUS to completely hide the diagnosis.\n\n' +
      mysteryInstructions +
      '**YOUR TASK:**\n' +
      'Take each of these titles and make them MORE vague, MORE mysterious, and LESS revealing.\n' +
      'Remove any remaining hints about the condition. Make them more cryptic and indirect.\n' +
      'Keep the human context and emotional tone, but be even more subtle.\n\n' +
      '**Current Titles to Make More Mysterious:**\n' +
      JSON.stringify(currentTitles, null, 2) + '\n\n' +
      formatInstruction +
      '**Patient Context (to maintain relevance):**\n' +
      patientSummary + '\n\n' +
      '**Actual Diagnosis (HIDE THIS COMPLETELY):**\n' +
      diagnosis + '\n\n' +
      '**CRITICAL RULES:**\n' +
      '- NEVER mention the diagnosis (' + diagnosis + ')\n' +
      '- NEVER use medical terminology\n' +
      '- Remove any remaining clinical hints\n' +
      '- Make each title LESS specific than before\n' +
      '- Use even vaguer language\n' +
      '- Focus on pure emotion and concern\n' +
      '- Keep titles grounded in the patient context (age, setting, etc.)\n' +
      '- Maintain human perspective (family member, concerned observer)\n' +
      (demographic ? '- ALWAYS include (' + demographic + ') in each title\n' : '') +
      '\n' +
      'Return ONLY a JSON array of the same number of titles, now more mysterious:\n' +
      '["More mysterious version of title 1", "More mysterious version of title 2", ...]';
  } else {
    // INITIAL MODE: Generate from scratch
    const formatInstruction = demographic
      ? '**FORMAT REQUIREMENT:**\nEach title MUST follow this exact format:\n"Title (' + demographic + '): Brief description"\n\nExample: "Grandpa\'s Not Acting Right (' + demographic + '): Family Concerned"\n\n'
      : '';

    const exampleSuffix = demographic ? ' (' + demographic + ')' : '';

    prompt = 'You are creating ULTRA-MYSTERIOUS pre-simulation titles that COMPLETELY HIDE the diagnosis from learners.\n\n' +
      mysteryInstructions +
      formatInstruction +
      '**CRITICAL RULES:**\n' +
      '- NEVER mention the diagnosis (' + diagnosis + ')\n' +
      '- NEVER use medical terminology that reveals the condition\n' +
      '- NEVER hint at the organ system or pathophysiology\n' +
      '- Focus on vague, concerning observations\n' +
      '- Use layperson language and indirect descriptions\n' +
      '- Create curiosity and mystery without clinical clues\n' +
      (demographic ? '- ALWAYS include (' + demographic + ') in each title\n' : '') +
      '\n' +
      '**Patient Context:**\n' +
      patientSummary + '\n\n' +
      '**Actual Diagnosis (HIDE THIS COMPLETELY):**\n' +
      diagnosis + '\n\n' +
      '**Examples of Ultra-Mysterious Titles:**\n' +
      '- "Grandpa\'s Not Acting Right' + exampleSuffix + ': Family Concerned"\n' +
      '- "She Just Doesn\'t Look Right' + exampleSuffix + ': Something\'s Wrong"\n' +
      '- "Something\'s Off with Dad Today' + exampleSuffix + ': Can\'t Put My Finger on It"\n' +
      '- "The Kid Who Won\'t Stop Crying' + exampleSuffix + ': Parents Worried"\n' +
      '- "Mom Says He\'s Not Himself' + exampleSuffix + ': Acting Strange"\n\n' +
      '**Generate 5 ultra-mysterious Spark Titles that:**\n' +
      '1. Use concerned family member observations\n' +
      '2. Describe behavioral/emotional changes only\n' +
      '3. Avoid ANY medical symptoms or terms\n' +
      '4. Create urgency through human context\n' +
      '5. Make learners think "I need to assess this"\n' +
      (demographic ? '6. Include (' + demographic + ') in EVERY title\n' : '') +
      '\n' +
      'Return ONLY a JSON array of 5 title strings, no explanation:\n' +
      '["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"]';
  }

  Logger.log('🎭 Generating ultra-mysterious Spark Titles (Level ' + level + ')');
  Logger.log('   For diagnosis: ' + diagnosis);
  if (currentTitles && currentTitles.length > 0) {
    Logger.log('   Iterating on ' + currentTitles.length + ' existing titles');
  } else {
    Logger.log('   Generating fresh titles from scratch');
  }

  const response = callOpenAI(prompt, 0.9); // High temperature for creativity
  Logger.log('📝 OpenAI response: ' + response);

  // Parse the JSON array
  const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const titles = JSON.parse(cleanResponse);

  Logger.log('✅ Generated ' + titles.length + ' mysterious titles');
  return titles;
}

// New save function that handles data from the UI
function saveATSRData(row, data) {
  const s = pickMasterSheet_();
  const headers = s.getRange(2,1,1,s.getLastColumn()).getValues()[0];

  const setVal = (key, val) => {
    if (!val || val==='nochange') return;
    const idx = headers.indexOf(key);
    if (idx<0) {
      Logger.log('⚠️ Column not found: ' + key);
      return;
    }
    const r = s.getRange(row, idx+1);
    r.setValue(val);
  };

  Logger.log('💾 Saving ATSR data for row ' + row);
  Logger.log('   Spark: ' + data.spark);
  Logger.log('   Reveal: ' + data.reveal);
  Logger.log('   Anchor: ' + data.anchor);

  setVal('Case_Organization_Spark_Title', data.spark);
  setVal('Case_Organization_Reveal_Title', data.reveal);
  setVal('Case_Organization_Memory_Anchor', data.anchor);

  SpreadsheetApp.getActive().toast('✅ ATSR saved successfully!');
}

// Legacy function kept for compatibility
function applyATSRSelectionsWithDefiningAndMemory(row, spark, reveal, caseID, define) {
  const s = pickMasterSheet_();
  const headers = s.getRange(2,1,1,s.getLastColumn()).getValues()[0];

  const setVal = (key, val, append=false) => {
    if (!val || val==='nochange') return;
    const idx = headers.indexOf(key);
    if (idx<0) return;
    const r = s.getRange(row, idx+1);
    if (append) {
      const ex = r.getValue();
      r.setValue(ex ? (ex + ' ' + val) : val);
    } else r.setValue(val);
  };

  setVal('Spark_Title',   spark);
  setVal('Reveal_Title',  reveal);
  setVal('Patient_Descriptor', define, true);

  if (define && define!=='nochange') {
    const memKey = SP_KEYS.USED_MOTIFS;
    const prev = getProp(memKey,'');
    const motif = define.toLowerCase().split(' ').slice(0,3).join(' ');
    if (!prev.includes(motif)) setProp(memKey, prev ? (prev+', '+motif) : motif);
  }

  SpreadsheetApp.getActive().toast('✅ ATSR saved.');
}


// ══════════════════════════════════════════════════════════════════════════════
// END OF ATSR IMPLEMENTATION
// ══════════════════════════════════════════════════════════════════════════════

function pickMasterSheet_() {
  const ss = SpreadsheetApp.getActive();
  // Prefer last used output
  const last = getProp(SP_KEYS.LAST_OUTPUT_SHEET, '');
  if (last) {
    const s = ss.getSheetByName(last);
    if (s) return s;
  }
  // Else prefer sheet named like Master Scenario CSV
  const m = ss.getSheets().find(sh=>/master scenario csv/i.test(sh.getName()));
  return m || ss.getActiveSheet();
}

// Auto-bold key phrases in summary lines
function autoBoldSummary_(summary, key, take) {
  function boldPhrase(s) {
    if (!s) return 'N/A';
    // Bold up to the colon if present; else first 2–3 words
    const parts = s.split(':');
    if (parts.length>1) return `<strong>${parts[0]}</strong>:` + parts.slice(1).join(':');
    const words = s.split(' ');
    const head = words.slice(0,3).join(' ');
    return `<strong>${head}</strong> ${words.slice(3).join(' ')}`.trim();
  }
  return { summary, key: boldPhrase(key), take: boldPhrase(take) };
}


// ========== 7) IMAGE SYNC DEFAULTS MANAGER ==========

function openImageSyncDefaults() {
  const s = pickMasterSheet_();
  const {header1, header2} = getCachedHeadersOrRead(s);
  const keys = header1.map((t1,i)=>`${t1}:${header2[i]}`).filter(k=>/^Image_Sync:/i.test(k));

  const current = JSON.parse(getProp(SP_KEYS.IMG_SYNC_DEFAULTS, '{}') || '{}');
  const rows = keys.map(k=>{
    const v = (current[k]!==undefined) ? current[k] : '';
    return `<tr><td>${k}</td><td><input data-k="${k}" value="${String(v).replace(/"/g,'&quot;')}" style="width:100%"></td></tr>`;
  }).join('');

  const html = HtmlService.createHtmlOutput(`
  <style>
    body{font-family:Arial;background:#f5f7fa;color:#2c3e50}
    table{width:100%;border-collapse:collapse}
    td,th{border:1px solid #dfe3e8;padding:8px}
    .bar{padding:14px 16px;background:#1b1f2a;border-bottom:1px solid #dfe3e8}
    button{background:#2357ff;border:0;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer}
  </style>
  <div class="bar"><h3>${ICONS.frame} Image Sync Defaults</h3></div>
  <div style="padding:12px;">
    <p class="hint">Edit defaults per <code>Image_Sync:*</code> column. Click Save to persist.</p>
    <table>
      <tr><th>Column</th><th>Default Value</th></tr>
      ${rows || '<tr><td colspan="2"><em>No Image_Sync columns detected.</em></td></tr>'}
    </table>
    <div style="margin-top:12px;">
      <button onclick="save()">Save</button>
      <button style="background:#dfe3e8" onclick="refresh()">Refresh Columns</button>
    </div>
  </div>
  <script>
    function save(){
      const obj = {};
      document.querySelectorAll('input[data-k]').forEach(inp=>{
        obj[inp.getAttribute('data-k')] = inp.value;
      });
      google.script.run
        .withSuccessHandler(()=>google.script.host.close())
        .saveImageSyncDefaults(JSON.stringify(obj));
    }
    function refresh(){
      google.script.run
        .withSuccessHandler(()=>location.reload())
        .refreshImageSyncHeaderCache();
    }
  </script>
  `).setWidth(720).setHeight(560);

  getSafeUi_().showModalDialog(html, '🖼 Image Sync Defaults');
}
function saveImageSyncDefaults(json) {
  setProp(SP_KEYS.IMG_SYNC_DEFAULTS, json||'{}');
  SpreadsheetApp.getActive().toast('✅ Image Sync defaults saved.');
}
function refreshImageSyncHeaderCache() {
  const s = pickMasterSheet_();
  cacheHeaders(s);
  SpreadsheetApp.getActive().toast('🔁 Header cache refreshed.');
}


// ========== 8) MEMORY TRACKER ==========

function openMemoryTracker() {
  const mem = (getProp(SP_KEYS.USED_MOTIFS,'')||'').split(',').map(m=>m.trim()).filter(Boolean);
  const list = mem.map((m,i)=>`<div><input type="checkbox" id="m${i}" checked> ${m}</div>`).join('');
  const html = HtmlService.createHtmlOutput(`
  <style>body{font-family:Arial;background:#f5f7fa;color:#2c3e50} button{background:#2357ff;border:0;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer}</style>
  <div style="padding:16px;">
    <h3>${ICONS.puzzle} Memory Tracker</h3>
    ${list || '<p><em>No motifs stored.</em></p>'}
    <div style="margin-top:12px;">
      <button onclick="clearAll()">🧹 Clear All</button>
      <button style="background:#dfe3e8" onclick="markReusable()">♻️ Mark Selected as Reusable</button>
    </div>
  </div>
  <script>
    function clearAll(){ google.script.run.withSuccessHandler(()=>google.script.host.close()).clearMotifMemory(); }
    function markReusable(){
      const unchecked=[];
      document.querySelectorAll('input[type=checkbox]').forEach(c=>{ if(!c.checked) unchecked.push(c.nextSibling.textContent.trim()); });
      google.script.run.withSuccessHandler(()=>google.script.host.close()).markMotifsReusable(unchecked);
    }
  </script>`).setWidth(520).setHeight(420);
  getSafeUi_().showModalDialog(html, '🧩 Memory Tracker');
}
function clearMotifMemory(){ PropertiesService.getDocumentProperties().deleteProperty(SP_KEYS.USED_MOTIFS); SpreadsheetApp.getActive().toast('🧹 Memory cleared.'); }
function markMotifsReusable(unchecked){ 
  const key = SP_KEYS.USED_MOTIFS;
  const motifs = (getProp(key,'')||'').split(',').map(m=>m.trim()).filter(Boolean);
  const kept = motifs.filter(m => unchecked.includes(m)===false);
  setProp(key, kept.join(', '));
  SpreadsheetApp.getActive().toast('♻️ Selected motifs marked reusable.');
}

// ======================================================
// HEADER MANAGEMENT + AUTO-RETRAIN MODULE (Sim Mastery)
// ======================================================


// ========== 1) REFRESH HEADERS (TRAIN STRUCTURE) ==========
function refreshHeaders() {
  const ui = getSafeUi_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const outputSheet = pickMasterSheet_();
  if (!outputSheet) {
    if (ui) { ui.alert('❌ Master sheet not found.'); }
    return;
  }

  // Read Row 2 which contains the FULL flattened headers
  // Row 1: Short names (Case_ID, Spark_Title)
  // Row 2: Full flattened (Case_Organization_Case_ID, Case_Organization_Spark_Title)
  const flattenedHeaders = outputSheet.getRange(2, 1, 1, outputSheet.getLastColumn()).getValues()[0];

  // Clean and filter headers
  const mergedKeys = flattenedHeaders
    .map(h => String(h || '').trim())
    .filter(h => h !== '');

  // Remove duplicates from mergedKeys
  const uniqueKeys = [];
  const seen = {};
  for (let i = 0; i < mergedKeys.length; i++) {
    if (!seen[mergedKeys[i]]) {
      uniqueKeys.push(mergedKeys[i]);
      seen[mergedKeys[i]] = true;
    }
  }
  if (uniqueKeys.length < mergedKeys.length) {
    Logger.log('⚠️ Removed ' + (mergedKeys.length - uniqueKeys.length) + ' duplicate headers');
  }
  const finalKeys = uniqueKeys;


  // Cache the flattened headers
  setProp('CACHED_MERGED_KEYS', JSON.stringify(finalKeys));

  // For backward compatibility, also cache as header1/header2
  // Parse tier1 and tier2 from flattened names
  const header1 = [];
  const header2 = [];

  mergedKeys.forEach(merged => {
    const parts = merged.split('_');
    if (parts.length >= 3) {
      header1.push(parts.slice(0, -1).join('_'));
      header2.push(parts[parts.length - 1]);
    } else if (parts.length === 2) {
      header1.push(parts[0]);
      header2.push(parts[1]);
    } else {
      header1.push('General');
      header2.push(merged);
    }
  });

  setProp('CACHED_HEADER1', JSON.stringify(header1));
  setProp('CACHED_HEADER2', JSON.stringify(header2));

  // Silent mode - no alert (will be shown by field selector if needed)
  Logger.log('✅ Headers refreshed: ' + mergedKeys.length + ' merged keys cached');
}

// ========== 2) AUTO-RETRAIN PROMPT STRUCTURE ==========
function retrainPromptStructure() {
  const ui = getSafeUi_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Use pickMasterSheet_() instead of hardcoded fallback
  const outputSheet = pickMasterSheet_();
  if (!outputSheet) {
    if (ui) { ui.alert('❌ Master sheet not found.'); }
    return;
  }

  const header1 = outputSheet.getRange(1, 1, 1, outputSheet.getLastColumn()).getValues()[0];
  const header2 = outputSheet.getRange(2, 1, 1, outputSheet.getLastColumn()).getValues()[0];
  const mergedKeys = header1.map((t1, i) => `${t1}:${header2[i]}`.replace(/\s+/g, '_'));

  // Cache structure
  setProp('CACHED_HEADER1', JSON.stringify(header1));
  setProp('CACHED_HEADER2', JSON.stringify(header2));
  setProp('CACHED_MERGED_KEYS', JSON.stringify(mergedKeys));

  // Build prompt training text
  const promptIntro = `
📘 Sim Mastery — Auto-Trained Output Schema
This defines your authoritative JSON schema for all generated content.

Each key must exactly match the merged Tier1:Tier2 form, using underscores (_) instead of spaces.
When a value cannot be filled, output "N/A".

Tier1 Headers:
${header1.join(', ')}

Tier2 Headers:
${header2.join(', ')}

Merged Keys (exact JSON keys required):
${mergedKeys.join(', ')}
`.trim();

  setProp('CACHED_PROMPT_STRUCTURE', promptIntro);

  if (ui) { ui.alert(`✅ Prompt structure retrained!\n\n${mergedKeys.length} merged keys cached.\nPrompt fragment stored for AI calls.`); }
}

// ========== 3) OPTIONAL: AUTO-CHECK BEFORE RUN ==========
function ensureHeadersCached() {
  const h = getProp('CACHED_HEADER1');
  if (!h) {
    refreshHeaders();
    retrainPromptStructure();
  }
}







// ========== 9) SETTINGS PANEL (Properties + Cache) ==========

function openSettingsPanel() {
  const api = getProp(SP_KEYS.API_KEY,'');
  const model = getProp(SP_KEYS.MODEL, DEFAULT_MODEL);
  const pIn = getProp(SP_KEYS.PRICE_INPUT, DEFAULT_PRICE.input);
  const pOut= getProp(SP_KEYS.PRICE_OUTPUT, DEFAULT_PRICE.output);
  const html = HtmlService.createHtmlOutput(`
  <style>body{font-family:Arial;background:#f5f7fa;color:#2c3e50}
  label{font-size:12px;color:#9aa3b2}
  input,select{width:100%;background:#f5f7fa;border:1px solid #30384b;color:#2c3e50;border-radius:8px;padding:8px}
  button{background:#2357ff;border:0;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer}
  .card{background:#ffffff;border:1px solid #dfe3e8;border-radius:10px;padding:14px;margin:12px}
  </style>
  <div class="card">
    <h3>${ICONS.gear} Settings</h3>
    <label>Model</label>
    <input id="m" value="${model}">
    <label style="margin-top:8px;">API Key</label>
    <input id="k" value="${api ? '••••••••' : ''}" placeholder="sk-...">
    <label style="margin-top:8px;">Price Input per 1k</label>
    <input id="pi" value="${pIn}">
    <label style="margin-top:8px;">Price Output per 1k</label>
    <input id="po" value="${pOut}">
    <div style="margin-top:10px;">
      <button onclick="save()">Save</button>
      <button style="background:#dfe3e8" onclick="clearCache()">Clear Header Cache</button>
      <button style="background:#dfe3e8" onclick="pull()">Sync API from Settings sheet</button>
    </div>
  </div>
  <script>
    function save(){
      const key = document.getElementById('k').value.trim();
      google.script.run.saveSidebarBasics(
        document.getElementById('m').value,
        (key && key!=='••••••••') ? key : '',
        document.getElementById('pi').value.trim(),
        document.getElementById('po').value.trim(),
        '', ''
      );
      google.script.host.close();
    }
    function clearCache(){ google.script.run.withSuccessHandler(()=>alert('Cache cleared')).clearHeaderCache(); }
    function pull(){ google.script.run.withSuccessHandler(()=>alert('API key synced from Settings sheet (if found).')).pullApiFromSettingsSheet(); }
  </script>`).setWidth(520).setHeight(420);
  getSafeUi_().showModalDialog(html, '⚙️ Settings');
}

function pullApiFromSettingsSheet() {
  const key = syncApiKeyFromSettingsSheet_();
  if (key) setProp(SP_KEYS.API_KEY, key);
}


// ========== 10) MENU ==========



/**
 * Categories & Pathways Panel - Light Theme (Classic Google Sheets Style)
 *
 * Clean, easy-to-read interface for managing categories and pathways
 * Light grey theme optimized for data manipulation
 */

// ========== MAIN LAUNCHER ==========

function openCategoriesPathwaysPanel() {
  const ui = getSafeUi_();
  if (!ui) return;

  const html = buildCategoriesPathwaysMainMenu_();
  ui.showSidebar(HtmlService.createHtmlOutput(html).setTitle('📂 Categories & Pathways').setWidth(320));
}

// ========== MAIN MENU ==========

function buildCategoriesPathwaysMainMenu_() {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1]; // Row 2

  // Get column indices
  const categoryIdx = headers.indexOf('Case_Organization:Category');
  const pathwayIdx = headers.indexOf('Case_Organization:Pathway_Name');
  const sparkIdx = headers.indexOf('Case_Organization:Spark_Title');

  // Count categories and pathways
  const categoryCounts = {};
  const pathwayCounts = {};

  for (let i = 2; i < data.length; i++) {
    const category = data[i][categoryIdx] || 'Uncategorized';
    const pathway = data[i][pathwayIdx] || 'Unassigned';

    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    pathwayCounts[pathway] = (pathwayCounts[pathway] || 0) + 1;
  }

  const totalCases = data.length - 2;

  // Build category list
  const categoryList = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => `
      <div class="list-item" onclick="viewCategory('${cat.replace(/'/g, "\\'")}')">
        <span class="item-label">${cat}</span>
        <span class="item-count">${count}</span>
      </div>
    `).join('');

  // Build pathway list (top 10)
  const pathwayList = Object.entries(pathwayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => `
      <div class="list-item" onclick="viewPathway('${path.replace(/'/g, "\\'")}')">
        <span class="item-label">${path}</span>
        <span class="item-count">${count}</span>
      </div>
    `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Arial, sans-serif;
      background: #f5f7fa;
      color: #2c3e50;
      font-size: 13px;
    }

    .header {
      background: #fff;
      padding: 16px;
      border-bottom: 1px solid #dfe3e8;
    }

    .header h1 {
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 4px;
    }

    .header .subtitle {
      font-size: 12px;
      color: #7f8c9d;
    }

    .stats {
      background: #fff;
      padding: 12px 16px;
      border-bottom: 1px solid #dfe3e8;
      display: flex;
      justify-content: space-around;
    }

    .stat {
      text-align: center;
    }

    .stat .num {
      font-size: 20px;
      font-weight: 700;
      color: #3b7ddd;
      display: block;
    }

    .stat .label {
      font-size: 11px;
      color: #7f8c9d;
      text-transform: uppercase;
    }

    .section {
      background: #fff;
      margin: 12px;
      padding: 14px;
      border-radius: 6px;
      border: 1px solid #dfe3e8;
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f2f5;
    }

    .btn {
      display: block;
      width: 100%;
      background: #fff;
      border: 1px solid #d1d7de;
      color: #2c3e50;
      padding: 10px 12px;
      margin-bottom: 8px;
      border-radius: 4px;
      cursor: pointer;
      text-align: left;
      font-size: 13px;
      transition: all 0.2s;
    }

    .btn:hover {
      background: #f5f7fa;
      border-color: #3b7ddd;
    }

    .btn-primary {
      background: #3b7ddd;
      color: #fff;
      border-color: #3b7ddd;
      font-weight: 600;
    }

    .btn-primary:hover {
      background: #2d6bc6;
    }

    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 10px;
      margin-bottom: 4px;
      background: #f8f9fa;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .list-item:hover {
      background: #e9ecef;
    }

    .item-label {
      font-size: 13px;
      color: #2c3e50;
    }

    .item-count {
      font-size: 12px;
      color: #7f8c9d;
      background: #fff;
      padding: 2px 8px;
      border-radius: 10px;
    }

    .scrollable {
      max-height: 200px;
      overflow-y: auto;
    }

    .scrollable::-webkit-scrollbar {
      width: 6px;
    }

    .scrollable::-webkit-scrollbar-track {
      background: #f0f2f5;
    }

    .scrollable::-webkit-scrollbar-thumb {
      background: #d1d7de;
      border-radius: 3px;
    }

    .info {
      background: #e8f4fd;
      border: 1px solid #bee5eb;
      padding: 10px 12px;
      border-radius: 4px;
      font-size: 12px;
      color: #31708f;
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📂 Categories & Pathways</h1>
    <div class="subtitle">Organize cases by system and learning path</div>
  </div>

  <div class="stats">
    <div class="stat">
      <span class="num">${totalCases}</span>
      <span class="label">Cases</span>
    </div>
    <div class="stat">
      <span class="num">${Object.keys(categoryCounts).length}</span>
      <span class="label">Categories</span>
    </div>
    <div class="stat">
      <span class="num">${Object.keys(pathwayCounts).length}</span>
      <span class="label">Pathways</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Quick Actions</div>
    <button class="btn" onclick="viewAllCategories()">📊 View All Categories</button>
    <button class="btn" onclick="viewAllPathways()">🧩 View All Pathways</button>
    <button class="btn" onclick="assignCase()">🔗 Assign Case to Category/Pathway</button>
  </div>

  <div class="section">
    <div class="section-title">Medical System Categories</div>
    <div class="scrollable">
      ${categoryList || '<div class="info">No categories found</div>'}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Learning Pathways (Top 10)</div>
    <div class="scrollable">
      ${pathwayList || '<div class="info">No pathways found</div>'}
    </div>
    <button class="btn-primary btn" onclick="viewAllPathways()" style="margin-top:10px;">View All Pathways</button>
  </div>

  <div class="info">
    💡 Click any category or pathway to view and edit cases
  </div>

  <script>
    function viewCategory(category) {
      google.script.run
        .withSuccessHandler(updateContent)
        .getCategoryView(category);
    }

    function viewPathway(pathway) {
      google.script.run
        .withSuccessHandler(updateContent)
        .getPathwayView(pathway);
    }

    function viewAllCategories() {
      google.script.run
        .withSuccessHandler(updateContent)
        .getAllCategoriesView();
    }

    function viewAllPathways() {
      google.script.run
        .withSuccessHandler(updateContent)
        .getAllPathwaysView();
    }

    function assignCase() {
      const row = prompt('Enter row number:');
      if (row) {
        google.script.run
          .withSuccessHandler(updateContent)
          .getCaseAssignmentView(parseInt(row));
      }
    }

    function updateContent(html) {
      document.body.innerHTML = html;
    }

    function goBack() {
      google.script.run
        .withSuccessHandler(updateContent)
        .buildCategoriesPathwaysMainMenu_();
    }
  </script>
</body>
</html>
  `;
}

// ========== VIEW FUNCTIONS ==========

function getCategoryView(category) {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  const categoryIdx = headers.indexOf('Case_Organization:Category');
  const sparkIdx = headers.indexOf('Case_Organization:Spark_Title');
  const pathwayIdx = headers.indexOf('Case_Organization:Pathway_Name');

  const cases = [];
  for (let i = 2; i < data.length; i++) {
    if (data[i][categoryIdx] === category) {
      cases.push({
        row: i + 1,
        spark: data[i][sparkIdx] || 'Untitled',
        pathway: data[i][pathwayIdx] || 'Unassigned'
      });
    }
  }

  const casesList = cases.map(c => `
    <div class="list-item">
      <div>
        <div style="font-weight:500;">${c.spark}</div>
        <div style="font-size:11px;color:#7f8c9d;margin-top:2px;">Row ${c.row} • ${c.pathway}</div>
      </div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><base target="_top">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; background: #f5f7fa; color: #2c3e50; font-size: 13px; }
  .header { background: #fff; padding: 16px; border-bottom: 1px solid #dfe3e8; }
  .header h1 { font-size: 16px; font-weight: 600; color: #2c3e50; margin-bottom: 4px; }
  .header .subtitle { font-size: 12px; color: #7f8c9d; }
  .section { background: #fff; margin: 12px; padding: 14px; border-radius: 6px; border: 1px solid #dfe3e8; }
  .list-item { padding: 10px 12px; margin-bottom: 6px; background: #f8f9fa; border-radius: 4px; }
  .btn { display: inline-block; background: #fff; border: 1px solid #d1d7de; color: #2c3e50; padding: 8px 14px; margin: 8px 4px; border-radius: 4px; cursor: pointer; font-size: 12px; text-decoration: none; }
  .btn:hover { background: #f5f7fa; }
  .scrollable { max-height: 400px; overflow-y: auto; }
</style>
</head>
<body>
  <div class="header">
    <h1>📂 ${category}</h1>
    <div class="subtitle">${cases.length} cases</div>
  </div>
  <div class="section">
    <div class="scrollable">${casesList}</div>
  </div>
  <div style="padding:12px;">
    <button class="btn" onclick="goBack()">← Back to Menu</button>
  </div>
  <script>
    function goBack() {
      google.script.run
        .withSuccessHandler(html => document.body.innerHTML = html)
        .buildCategoriesPathwaysMainMenu_();
    }
  </script>
</body>
</html>
  `;
}

function getPathwayView(pathway) {
  // Similar to category view
  return getCategoryView(pathway); // Simplified for now
}

function getAllCategoriesView() {
  // Grid of all categories
  return buildCategoriesPathwaysMainMenu_();
}

function getAllPathwaysView() {
  // Grid of all pathways
  return buildCategoriesPathwaysMainMenu_();
}

function getCaseAssignmentView(row) {
  // Assignment interface
  return buildCategoriesPathwaysMainMenu_();
}




function saveATSRData(row, data) {
  const ss = SpreadsheetApp.getActive();
  const sheet = pickMasterSheet_();
  if (!sheet) return;

  const headers = sheet.getRange(2,1,1,sheet.getLastColumn()).getValues()[0];

  const setCell = (colName, value) => {
    const colIdx = headers.indexOf(colName);
    if (colIdx === -1) return;
    if (value !== 'nochange') {
      sheet.getRange(row, colIdx + 1).setValue(value);
    }
  };

  // Save selected values
  setCell('Case_Organization:Spark_Title', data.spark);
  setCell('Case_Organization:Reveal_Title', data.reveal);
  setCell('Case_Organization:Memory_Anchor', data.anchor);

  // Track used memory anchors for uniqueness
  if (data.anchor !== 'nochange') {
    const usedMemory = getProp(SP_KEYS.USED_MEMORY_ANCHORS, '');
    const newUsed = usedMemory + ' | ' + data.anchor;
    setProp(SP_KEYS.USED_MEMORY_ANCHORS, newUsed.substring(0, 5000)); // Keep last 5000 chars
  }
}





// ⭐ Sidebar Log Helpers
function appendLogSafe(message) {
  try {
    const docProps = PropertiesService.getDocumentProperties();
    const oldLog = docProps.getProperty('Sidebar_Logs') || '';
    const newLog = `${oldLog}\n${new Date().toLocaleTimeString()} ${message}`.trim();
    docProps.setProperty('Sidebar_Logs', newLog);
  } catch (err) {
    Logger.log('appendLogSafe error: ' + err);
  }
}

/******************************************************
 * ER Simulator – Intelligent Waveform Mapper Extension
 * (adds a second menu: “ER Simulator”)
 ******************************************************/

// Canonical waveform definitions
const WAVEFORMS = {
  'sinus_ecg': 'Normal Sinus Rhythm',
  'afib_ecg': 'Atrial Fibrillation',
  'aflutter_ecg': 'Atrial Flutter',
  'svt_ecg': 'Supraventricular Tachycardia',
  'vtach_ecg': 'Ventricular Tachycardia',
  'vfib_ecg': 'Ventricular Fibrillation',
  'asystole_ecg': 'Asystole (Flatline)',
  'paced_ecg': 'Paced Rhythm',
  'junctional_ecg': 'Junctional Rhythm',
  'bigeminy_ecg': 'Ventricular Bigeminy',
  'trigeminy_ecg': 'Ventricular Trigeminy',
  'idioventricular_ecg': 'Idioventricular Rhythm',
  'torsades_ecg': 'Torsades de Pointes',
  'peapulseless_ecg': 'Pulseless Electrical Activity',
  'artifact_ecg': 'Artifact / Noise'
};

// === 1. Extend onOpen() safely ===
(function extendMenu_() {
  const ui = getSafeUi_();
  if (!ui) { Logger.log("Web app context - skipping UI"); }
  try {
    ui.createMenu('🧠 Sim Builder')
      .addItem('🩺 Suggest Waveform Mapping', 'suggestWaveformMapping')
      .addItem('🔄 Auto-Map All Waveforms', 'autoMapAllWaveforms')
      .addSeparator()
      .addItem('📊 Analyze Current Mappings', 'analyzeCurrentMappings')
      .addItem('❌ Clear All Waveforms', 'clearAllWaveforms')
      .addToUi();
  } catch (e) {
    Logger.log('Menu extension error: ' + e);
  }
})();

// === 2. Mapping logic ===
function detectWaveformForState_(caseTitle, initialRhythm, dispositionPlan, stateName) {
  const txt = `${caseTitle} ${initialRhythm} ${dispositionPlan}`.toLowerCase();
  const isArrest = /arrest|critical/i.test(stateName);
  const isWorsening = /worsening|deterior/i.test(stateName);

  if (isArrest) {
    if (txt.includes('pea')) return 'peapulseless_ecg';
    if (txt.includes('asystole') || txt.includes('flatline')) return 'asystole_ecg';
    if (txt.includes('vfib')) return 'vfib_ecg';
    if (txt.includes('vtach')) return 'vtach_ecg';
    if (txt.includes('torsades')) return 'torsades_ecg';
    return 'asystole_ecg';
  }
  if (isWorsening) {
    if (txt.includes('vtach')) return 'vtach_ecg';
    if (txt.includes('svt')) return 'svt_ecg';
    if (txt.includes('aflutter')) return 'aflutter_ecg';
  }
  if (txt.includes('afib')) return 'afib_ecg';
  if (txt.includes('aflutter')) return 'aflutter_ecg';
  if (txt.includes('paced') || txt.includes('pacemaker')) return 'paced_ecg';
  if (txt.includes('junctional')) return 'junctional_ecg';
  if (txt.includes('bigeminy')) return 'bigeminy_ecg';
  if (txt.includes('trigeminy')) return 'trigeminy_ecg';
  return 'sinus_ecg';
}

// === 3. Helpers ===
function getHeaders_(sheet) {
  const t1 = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const t2 = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
  return t1.map((a, i) => `${a}:${t2[i]}`);
}
function buildCase_(headers, row) {
  const o = {};
  headers.forEach((h, i) => (o[h] = row[i]));
  return o;
}

// === 4. Suggest mapping for active row ===
function suggestWaveformMapping() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Scenario Convert');
  const ui = getSafeUi_();
  if (!sheet) return ui.alert('❌ Sheet "Master Scenario Convert" not found');
  const r = sheet.getActiveCell().getRow();
  if (r < 3) return ui.alert('Select a data row (≥ 3)');

  const headers = getHeaders_(sheet);
  const vals = sheet.getRange(r, 1, 1, headers.length).getValues()[0];
  const data = buildCase_(headers, vals);
  const title = data['Case_Organization:Reveal_Title'] || data['Case_Organization:Spark_Title'] || '';
  const rhythm = data['Patient_Demographics_and_Clinical_Data:Initial_Rhythm'] || '';
  const plan = data['Situation_and_Environment_Details:Disposition_Plan'] || '';
  const states = (data['image sync:Default_Patient_States'] || 'Baseline,Worsening,Arrest,Recovery').split(',');

  let msg = `📋 ${title}\n\n🩺 Suggested Waveforms:\n`;
  ['Initial_Vitals','State1_Vitals','State2_Vitals','State3_Vitals','State4_Vitals','State5_Vitals'].forEach((f,i)=>{
    const sName = states[i] || f;
    const w = detectWaveformForState_(title, rhythm, plan, sName);
    msg += `• ${sName}: ${WAVEFORMS[w]}\n`;
  });
  if (ui) { ui.alert('Waveform Suggestions', msg, ui.ButtonSet.OK); }
}

// === 5. Auto-map all waveforms ===
function autoMapAllWaveforms() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Scenario Convert');
  const ui = getSafeUi_();
  if (!sheet) return ui.alert('❌ Sheet "Master Scenario Convert" not found');
  if (ui.alert('Auto-Map Waveforms','Map all cases intelligently?',ui.ButtonSet.YES_NO)!==ui.Button.YES) return;

  const headers = getHeaders_(sheet);
  const dataR = sheet.getRange(3,1,sheet.getLastRow()-2,headers.length);
  const data = dataR.getValues();
  let count=0;

  data.forEach(row=>{
    const d=buildCase_(headers,row);
    const title=d['Case_Organization:Reveal_Title']||'';
    const rhythm=d['Patient_Demographics_and_Clinical_Data:Initial_Rhythm']||'';
    const plan=d['Situation_and_Environment_Details:Disposition_Plan']||'';
    const states=(d['image sync:Default_Patient_States']||'Baseline,Worsening,Arrest,Recovery').split(',');
    ['Initial_Vitals','State1_Vitals','State2_Vitals','State3_Vitals','State4_Vitals','State5_Vitals'].forEach((f,i)=>{
      const col=headers.indexOf(`Monitor_Vital_Signs:${f}`);
      if(col===-1)return;
      try{
        const v=JSON.parse(row[col]);
        const w=detectWaveformForState_(title,rhythm,plan,states[i]||f);
        v.waveform=w; row[col]=JSON.stringify(v); count++;
      }catch(e){}
    });
  });
  dataR.setValues(data);
  if (ui) { ui.alert('✅ Auto-mapping complete',`Updated ${count} waveforms`,ui.ButtonSet.OK); }
}

// === 6. Analyze distribution ===
function analyzeCurrentMappings() {
  const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Scenario Convert');
  const ui=getSafeUi_();
  if(!sheet)return ui.alert('❌ Sheet not found');
  const h=getHeaders_(sheet);
  const dr=sheet.getRange(3,1,sheet.getLastRow()-2,h.length);
  const d=dr.getValues();
  const stats={};let tot=0,withWF=0;
  d.forEach(r=>{
    ['Initial_Vitals','State1_Vitals','State2_Vitals','State3_Vitals','State4_Vitals','State5_Vitals'].forEach(f=>{
      const c=h.indexOf(`Monitor_Vital_Signs:${f}`);
      if(c===-1)return;
      try{const v=JSON.parse(r[c]);tot++;if(v.waveform){withWF++;stats[v.waveform]=(stats[v.waveform]||0)+1;}}catch(e){}
    });
  });
  let msg=`Total Vitals: ${tot}\nWith Waveforms: ${withWF}\nMissing: ${tot-withWF}\n\n`;
  Object.keys(stats).sort((a,b)=>stats[b]-stats[a]).forEach(k=>msg+=`${WAVEFORMS[k]||k}: ${stats[k]}\n`);
  if (ui) { ui.alert('Waveform Analysis',msg,ui.ButtonSet.OK); }
}

// === 7. Clear all waveforms ===
function clearAllWaveforms() {
  const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Master Scenario Convert');
  const ui=getSafeUi_();
  if(!sheet)return ui.alert('❌ Sheet not found');
  if(ui.alert('Clear All Waveforms','⚠️ Remove all waveforms?',ui.ButtonSet.YES_NO)!==ui.Button.YES)return;
  const h=getHeaders_(sheet);
  const dr=sheet.getRange(3,1,sheet.getLastRow()-2,h.length);
  const d=dr.getValues();let n=0;
  d.forEach(r=>{
    ['Initial_Vitals','State1_Vitals','State2_Vitals','State3_Vitals','State4_Vitals','State5_Vitals'].forEach(f=>{
      const c=h.indexOf(`Monitor_Vital_Signs:${f}`);if(c===-1)return;
      try{const v=JSON.parse(r[c]);if(v.waveform){delete v.waveform;r[c]=JSON.stringify(v);n++;}}catch(e){}
    });
  });
  dr.setValues(d);
  if (ui) { ui.alert('❌ Cleared',`Removed ${n} waveforms`,ui.ButtonSet.OK); }
}


/******************************************************
 * 🔗 Live Sync Webhook Trigger (Google → Local)
 ******************************************************/
const LIVE_SYNC_URL = "https://overlate-nontemporizingly-edris.ngrok-free.dev/vitals-update"; // ngrok tunnel

function onEdit(e) {
  try {
    // If run manually (no event), bail early
    if (!e || !e.range) {
      Logger.log("⚠️ onEdit called manually - skipping live sync");
      return;
    }

    const sheet = e.range.getSheet();
    if (sheet.getName() !== "Master Scenario Convert" || e.range.getRow() < 3) {
      Logger.log("⚠️ Edit ignored: not in Master Scenario Convert or header row");
      return;
    }

    const row = e.range.getRow();
    const dataRange = sheet.getRange(row, 1, 1, sheet.getLastColumn());
    const headers1 = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const headers2 = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowValues = dataRange.getValues()[0];
    const mergedKeys = headers1.map((t1, i) => `${t1}:${headers2[i]}`);

    const entry = {};
    mergedKeys.forEach((key, i) => {
      const val = rowValues[i];
      if (val && val !== "N/A") entry[key] = tryParseJSON(val);
    });

    // Post update to your local LiveSync server
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(entry),
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(LIVE_SYNC_URL, options);
    Logger.log(`📡 Sent live update for row ${row}: ${response.getResponseCode()}`);
  } catch (err) {
    Logger.log("❌ Live Sync error: " + err);
  }
}


// === TEST FUNCTION: Manually trigger batch processing ===
function testBatchProcessRow3() {
  try {
    const ss = SpreadsheetApp.getActive();
    const inSheet = ss.getSheetByName('Input');
    const outSheet = ss.getSheetByName('Master Scenario Convert');

    Logger.log('📋 Starting test batch for Input row 3...');

    const summary = processOneInputRow_(inSheet, outSheet, 3, true);

    Logger.log('✅ Result: ' + JSON.stringify(summary));

    return {
      success: true,
      summary: summary,
      message: summary.message || 'Completed'
    };

  } catch (err) {
    Logger.log('❌ ERROR: ' + err.message);
    Logger.log('Stack: ' + err.stack);

    return {
      success: false,
      error: err.message,
      stack: err.stack,
      errorDetails: err.toString()
    };
  }
}



// === DIAGNOSTIC FUNCTION: Test Live Logging System ===
function testLiveLogging() {
  try {
    Logger.log('🔍 Starting Live Logging Diagnostic Test');

    // Test 1: Can we write to Document Properties?
    Logger.log('Test 1: Writing to Document Properties...');
    appendLogSafe('🧪 TEST LOG 1: appendLogSafe() is working!');
    Logger.log('✅ Test 1 passed');

    // Test 2: Can we read back what we wrote?
    Logger.log('Test 2: Reading from Document Properties...');
    const logs = getSidebarLogs();
    Logger.log('Retrieved logs: ' + logs);
    Logger.log('✅ Test 2 passed');

    // Test 3: Add more logs
    Logger.log('Test 3: Adding multiple log entries...');
    appendLogSafe('🧪 TEST LOG 2: Second entry');
    appendLogSafe('🧪 TEST LOG 3: Third entry with timestamp');
    Logger.log('✅ Test 3 passed');

    // Test 4: Read final result
    const finalLogs = getSidebarLogs();
    Logger.log('Final logs content:');
    Logger.log(finalLogs);

    return {
      success: true,
      message: 'All tests passed! Check execution logs for details.',
      logsLength: finalLogs.length,
      logsPreview: finalLogs.substring(0, 200)
    };

  } catch (err) {
    Logger.log('❌ ERROR: ' + err.message);
    Logger.log('Stack: ' + err.stack);
    return {
      success: false,
      error: err.message,
      stack: err.stack
    };
  }
}

// === DIAGNOSTIC FUNCTION: Check if batch mode flag is set ===
function testBatchModeFlag() {
  try {
    const inSheet = SpreadsheetApp.getActive().getSheetByName('Input');
    const outSheet = SpreadsheetApp.getActive().getSheetByName('Master Scenario Convert');

    Logger.log('🔍 Testing batch mode flag...');
    Logger.log('');

    // Call processOneInputRow_ with batchMode=true
    Logger.log('Calling processOneInputRow_ with batchMode=true on row 3...');
    const result = processOneInputRow_(inSheet, outSheet, 3, true);

    Logger.log('Result: ' + JSON.stringify(result));
    Logger.log('');
    Logger.log('Now check Document Properties:');

    const logs = getSidebarLogs();
    Logger.log('Sidebar_Logs content:');
    Logger.log(logs || '(empty)');

    return {
      success: true,
      result: result,
      logsFound: logs && logs.length > 0,
      logsLength: (logs || '').length,
      logsPreview: (logs || '').substring(0, 300)
    };

  } catch (err) {
    Logger.log('❌ ERROR: ' + err.message);
    return {
      success: false,
      error: err.message
    };
  }

function clearApiKeyCache() {
  PropertiesService.getDocumentProperties().deleteProperty('OPENAI_API_KEY');
  Logger.log('✅ Cleared API key cache');
  return 'API key cache cleared. Will re-read from Settings sheet on next use.';
}

/**
 * Show a temporary toast notification
 * Auto-closes after 3 seconds
 */
function showToast(message, duration) {
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(message, '✅ Success', duration || 3);
  } catch (e) {
    Logger.log('Toast: ' + message);
  }
}


function analyzeOutputSheetStructure() {
  const ss = SpreadsheetApp.getActive();

  // Get output sheet name from Settings
  const settingsSheet = ss.getSheetByName('Settings');
  let outputSheetName = 'Master Scenario Convert';
  if (settingsSheet) {
    const settingsOut = settingsSheet.getRange('A1').getValue();
    if (settingsOut) outputSheetName = settingsOut;
  }

  const outSheet = ss.getSheetByName(outputSheetName);
  if (!outSheet) return { error: 'Output sheet not found: ' + outputSheetName };

  const lastRow = outSheet.getLastRow();
  const lastCol = outSheet.getLastColumn();

  // Get headers (row 1 and row 2)
  const tier1Headers = outSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const tier2Headers = outSheet.getRange(2, 1, 1, lastCol).getValues()[0];

  // Get a few sample data rows
  const sampleRows = [];
  const sampleStart = Math.max(3, lastRow - 2); // Last 3 data rows
  if (lastRow >= 3) {
    const sampleData = outSheet.getRange(sampleStart, 1, lastRow - sampleStart + 1, lastCol).getValues();
    sampleRows.push(...sampleData);
  }

  return {
    sheetName: outputSheetName,
    lastRow: lastRow,
    lastCol: lastCol,
    tier1Headers: tier1Headers,
    tier2Headers: tier2Headers,
    sampleRows: sampleRows,
    sampleStartRow: sampleStart
  };
}

function clearAllBatchProperties() {
  const props = PropertiesService.getDocumentProperties();

  // Clear all batch-related properties
  const keysToDelete = [
    'BATCH_QUEUE',
    'BATCH_ROWS',
    'BATCH_INPUT_SHEET',
    'BATCH_OUTPUT_SHEET',
    'BATCH_MODE',
    'BATCH_SPEC',
    'BATCH_STOP',
    'BATCH_RUNNING',
    'BATCH_CURRENT_ROW'
  ];

  keysToDelete.forEach(key => {
    try {
      props.deleteProperty(key);
    } catch(e) {
      // Ignore if property doesn't exist
    }
  });

  Logger.log('✅ Cleared all batch properties');
  return 'Batch queue cleared. Ready to start fresh from row 15.';
}
}


// ==================== TITLE OPTIMIZER (ATSR) ====================
// Complete ATSR system with Spark/Reveal titles and mystery regeneration

/**
 * ATSR Title Generator Feature - Complete
 *
 * Everything for ATSR (Automated Titles, Summary & Review Generator):
 * - Complete ATSR UI with selection interface
 * - ALL GOLDEN PROMPTS PRESERVED CHARACTER-FOR-CHARACTER
 * - OpenAI API integration
 * - Response parsing and validation
 * - User selection and memory tracking
 *
 * Common Utility Goal: Adjust all ATSR features
 *
 * External Dependencies:
 * - Core_Processing_Engine.gs (for tryParseJSON)
 *
 * Generated: 2025-11-04T18:48:41.621Z
 * Source: Code_ULTIMATE_ATSR.gs (complete feature extraction)
 */

// ==================== ATSR FEATURE ====================

// Custom menu for test environment

// ========== ATSR HELPER FUNCTIONS & CONSTANTS ==========






// Constants for OpenAI API

// API Key Management


// OpenAI API Calls

// ========== 6) ATSR — Titles & Summary (Keep & Regenerate, Deselect, Memory) ==========




// ATSR-specific JSON parser that handles markdown code fences








// Generate ultra-mysterious Spark Titles that completely hide the diagnosis
function generateMysteriousSparkTitles(row, mysteryLevel, currentTitles) {
  const s = pickMasterSheet_();
  const headers = s.getRange(2,1,1,s.getLastColumn()).getValues()[0];
  const rowData = s.getRange(row, 1, 1, headers.length).getValues()[0];

  // Build data object
  const data = {};
  headers.forEach((h,i) => { data[h] = rowData[i]; });

  // Extract the diagnosis from Reveal Title
  const revealTitle = data['Case_Organization_Reveal_Title'] || '';
  const diagnosisMatch = revealTitle.match(/^([^(]+)/);
  const diagnosis = diagnosisMatch ? diagnosisMatch[1].trim() : 'Unknown';

  // Extract age/gender from current Spark Title (e.g., "Title (58 M): Description")
  const currentSparkTitle = data['Case_Organization_Spark_Title'] || '';
  const demographicMatch = currentSparkTitle.match(/\((\d+\s+[MF])\)/);
  const demographic = demographicMatch ? demographicMatch[1] : null;

  // Get patient summary
  const patientSummary = data['Case_Summary_Patient_Summary'] || 'A patient presents with concerning symptoms.';

  // Adjust mystery level instructions
  const level = mysteryLevel || 1;
  let mysteryInstructions = '';

  if (level === 1) {
    mysteryInstructions = '**MYSTERY LEVEL 1 (Moderate Mystery):**\n' +
      '- Use vague family observations\n' +
      '- Avoid medical terms but can hint at general concern\n' +
      '- Example: "Grandpa\'s Not Acting Right"\n\n';
  } else if (level === 2) {
    mysteryInstructions = '**MYSTERY LEVEL 2 (High Mystery):**\n' +
      '- Even more vague and indirect\n' +
      '- Focus on pure behavioral changes\n' +
      '- Example: "Something\'s Different Today"\n\n';
  } else if (level === 3) {
    mysteryInstructions = '**MYSTERY LEVEL 3 (Maximum Mystery):**\n' +
      '- Extremely vague, almost cryptic\n' +
      '- Pure emotion and concern only\n' +
      '- Example: "I\'m Worried"\n\n';
  } else {
    mysteryInstructions = '**MYSTERY LEVEL ' + level + ' (ULTRA Maximum):**\n' +
      '- Absolutely NO specifics whatsoever\n' +
      '- Pure gut feeling and unease\n' +
      '- Example: "Something\'s Not Right"\n\n';
  }

  // Build the prompt based on whether we have current titles to iterate on
  let prompt = '';

  if (currentTitles && currentTitles.length > 0) {
    // ITERATIVE MODE: Make existing titles MORE mysterious
    const formatInstruction = demographic
      ? '**FORMAT REQUIREMENT:**\nEach title MUST follow this exact format:\n"Title (' + demographic + '): Brief description"\n\nExample: "Grandpa\'s Not Acting Right (' + demographic + '): Family Concerned"\n\n'
      : '';

    prompt = 'You are making existing pre-simulation titles EVEN MORE MYSTERIOUS to completely hide the diagnosis.\n\n' +
      mysteryInstructions +
      '**YOUR TASK:**\n' +
      'Take each of these titles and make them MORE vague, MORE mysterious, and LESS revealing.\n' +
      'Remove any remaining hints about the condition. Make them more cryptic and indirect.\n' +
      'Keep the human context and emotional tone, but be even more subtle.\n\n' +
      '**Current Titles to Make More Mysterious:**\n' +
      JSON.stringify(currentTitles, null, 2) + '\n\n' +
      formatInstruction +
      '**Patient Context (to maintain relevance):**\n' +
      patientSummary + '\n\n' +
      '**Actual Diagnosis (HIDE THIS COMPLETELY):**\n' +
      diagnosis + '\n\n' +
      '**CRITICAL RULES:**\n' +
      '- NEVER mention the diagnosis (' + diagnosis + ')\n' +
      '- NEVER use medical terminology\n' +
      '- Remove any remaining clinical hints\n' +
      '- Make each title LESS specific than before\n' +
      '- Use even vaguer language\n' +
      '- Focus on pure emotion and concern\n' +
      '- Keep titles grounded in the patient context (age, setting, etc.)\n' +
      '- Maintain human perspective (family member, concerned observer)\n' +
      (demographic ? '- ALWAYS include (' + demographic + ') in each title\n' : '') +
      '\n' +
      'Return ONLY a JSON array of the same number of titles, now more mysterious:\n' +
      '["More mysterious version of title 1", "More mysterious version of title 2", ...]';
  } else {
    // INITIAL MODE: Generate from scratch
    const formatInstruction = demographic
      ? '**FORMAT REQUIREMENT:**\nEach title MUST follow this exact format:\n"Title (' + demographic + '): Brief description"\n\nExample: "Grandpa\'s Not Acting Right (' + demographic + '): Family Concerned"\n\n'
      : '';

    const exampleSuffix = demographic ? ' (' + demographic + ')' : '';

    prompt = 'You are creating ULTRA-MYSTERIOUS pre-simulation titles that COMPLETELY HIDE the diagnosis from learners.\n\n' +
      mysteryInstructions +
      formatInstruction +
      '**CRITICAL RULES:**\n' +
      '- NEVER mention the diagnosis (' + diagnosis + ')\n' +
      '- NEVER use medical terminology that reveals the condition\n' +
      '- NEVER hint at the organ system or pathophysiology\n' +
      '- Focus on vague, concerning observations\n' +
      '- Use layperson language and indirect descriptions\n' +
      '- Create curiosity and mystery without clinical clues\n' +
      (demographic ? '- ALWAYS include (' + demographic + ') in each title\n' : '') +
      '\n' +
      '**Patient Context:**\n' +
      patientSummary + '\n\n' +
      '**Actual Diagnosis (HIDE THIS COMPLETELY):**\n' +
      diagnosis + '\n\n' +
      '**Examples of Ultra-Mysterious Titles:**\n' +
      '- "Grandpa\'s Not Acting Right' + exampleSuffix + ': Family Concerned"\n' +
      '- "She Just Doesn\'t Look Right' + exampleSuffix + ': Something\'s Wrong"\n' +
      '- "Something\'s Off with Dad Today' + exampleSuffix + ': Can\'t Put My Finger on It"\n' +
      '- "The Kid Who Won\'t Stop Crying' + exampleSuffix + ': Parents Worried"\n' +
      '- "Mom Says He\'s Not Himself' + exampleSuffix + ': Acting Strange"\n\n' +
      '**Generate 5 ultra-mysterious Spark Titles that:**\n' +
      '1. Use concerned family member observations\n' +
      '2. Describe behavioral/emotional changes only\n' +
      '3. Avoid ANY medical symptoms or terms\n' +
      '4. Create urgency through human context\n' +
      '5. Make learners think "I need to assess this"\n' +
      (demographic ? '6. Include (' + demographic + ') in EVERY title\n' : '') +
      '\n' +
      'Return ONLY a JSON array of 5 title strings, no explanation:\n' +
      '["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"]';
  }

  Logger.log('🎭 Generating ultra-mysterious Spark Titles (Level ' + level + ')');
  Logger.log('   For diagnosis: ' + diagnosis);
  if (currentTitles && currentTitles.length > 0) {
    Logger.log('   Iterating on ' + currentTitles.length + ' existing titles');
  } else {
    Logger.log('   Generating fresh titles from scratch');
  }

  const response = callOpenAI(prompt, 0.9); // High temperature for creativity
  Logger.log('📝 OpenAI response: ' + response);

  // Parse the JSON array
  const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const titles = JSON.parse(cleanResponse);

  Logger.log('✅ Generated ' + titles.length + ' mysterious titles');
  return titles;
}

// New save function that handles data from the UI

// Legacy function kept for compatibility



// ==================== CATEGORIES & PATHWAYS PHASE 2 ====================
// Field Selector with 27 default headers and AI recommendations


/**
 * Get AI-recommended fields based on pathway discovery potential
 * Asks OpenAI which fields would maximize clinical reasoning pathways
 * Only recommends from unselected fields (excludes currently selected)
 */

/**
 * Static fallback recommendations (used when API unavailable)
 */



/**
 * Get static recommended fields using ACTUAL flattened header names
 * Returns 8-12 fields that are valuable but not in the default 27
 */
function getStaticRecommendedFields_() {
  Logger.log('🔍 getStaticRecommendedFields_() - using dynamic header cache');

  try {
    const docProps = PropertiesService.getDocumentProperties();
    const cachedMergedKeys = docProps.getProperty('CACHED_MERGED_KEYS');
    
    if (!cachedMergedKeys) {
      Logger.log('⚠️ No cached headers - returning empty array');
      return [];
    }

    const allFields = JSON.parse(cachedMergedKeys);
    Logger.log('✅ Read ' + allFields.length + ' fields from CACHED_MERGED_KEYS');

    // Get currently selected fields to avoid duplicates
    const savedSelection = docProps.getProperty('SELECTED_CACHE_FIELDS');
    const selected = savedSelection ? JSON.parse(savedSelection) : [];

    // Intelligent selection based on tier2 patterns
    // These patterns identify clinically useful fields
    const valuableTier2Patterns = [
      'Presenting_Complaint',
      'Chief_Complaint', 
      'Medical_History',
      'Past_Medical_History',
      'Medications',
      'Current_Medications',
      'Allergies',
      'Social_History',
      'Teaching_Points',
      'Key_Teaching_Points',
      'Common_Pitfalls',
      'Common_Errors',
      'Critical_Actions',
      'Critical_Action_Checklist',
      'Expected_Actions',
      'Common_Pitfalls_Discussion',
      'Differential_Diagnosis',
      'Key_Clinical_Features'
    ];

    const recommended = [];

    allFields.forEach(function(fieldName) {
      // Skip if already selected
      if (selected.indexOf(fieldName) !== -1) {
        return;
      }

      // Parse field name: "Patient_Demographics_and_Clinical_Data_Age" → tier2: "Age"
      const parts = fieldName.split('_');
      const tier2 = parts[parts.length - 1];

      // Check if tier2 matches any valuable pattern
      const isValuable = valuableTier2Patterns.some(function(pattern) {
        return tier2 === pattern || fieldName.indexOf(pattern) !== -1;
      });

      if (isValuable && recommended.length < 12) {
        recommended.push(fieldName);
      }
    });

    Logger.log('✅ Selected ' + recommended.length + ' recommended fields dynamically');
    if (recommended.length > 0) {
      Logger.log('   Fields: ' + recommended.slice(0, 5).join(', ') + (recommended.length > 5 ? '...' : ''));
    }

    return recommended;

  } catch (e) {
    Logger.log('⚠️ Error in getStaticRecommendedFields_: ' + e.message);
    return [];
  }
}

/**
 * Get default 27 field names for cache system
 * These are the core fields needed for pathway analysis
 */
function getDefaultFieldNames_() {
  // Try to use these specific 27 fields if they exist
  const preferred = [
    'Case_Organization_Case_ID',
    'Case_Organization_Spark_Title',
    'Case_Organization_Reveal_Title',
    'Case_Organization_Pathway_or_Course_Name',
    'Case_Organization_Difficulty_Level',
    'Case_Organization_Medical_Category',
    'Case_Patient_Demographics_Age',
    'Case_Patient_Demographics_Gender',
    'Case_Patient_Demographics_Chief_Complaint',
    'Monitor_Vital_Signs_Initial_Vitals',
    'Monitor_Vital_Signs_State1_Vitals',
    'Monitor_Vital_Signs_State2_Vitals',
    'Monitor_Vital_Signs_State3_Vitals',
    'Monitor_Vital_Signs_State4_Vitals',
    'Monitor_Vital_Signs_Final_Vitals',
    'Case_Orientation_Chief_Diagnosis',
    'Case_Orientation_Key_Clinical_Features',
    'Case_Orientation_Differential_Diagnosis',
    'Case_Orientation_Critical_Actions',
    'Case_Orientation_Time_Sensitive_Factors',
    'Case_Orientation_Actual_Learning_Outcomes',
    'Case_Orientation_Teaching_Points',
    'Case_Orientation_Common_Pitfalls',
    'Scoring_Criteria_Performance_Benchmarks',
    'Case_Organization_Pre_Sim_Overview',
    'Case_Organization_Post_Sim_Overview',
    'Version_and_Attribution_Full_Attribution_Details'
  ];

  // Fallback: If we can't verify these exist, just return the list
  // getAvailableFields() will filter out non-existent ones anyway
  return preferred;
}

/**
 * Load saved field selection from DocumentProperties
 * Returns saved array or defaults if none saved
 */
function loadFieldSelection() {
  const docProps = PropertiesService.getDocumentProperties();
  const saved = docProps.getProperty('SELECTED_CACHE_FIELDS');

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      Logger.log('⚠️ Error parsing saved field selection: ' + e.message);
    }
  }

  // Return default 27 fields
  return getDefaultFieldNames_();
}


/**
 * Get all available fields from cached flattened headers
 * Returns array of field objects: { name, tier1, tier2, header }
 * Handles flattened format: Row 2 has "Case_Organization_Case_ID"
 */
function getAvailableFields() {
  const docProps = PropertiesService.getDocumentProperties();

  // Read cached merged keys (flattened headers from Row 2)
  const mergedKeysJson = docProps.getProperty('CACHED_MERGED_KEYS');

  if (!mergedKeysJson) {
    throw new Error('Headers not cached. Please run refreshHeaders() first.');
  }

  const mergedKeys = JSON.parse(mergedKeysJson);

  // Build array of field objects by parsing flattened names
  const fields = [];
  for (let i = 0; i < mergedKeys.length; i++) {
    const merged = String(mergedKeys[i] || '').trim();
    if (!merged) continue;

    // Parse flattened name: "Case_Organization_Case_ID" → tier1:"Case_Organization", tier2:"Case_ID"
    // OR simpler: "Case_ID" → tier1:"Case", tier2:"ID"
    const parts = merged.split('_');

    let tier1, tier2;
    if (parts.length >= 3) {
      // Format: Tier1_Tier1Part2_Tier2 (e.g., "Case_Organization_Case_ID")
      // Take first part(s) as tier1, last part as tier2
      tier2 = parts[parts.length - 1];
      tier1 = parts.slice(0, -1).join('_');
    } else if (parts.length === 2) {
      // Format: Tier1_Tier2 (e.g., "Case_ID")
      tier1 = parts[0];
      tier2 = parts[1];
    } else {
      // Single part, no underscore
      tier1 = 'General';
      tier2 = merged;
    }

    fields.push({
      name: merged,        // Use full flattened name as-is
      tier1: tier1,
      tier2: tier2,
      header: merged       // Display flattened name
    });
  }

  Logger.log('📊 Found ' + fields.length + ' available fields from flattened headers');
  return fields;
}

/**
 * Show dynamic field selector modal
 * Reads all available columns and lets user select which to cache
 */

/**
 * Get rough draft data (immediate, no AI call)
 */
function getFieldSelectorRoughDraft() {
  Logger.log('🎯 getFieldSelectorRoughDraft() START');

  var docProps = PropertiesService.getDocumentProperties();

  // STEP 1: Get all valid field names from cached headers (Row 2)
  var cachedMergedKeys = docProps.getProperty('CACHED_MERGED_KEYS');
  if (!cachedMergedKeys) {
    Logger.log('⚠️ Headers not cached - refreshing...');
    refreshHeaders();
    cachedMergedKeys = docProps.getProperty('CACHED_MERGED_KEYS');
  }

  var allFields = JSON.parse(cachedMergedKeys);
  Logger.log('✅ Got ' + allFields.length + ' valid fields from Row 2');

  // STEP 2: Get selected fields (PREFERENCE: last saved, FALLBACK: 35 defaults)
  var savedSelection = docProps.getProperty('SELECTED_CACHE_FIELDS');
  var selected;

  if (savedSelection) {
    // Use last saved selection
    var savedFields = JSON.parse(savedSelection);
    Logger.log('📂 Found last saved selection: ' + savedFields.length + ' fields');

    // VALIDATE: Remove duplicates
    var uniqueFields = [];
    var seen = {};
    for (var i = 0; i < savedFields.length; i++) {
      var fieldName = savedFields[i];
      if (!seen[fieldName]) {
        uniqueFields.push(fieldName);
        seen[fieldName] = true;
      }
    }

    if (uniqueFields.length < savedFields.length) {
      Logger.log('⚠️ Removed ' + (savedFields.length - uniqueFields.length) + ' duplicates from saved selection');
    }

    // VALIDATE: Ensure all fields still exist in current headers
    var validFields = [];
    for (var i = 0; i < uniqueFields.length; i++) {
      if (allFields.indexOf(uniqueFields[i]) !== -1) {
        validFields.push(uniqueFields[i]);
      } else {
        Logger.log('⚠️ Removed invalid field (no longer in CSV): ' + uniqueFields[i]);
      }
    }

    selected = validFields;
    Logger.log('✅ Using ' + selected.length + ' validated fields from last saved selection');

    // Save cleaned version back
    if (selected.length !== savedFields.length) {
      docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(selected));
      Logger.log('✅ Saved cleaned selection (removed ' + (savedFields.length - selected.length) + ' invalid entries)');
    }

  } else {
    // No saved selection - use 35 intelligent defaults
    Logger.log('⚠️ No saved selection - initializing 35 intelligent defaults');

    var defaultFields = [
            'Case_Organization_Case_ID',
      'Case_Organization_Spark_Title',
      'Case_Organization_Reveal_Title',
      'Case_Organization_Pathway_or_Course_Name',
      'Case_Organization_Difficulty_Level',
      'Case_Organization_Medical_Category',

            'Patient_Demographics_and_Clinical_Data_Age',
      'Patient_Demographics_and_Clinical_Data_Gender',
      'Patient_Demographics_and_Clinical_Data_Presenting_Complaint',
      'Patient_Demographics_and_Clinical_Data_Past_Medical_History',
      'Patient_Demographics_and_Clinical_Data_Exam_Positive_Findings',
      'Monitor_Vital_Signs_Initial_Vitals',
      'Scenario_Progression_States_Decision_Nodes_JSON',
      'Set_the_Stage_Context_Case_Summary_Concise',

            'CME_and_Educational_Content_CME_Learning_Objective',
      'Set_the_Stage_Context_Educational_Goal',
      'Set_the_Stage_Context_Why_It_Matters',
      'Developer_and_QA_Metadata_Simulation_Quality_Score',
      'Case_Organization_Original_Title',

            'Set_the_Stage_Context_Environment_Type',
      'Set_the_Stage_Context_Environment_Description_for_AI_Image',
      'Situation_and_Environment_Details_Triage_or_SBAR_Note',
      'Situation_and_Environment_Details_Disposition_Plan',
      'Scenario_Progression_States_Branching_Notes',
      'Staff_and_AI_Interaction_Config_Patient_Script',

            'Monitor_Vital_Signs_State1_Vitals',
      'Monitor_Vital_Signs_State2_Vitals',
      'Monitor_Vital_Signs_State3_Vitals',
      'Monitor_Vital_Signs_State4_Vitals',
      'Monitor_Vital_Signs_State5_Vitals',
      'Monitor_Vital_Signs_Vitals_Format',

            'Developer_and_QA_Metadata_AI_Reflection_and_Suggestions',
      'Version_and_Attribution_Full_Attribution_Details',
      'Case_Organization_Pre_Sim_Overview',
      'Case_Organization_Post_Sim_Overview'
    ];

    // VALIDATE: Ensure defaults exist in current headers
    var validDefaults = [];
    for (var i = 0; i < defaultFields.length; i++) {
      if (allFields.indexOf(defaultFields[i]) !== -1) {
        validDefaults.push(defaultFields[i]);
      } else {
        Logger.log('⚠️ Default field not in current CSV: ' + defaultFields[i]);
      }
    }

    selected = validDefaults;
    Logger.log('✅ Using ' + selected.length + ' validated defaults (from 35 originals)');

    // Save validated defaults
    docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(selected));
    Logger.log('✅ Saved validated defaults');
  }

  Logger.log('✅ getFieldSelectorRoughDraft() COMPLETE');
  Logger.log('   → ' + allFields.length + ' total fields available');
  Logger.log('   → ' + selected.length + ' fields selected (DEFAULT section)');
  Logger.log('   → ' + (allFields.length - selected.length) + ' fields unselected (OTHER section)');

  return {
    allFields: allFields,
    selected: selected
  };
}

/**
 * Get AI recommendations (async, called after rough draft loads)
 */
function getAIRecommendations(currentlySelected, availableFields) {
  Logger.log('🤖 getAIRecommendations() START');
  Logger.log('   Current selection: ' + currentlySelected.length + ' fields');
  Logger.log('   Available fields: ' + availableFields.length);

  try {
    // Check for cached recommendations first
    var docProps = PropertiesService.getDocumentProperties();
    var cachedRecs = docProps.getProperty('AI_RECOMMENDED_FIELDS');
    var cachedTime = docProps.getProperty('AI_RECOMMENDATIONS_TIMESTAMP');

    if (cachedRecs && cachedTime) {
      var age = (new Date() - new Date(cachedTime)) / 1000;
      if (age < 3600) { // 1 hour cache
        Logger.log('✅ Using cached AI recommendations (age: ' + Math.round(age) + 's)');
        return JSON.parse(cachedRecs);
      }
    }

    // Call getRecommendedFields (which calls OpenAI)
    Logger.log('📞 Calling OpenAI API...');
    var availableFieldObjects = availableFields.map(function(name) {
      return { name: name };
    });

    var recommendations = getRecommendedFields(availableFieldObjects, currentlySelected);

    // Cache for next time
    docProps.setProperty('AI_RECOMMENDED_FIELDS', JSON.stringify(recommendations));
    docProps.setProperty('AI_RECOMMENDATIONS_TIMESTAMP', new Date().toISOString());

    Logger.log('✅ Got ' + recommendations.length + ' AI recommendations');

    return recommendations;

  } catch (error) {
    Logger.log('⚠️ AI recommendation error: ' + error.toString());
    return []; // Return empty array on error
  }
}




function getRecommendedFields(availableFields, selectedFields) {
  // Try to get AI recommendations, fall back to static if API unavailable
  try {
    const apiKey = readApiKey_();
    if (!apiKey) {
      Logger.log('⚠️ No API key - using static recommendations');
      return getStaticRecommendedFields_();
    }

    // availableFields passed as parameter
    const currentlySelected = selectedFields; // Get saved or default fields

    // Filter to only unselected fields
    const unselectedFields = availableFields.filter(function(f) {
      return currentlySelected.indexOf(f.name) === -1;
    });

    const fieldDescriptions = unselectedFields.map(function(f) {
      return {
        name: f.name,
        header: f.header,
        category: f.tier1
      };
    });

    const prompt = 'You are a medical education expert analyzing which data fields would be most valuable for AI pathway discovery in emergency medicine simulation cases.\n\n' +
      'CURRENTLY SELECTED FIELDS (already chosen, DO NOT recommend these):\n' +
      JSON.stringify(currentlySelected, null, 2) + '\n\n' +
      'AVAILABLE UNSELECTED FIELDS (choose from these ONLY):\n' +
      JSON.stringify(fieldDescriptions, null, 2) + '\n\n' +
      'PATHWAY DISCOVERY GOALS:\n' +
      '- Clinical reasoning pathways (differential diagnosis, pattern recognition)\n' +
      '- Risk stratification pathways (high-risk → low-risk)\n' +
      '- Time-critical decision pathways (STEMI, stroke, sepsis)\n' +
      '- Cognitive bias awareness pathways (anchoring, premature closure)\n' +
      '- Skill progression pathways (novice → expert)\n' +
      '- Patient complexity pathways (single-system → multi-system)\n\n' +
      'TASK: From the UNSELECTED fields only, recommend fields that would maximize (as many or few as make sense) pathway discovery potential.\n\n' +
      'PRIORITIZE fields that:\n' +
      '- Enable differential diagnosis logic\n' +
      '- Support risk stratification\n' +
      '- Reveal clinical reasoning patterns\n' +
      '- Identify time-critical cases\n' +
      '- Show patient complexity\n\n' +
      'IMPORTANT: Only recommend from UNSELECTED fields. Do NOT include any currently selected fields.\n\n' +
      'Return ONLY a JSON array of field names: ["fieldName1", "fieldName2", ...]';

    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4o',  // Project standard
      messages: [
        {
          role: 'system',
          content: 'You are an expert in medical education and clinical reasoning. Respond ONLY with valid JSON. NEVER recommend fields that are already selected.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,  // Low temperature for consistent recommendations
      max_tokens: 500
    };

    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      Logger.log('⚠️ OpenAI API error: ' + responseCode + ' - using static recommendations');
      return getStaticRecommendedFields_();
    }

    const data = JSON.parse(response.getContentText());
    const aiResponse = data.choices[0].message.content.trim();

    // Extract JSON array from response
    const jsonMatch = aiResponse.match(/\[[\"\w\s,]+\]/);
    if (!jsonMatch) {
      Logger.log('⚠️ Could not parse AI response - using static recommendations');
      return getStaticRecommendedFields_();
    }

    const recommendedFields = JSON.parse(jsonMatch[0]);

    // Extra safety: Filter out any selected fields AI might have included
    const filteredRecommendations = recommendedFields.filter(function(field) {
      return currentlySelected.indexOf(field) === -1;
    });

    Logger.log('✅ AI recommended ' + filteredRecommendations.length + ' fields from unselected pool');
    Logger.log('   Fields: ' + filteredRecommendations.join(', '));

    return filteredRecommendations;
  } catch (e) {
    Logger.log('⚠️ Error getting AI recommendations: ' + e.message);
    return getStaticRecommendedFields_();
  }
}

/**
 * Static fallback recommendations (used when API unavailable)
 */
function getRecommendedFields(availableFields, selectedFields) {
  // Try to get AI recommendations, fall back to static if API unavailable
  try {
    const apiKey = readApiKey_();
    if (!apiKey) {
      Logger.log('⚠️ No API key - using static recommendations');
      return getStaticRecommendedFields_();
    }

    // availableFields passed as parameter
    const currentlySelected = selectedFields; // Get saved or default fields

    // Filter to only unselected fields
    const unselectedFields = availableFields.filter(function(f) {
      return currentlySelected.indexOf(f.name) === -1;
    });

    const fieldDescriptions = unselectedFields.map(function(f) {
      return {
        name: f.name,
        header: f.header,
        category: f.tier1
      };
    });

    const prompt = 'You are a medical education expert analyzing which data fields would be most valuable for AI pathway discovery in emergency medicine simulation cases.\n\n' +
      'CURRENTLY SELECTED FIELDS (already chosen, DO NOT recommend these):\n' +
      JSON.stringify(currentlySelected, null, 2) + '\n\n' +
      'AVAILABLE UNSELECTED FIELDS (choose from these ONLY):\n' +
      JSON.stringify(fieldDescriptions, null, 2) + '\n\n' +
      'PATHWAY DISCOVERY GOALS:\n' +
      '- Clinical reasoning pathways (differential diagnosis, pattern recognition)\n' +
      '- Risk stratification pathways (high-risk → low-risk)\n' +
      '- Time-critical decision pathways (STEMI, stroke, sepsis)\n' +
      '- Cognitive bias awareness pathways (anchoring, premature closure)\n' +
      '- Skill progression pathways (novice → expert)\n' +
      '- Patient complexity pathways (single-system → multi-system)\n\n' +
      'TASK: From the UNSELECTED fields only, select 8-12 that would maximize pathway discovery potential.\n\n' +
      'PRIORITIZE fields that:\n' +
      '- Enable differential diagnosis logic\n' +
      '- Support risk stratification\n' +
      '- Reveal clinical reasoning patterns\n' +
      '- Identify time-critical cases\n' +
      '- Show patient complexity\n\n' +
      'IMPORTANT: Only recommend from UNSELECTED fields. Do NOT include any currently selected fields.\n\n' +
      'Return ONLY a JSON array of field names: ["fieldName1", "fieldName2", ...]';

    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4o-mini',  // Fast and cheap for recommendations
      messages: [
        {
          role: 'system',
          content: 'You are an expert in medical education and clinical reasoning. Respond ONLY with valid JSON. NEVER recommend fields that are already selected.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,  // Low temperature for consistent recommendations
      max_tokens: 500
    };

    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      Logger.log('⚠️ OpenAI API error: ' + responseCode + ' - using static recommendations');
      return getStaticRecommendedFields_();
    }

    const data = JSON.parse(response.getContentText());
    const aiResponse = data.choices[0].message.content.trim();

    // Extract JSON array from response
    const jsonMatch = aiResponse.match(/\[[\"\w\s,]+\]/);
    if (!jsonMatch) {
      Logger.log('⚠️ Could not parse AI response - using static recommendations');
      return getStaticRecommendedFields_();
    }

    const recommendedFields = JSON.parse(jsonMatch[0]);

    // Extra safety: Filter out any selected fields AI might have included
    const filteredRecommendations = recommendedFields.filter(function(field) {
      return currentlySelected.indexOf(field) === -1;
    });

    Logger.log('✅ AI recommended ' + filteredRecommendations.length + ' fields from unselected pool');
    Logger.log('   Fields: ' + filteredRecommendations.join(', '));

    return filteredRecommendations;
  } catch (e) {
    Logger.log('⚠️ Error getting AI recommendations: ' + e.message);
    return getStaticRecommendedFields_();
  }
}

/**
 * Static fallback recommendations (used when API unavailable)
 */
function getRecommendedFields(availableFields, selectedFields) {
  try {
    const apiKey = readApiKey_();
    if (!apiKey) {
      Logger.log('⚠️ No API key - using static recommendations');
      return getStaticRecommendedFields_();
    }

    const currentlySelected = selectedFields;

    // Build list of ALL valid field names from availableFields
    const allValidFieldNames = availableFields.map(function(f) {
      return typeof f === 'string' ? f : f.name;
    });

    // Filter to only unselected fields
    const unselectedFields = availableFields.filter(function(f) {
      const fieldName = typeof f === 'string' ? f : f.name;
      return currentlySelected.indexOf(fieldName) === -1;
    });

    // Extract tier1/tier2 for AI context
    const fieldDescriptions = unselectedFields.map(function(f) {
      const fieldName = typeof f === 'string' ? f : f.name;
      const parts = fieldName.split('_');
      const tier2 = parts[parts.length - 1];
      const tier1 = parts.slice(0, -1).join('_');

      return {
        name: fieldName,
        tier1: tier1,
        tier2: tier2
      };
    });

    const prompt = 'You are a medical education expert analyzing which data fields would be most valuable for AI pathway discovery in emergency medicine simulation cases.\n\n' +
      'CURRENTLY SELECTED FIELDS (already chosen, DO NOT recommend these):\n' +
      JSON.stringify(currentlySelected, null, 2) + '\n\n' +
      'AVAILABLE UNSELECTED FIELDS (choose from these ONLY):\n' +
      JSON.stringify(fieldDescriptions, null, 2) + '\n\n' +
      'PATHWAY DISCOVERY GOALS:\n' +
      '- Clinical reasoning pathways (differential diagnosis, pattern recognition)\n' +
      '- Risk stratification pathways (high-risk → low-risk)\n' +
      '- Time-critical decision pathways (STEMI, stroke, sepsis)\n' +
      '- Cognitive bias awareness pathways (anchoring, premature closure)\n' +
      '- Skill progression pathways (novice → expert)\n' +
      '- Patient complexity pathways (single-system → multi-system)\n\n' +
      'TASK: From the UNSELECTED fields only, select 8-12 that would maximize pathway discovery potential.\n\n' +
      'PRIORITIZE fields that:\n' +
      '- Enable differential diagnosis logic\n' +
      '- Support risk stratification\n' +
      '- Reveal clinical reasoning patterns\n' +
      '- Identify time-critical cases\n' +
      '- Show patient complexity\n\n' +
      'IMPORTANT: Return field names EXACTLY as shown in the "name" property. Do NOT modify them.\n' +
      'Only recommend from UNSELECTED fields. Do NOT include any currently selected fields.\n\n' +
      'Return ONLY a JSON array of exact field names from the list above: ["exact_name_1", "exact_name_2", ...]';

    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in medical education and clinical reasoning. Respond ONLY with valid JSON array of exact field names. NEVER modify field names or recommend already selected fields.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    };

    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      Logger.log('⚠️ OpenAI API error: ' + responseCode + ' - using static recommendations');
      return getStaticRecommendedFields_();
    }

    const data = JSON.parse(response.getContentText());
    const aiResponse = data.choices[0].message.content.trim();

    // ROBUST PARSING: Try multiple methods
    let recommendedFields = [];
    
    // Method 1: Try direct JSON parse
    try {
      recommendedFields = JSON.parse(aiResponse);
    } catch (e1) {
      // Method 2: Extract JSON array with flexible regex
      try {
        const jsonMatch = aiResponse.match(/\[([\s\S]*?)\]/);
        if (jsonMatch) {
          recommendedFields = JSON.parse(jsonMatch[0]);
        }
      } catch (e2) {
        Logger.log('⚠️ Could not parse AI response - using static recommendations');
        Logger.log('   AI response: ' + aiResponse.substring(0, 200));
        return getStaticRecommendedFields_();
      }
    }

    if (!Array.isArray(recommendedFields)) {
      Logger.log('⚠️ AI response not an array - using static recommendations');
      return getStaticRecommendedFields_();
    }

    // REDUNDANCY: Force exact format match
    // For each AI recommendation, find exact match in our valid field list
    const validatedRecommendations = [];
    
    recommendedFields.forEach(function(aiField) {
      // Normalize: trim whitespace, handle various formats
      const normalized = String(aiField).trim();
      
      // Find exact match in our valid field names
      const exactMatch = allValidFieldNames.find(function(validName) {
        return validName === normalized;
      });
      
      if (exactMatch) {
        // Only add if not already selected AND not duplicate in recommendations
        if (currentlySelected.indexOf(exactMatch) === -1 && validatedRecommendations.indexOf(exactMatch) === -1) {
          validatedRecommendations.push(exactMatch);
        }
      } else {
        // Log mismatches for debugging
        Logger.log('⚠️ AI returned unrecognized field: "' + normalized + '" - skipping');
      }
    });

    if (validatedRecommendations.length === 0) {
      Logger.log('⚠️ No valid AI recommendations after filtering - using static fallback');
      return getStaticRecommendedFields_();
    }

    Logger.log('✅ AI recommended ' + validatedRecommendations.length + ' valid fields');
    Logger.log('   Fields: ' + validatedRecommendations.join(', '));

    return validatedRecommendations;
    
  } catch (e) {
    Logger.log('⚠️ Error getting AI recommendations: ' + e.message);
    return getStaticRecommendedFields_();
  }
}

/**
 * Static fallback recommendations (used when API unavailable)
 */


/**
 * Save field selection and start cache
 * Called from field selector modal when user clicks Continue
 */
function saveFieldSelectionAndStartCache(selectedFields) {
  const docProps = PropertiesService.getDocumentProperties();
  docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(selectedFields));

  Logger.log('✅ Saved field selection: ' + selectedFields.length + ' fields');
  Logger.log('Fields: ' + selectedFields.join(', '));

  // Start the cache process with selected fields
  preCacheRichDataAfterSelection();
}

// END DYNAMIC FIELD SELECTOR SYSTEM
// ═══════════════════════════════════════════════════════════════


/**
 * Pre-Cache Rich Data - Entry Point
 * Shows field selector modal FIRST, then starts cache with selected fields
 */
function preCacheRichData() {
  try {
    Logger.log('🚀 preCacheRichData() called - starting field selector');
    showFieldSelector();
  } catch (error) {
    Logger.log('❌ preCacheRichData ERROR: ' + error.toString());
    SpreadsheetApp.getUi().alert('Field Selector Error: ' + error.message + '\n\nCheck Execution Log for details.');
  }
}

/**
 * TEST: Simple field selector to verify flow works
 */
function testSimpleFieldSelector() {
  try {
    Logger.log('🎯 TEST: Simple field selector started');

    const html =
      '<!DOCTYPE html>' +
      '<html>' +
      '<head><style>' +
      'body { font-family: Arial; padding: 20px; }' +
      'h2 { color: #667eea; }' +
      '</style></head>' +
      '<body>' +
      '<h2>🎯 Field Selector Test</h2>' +
      '<p>If you can see this modal, the flow is working!</p>' +
      '<p>Now we need to debug why the real field selector fails.</p>' +
      '<button onclick="google.script.host.close()">Close</button>' +
      '<div id="log" style="' +
      'position: fixed;' +
      'bottom: 0;' +
      'left: 0;' +
      'right: 0;' +
      'background: #1e1e1e;' +
      'color: #00ff00;' +
      'padding: 15px;' +
      'max-height: 200px;' +
      'overflow-y: auto;' +
      'border-top: 3px solid #00ff00;' +
      'font-family: \"Courier New\", monospace;' +
      'font-size: 12px;' +
      'white-space: pre-wrap;' +
      'z-index: 9999;' +
      '"></div>' +
      '</body>' +
      '</html>';

    const htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(600)
      .setHeight(400);

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Test Modal');
    Logger.log('✅ TEST: Modal displayed successfully');

  } catch (error) {
    Logger.log('❌ TEST ERROR: ' + error.toString());
    SpreadsheetApp.getUi().alert('Test Error: ' + error.message);
  }
}


function preCacheRichDataAfterSelection() {
  const html =
    '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
    '<style>' +
    'body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #00ff00; }' +
    'button { padding: 10px 20px; margin: 10px; font-size: 16px; cursor: pointer; }' +
    '#status { margin: 20px 0; padding: 10px; background: #000; border: 1px solid #00ff00; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<h3>🧪 Test Modal</h3>' +
    '<div id="status">Ready to test...</div>' +
    '<button onclick="testHello()">Test Hello</button>' +
    '<button onclick="startCache()">Start Cache</button>' +
    '<script>' +
    'function testHello() {' +
    '  document.getElementById("status").textContent = "Calling testHello()...";' +
    '  google.script.run' +
    '    .withSuccessHandler(function(r) {' +
    '      document.getElementById("status").textContent = "SUCCESS: " + r.message + " at " + r.timestamp;' +
    '    })' +
    '    .withFailureHandler(function(e) {' +
    '      document.getElementById("status").textContent = "FAILED: " + e.message;' +
    '    })' +
    '    .testHello();' +
    '}' +
    'function startCache() {' +
    '  document.getElementById("status").textContent = "Starting cache...";' +
    '  google.script.run' +
    '    .withSuccessHandler(function(r) {' +
    '      if (r.success) {' +
    '        document.getElementById("status").textContent = "CACHE SUCCESS: " + r.casesProcessed + " cases ✓ | " + r.fieldsPerCase + " fields cached ✓ | " + r.elapsed + "s";' +
    '      } else {' +
    '        document.getElementById("status").textContent = "CACHE FAILED: " + r.error;' +
    '      }' +
    '    })' +
    '    .withFailureHandler(function(e) {' +
    '      document.getElementById("status").textContent = "CACHE FAILED: " + e.message;' +
    '    })' +
    '    .performCacheWithProgress();' +
    '}' +
    '</script>' +
    '</body>' +
    '</html>';

  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(400)
    .setHeight(200);
  SpreadsheetApp.getUi().showModelessDialog(htmlOutput, '🧪 Simple Cache Test');
}

/**
 * Backend function to perform caching with progress updates
 */
function performCacheWithProgress() {
  try {
    Logger.log('🚀 STEP 1: Starting cache process...');
    const startTime = new Date().getTime();

    Logger.log('🔄 STEP 2: Calling refreshHeaders() to map column indices...');
    refreshHeaders(); // Explicitly call to ensure headers are cached
    Logger.log('✅ STEP 2 COMPLETE: Headers refreshed');

    Logger.log('🔄 STEP 3: Starting holistic analysis (getOrCreateHolisticAnalysis_)...');
    // Force fresh analysis (forceRefresh = true)
    const analysis = getOrCreateHolisticAnalysis_(true);
    Logger.log('✅ STEP 3 COMPLETE: Analysis finished');

    const elapsed = ((new Date().getTime() - startTime) / 1000).toFixed(1);
    const casesProcessed = analysis.totalCases || 0;

    Logger.log('✅ Analysis complete in ' + elapsed + 's - ' + casesProcessed + ' cases processed');

    return {
      success: true,
      casesProcessed: casesProcessed,
      elapsed: elapsed,
      fieldsPerCase: loadFieldSelection().length
    };
  } catch (e) {
    Logger.log('❌ Error in performCacheWithProgress: ' + e.message);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * SIMPLE TEST: Returns immediately to test if google.script.run works
 */
/**
 * ULTRA SIMPLE TEST: Returns immediately with timestamp
 */
function testHello() {
  Logger.log('👋 testHello() called');
  return {
    success: true,
    message: 'Hello from backend!',
    timestamp: new Date().toISOString()
  };
}

function testCacheSimple() {
  Logger.log('🧪 testCacheSimple() called');

  try {
    const sheet = pickMasterSheet_();
    const data = sheet.getDataRange().getValues();

    Logger.log('✅ Got data: ' + data.length + ' rows');

    return {
      success: true,
      message: 'Communication works!',
      rowCount: data.length,
      sheetName: sheet.getName()
    };
  } catch (e) {
    Logger.log('❌ Error: ' + e.message);
    return {
      success: false,
      error: e.message
    };
  }
}


/**
 * Get cache status for UI indicator
 * Returns: { status: 'valid'|'stale'|'missing', hoursOld, expiresIn, cases }
 */
function getCacheStatus() {
  try {
    const ss = SpreadsheetApp.openById(TEST_SPREADSHEET_ID);
    const cacheSheet = ss.getSheetByName('Pathway_Analysis_Cache');

    if (!cacheSheet) {
      return {
        status: 'missing',
        message: 'Not cached',
        icon: '❌'
      };
    }

    const data = cacheSheet.getDataRange().getValues();
    if (data.length < 2) {
      return {
        status: 'missing',
        message: 'Cache empty',
        icon: '⚠️'
      };
    }

    const cachedTimestamp = new Date(data[1][0]);
    const now = new Date();
    const hoursDiff = (now - cachedTimestamp) / (1000 * 60 * 60);
    const hoursRemaining = 24 - hoursDiff;

    // Parse JSON to get case count
    let caseCount = 0;
    try {
      const parsed = JSON.parse(data[1][1]);
      caseCount = parsed.allCases ? parsed.allCases.length : 0;
    } catch (e) {
      // Ignore parse errors
    }

    if (hoursDiff < 24) {
      return {
        status: 'valid',
        hoursOld: hoursDiff.toFixed(1),
        expiresIn: hoursRemaining.toFixed(1),
        cases: caseCount,
        message: 'Cached ' + hoursDiff.toFixed(0) + 'h ago',
        icon: '✅'
      };
    } else {
      return {
        status: 'stale',
        hoursOld: hoursDiff.toFixed(1),
        cases: caseCount,
        message: 'Cache expired',
        icon: '⚠️'
      };
    }
  } catch (e) {
    return {
      status: 'error',
      message: 'Error checking cache',
      icon: '❌'
    };
  }
}

/**
 * Show live log window that polls for updates
 */
function showAIDiscoveryWithStreamingLogs_(creativityMode) {
  AI_DISCOVERY_LOGS = []; // Reset

  const modeLabel = creativityMode === 'radical' ? '🔥 RADICAL MODE' : '🤖 STANDARD MODE';

  const html = '<style>' +
    'body{font-family:monospace;background:#0a0b0e;color:#0f0;padding:20px;margin:0}' +
    '.header{color:#0ff;font-size:18px;font-weight:bold;margin-bottom:20px;border-bottom:2px solid #0ff;padding-bottom:10px}' +
    '.log-container{background:#000;border:1px solid #0f0;padding:15px;border-radius:8px;max-height:500px;overflow-y:auto;font-size:13px;line-height:1.6}' +
    '.log-line{margin:5px 0;padding:5px;border-left:3px solid #0f0}' +
    '.log-line.info{border-left-color:#0ff;color:#0ff}' +
    '.log-line.success{border-left-color:#0f0;color:#0f0}' +
    '.log-line.warning{border-left-color:#ff0;color:#ff0}' +
    '.log-line.error{border-left-color:#f00;color:#f00}' +
    '.timestamp{color:#666;margin-right:10px;font-size:11px}' +
    '.status{margin-top:15px;padding:10px;background:#1a1a1a;border-radius:6px;text-align:center;color:#0ff}' +
    '</style>' +
    '<div class="header">🤖 AI PATHWAY DISCOVERY - LIVE LOGS (' + modeLabel + ')</div>' +
    '<div class="status" id="status">▶️ Starting discovery...</div>' +
    '<div class="log-container" id="logs"></div>' +
    '<script>' +
    'var mode = "' + creativityMode + '";' +
    'var logIndex = 0;' +
    'var pollInterval = null;' +
    'var startTime = Date.now();' +
    'function addLog(message, type) {' +
    '  var logs = document.getElementById("logs");' +
    '  var elapsed = Math.floor((Date.now() - startTime) / 1000);' +
    '  var mins = Math.floor(elapsed / 60);' +
    '  var secs = elapsed % 60;' +
    '  var timestamp = mins.toString().padStart(2, "0") + ":" + secs.toString().padStart(2, "0");' +
    '  var line = document.createElement("div");' +
    '  line.className = "log-line " + type;' +
    '  line.innerHTML = "<span class=\\"timestamp\\">[" + timestamp + "]</span>" + message;' +
    '  logs.appendChild(line);' +
    '  logs.scrollTop = logs.scrollHeight;' +
    '}' +
    'function updateStatus(text) {' +
    '  document.getElementById("status").textContent = text;' +
    '}' +
    'function pollLogs() {' +
    '  google.script.run' +
    '    .withSuccessHandler(function(result) {' +
    '      if (result.logs && result.logs.length > logIndex) {' +
    '        for (var i = logIndex; i < result.logs.length; i++) {' +
    '          addLog(result.logs[i].message, result.logs[i].type);' +
    '        }' +
    '        logIndex = result.logs.length;' +
    '      }' +
    '      if (result.status) {' +
    '        updateStatus(result.status);' +
    '      }' +
    '      if (result.complete) {' +
    '        clearInterval(pollInterval);' +
    '        updateStatus("✅ Complete! Showing results...");' +
    '        if (result.pathways && result.pathways.length > 0) {' +
    '          setTimeout(function() {' +
    '            google.script.host.close();' +
    '            google.script.run.showAIPathwayResults(result.pathways, mode);' +
    '          }, 2000);' +
    '        }' +
    '      }' +
    '    })' +
    '    .withFailureHandler(function(error) {' +
    '      addLog("❌ ERROR: " + error.message, "error");' +
    '      clearInterval(pollInterval);' +
    '      updateStatus("❌ Failed");' +
    '    })' +
    '    .getAIDiscoveryStatus();' +
    '}' +
    'addLog("🚀 Initializing AI discovery in " + mode + " mode...", "info");' +
    'updateStatus("⏳ Calling OpenAI API...");' +
    'pollInterval = setInterval(pollLogs, 300);' +
    'google.script.run' +
    '  .withSuccessHandler(function() { addLog("✅ Discovery started", "success"); })' +
    '  .withFailureHandler(function(error) { addLog("❌ Start failed: " + error.message, "error"); })' +
    '  .startAIDiscovery(mode);' +
    '</script>';

  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(900).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'AI Pathway Discovery - Live Progress');
}

/**
 * Start AI discovery (called from client)
 */
function startAIDiscovery(creativityMode) {
  AI_DISCOVERY_LOGS = [];
  AI_DISCOVERY_LOGS.push({ message: '🔧 Server-side execution started', type: 'info', timestamp: new Date().toISOString() });

  // Run discovery synchronously
  discoverPathwaysSync_(creativityMode);
}

/**
 * Get current status (called by polling)
 */
function getAIDiscoveryStatus() {
  return {
    logs: AI_DISCOVERY_LOGS,
    status: AI_DISCOVERY_LOGS.length > 0 ? AI_DISCOVERY_LOGS[AI_DISCOVERY_LOGS.length - 1].message : 'Starting...',
    complete: AI_DISCOVERY_LOGS.some(function(log) { return log.message.indexOf('🎉 COMPLETE') !== -1; }),
    pathways: PropertiesService.getScriptProperties().getProperty('AI_PATHWAYS') ? JSON.parse(PropertiesService.getScriptProperties().getProperty('AI_PATHWAYS')) : []
  };
}

/**
 * Analyze case catalog - SMART CACHING VERSION
 *
 * Three-tier strategy for maximum reliability + rich data:
 * 1. CACHE HIT (instant): Use cached holistic analysis if < 24 hours old
 * 2. FRESH ANALYSIS (slow but rich): Try performHolisticAnalysis_() with 4min timeout
 * 3. LIGHTWEIGHT FALLBACK (fast but basic): Direct sheet read if timeout
 *
 * This preserves all rich clinical context (demographics, vitals, exam findings, etc.)
 */
function analyzeCatalog_() {
  const ss = SpreadsheetApp.openById(TEST_SPREADSHEET_ID);

    let cacheSheet = ss.getSheetByName('Pathway_Analysis_Cache');

  if (cacheSheet) {
    const data = cacheSheet.getDataRange().getValues();
    if (data.length > 1) {
      const cachedTimestamp = new Date(data[1][0]);
      const now = new Date();
      const hoursDiff = (now - cachedTimestamp) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        // Cache hit! Return full rich data instantly
        Logger.log('✅ Using cached holistic analysis (' + hoursDiff.toFixed(1) + ' hours old)');
        return JSON.parse(data[1][1]);
      }
    }
  }

    Logger.log('📊 Cache miss or stale - attempting fresh holistic analysis');
  const startTime = new Date().getTime();
  const MAX_TIME = 4 * 60 * 1000; // 4 minutes (leave 2min buffer for 6min timeout)

  try {
    const analysis = performHolisticAnalysis_();
    const elapsed = new Date().getTime() - startTime;

    Logger.log('✅ Fresh analysis completed in ' + (elapsed / 1000).toFixed(1) + 's');

    if (elapsed < MAX_TIME) {
      return analysis; // Success! Got all the rich data + auto-cached for next time
    } else {
      Logger.log('⚠️  Analysis took too long, falling back to lightweight mode');
    }
  } catch (e) {
    Logger.log('⚠️  Error in performHolisticAnalysis_(): ' + e.message);
  }

    Logger.log('📉 Using lightweight analysis fallback');
  const sheet = ss.getSheets().find(function(sh) {
    return /master scenario csv/i.test(sh.getName());
  }) || ss.getActiveSheet();

  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  // Use dynamic header resolution for lightweight fallback
  const fieldMap = {
    caseId: { header: 'Case_Organization_Case_ID', fallback: 0 },
    spark: { header: 'Case_Organization_Spark_Title', fallback: 1 },
    diagnosis: { header: 'Case_Orientation_Chief_Diagnosis', fallback: 7 },
    learning: { header: 'Case_Orientation_Actual_Learning_Outcomes', fallback: 8 },
    category: { header: 'Case_Organization_Category', fallback: 11 },
    pathway: { header: 'Case_Organization_Pathway_or_Course_Name', fallback: 5 }
  };

  const indices = resolveColumnIndices_(fieldMap);
  const caseIdIdx = indices.caseId;
  const sparkIdx = indices.spark;
  const diagnosisIdx = indices.diagnosis;
  const learningIdx = indices.learning;
  const categoryIdx = indices.category;
  const pathwayIdx = indices.pathway;

  const allCases = [];
  for (let i = 2; i < data.length; i++) {
    allCases.push({
      caseId: data[i][caseIdIdx] || '',
      sparkTitle: data[i][sparkIdx] || '',
      diagnosis: data[i][diagnosisIdx] || '',
      learningOutcomes: data[i][learningIdx] || '',
      category: data[i][categoryIdx] || '',
      pathway: data[i][pathwayIdx] || ''
    });
  }

  return { allCases: allCases };
}

/**
 * Helper: Extract vital value from vitals JSON string
 */
function extractVital_(vitalsStr, field) {
  if (!vitalsStr) return '';
  try {
    const vitals = typeof vitalsStr === 'string' ? JSON.parse(vitalsStr) : vitalsStr;
    if (field === 'bp' && vitals.bp) {
      return vitals.bp.sys + '/' + vitals.bp.dia;
    }
    return vitals[field] || '';
  } catch (e) {
    return '';
  }
}

/**
 * Synchronous discovery with logging
 */
function discoverPathwaysSync_(creativityMode) {
  function log(msg, type) {
    AI_DISCOVERY_LOGS.push({ message: msg, type: type || 'info', timestamp: new Date().toISOString() });
  }

  try {
    log('Step 1/6: Getting API key', 'info');
    const ss = SpreadsheetApp.openById(TEST_SPREADSHEET_ID);
    const settingsSheet = ss.getSheetByName('Settings');

    if (!settingsSheet) {
      log('❌ Settings sheet not found', 'error');
      return;
    }

    const apiKey = settingsSheet.getRange('B2').getValue();
    if (!apiKey) {
      log('❌ No API key in Settings!B2', 'error');
      return;
    }

    log('✅ API key found', 'success');

    log('Step 1.5/6: Refreshing header mappings', 'info');
    try {
      refreshHeaders();
      log('✅ Headers refreshed', 'success');
    } catch (e) {
      log('⚠️  Could not refresh headers: ' + e.message, 'warning');
    }

    log('Step 2/6: Analyzing case catalog', 'info');
    const analysis = analyzeCatalog_();
    const cases = analysis.allCases;
    log('✅ Found ' + cases.length + ' cases', 'success');

    log('Step 3/6: Building rich case summaries with clinical context', 'info');
    // Send ALL cases with maximum context for AI pattern discovery
    const summaries = cases.map(function(c) {
      return {
        // Core identification
        id: c.caseId,
        title: c.sparkTitle || '',
        diagnosis: c.diagnosis || '',

        // Learning context
        preSim: (c.preSimOverview || '').substring(0, 300),
        postSim: (c.postSimOverview || '').substring(0, 300),
        learning: c.learningOutcomes || '',
        objectives: c.learningObjectives || '',

        // Case metadata
        category: c.category || '',
        difficulty: c.difficulty || '',
        duration: c.estimatedDuration || '',
        setting: c.setting || '',
        presentation: c.chiefComplaint || '',

        // ENHANCED: Patient demographics (unlocks age/gender pathways)
        age: c.age || c.patientAge || '',
        gender: c.gender || c.patientGender || '',

        // ENHANCED: Initial vitals (pattern recognition goldmine)
        initialHR: extractVital_(c.initialVitals || c.Initial_Vitals, 'hr'),
        initialBP: extractVital_(c.initialVitals || c.Initial_Vitals, 'bp'),
        initialRR: extractVital_(c.initialVitals || c.Initial_Vitals, 'rr'),
        initialSpO2: extractVital_(c.initialVitals || c.Initial_Vitals, 'spo2'),

        // ENHANCED: Clinical findings (physical exam pathways)
        examFindings: (c.examFindings || '').substring(0, 200),

        // ENHANCED: Medical context (complexity pathways)
        medications: (c.medications || c.pastMedications || '').substring(0, 150),
        pmh: (c.pastMedicalHistory || c.pmh || '').substring(0, 200),
        allergies: c.allergies || '',

        // ENHANCED: Environment (situational training)
        environment: c.environmentType || c.setting || '',
        disposition: c.dispositionPlan || c.disposition || ''
      };
    });
    log('✅ Prepared ' + summaries.length + ' enhanced case summaries (demographics + vitals + clinical context)', 'success');

    log('Step 4/6: Building prompt', 'info');
    const temp = creativityMode === 'radical' ? 1.0 : 0.7;
    const prompt = creativityMode === 'radical'
      ? 'ANALYZE ALL ' + summaries.length + ' EMERGENCY MEDICINE CASES. TARGET AUDIENCE: Emergency physicians, EM residents, simulation educators. PRIORITY: Clinical value > novelty. Create 5-8 RADICALLY CREATIVE pathways that address REAL EM physician pain points. PRIORITIZE by clinical impact: (1) High-stakes/time-critical scenarios, (2) Diagnostic pitfalls/misses, (3) Disease mimics - TWO TYPES: (a) Cross-category mimics: similar symptoms but dramatically different pathophysiology (MI vs panic, meningitis vs migraine), (b) Within-category mimics: related diseases where subtle distinctions matter (STEMI vs Wellens, bacterial vs viral meningitis, DKA vs HHS), (4) Procedural mastery, (5) Complex decision-making, (6) Communication under pressure. Push boundaries with psychological, narrative, game-design approaches but ALWAYS tie to clinical outcomes. PATHWAY NAMES MUST BE IRRESISTIBLY CLICK-WORTHY: Make ED clinicians think "I NEED this!" Use emotionally resonant language (trigger curiosity, urgency, fear-of-missing-out), action-oriented promises (transformation, not just info), Netflix series vibes (make them want to binge). Examples: "The 3am Nightmare Cases", "Death By Anchoring", "The Great Pretenders", "The Deadly Doppelgangers", "When Experts Get Fooled". Avoid generic academic titles. SORT results by clinical_value_score (1-10). Return ONLY a JSON array with pathway_name (CLICK-WORTHY, emotionally compelling), pathway_icon, grouping_logic_type, why_this_matters (emphasize EM physician value + make them feel this is unmissable), learning_outcomes (EM-specific), best_for (EM audience), unique_value (clinical impact - why THIS pathway vs any other), case_ids (array of at least 3), novelty_score (8-10), clinical_value_score (1-10, rate clinical utility), estimated_learning_time, difficulty_curve, scientific_rationale. NO markdown, NO explanation.'
      : 'ANALYZE ALL ' + summaries.length + ' EMERGENCY MEDICINE CASES. TARGET AUDIENCE: Emergency physicians, EM residents, simulation educators. PRIORITY: Clinical value > novelty. Create 5-8 CREATIVE pathways that solve REAL EM training needs. PRIORITIZE by clinical impact: (1) Can\'t-miss diagnoses, (2) Time-sensitive interventions, (3) Disease mimics - TWO TYPES: (a) Cross-category mimics: similar symptoms, dramatically different diseases (MI vs dissection vs esophageal rupture, PE vs pneumonia vs pneumothorax), (b) Within-category mimics: closely related diseases where subtle distinctions are essential (STEMI vs Wellens vs Takotsubo, bacterial vs viral vs fungal meningitis, DKA vs HHS vs euglycemic DKA), (4) High-risk populations (peds/geriatrics), (5) Undifferentiated patients, (6) Cognitive errors/biases. Discover patterns in clinical reasoning, diagnostic challenges, or critical actions. PATHWAY NAMES MUST BE IRRESISTIBLY CLICK-WORTHY: Make ED clinicians think "I NEED this!" Use emotionally resonant language (trigger curiosity, urgency, professional pride), action-oriented promises (mastery, confidence), specific enough to visualize. Examples: "The Great Pretenders", "The Deadly Doppelgangers", "When Similar Kills Different", "The Subtle Distinction Series", "Evil Twins: Life-or-Death Differences". Avoid boring academic titles like "Cardiovascular Pathology Module". SORT results by clinical_value_score (1-10). Return ONLY a JSON array with pathway_name (CLICK-WORTHY, emotionally compelling), pathway_icon, grouping_logic_type, why_this_matters (emphasize EM physician value + make them feel this is unmissable), learning_outcomes (EM-specific), best_for (EM audience), unique_value (clinical impact - why THIS pathway vs any other), case_ids (array of at least 3), novelty_score (7+), clinical_value_score (1-10, rate clinical utility), estimated_learning_time, difficulty_curve. NO markdown, NO explanation.';

    log('✅ Prompt ready (' + temp + ' temp, ' + summaries.length + ' cases)', 'success');

    log('Step 5/6: Calling OpenAI GPT-4', 'info');
    log('⏳ Analyzing ' + summaries.length + ' cases - may take 15-45 seconds...', 'warning');

    const start = new Date().getTime();
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: creativityMode === 'radical' ? 'You are an experimental medical educator applying cognitive science and game design to create revolutionary learning pathways.' : 'You are an expert medical educator discovering novel patterns across medical cases to create innovative learning pathways.' },
          { role: 'user', content: prompt + '\n\nCASES:\n' + JSON.stringify(summaries) }
        ],
        temperature: temp,
        max_tokens: 2500
      }),
      muteHttpExceptions: true
    });

    const elapsed = ((new Date().getTime() - start) / 1000).toFixed(1);
    const code = response.getResponseCode();

    log('✅ OpenAI responded in ' + elapsed + 's', 'success');
    log('📊 Status: ' + code, 'info');

    if (code !== 200) {
      log('❌ API error: ' + response.getContentText(), 'error');
      return;
    }

    log('Step 6/6: Parsing response', 'info');
    const data = JSON.parse(response.getContentText());
    const aiText = data.choices[0].message.content;

    let pathways = [];
    const match = aiText.match(/\[[\s\S]*\]/);
    pathways = match ? JSON.parse(match[0]) : JSON.parse(aiText);

    log('✅ Parsed ' + pathways.length + ' pathways', 'success');

    pathways.forEach(function(pw, i) {
      log((i+1) + '. ' + (pw.pathway_icon || '🤖') + ' ' + (pw.pathway_name || 'Unnamed'), 'info');
    });

    log('🎉 COMPLETE! Discovery finished', 'success');

    // Store pathways for retrieval
    PropertiesService.getScriptProperties().setProperty('AI_PATHWAYS', JSON.stringify(pathways));
    PropertiesService.getScriptProperties().setProperty('AI_MODE', creativityMode);

  } catch (e) {
    log('❌ EXCEPTION: ' + e.message, 'error');
  }
}

/**
 * Show results (called after discovery completes)
 */
function showAIPathwayResults(pathways, creativityMode) {
  const modeLabel = creativityMode === 'radical' ? '🔥 RADICAL' : '🤖 CREATIVE';

  let html = '<style>body{font-family:Arial;background:#0a0b0e;color:#fff;padding:24px}.pathway{background:#1a1f2e;padding:20px;margin:15px 0;border-radius:12px;border-left:4px solid ' + (creativityMode === 'radical' ? '#ff6b00' : '#2357ff') + '}.name{font-size:20px;font-weight:bold;margin-bottom:10px}.pitch{color:#ccc;line-height:1.6}</style>';

  html += '<h1>' + modeLabel + ' AI-Discovered Pathways</h1>';
  html += '<p>Found ' + pathways.length + ' novel groupings</p>';

  pathways.forEach(function(pw) {
    html += '<div class="pathway">';
    html += '<div class="name">' + (pw.pathway_icon || '🤖') + ' ' + (pw.pathway_name || 'Unnamed') + '</div>';
    html += '<div class="pitch">' + (pw.why_this_matters || 'No description') + '</div>';
    html += '</div>';
  });

  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(800).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, modeLabel + ' Pathways');
}


/**
 * COMPREHENSIVE CACHE DIAGNOSTIC
 * Tests each step of the cache process with detailed logging
 */
function testCacheDiagnostic() {
  const startTime = new Date().getTime();
  Logger.log('');
  Logger.log('╔═══════════════════════════════════════════════════════════════╗');
  Logger.log('║           🧪 CACHE DIAGNOSTIC TEST STARTED                   ║');
  Logger.log('╚═══════════════════════════════════════════════════════════════╝');
  Logger.log('');

  try {
    // STEP 1: Open TEST spreadsheet
    Logger.log('🧪 STEP 1: Opening TEST spreadsheet by ID...');
    const ss = SpreadsheetApp.openById('1t3qN8e537ghl38GTsXbVG8ML8OZtK2XyUpDiMQjnGAI');
    Logger.log('✅ STEP 1: Opened: ' + ss.getName());
    Logger.log('   Spreadsheet ID: ' + ss.getId());
    Logger.log('');

    // STEP 2: Get active sheet
    Logger.log('🧪 STEP 2: Getting active sheet...');
    const sheet = ss.getActiveSheet();
    Logger.log('✅ STEP 2: Sheet name: ' + sheet.getName());
    Logger.log('');

    // STEP 3: Get data
    Logger.log('🧪 STEP 3: Getting all data...');
    const data = sheet.getDataRange().getValues();
    Logger.log('✅ STEP 3: Got ' + data.length + ' total rows');
    Logger.log('   Data rows (excluding headers): ' + (data.length - 2));
    Logger.log('');

    // STEP 4: Check headers
    Logger.log('🧪 STEP 4: Checking headers...');
    if (data.length < 2) {
      throw new Error('Sheet does not have enough rows for headers');
    }
    const headers = data[1];
    Logger.log('✅ STEP 4: Headers row has ' + headers.length + ' columns');
    Logger.log('   First 10 headers: ' + headers.slice(0, 10).join(', '));
    Logger.log('');

    // STEP 5: Test refreshHeaders()
    Logger.log('🧪 STEP 5: Testing refreshHeaders()...');
    const headerResult = refreshHeaders();
    if (!headerResult) {
      throw new Error('refreshHeaders() returned null');
    }
    Logger.log('✅ STEP 5: refreshHeaders() succeeded');
    Logger.log('   Mapped columns: ' + Object.keys(headerResult.map).length);
    Logger.log('');

    // STEP 6: Test holistic analysis (this is the heavy operation)
    Logger.log('🧪 STEP 6: Testing performHolisticAnalysis_()...');
    Logger.log('   This processes ALL rows - may take time...');
    const analysisStart = new Date().getTime();
    const analysis = performHolisticAnalysis_();
    const analysisTime = ((new Date().getTime() - analysisStart) / 1000).toFixed(1);
    Logger.log('✅ STEP 6: performHolisticAnalysis_() completed in ' + analysisTime + 's');
    Logger.log('   Total cases: ' + analysis.totalCases);
    Logger.log('   Systems found: ' + Object.keys(analysis.systemDistribution).length);
    Logger.log('   Pathways found: ' + Object.keys(analysis.pathwayDistribution).length);
    Logger.log('   Unassigned: ' + analysis.unassignedCount);
    Logger.log('');

    // STEP 7: Test cache sheet creation/update
    Logger.log('🧪 STEP 7: Testing cache sheet access...');
    let cacheSheet = ss.getSheetByName('Pathway_Analysis_Cache');
    if (!cacheSheet) {
      Logger.log('   Creating Pathway_Analysis_Cache sheet...');
      cacheSheet = ss.insertSheet('Pathway_Analysis_Cache');
      cacheSheet.hideSheet();
      cacheSheet.appendRow(['timestamp', 'analysis_json']);
    }
    Logger.log('✅ STEP 7: Cache sheet ready');
    Logger.log('');

    const totalTime = ((new Date().getTime() - startTime) / 1000).toFixed(1);

    Logger.log('╔═══════════════════════════════════════════════════════════════╗');
    Logger.log('║           ✅ ALL DIAGNOSTICS PASSED                          ║');
    Logger.log('╚═══════════════════════════════════════════════════════════════╝');
    Logger.log('');
    Logger.log('📊 SUMMARY:');
    Logger.log('   • Total time: ' + totalTime + 's');
    Logger.log('   • Analysis time: ' + analysisTime + 's');
    Logger.log('   • Data rows: ' + (data.length - 2));
    Logger.log('   • Cases processed: ' + analysis.totalCases);
    Logger.log('');

    SpreadsheetApp.getUi().alert(
      '✅ Cache Diagnostic PASSED!\n\n' +
      'Total time: ' + totalTime + 's\n' +
      'Analysis time: ' + analysisTime + 's\n' +
      'Data rows: ' + (data.length - 2) + '\n' +
      'Cases processed: ' + analysis.totalCases + '\n\n' +
      'Check Execution Log (Ctrl+Enter) for full details'
    );

    return {
      success: true,
      totalTime: totalTime,
      analysisTime: analysisTime,
      dataRows: data.length - 2,
      casesProcessed: analysis.totalCases
    };

  } catch (e) {
    Logger.log('');
    Logger.log('╔═══════════════════════════════════════════════════════════════╗');
    Logger.log('║           ❌ DIAGNOSTIC FAILED                               ║');
    Logger.log('╚═══════════════════════════════════════════════════════════════╝');
    Logger.log('');
    Logger.log('❌ Error: ' + e.message);
    Logger.log('❌ Stack trace:');
    Logger.log(e.stack);
    Logger.log('');

    SpreadsheetApp.getUi().alert(
      '❌ Cache Diagnostic FAILED\n\n' +
      'Error: ' + e.message + '\n\n' +
      'Check Execution Log (Ctrl+Enter) for full stack trace'
    );

    return {
      success: false,
      error: e.message,
      stack: e.stack
    };
  }
}

/**
 * Try to parse vitals JSON and extract hr, bp, rr, spo2
 * @param {string} vitalsJson - JSON string from Monitor_Vital_Signs_Initial_Vitals column
 * @return {object|null} - Parsed vitals object with hr, bpSys, bpDia, rr, spo2, or null if parse fails
 */
function tryParseVitals_(vitalsJson) {
  if (!vitalsJson || typeof vitalsJson !== 'string') return null;

  try {
    const vitals = JSON.parse(vitalsJson);
    return {
      hr: vitals.hr || null,
      bpSys: vitals.bp && vitals.bp.sys ? vitals.bp.sys : null,
      bpDia: vitals.bp && vitals.bp.dia ? vitals.bp.dia : null,
      rr: vitals.rr || null,
      spo2: vitals.spo2 || null
    };
  } catch (e) {
    return null;
  }
}

/**
 * Truncate field to max length to avoid cache bloat
 * @param {string} value - Field value to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @return {string} - Truncated string with '...' appended if truncated
 */
function truncateField_(value, maxLength) {
  if (!value || typeof value !== 'string') return '';
  if (value.length <= maxLength) return value;
  return value.substring(0, maxLength) + '...';
}

// ==================== ADVANCED CACHE SYSTEM ====================
// Pathway Chain Builder and 7-layer cache enrichment

/**
 * Categories & Pathways - Phase 2: Interactive Pathway Chain Builder
 *
 * Holistic AI-powered pathway design system with:
 * - Bird's eye view of entire case library
 * - Pre-computed holistic analysis (cached)
 * - Horizontal chain builder UI
 * - Alternative selection with prominence system
 * - AI rationale generation
 * - Drag-and-drop reordering
 * - Pathway persistence
 *
 * Phase 2A: Holistic Analysis Engine + Bird's Eye View
 */

// ========== HELPER FUNCTIONS ==========


// ============================================================================
// DYNAMIC HEADER RESOLUTION
// ============================================================================

/**
 * Refresh header mappings from spreadsheet and cache in document properties
 * Call this before any operations that use column indices
 */

/**
 * Get column index by Tier2 header name from cached mappings
 * @param {string} tier2Name - The Tier2 header name to find
 * @param {number} fallbackIndex - Fallback column index if not found
 * @returns {number} Column index (0-based)
 */
function getColumnIndexByHeader_(fullFieldName, fallbackIndex) {
  try {
    const docProps = PropertiesService.getDocumentProperties();
    const cachedMergedKeys = docProps.getProperty('CACHED_MERGED_KEYS');
    
    if (cachedMergedKeys) {
      const headers = JSON.parse(cachedMergedKeys);
      const index = headers.indexOf(fullFieldName);
      
      if (index !== -1) {
        if (index !== fallbackIndex) {
          Logger.log('🔄 Header "' + fullFieldName + '" moved: ' + fallbackIndex + ' → ' + index);
        }
        return index;
      }
    }
  } catch (e) {
    Logger.log('⚠️  Could not read cached headers: ' + e.message);
  }
  
  return fallbackIndex;
}

/**
 * Resolve multiple column indices at once
 * @param {Object} fieldMap - Map of field names to {name: tier2Name, fallback: index}
 * @returns {Object} Map of field names to resolved column indices
 */
function resolveColumnIndices_(fieldMap) {
  const resolved = {};
  
  Object.keys(fieldMap).forEach(function(fieldName) {
    const field = fieldMap[fieldName];
    resolved[fieldName] = getColumnIndexByHeader_(field.name, field.fallback);
  });
  
  return resolved;
}




// ========== MAIN PANEL LAUNCHER ==========

function runPathwayChainBuilder() {
  const ui = getSafeUi_();
  if (!ui) {
    Logger.log('No UI context available');
    return;
  }

  try {
    // STEP 1: Refresh headers cache (loads Row 2 headers into DocumentProperties)
    Logger.log('📂 Refreshing headers cache...');
    refreshHeaders();
    Logger.log('✅ Headers cached');

    // STEP 2: Initialize 35 intelligent defaults if none exist
    var docProps = PropertiesService.getDocumentProperties();
    var savedSelection = docProps.getProperty('SELECTED_CACHE_FIELDS');

    if (!savedSelection) {
      Logger.log('📂 No saved field selection - initializing 35 intelligent defaults...');

      var defaultFields = [
                'Case_Organization_Case_ID',
        'Case_Organization_Spark_Title',
        'Case_Organization_Reveal_Title',
        'Case_Organization_Pathway_or_Course_Name',
        'Case_Organization_Difficulty_Level',
        'Case_Organization_Medical_Category',

                'Patient_Demographics_and_Clinical_Data_Age',
        'Patient_Demographics_and_Clinical_Data_Gender',
        'Patient_Demographics_and_Clinical_Data_Presenting_Complaint',
        'Patient_Demographics_and_Clinical_Data_Past_Medical_History',
        'Patient_Demographics_and_Clinical_Data_Exam_Positive_Findings',
        'Monitor_Vital_Signs_Initial_Vitals',
        'Scenario_Progression_States_Decision_Nodes_JSON',
        'Set_the_Stage_Context_Case_Summary_Concise',

                'CME_and_Educational_Content_CME_Learning_Objective',
        'Set_the_Stage_Context_Educational_Goal',
        'Set_the_Stage_Context_Why_It_Matters',
        'Developer_and_QA_Metadata_Simulation_Quality_Score',
        'Case_Organization_Original_Title',

                'Set_the_Stage_Context_Environment_Type',
        'Set_the_Stage_Context_Environment_Description_for_AI_Image',
        'Situation_and_Environment_Details_Triage_or_SBAR_Note',
        'Situation_and_Environment_Details_Disposition_Plan',
        'Scenario_Progression_States_Branching_Notes',
        'Staff_and_AI_Interaction_Config_Patient_Script',

                'Monitor_Vital_Signs_State1_Vitals',
        'Monitor_Vital_Signs_State2_Vitals',
        'Monitor_Vital_Signs_State3_Vitals',
        'Monitor_Vital_Signs_State4_Vitals',
        'Monitor_Vital_Signs_State5_Vitals',
        'Monitor_Vital_Signs_Vitals_Format',

                'Developer_and_QA_Metadata_AI_Reflection_and_Suggestions',
        'Version_and_Attribution_Full_Attribution_Details',
        'Case_Organization_Pre_Sim_Overview',
        'Case_Organization_Post_Sim_Overview'
      ];

      docProps.setProperty('SELECTED_CACHE_FIELDS', JSON.stringify(defaultFields));
      Logger.log('✅ Initialized 35 intelligent defaults');
    } else {
      Logger.log('✅ Field selection already cached (' + JSON.parse(savedSelection).length + ' fields)');
    }

    // STEP 2.5: Pre-fetch AI recommendations in background (NON-BLOCKING)
    Logger.log('🤖 Starting AI pre-fetch in background...');

    // Strategy: We trigger the AI call but DON'T wait for it
    // This way the Pathway UI shows immediately
    // When user clicks cache button, modal will check if AI result is ready
    // If not ready, modal shows "AI processing..." and tries again
    // If ready, modal uses cached result instantly

    try {
      var roughDraft = getFieldSelectorRoughDraft();
      getRecommendedFields(roughDraft.allFields, roughDraft.selected);
      Logger.log('✅ AI pre-fetch initiated (processing in background)');
    } catch (prefetchError) {
      Logger.log('⚠️ AI pre-fetch failed (non-critical): ' + prefetchError.message);
      // Don't throw - this is background work, failure is acceptable
      // Modal will retry AI call when opened
    }




    // STEP 3: Get or create holistic analysis (cached)
    const analysis = getOrCreateHolisticAnalysis_();

    const html = buildBirdEyeViewUI_(analysis);
    const htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(1920)
      .setHeight(1000);

    ui.showModalDialog(htmlOutput, '🧩 Pathway Chain Builder - AI-Powered Design System');
  } catch (error) {
    ui.alert('Error loading Pathway Chain Builder: ' + error.toString());
    Logger.log('Pathway Chain Builder Error: ' + error.toString());
  }
}

// ========== HOLISTIC ANALYSIS ENGINE ==========

function getOrCreateHolisticAnalysis_(forceRefresh) {

  // Refresh headers before analysis
  refreshHeaders();

  const docProps = PropertiesService.getDocumentProperties();

  // Check if we have cached analysis (less than 24 hours old)
  const cachedTimestamp = docProps.getProperty('HOLISTIC_ANALYSIS_TIMESTAMP');
  const cachedAnalysis = docProps.getProperty('HOLISTIC_ANALYSIS_JSON');

  if (!forceRefresh && cachedTimestamp && cachedAnalysis) {
    const cached = new Date(cachedTimestamp);
    const now = new Date();
    const hoursDiff = (now - cached) / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      // Use cached analysis
      Logger.log('Using cached holistic analysis (' + hoursDiff.toFixed(1) + ' hours old)');
      try {
        return JSON.parse(cachedAnalysis);
      } catch (parseError) {
        Logger.log('⚠️ Failed to parse cached analysis, regenerating...');
        // Fall through to regenerate
      }
    }
  }

  // Generate fresh analysis
  Logger.log('Generating fresh holistic analysis...');
  const analysis = performHolisticAnalysis_();

  // Cache the results in DocumentProperties
  try {
    const analysisJson = JSON.stringify(analysis);

    // Check if it fits in a single property (9KB limit = ~9000 chars)
    if (analysisJson.length < 9000) {
      docProps.setProperty('HOLISTIC_ANALYSIS_JSON', analysisJson);
      docProps.setProperty('HOLISTIC_ANALYSIS_TIMESTAMP', new Date().toISOString());
      Logger.log('✅ Cached analysis (' + analysisJson.length + ' chars) in DocumentProperties');
    } else {
      // Split across multiple properties (chunk into 8KB pieces)
      const chunkSize = 8000;
      const chunks = [];
      for (let i = 0; i < analysisJson.length; i += chunkSize) {
        chunks.push(analysisJson.substring(i, i + chunkSize));
      }

      // Save chunks
      docProps.setProperty('HOLISTIC_ANALYSIS_CHUNKS', chunks.length.toString());
      for (let i = 0; i < chunks.length; i++) {
        docProps.setProperty('HOLISTIC_ANALYSIS_CHUNK_' + i, chunks[i]);
      }
      docProps.setProperty('HOLISTIC_ANALYSIS_TIMESTAMP', new Date().toISOString());

      Logger.log('✅ Cached analysis (' + analysisJson.length + ' chars) in ' + chunks.length + ' chunks');
    }
  } catch (cacheError) {
    Logger.log('⚠️ Failed to cache analysis: ' + cacheError.toString());
    // Don't fail if caching fails - just return the analysis
  }

  return analysis;
}


function performHolisticAnalysis_() {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();

  // Defensive: Ensure we have enough rows
  if (!data || data.length < 3) {
    throw new Error('Sheet does not have enough data rows');
  }

  // Row 2 (index 1) contains the flattened merged headers like "Case_Organization_Case_ID"
  const rawHeaders = data[1];

  // Defensive: Ensure headers exist and is an array
  if (!rawHeaders || !Array.isArray(rawHeaders)) {
    throw new Error('Could not find valid header row at row 2 (index 1)');
  }

  // Trim all headers to remove whitespace
  const headers = rawHeaders.map(function(h) {
    return typeof h === 'string' ? h.trim() : h;
  });

  // Dynamic column resolution for holistic analysis
  const columnIndices = resolveColumnIndices_({
    caseId: { name: 'Case_Organization_Case_ID', fallback: 0 },
    sparkTitle: { name: 'Case_Organization_Spark_Title', fallback: 1 },
    pathway: { name: 'Case_Organization_Pathway_or_Course_Name', fallback: 5 },
    category: { name: 'Case_Organization_Category', fallback: 4 },
    diagnosis: { name: 'Case_Orientation_Chief_Diagnosis', fallback: 44 },
    learningOutcomes: { name: 'Case_Orientation_Actual_Learning_Outcomes', fallback: 45 }
  });

  const caseIdIdx = columnIndices.caseId;
  const sparkIdx = columnIndices.sparkTitle;
  const pathwayIdx = columnIndices.pathway;
  const categoryIdx = columnIndices.category;
  const diagnosisIdx = columnIndices.diagnosis;
  const learningOutcomesIdx = columnIndices.learningOutcomes;

  // Defensive: Check if critical columns were found
  if (caseIdIdx === -1 || sparkIdx === -1) {
    throw new Error('Could not find required columns. Looking for Case_Organization_Case_ID, Case_Organization_Spark_Title. CaseID idx: ' + caseIdIdx + ', Spark idx: ' + sparkIdx + ', Category idx: ' + categoryIdx);
  }

  // Collect all cases with full metadata
  const allCases = [];
  const systemDistribution = {};
  const pathwayDistribution = {};
  let unassignedCount = 0;

  // Data starts at row 3 (index 2) since row 1 is tier1, row 2 is merged headers
  for (let i = 2; i < data.length; i++) {
    const caseItem = {
      row: i + 1,
      caseId: data[i][caseIdIdx] || '',
      sparkTitle: data[i][sparkIdx] || '',
      category: data[i][categoryIdx] || '',
      pathway: data[i][pathwayIdx] || '',
      diagnosis: data[i][diagnosisIdx] || '',
      learningOutcomes: data[i][learningOutcomesIdx] || ''
    };

    allCases.push(caseItem);

    // Track system distribution
    const system = extractPrimarySystem_(caseItem.category);
    systemDistribution[system] = (systemDistribution[system] || 0) + 1;

    // Track pathway assignment
    if (caseItem.pathway && caseItem.pathway.trim() !== '') {
      pathwayDistribution[caseItem.pathway] = (pathwayDistribution[caseItem.pathway] || 0) + 1;
    } else {
      unassignedCount++;
    }
  }

  // Identify high-value pathway opportunities
  const pathwayOpportunities = identifyPathwayOpportunities_(allCases, systemDistribution);

  // Generate insights
  const insights = generateHolisticInsights_(allCases, systemDistribution, pathwayDistribution, unassignedCount);

  return {
    timestamp: new Date().toISOString(),
    totalCases: allCases.length,
    systemDistribution: systemDistribution,
    pathwayDistribution: pathwayDistribution,
    unassignedCount: unassignedCount,
    topPathways: pathwayOpportunities,
    insights: insights,
    allCases: allCases // Store for later use
  };
}

function extractPrimarySystem_(category) {
  const systems = ['CARD', 'RESP', 'NEUR', 'GI', 'ENDO', 'RENAL', 'ORTHO', 'PSYCH', 'SKIN'];
  if (!category || typeof category !== 'string') return '';
  const catUpper = category.toUpperCase();

  for (let i = 0; i < systems.length; i++) {
    if (catUpper.indexOf(systems[i]) !== -1) {
      return systems[i];
    }
  }

  return 'OTHER';
}

function identifyPathwayOpportunities_(cases, systemDist) {
  const opportunities = [];

  // ACLS Pathway Opportunity
  const aclsCases = cases.filter(function(c) {
    const combined = (c.sparkTitle + ' ' + c.diagnosis + ' ' + c.category).toUpperCase();
    return combined.indexOf('CARDIAC') !== -1 ||
           combined.indexOf('ARREST') !== -1 ||
           combined.indexOf('ARRHYTHMIA') !== -1 ||
           combined.indexOf('VTACH') !== -1 ||
           combined.indexOf('VFIB') !== -1 ||
           combined.indexOf('AFIB') !== -1;
  });

  if (aclsCases.length >= 5) {
    opportunities.push({
      id: 'acls_protocol_001',
      name: 'ACLS Protocol Series',
      logicType: 'protocol',
      icon: '💓',
      confidence: aclsCases.length >= 12 ? 0.95 : 0.75,
      caseCount: aclsCases.length,
      rationale: 'Strong concentration of cardiac arrest and arrhythmia cases with clear ACLS protocol applications',
      suggestedCases: aclsCases.slice(0, 12).map(function(c) { return c.caseId; })
    });
  }

  // Cardiovascular System Pathway
  if (systemDist['CARD'] && systemDist['CARD'] >= 8) {
    opportunities.push({
      id: 'card_system_001',
      name: 'Cardiovascular System Mastery',
      logicType: 'system',
      icon: '❤️',
      confidence: 0.90,
      caseCount: systemDist['CARD'],
      rationale: 'Sufficient cardiac cases to build comprehensive system-based learning pathway',
      suggestedCases: cases.filter(function(c) { return (c.category || '').toUpperCase().indexOf('CARD') !== -1; })
                           .slice(0, 12)
                           .map(function(c) { return c.caseId; })
    });
  }

  // Respiratory System Pathway
  if (systemDist['RESP'] && systemDist['RESP'] >= 8) {
    opportunities.push({
      id: 'resp_system_001',
      name: 'Respiratory System Mastery',
      logicType: 'system',
      icon: '🫁',
      confidence: 0.88,
      caseCount: systemDist['RESP'],
      rationale: 'Strong respiratory case collection for airway management and ventilation training',
      suggestedCases: cases.filter(function(c) { return (c.category || '').toUpperCase().indexOf('RESP') !== -1; })
                           .slice(0, 12)
                           .map(function(c) { return c.caseId; })
    });
  }

  // Pediatric Pathway
  const pedsCases = cases.filter(function(c) {
    const combined = (c.sparkTitle + ' ' + c.diagnosis + ' ' + c.category).toUpperCase();
    return combined.indexOf('PEDIATRIC') !== -1 ||
           combined.indexOf('CHILD') !== -1 ||
           combined.indexOf('INFANT') !== -1 ||
           combined.indexOf('PEDS') !== -1;
  });

  if (pedsCases.length >= 5) {
    opportunities.push({
      id: 'peds_specialty_001',
      name: 'Pediatric Emergency Medicine',
      logicType: 'specialty',
      icon: '🧸',
      confidence: pedsCases.length >= 10 ? 0.85 : 0.70,
      caseCount: pedsCases.length,
      rationale: 'Pediatric cases suitable for PALS and age-specific emergency training',
      suggestedCases: pedsCases.slice(0, 12).map(function(c) { return c.caseId; })
    });
  }

  // Sort by confidence
  opportunities.sort(function(a, b) { return b.confidence - a.confidence; });

  return opportunities.slice(0, 6); // Top 6 opportunities
}

function generateHolisticInsights_(cases, systemDist, pathwayDist, unassignedCount) {
  const insights = [];

  // Insight 1: Top system
  const topSystem = Object.keys(systemDist).reduce(function(a, b) {
    return systemDist[a] > systemDist[b] ? a : b;
  });
  insights.push(systemDist[topSystem] + ' ' + topSystem + ' cases form largest system group - strong pathway potential');

  // Insight 2: Unassigned cases
  if (unassignedCount > 0) {
    const pct = ((unassignedCount / cases.length) * 100).toFixed(0);
    insights.push(unassignedCount + ' cases unassigned (' + pct + '%) - opportunity to create new pathways');
  }

  // Insight 3: Protocol opportunities
  const aclsCount = cases.filter(function(c) {
    return (c.sparkTitle + c.diagnosis).toUpperCase().indexOf('CARDIAC') !== -1;
  }).length;

  if (aclsCount >= 8) {
    insights.push('Strong ACLS pathway opportunity with ' + aclsCount + ' cardiac cases');
  }

  // Insight 4: Complexity balance
  const simpleCount = cases.filter(function(c) { return c.diagnosis.length <= 25; }).length;
  const complexCount = cases.filter(function(c) { return c.diagnosis.length > 50; }).length;
  const simplePct = ((simpleCount / cases.length) * 100).toFixed(0);
  const complexPct = ((complexCount / cases.length) * 100).toFixed(0);

  insights.push('Case complexity: ' + simplePct + '% foundational, ' + complexPct + '% advanced - good balance for progression pathways');

  // Insight 5: Multi-system cases
  const multiSystemCount = cases.filter(function(c) {
    if (!c.category || typeof c.category !== 'string') return false;
    return c.category.indexOf(',') !== -1 || c.category.indexOf('/') !== -1;
  }).length;

  if (multiSystemCount > 5) {
    insights.push(multiSystemCount + ' multi-system cases identified - consider complexity-based pathway');
  }

  return insights;
}

// ========== BIRD'S EYE VIEW UI ==========

// Build Categories tab content
function buildCategoriesTabHTML_(analysis) {
  const systemCards = Object.keys(analysis.systemDistribution)
    .sort(function(a, b) { return analysis.systemDistribution[b] - analysis.systemDistribution[a]; })
    .map(function(sys) {
      const count = analysis.systemDistribution[sys];
      const icon = sys === 'CARD' ? '🫀' :
                   sys === 'RESP' ? '🫁' :
                   sys === 'NEUR' ? '🧠' :
                   sys === 'GI' ? '🍽️' :
                   sys === 'ENDO' ? '🔬' :
                   sys === 'PSYCH' ? '🧘' :
                   sys === 'TRAUMA' ? '🚑' :
                   sys === 'PEDS' ? '👶' : '📁';

      return '<div class="category-card" onclick="alert(\'Category view coming soon! Will show all ' + sys + ' cases.\')">' +
             '  <div class="category-icon">' + icon + '</div>' +
             '  <div class="category-name">' + sys + '</div>' +
             '  <div class="category-count">' + count + ' cases</div>' +
             '</div>';
    }).join('');

  return '<div class="tab-content" id="categories-tab" style="display: none;">' +
         '  <div class="section">' +
         '    <div class="section-title">📁 System-Based Organization</div>' +
         '    <div class="category-grid">' + systemCards + '</div>' +
         '  </div>' +
         '</div>';
}

// Build Pathways tab content
function buildPathwaysTabHTML_(analysis) {
  const pathwayCards = analysis.topPathways.map(function(pw) {
    const stars = Math.round(pw.confidence * 5);
    const starStr = Array(stars + 1).join('⭐');
    const confidencePct = (pw.confidence * 100).toFixed(0);

    return '<div class="pathway-card" style="cursor: pointer;" onclick="' +
           '  document.body.innerHTML = \'<div style=&quot;text-align:center; padding:100px;&quot;><h2>⚙️ Loading chain builder...</h2><p style=&quot;color: #8b92a0;&quot;>Pathway: ' + pw.name + '</p></div>\';' +
           '  google.script.run' +
           '    .withSuccessHandler(function(html) { document.documentElement.innerHTML = html; })' +
           '    .withFailureHandler(function(error) { document.body.innerHTML = \'<div style=&quot;text-align:center; padding:100px;&quot;><h2 style=&quot;color: #ff4444;&quot;>❌ Error</h2><p>\' + error.message + \'</p></div>\'; })' +
           '    .buildChainBuilderUI(\'' + pw.id + '\', \'complexity_gradient\');' +
           '">' +
           '  <div class="pathway-header">' +
           '    <span class="pathway-icon">' + pw.icon + '</span>' +
           '    <div class="pathway-title">' + pw.name + '</div>' +
           '  </div>' +
           '  <div class="pathway-stats">' +
           '    <span class="pathway-count">' + pw.caseCount + ' cases</span>' +
           '    <span class="pathway-confidence">' + starStr + ' ' + confidencePct + '%</span>' +
           '  </div>' +
           '  <div class="pathway-rationale">' + pw.rationale + '</div>' +
           '</div>';
  }).join('');

  const insightsList = analysis.insights.map(function(insight) {
    return '<li class="insight-item">💡 ' + insight + '</li>';
  }).join('');

  // Get cache status
  const cacheStatus = getCacheStatus();
  const statusColor = cacheStatus.status === 'valid' ? '#00c853' :
                      cacheStatus.status === 'stale' ? '#ff9800' : '#f44336';
  const cacheIndicator = '<span id="cache-status" style="font-size: 11px; padding: 4px 8px; background: ' + statusColor + '; color: #fff; border-radius: 4px; font-weight: 600; margin-left: 8px;">' +
                        cacheStatus.icon + ' ' + cacheStatus.message +
                        (cacheStatus.cases ? ' (' + cacheStatus.cases + ' cases)' : '') +
                        '</span>';

  return '<div class="tab-content active" id="pathways-tab" style="display: block;">' +
         '  <div class="insights-box">' +
         '    <h3>🎯 Holistic Insights</h3>' +
         '    <ul class="insights-list">' + insightsList + '</ul>' +
         '  </div>' +
         '  <div class="section">' +
         '    <div class="section-title" style="display: flex; justify-content: space-between; align-items: center;">' +
         '      <div><span>🧩 Intelligent Pathway Opportunities</span>' + cacheIndicator + '</div>' +
         '      <div style="display: flex; gap: 12px; align-items: center;">' +
         '        <button class="precache-btn" onclick="google.script.run.preCacheRichData();" style="background: linear-gradient(135deg, #00c853 0%, #00a040 100%); border: none; color: #fff; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s ease; display: flex; align-items: center; gap: 6px; box-shadow: 0 0 12px rgba(0, 200, 83, 0.3);">💾 Pre-Cache Rich Data</button>' +
         '        <button class="ai-discover-btn" onclick="google.script.run.showAIPathwaysStandardWithLogs();" style="background: linear-gradient(135deg, #2357ff 0%, #1a47cc 100%); border: none; color: #fff; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s ease; display: flex; align-items: center; gap: 6px;">🤖 AI: Discover Novel Pathways</button>' +
         '        <button class="ai-radical-btn" onclick="google.script.run.showAIPathwaysRadicalWithLogs();" style="background: linear-gradient(135deg, #ff6b00 0%, #cc5500 100%); border: none; color: #fff; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s ease; display: flex; align-items: center; gap: 6px; box-shadow: 0 0 12px rgba(255, 107, 0, 0.3);">🔥 AI: Radical Mode</button>' +
         '      </div>' +
         '    </div>' +
         '    <div class="pathway-grid">' + pathwayCards + '</div>' +
         '  </div>' +
         '</div>';
}

// ========== HOLISTIC ANALYSIS ENGINE ==========

function getOrCreateHolisticAnalysis_(forceRefresh) {
  
  // Refresh headers before analysis
  refreshHeaders();
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let cacheSheet = ss.getSheetByName('Pathway_Analysis_Cache');

  // Create cache sheet if doesn't exist
  if (!cacheSheet) {
    cacheSheet = ss.insertSheet('Pathway_Analysis_Cache');
    cacheSheet.hideSheet();
    cacheSheet.appendRow(['timestamp', 'analysis_json']);
  }

  // Check if we have cached analysis (less than 24 hours old)
  const data = cacheSheet.getDataRange().getValues();
  if (!forceRefresh && data.length > 1) {
    const cachedTimestamp = new Date(data[1][0]);
    const now = new Date();
    const hoursDiff = (now - cachedTimestamp) / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      // Use cached analysis
      Logger.log('Using cached holistic analysis (' + hoursDiff.toFixed(1) + ' hours old)');
      return JSON.parse(data[1][1]);
    }
  }

  // Generate fresh analysis
  Logger.log('Generating fresh holistic analysis...');
  const analysis = performHolisticAnalysis_();

  // Cache the results
  if (data.length > 1) {
    // Update existing row
    cacheSheet.getRange(2, 1, 1, 2).setValues([
      [new Date(), JSON.stringify(analysis)]
    ]);
  } else {
    // Create new row
    cacheSheet.appendRow([new Date(), JSON.stringify(analysis)]);
  }

  return analysis;
}

function performHolisticAnalysis_() {
  const sheet = pickMasterSheet_();
  const data = sheet.getDataRange().getValues();

  // Defensive: Ensure we have enough rows
  if (!data || data.length < 3) {
    throw new Error('Sheet does not have enough data rows');
  }

  // Row 2 (index 1) contains the flattened merged headers like "Case_Organization_Case_ID"
  const rawHeaders = data[1];

  // Defensive: Ensure headers exist and is an array
  if (!rawHeaders || !Array.isArray(rawHeaders)) {
    throw new Error('Could not find valid header row at row 2 (index 1)');
  }

  // Trim all headers to remove whitespace
  const headers = rawHeaders.map(function(h) {
    return typeof h === 'string' ? h.trim() : h;
  });

  // Dynamic column resolution for holistic analysis
  const columnIndices = resolveColumnIndices_({
    caseId: { name: 'Case_Organization_Case_ID', fallback: 0 },
    sparkTitle: { name: 'Case_Organization_Spark_Title', fallback: 1 },
    pathway: { name: 'Case_Organization_Pathway_or_Course_Name', fallback: 5 },
    category: { name: 'Case_Organization_Category', fallback: 4 },
    diagnosis: { name: 'Case_Orientation_Chief_Diagnosis', fallback: 44 },
    learningOutcomes: { name: 'Case_Orientation_Actual_Learning_Outcomes', fallback: 45 }
  });

  const caseIdIdx = columnIndices.caseId;
  const sparkIdx = columnIndices.sparkTitle;
  const pathwayIdx = columnIndices.pathway;
  const categoryIdx = columnIndices.category;
  const diagnosisIdx = columnIndices.diagnosis;
  const learningOutcomesIdx = columnIndices.learningOutcomes;

  // Defensive: Check if critical columns were found
  if (caseIdIdx === -1 || sparkIdx === -1) {
    throw new Error('Could not find required columns. Looking for Case_Organization_Case_ID, Case_Organization_Spark_Title. CaseID idx: ' + caseIdIdx + ', Spark idx: ' + sparkIdx + ', Category idx: ' + categoryIdx);
  }

  // Collect all cases with full metadata
  const allCases = [];
  const systemDistribution = {};
  const pathwayDistribution = {};
  let unassignedCount = 0;

  // Data starts at row 3 (index 2) since row 1 is tier1, row 2 is merged headers
  for (let i = 2; i < data.length; i++) {
    const caseItem = {
      row: i + 1,
      caseId: data[i][caseIdIdx] || '',
      sparkTitle: data[i][sparkIdx] || '',
      category: data[i][categoryIdx] || '',
      pathway: data[i][pathwayIdx] || '',
      diagnosis: data[i][diagnosisIdx] || '',
      learningOutcomes: data[i][learningOutcomesIdx] || ''
    };

    allCases.push(caseItem);

    // Track system distribution
    const system = extractPrimarySystem_(caseItem.category);
    systemDistribution[system] = (systemDistribution[system] || 0) + 1;

    // Track pathway assignment
    if (caseItem.pathway && caseItem.pathway.trim() !== '') {
      pathwayDistribution[caseItem.pathway] = (pathwayDistribution[caseItem.pathway] || 0) + 1;
    } else {
      unassignedCount++;
    }
  }

  // Identify high-value pathway opportunities
  const pathwayOpportunities = identifyPathwayOpportunities_(allCases, systemDistribution);

  // Generate insights
  const insights = generateHolisticInsights_(allCases, systemDistribution, pathwayDistribution, unassignedCount);

  return {
    timestamp: new Date().toISOString(),
    totalCases: allCases.length,
    systemDistribution: systemDistribution,
    pathwayDistribution: pathwayDistribution,
    unassignedCount: unassignedCount,
    topPathways: pathwayOpportunities,
    insights: insights,
    allCases: allCases // Store for later use
  };
}

function extractPrimarySystem_(category) {
  const systems = ['CARD', 'RESP', 'NEUR', 'GI', 'ENDO', 'RENAL', 'ORTHO', 'PSYCH', 'SKIN'];
  if (!category || typeof category !== 'string') return '';
  const catUpper = category.toUpperCase();

  for (let i = 0; i < systems.length; i++) {
    if (catUpper.indexOf(systems[i]) !== -1) {
      return systems[i];
    }
  }

  return 'OTHER';
}

function identifyPathwayOpportunities_(cases, systemDist) {
  const opportunities = [];

  // ACLS Pathway Opportunity
  const aclsCases = cases.filter(function(c) {
    const combined = (c.sparkTitle + ' ' + c.diagnosis + ' ' + c.category).toUpperCase();
    return combined.indexOf('CARDIAC') !== -1 ||
           combined.indexOf('ARREST') !== -1 ||
           combined.indexOf('ARRHYTHMIA') !== -1 ||
           combined.indexOf('VTACH') !== -1 ||
           combined.indexOf('VFIB') !== -1 ||
           combined.indexOf('AFIB') !== -1;
  });

  if (aclsCases.length >= 5) {
    opportunities.push({
      id: 'acls_protocol_001',
      name: 'ACLS Protocol Series',
      logicType: 'protocol',
      icon: '💓',
      confidence: aclsCases.length >= 12 ? 0.95 : 0.75,
      caseCount: aclsCases.length,
      rationale: 'Strong concentration of cardiac arrest and arrhythmia cases with clear ACLS protocol applications',
      suggestedCases: aclsCases.slice(0, 12).map(function(c) { return c.caseId; })
    });
  }

  // Cardiovascular System Pathway
  if (systemDist['CARD'] && systemDist['CARD'] >= 8) {
    opportunities.push({
      id: 'card_system_001',
      name: 'Cardiovascular System Mastery',
      logicType: 'system',
      icon: '❤️',
      confidence: 0.90,
      caseCount: systemDist['CARD'],
      rationale: 'Sufficient cardiac cases to build comprehensive system-based learning pathway',
      suggestedCases: cases.filter(function(c) { return (c.category || '').toUpperCase().indexOf('CARD') !== -1; })
                           .slice(0, 12)
                           .map(function(c) { return c.caseId; })
    });
  }

  // Respiratory System Pathway
  if (systemDist['RESP'] && systemDist['RESP'] >= 8) {
    opportunities.push({
      id: 'resp_system_001',
      name: 'Respiratory System Mastery',
      logicType: 'system',
      icon: '🫁',
      confidence: 0.88,
      caseCount: systemDist['RESP'],
      rationale: 'Strong respiratory case collection for airway management and ventilation training',
      suggestedCases: cases.filter(function(c) { return (c.category || '').toUpperCase().indexOf('RESP') !== -1; })
                           .slice(0, 12)
                           .map(function(c) { return c.caseId; })
    });
  }

  // Pediatric Pathway
  const pedsCases = cases.filter(function(c) {
    const combined = (c.sparkTitle + ' ' + c.diagnosis + ' ' + c.category).toUpperCase();
    return combined.indexOf('PEDIATRIC') !== -1 ||
           combined.indexOf('CHILD') !== -1 ||
           combined.indexOf('INFANT') !== -1 ||
           combined.indexOf('PEDS') !== -1;
  });

  if (pedsCases.length >= 5) {
    opportunities.push({
      id: 'peds_specialty_001',
      name: 'Pediatric Emergency Medicine',
      logicType: 'specialty',
      icon: '🧸',
      confidence: pedsCases.length >= 10 ? 0.85 : 0.70,
      caseCount: pedsCases.length,
      rationale: 'Pediatric cases suitable for PALS and age-specific emergency training',
      suggestedCases: pedsCases.slice(0, 12).map(function(c) { return c.caseId; })
    });
  }

  // Sort by confidence
  opportunities.sort(function(a, b) { return b.confidence - a.confidence; });

  return opportunities.slice(0, 6); // Top 6 opportunities
}

function generateHolisticInsights_(cases, systemDist, pathwayDist, unassignedCount) {
  const insights = [];

  // Insight 1: Top system
  const topSystem = Object.keys(systemDist).reduce(function(a, b) {
    return systemDist[a] > systemDist[b] ? a : b;
  });
  insights.push(systemDist[topSystem] + ' ' + topSystem + ' cases form largest system group - strong pathway potential');

  // Insight 2: Unassigned cases
  if (unassignedCount > 0) {
    const pct = ((unassignedCount / cases.length) * 100).toFixed(0);
    insights.push(unassignedCount + ' cases unassigned (' + pct + '%) - opportunity to create new pathways');
  }

  // Insight 3: Protocol opportunities
  const aclsCount = cases.filter(function(c) {
    return (c.sparkTitle + c.diagnosis).toUpperCase().indexOf('CARDIAC') !== -1;
  }).length;

  if (aclsCount >= 8) {
    insights.push('Strong ACLS pathway opportunity with ' + aclsCount + ' cardiac cases');
  }

  // Insight 4: Complexity balance
  const simpleCount = cases.filter(function(c) { return c.diagnosis.length <= 25; }).length;
  const complexCount = cases.filter(function(c) { return c.diagnosis.length > 50; }).length;
  const simplePct = ((simpleCount / cases.length) * 100).toFixed(0);
  const complexPct = ((complexCount / cases.length) * 100).toFixed(0);

  insights.push('Case complexity: ' + simplePct + '% foundational, ' + complexPct + '% advanced - good balance for progression pathways');

  // Insight 5: Multi-system cases
  const multiSystemCount = cases.filter(function(c) {
    if (!c.category || typeof c.category !== 'string') return false;
    return c.category.indexOf(',') !== -1 || c.category.indexOf('/') !== -1;
  }).length;

  if (multiSystemCount > 5) {
    insights.push(multiSystemCount + ' multi-system cases identified - consider complexity-based pathway');
  }

  return insights;
}

// ========== BIRD'S EYE VIEW UI ==========

// Build Categories tab content
function buildCategoriesTabHTML_(analysis) {
  const systemCards = Object.keys(analysis.systemDistribution)
    .sort(function(a, b) { return analysis.systemDistribution[b] - analysis.systemDistribution[a]; })
    .map(function(sys) {
      const count = analysis.systemDistribution[sys];
      const icon = sys === 'CARD' ? '🫀' :
                   sys === 'RESP' ? '🫁' :
                   sys === 'NEUR' ? '🧠' :
                   sys === 'GI' ? '🍽️' :
                   sys === 'ENDO' ? '🔬' :
                   sys === 'PSYCH' ? '🧘' :
                   sys === 'TRAUMA' ? '🚑' :
                   sys === 'PEDS' ? '👶' : '📁';

      return '<div class="category-card" onclick="alert(\'Category view coming soon! Will show all ' + sys + ' cases.\')">' +
             '  <div class="category-icon">' + icon + '</div>' +
             '  <div class="category-name">' + sys + '</div>' +
             '  <div class="category-count">' + count + ' cases</div>' +
             '</div>';
    }).join('');

  return '<div class="tab-content" id="categories-tab" style="display: none;">' +
         '  <div class="section">' +
         '    <div class="section-title">📁 System-Based Organization</div>' +
         '    <div class="category-grid">' + systemCards + '</div>' +
         '  </div>' +
         '</div>';
}

// Build Pathways tab content
function buildPathwaysTabHTML_(analysis) {
  const pathwayCards = analysis.topPathways.map(function(pw) {
    const stars = Math.round(pw.confidence * 5);
    const starStr = Array(stars + 1).join('⭐');
    const confidencePct = (pw.confidence * 100).toFixed(0);

    return '<div class="pathway-card" style="cursor: pointer;" onclick="' +
           '  document.body.innerHTML = \'<div style=&quot;text-align:center; padding:100px;&quot;><h2>⚙️ Loading chain builder...</h2><p style=&quot;color: #8b92a0;&quot;>Pathway: ' + pw.name + '</p></div>\';' +
           '  google.script.run' +
           '    .withSuccessHandler(function(html) { document.documentElement.innerHTML = html; })' +
           '    .withFailureHandler(function(error) { document.body.innerHTML = \'<div style=&quot;text-align:center; padding:100px;&quot;><h2 style=&quot;color: #ff4444;&quot;>❌ Error</h2><p>\' + error.message + \'</p></div>\'; })' +
           '    .buildChainBuilderUI(\'' + pw.id + '\', \'complexity_gradient\');' +
           '">' +
           '  <div class="pathway-header">' +
           '    <span class="pathway-icon">' + pw.icon + '</span>' +
           '    <div class="pathway-title">' + pw.name + '</div>' +
           '  </div>' +
           '  <div class="pathway-stats">' +
           '    <span class="pathway-count">' + pw.caseCount + ' cases</span>' +
           '    <span class="pathway-confidence">' + starStr + ' ' + confidencePct + '%</span>' +
           '  </div>' +
           '  <div class="pathway-rationale">' + pw.rationale + '</div>' +
           '</div>';
  }).join('');

  const insightsList = analysis.insights.map(function(insight) {
    return '<li class="insight-item">💡 ' + insight + '</li>';
  }).join('');

  // Get cache status
  const cacheStatus = getCacheStatus();
  const statusColor = cacheStatus.status === 'valid' ? '#00c853' :
                      cacheStatus.status === 'stale' ? '#ff9800' : '#f44336';
  const cacheIndicator = '<span id="cache-status" style="font-size: 11px; padding: 4px 8px; background: ' + statusColor + '; color: #fff; border-radius: 4px; font-weight: 600; margin-left: 8px;">' +
                        cacheStatus.icon + ' ' + cacheStatus.message +
                        (cacheStatus.cases ? ' (' + cacheStatus.cases + ' cases)' : '') +
                        '</span>';

  return '<div class="tab-content active" id="pathways-tab" style="display: block;">' +
         '  <div class="insights-box">' +
         '    <h3>🎯 Holistic Insights</h3>' +
         '    <ul class="insights-list">' + insightsList + '</ul>' +
         '  </div>' +
         '  <div class="section">' +
         '    <div class="section-title" style="display: flex; justify-content: space-between; align-items: center;">' +
         '      <div><span>🧩 Intelligent Pathway Opportunities</span>' + cacheIndicator + '</div>' +
         '      <div style="display: flex; gap: 12px; align-items: center;">' +
         '        <button class="precache-btn" onclick="google.script.run.preCacheRichData();" style="background: linear-gradient(135deg, #00c853 0%, #00a040 100%); border: none; color: #fff; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s ease; display: flex; align-items: center; gap: 6px; box-shadow: 0 0 12px rgba(0, 200, 83, 0.3);">💾 Pre-Cache Rich Data</button>' +
         '        <button class="ai-discover-btn" onclick="google.script.run.showAIPathwaysStandardWithLogs();" style="background: linear-gradient(135deg, #2357ff 0%, #1a47cc 100%); border: none; color: #fff; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s ease; display: flex; align-items: center; gap: 6px;">🤖 AI: Discover Novel Pathways</button>' +
         '        <button class="ai-radical-btn" onclick="google.script.run.showAIPathwaysRadicalWithLogs();" style="background: linear-gradient(135deg, #ff6b00 0%, #cc5500 100%); border: none; color: #fff; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s ease; display: flex; align-items: center; gap: 6px; box-shadow: 0 0 12px rgba(255, 107, 0, 0.3);">🔥 AI: Radical Mode</button>' +
         '      </div>' +
         '    </div>' +
         '    <div class="pathway-grid">' + pathwayCards + '</div>' +
         '  </div>' +
         '</div>';
}

function buildBirdEyeViewUI_(analysis) {
  // Build tab content
  const categoriesTabHTML = buildCategoriesTabHTML_(analysis);
  const pathwaysTabHTML = buildPathwaysTabHTML_(analysis);

  return '<!DOCTYPE html>' +
'<html>' +
'<head>' +
'  <base target="_top">' +
'  <style>' +
'    * { margin: 0; padding: 0; box-sizing: border-box; }' +
'' +
'    body {' +
'      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;' +
'      background: linear-gradient(135deg, #0f1115 0%, #1a1d26 100%);' +
'      color: #e7eaf0;' +
'      overflow-x: hidden;' +
'      height: 1000px;' +
'    }' +
'' +
'    .header {' +
'      background: linear-gradient(135deg, #1b1f2a 0%, #141824 100%);' +
'      padding: 20px 32px 0 32px;' +
'      border-bottom: 2px solid #2a3040;' +
'    }' +
'' +
'    .header-top {' +
'      display: flex;' +
'      justify-content: space-between;' +
'      align-items: center;' +
'      margin-bottom: 16px;' +
'    }' +
'' +
'    .header h1 {' +
'      font-size: 28px;' +
'      font-weight: 700;' +
'    }' +
'' +
'    .btn-reanalyze {' +
'      background: linear-gradient(135deg, #2a3040 0%, #1e2533 100%);' +
'      border: 1px solid #3a4458;' +
'      color: #e7eaf0;' +
'      padding: 10px 18px;' +
'      border-radius: 8px;' +
'      cursor: pointer;' +
'      font-size: 13px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .btn-reanalyze:hover {' +
'      background: linear-gradient(135deg, #3a4458 0%, #2a3040 100%);' +
'      border-color: #2357ff;' +
'    }' +
'' +
'    .stats-bar {' +
'      display: flex;' +
'      gap: 16px;' +
'      margin-bottom: 12px;' +
'    }' +
'' +
'    .stat-badge {' +
'      background: #0f1115;' +
'      border: 1px solid #2a3040;' +
'      padding: 6px 14px;' +
'      border-radius: 8px;' +
'      font-size: 12px;' +
'      color: #8b92a0;' +
'    }' +
'' +
'    .stat-badge .value {' +
'      color: #2357ff;' +
'      font-weight: 700;' +
'      margin-right: 4px;' +
'    }' +
'' +
'    /* Browser-style tabs */' +
'    .tab-switcher {' +
'      display: flex;' +
'      gap: 4px;' +
'      border-bottom: none;' +
'    }' +
'' +
'    .tab {' +
'      background: #141824;' +
'      border: 1px solid #2a3040;' +
'      border-bottom: none;' +
'      color: #8b92a0;' +
'      padding: 12px 24px;' +
'      border-radius: 10px 10px 0 0;' +
'      cursor: pointer;' +
'      font-size: 14px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'      position: relative;' +
'      bottom: -1px;' +
'    }' +
'' +
'    .tab:hover {' +
'      background: #1b1f2a;' +
'      color: #e7eaf0;' +
'    }' +
'' +
'    .tab.active {' +
'      background: linear-gradient(135deg, #0f1115 0%, #1a1d26 100%);' +
'      border-color: #2a3040;' +
'      border-bottom: 2px solid transparent;' +
'      color: #2357ff;' +
'      box-shadow: 0 -2px 8px rgba(35, 87, 255, 0.1);' +
'    }' +
'' +
'    /* Tab content */' +
'    .tab-content {' +
'      display: none;' +
'      padding: 32px;' +
'      overflow-y: auto;' +
'      height: calc(1000px - 180px);' +
'    }' +
'' +
'    .tab-content.active {' +
'      display: block;' +
'    }' +
'' +
'    .tab-content::-webkit-scrollbar {' +
'      width: 10px;' +
'    }' +
'' +
'    .tab-content::-webkit-scrollbar-track {' +
'      background: #0f1115;' +
'    }' +
'' +
'    .tab-content::-webkit-scrollbar-thumb {' +
'      background: #2a3040;' +
'      border-radius: 5px;' +
'    }' +
'' +
'    .section {' +
'      margin-bottom: 32px;' +
'    }' +
'' +
'    .section-title {' +
'      font-size: 18px;' +
'      font-weight: 600;' +
'      margin-bottom: 20px;' +
'      color: #e7eaf0;' +
'      display: flex;' +
'      align-items: center;' +
'      gap: 10px;' +
'    }' +
'' +
'    /* Category cards (for Categories tab) */' +
'    .category-grid {' +
'      display: grid;' +
'      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));' +
'      gap: 20px;' +
'    }' +
'' +
'    .category-card {' +
'      background: linear-gradient(135deg, #1e2533 0%, #181d28 100%);' +
'      border: 2px solid #2a3040;' +
'      border-radius: 16px;' +
'      padding: 28px 24px;' +
'      text-align: center;' +
'      cursor: pointer;' +
'      transition: all 0.3s ease;' +
'    }' +
'' +
'    .category-card:hover {' +
'      background: linear-gradient(135deg, #252b3a 0%, #1f2430 100%);' +
'      border-color: #2357ff;' +
'      transform: translateY(-6px);' +
'      box-shadow: 0 12px 32px rgba(35, 87, 255, 0.25);' +
'    }' +
'' +
'    .category-icon {' +
'      font-size: 52px;' +
'      margin-bottom: 16px;' +
'      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));' +
'    }' +
'' +
'    .category-name {' +
'      font-size: 20px;' +
'      font-weight: 700;' +
'      color: #e7eaf0;' +
'      margin-bottom: 8px;' +
'      letter-spacing: 0.5px;' +
'    }' +
'' +
'    .category-count {' +
'      font-size: 14px;' +
'      color: #8b92a0;' +
'      font-weight: 500;' +
'    }' +
'' +
'    /* Insights box */' +
'    .insights-box {' +
'      background: linear-gradient(135deg, #1e2533 0%, #181d28 100%);' +
'      border: 1px solid #2a3040;' +
'      border-left: 3px solid #2357ff;' +
'      padding: 20px 24px;' +
'      border-radius: 10px;' +
'      margin-bottom: 32px;' +
'    }' +
'' +
'    .insights-box h3 {' +
'      font-size: 16px;' +
'      font-weight: 600;' +
'      margin-bottom: 12px;' +
'      color: #2357ff;' +
'    }' +
'' +
'    .insights-list {' +
'      list-style: none;' +
'      padding: 0;' +
'    }' +
'' +
'    .insight-item {' +
'      font-size: 14px;' +
'      color: #8b92a0;' +
'      line-height: 1.6;' +
'      margin-bottom: 10px;' +
'    }' +
'' +
'    /* Pathway cards (for Pathways tab) */' +
'    .pathway-grid {' +
'      display: grid;' +
'      grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));' +
'      gap: 20px;' +
'    }' +
'' +
'    .pathway-card {' +
'      background: linear-gradient(135deg, #1e2533 0%, #181d28 100%);' +
'      border: 1px solid #2a3040;' +
'      padding: 20px;' +
'      border-radius: 12px;' +
'      cursor: pointer;' +
'      transition: all 0.3s;' +
'    }' +
'' +
'    .pathway-card:hover {' +
'      background: linear-gradient(135deg, #252b3a 0%, #1f2430 100%);' +
'      border-color: #2357ff;' +
'      transform: translateY(-3px);' +
'      box-shadow: 0 8px 24px rgba(35, 87, 255, 0.2);' +
'    }' +
'' +
'    .pathway-header {' +
'      display: flex;' +
'      align-items: center;' +
'      gap: 12px;' +
'      margin-bottom: 12px;' +
'    }' +
'' +
'    .pathway-icon {' +
'      font-size: 32px;' +
'    }' +
'' +
'    .pathway-title {' +
'      font-size: 18px;' +
'      font-weight: 600;' +
'      color: #e7eaf0;' +
'    }' +
'' +
'    .pathway-stats {' +
'      display: flex;' +
'      justify-content: space-between;' +
'      align-items: center;' +
'      margin-bottom: 12px;' +
'    }' +
'' +
'    .pathway-count {' +
'      font-size: 13px;' +
'      color: #2357ff;' +
'      font-weight: 600;' +
'    }' +
'' +
'    .pathway-confidence {' +
'      font-size: 12px;' +
'      color: #8b92a0;' +
'    }' +
'' +
'    .pathway-rationale {' +
'      font-size: 13px;' +
'      color: #8b92a0;' +
'      line-height: 1.5;' +
'      margin-bottom: 16px;' +
'    }' +
'' +
'    .btn-build {' +
'      width: 100%;' +
'      background: linear-gradient(135deg, #2357ff 0%, #1a47d9 100%);' +
'      border: none;' +
'      color: #fff;' +
'      padding: 10px 16px;' +
'      border-radius: 8px;' +
'      cursor: pointer;' +
'      font-size: 14px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .btn-build:hover {' +
'      background: linear-gradient(135deg, #1a47d9 0%, #1538b8 100%);' +
'      transform: translateY(-1px);' +
'    }' +
'  </style>' +
'</head>' +
'<body>' +
'  <div class="header">' +
'    <div class="header-top">' +
'      <h1>🧩 Pathway Chain Builder</h1>' +
'      <button class="btn-reanalyze" onclick="reAnalyze()">🔄 Re-analyze</button>' +
'    </div>' +
'    <div class="stats-bar">' +
'      <div class="stat-badge"><span class="value">' + analysis.totalCases + '</span> Total Cases</div>' +
'      <div class="stat-badge"><span class="value">' + Object.keys(analysis.systemDistribution).length + '</span> Systems</div>' +
'      <div class="stat-badge"><span class="value">' + analysis.topPathways.length + '</span> Opportunities</div>' +
'      <div class="stat-badge"><span class="value">' + analysis.unassignedCount + '</span> Unassigned</div>' +
'    </div>' +
'    <div class="tab-switcher">' +
'      <button class="tab" id="categories-tab-btn" onclick="' +
'        document.getElementById(\'categories-tab-btn\').classList.add(\'active\');' +
'        document.getElementById(\'pathways-tab-btn\').classList.remove(\'active\');' +
'        document.getElementById(\'categories-tab\').style.display = \'block\';' +
'        document.getElementById(\'pathways-tab\').style.display = \'none\';' +
'      ">📁 Categories</button>' +
'      <button class="tab active" id="pathways-tab-btn" onclick="' +
'        document.getElementById(\'categories-tab-btn\').classList.remove(\'active\');' +
'        document.getElementById(\'pathways-tab-btn\').classList.add(\'active\');' +
'        document.getElementById(\'categories-tab\').style.display = \'none\';' +
'        document.getElementById(\'pathways-tab\').style.display = \'block\';' +
'      ">🧩 Pathways</button>' +
'    </div>' +
'  </div>' +
'' +
'  ' + categoriesTabHTML +
'  ' + pathwaysTabHTML +
'' +
'  <script>' +
'    function showCategories() {' +
'      // Update tab buttons' +
'      var categoriesBtn = document.getElementById(\'categories-tab-btn\');' +
'      var pathwaysBtn = document.getElementById(\'pathways-tab-btn\');' +
'      if (categoriesBtn) categoriesBtn.classList.add(\'active\');' +
'      if (pathwaysBtn) pathwaysBtn.classList.remove(\'active\');' +
'      ' +
'      // Update tab content' +
'      var categoriesTab = document.getElementById(\'categories-tab\');' +
'      var pathwaysTab = document.getElementById(\'pathways-tab\');' +
'      if (categoriesTab) categoriesTab.style.display = \'block\';' +
'      if (pathwaysTab) pathwaysTab.style.display = \'none\';' +
'    }' +
'' +
'    function showPathways() {' +
'      // Update tab buttons' +
'      var categoriesBtn = document.getElementById(\'categories-tab-btn\');' +
'      var pathwaysBtn = document.getElementById(\'pathways-tab-btn\');' +
'      if (categoriesBtn) categoriesBtn.classList.remove(\'active\');' +
'      if (pathwaysBtn) pathwaysBtn.classList.add(\'active\');' +
'      ' +
'      // Update tab content' +
'      var categoriesTab = document.getElementById(\'categories-tab\');' +
'      var pathwaysTab = document.getElementById(\'pathways-tab\');' +
'      if (categoriesTab) categoriesTab.style.display = \'none\';' +
'      if (pathwaysTab) pathwaysTab.style.display = \'block\';' +
'    }' +
'' +
'    function viewCategory(categoryName) {' +
'      console.log("🗂️ View category:", categoryName);' +
'      alert("Category view coming soon! Will show all " + categoryName + " cases.");' +
'    }' +
'' +
'    function buildPathway(pathwayId) {' +
'      console.log("🎯 buildPathway called with ID:", pathwayId);' +
'      try {' +
'        document.body.innerHTML = "<div style=\\"text-align:center; padding:100px;\\"><h2>⚙️ Loading chain builder...</h2><p style=\\"color: #8b92a0;\\">Pathway ID: " + pathwayId + "</p></div>";' +
'        console.log("📞 Calling google.script.run.buildChainBuilderUI");' +
'        google.script.run' +
'          .withSuccessHandler(function(html) {' +
'            console.log("✅ buildChainBuilderUI returned successfully");' +
'            console.log("📄 HTML length:", html.length);' +
'            document.documentElement.innerHTML = html;' +
'          })' +
'          .withFailureHandler(function(error) {' +
'            console.error("❌ buildChainBuilderUI failed:", error);' +
'            document.body.innerHTML = "<div style=\\"text-align:center; padding:100px;\\"><h2 style=\\"color: #ff4444;\\">❌ Error Loading Chain Builder</h2><p style=\\"color: #8b92a0;\\">Error: " + error.message + "</p><p style=\\"color: #8b92a0;\\">See console for details (F12)</p></div>";' +
'          })' +
'          .buildChainBuilderUI(pathwayId);' +
'      } catch (e) {' +
'        console.error("❌ Exception in buildPathway:", e);' +
'        document.body.innerHTML = "<div style=\\"text-align:center; padding:100px;\\"><h2 style=\\"color: #ff4444;\\">❌ Exception</h2><p style=\\"color: #8b92a0;\\">Exception: " + e.message + "</p></div>";' +
'      }' +
'    }' +
'' +
'    function reAnalyze() {' +
'      if (confirm("Re-analyze entire case library?\\n\\nThis will invalidate the cache and take 30-60 seconds.")) {' +
'        document.body.innerHTML = "<div style=\\"text-align:center; padding:100px;\\"><h2>⚙️ Re-analyzing...</h2><p>Please wait...</p></div>";' +
'        google.script.run' +
'          .withSuccessHandler(function() {' +
'            google.script.host.close();' +
'          })' +
'          .reAnalyzeLibrary();' +
'      }' +
'    }' +
'  </script>' +
'</body>' +
'</html>';
}

// ========== RE-ANALYZE FUNCTION ==========

function reAnalyzeLibrary() {
  // Force refresh of holistic analysis
  getOrCreateHolisticAnalysis_(true);
}

// ========== LOGIC TYPE REGISTRY ==========

function getAllLogicTypes_() {
  return [
    {
      id: 'complexity_gradient',
      name: 'Complexity Gradient',
      icon: '📊',
      description: 'Simple → Complex progression based on diagnosis length and symptom count',
      explanation: 'This logic type orders cases from simplest to most complex, allowing learners to build confidence with straightforward presentations before tackling multi-system cases.',
      targetAudience: 'Medical students, new residents, general learners',
      whenToUse: 'When building foundational knowledge and pattern recognition skills'
    },
    {
      id: 'acuity_escalation',
      name: 'Acuity Escalation',
      icon: '🚨',
      description: 'Stable → Critical based on vital signs severity and time-sensitivity',
      explanation: 'Orders cases from stable presentations to life-threatening emergencies, teaching triage prioritization and escalation recognition.',
      targetAudience: 'ER residents, triage nurses, emergency responders',
      whenToUse: 'When teaching emergency prioritization and critical decision-making under pressure'
    },
    {
      id: 'diagnostic_mimicry',
      name: 'Diagnostic Mimicry',
      icon: '🎭',
      description: 'Similar presentations with different diagnoses - teaches differential reasoning',
      explanation: 'Groups cases with similar chief complaints but different underlying diagnoses, forcing learners to differentiate between look-alike conditions.',
      targetAudience: 'Advanced students, residents preparing for boards, diagnosticians',
      whenToUse: 'When teaching differential diagnosis and avoiding cognitive anchoring bias'
    },
    {
      id: 'protocol_mastery',
      name: 'Protocol Mastery',
      icon: '📋',
      description: 'Algorithm-driven sequence (ACLS, ATLS, PALS protocols)',
      explanation: 'Follows established clinical protocols step-by-step, reinforcing algorithmic decision trees and standardized care pathways.',
      targetAudience: 'Certification candidates (ACLS/ATLS/PALS), protocol-driven teams',
      whenToUse: 'When preparing for certification exams or standardizing team responses'
    },
    {
      id: 'organ_system_journey',
      name: 'Organ System Journey',
      icon: '🫀',
      description: 'Deep dive into single system (Cardiology, Neurology, etc.)',
      explanation: 'Focuses exclusively on one organ system, progressing through all severity levels and subtypes within that specialty.',
      targetAudience: 'Specialty residents, fellows, focused learners',
      whenToUse: 'When developing deep expertise in a specific medical specialty'
    },
    {
      id: 'age_spectrum',
      name: 'Age Spectrum',
      icon: '👶👴',
      description: 'Pediatric → Geriatric presentations of similar conditions',
      explanation: 'Shows how the same condition presents differently across age groups, teaching age-specific assessment and treatment modifications.',
      targetAudience: 'Family medicine, pediatricians, geriatricians',
      whenToUse: 'When teaching lifespan considerations and age-adapted care'
    },
    {
      id: 'rare_zebras',
      name: 'Rare Zebras',
      icon: '🦓',
      description: 'Uncommon diagnoses that mimic common conditions',
      explanation: 'Highlights rare but important diagnoses that can be missed, teaching "when to think zebra not horse."',
      targetAudience: 'Experienced clinicians, academic medicine, diagnosticians',
      whenToUse: 'When teaching pattern interruption and avoiding premature closure'
    },
    {
      id: 'comorbidity_complexity',
      name: 'Comorbidity Complexity',
      icon: '🧩',
      description: 'Single-system → Multi-system with medication interactions',
      explanation: 'Progressively adds comorbidities and polypharmacy, teaching complex patient management and interaction awareness.',
      targetAudience: 'Internists, hospitalists, chronic disease managers',
      whenToUse: 'When teaching management of medically complex patients'
    },
    {
      id: 'time_pressure',
      name: 'Time-Pressure Triage',
      icon: '⏱️',
      description: 'Door-to-decision time constraints (minutes → hours)',
      explanation: 'Orders cases by acceptable decision timeframe, teaching when rapid action is critical versus when observation is safe.',
      targetAudience: 'ER physicians, trauma teams, acute care providers',
      whenToUse: 'When teaching time-critical decision making and triage skills'
    },
    {
      id: 'cognitive_traps',
      name: 'Cognitive Trap Awareness',
      icon: '🧠',
      description: 'Cases designed to expose common diagnostic biases',
      explanation: 'Presents cases that trigger anchoring, availability, confirmation bias - then reveals the correct diagnosis to teach metacognition.',
      targetAudience: 'All levels - teaches self-awareness and bias recognition',
      whenToUse: 'When teaching clinical reasoning and diagnostic error prevention'
    },
    {
      id: 'resource_constrained',
      name: 'Resource-Constrained Care',
      icon: '🏕️',
      description: 'Full-resource → Limited-resource management',
      explanation: 'Shows how to adapt diagnosis and treatment when advanced imaging, labs, or specialists are unavailable.',
      targetAudience: 'Rural providers, austere medicine, international health workers',
      whenToUse: 'When teaching clinical reasoning without high-tech dependencies'
    },
    {
      id: 'handoff_continuity',
      name: 'Handoff & Continuity',
      icon: '🔄',
      description: 'Cases that span multiple shifts and care transitions',
      explanation: 'Teaches safe handoffs, information synthesis across time, and recognizing evolving presentations.',
      targetAudience: 'Hospitalists, shift workers, care coordinators',
      whenToUse: 'When teaching communication and longitudinal thinking'
    }
  ];
}

function getLogicTypeById_(logicTypeId) {
  const allTypes = getAllLogicTypes_();
  for (let i = 0; i < allTypes.length; i++) {
    if (allTypes[i].id === logicTypeId) {
      return allTypes[i];
    }
  }
  return allTypes[0]; // Default to complexity_gradient
}

function sortByLogicType_(cases, logicTypeId) {
  switch(logicTypeId) {
    case 'complexity_gradient':
      // Simple → Complex (by diagnosis length)
      cases.sort(function(a, b) {
        return a.diagnosis.length - b.diagnosis.length;
      });
      break;

    case 'acuity_escalation':
      // Stable → Critical (by diagnosis severity keywords)
      cases.sort(function(a, b) {
        const acuityA = getAcuityScore_(a.diagnosis + ' ' + a.sparkTitle);
        const acuityB = getAcuityScore_(b.diagnosis + ' ' + b.sparkTitle);
        return acuityA - acuityB;
      });
      break;

    case 'diagnostic_mimicry':
      // Group by similar chief complaints (first word of spark title)
      cases.sort(function(a, b) {
        const chiefA = a.sparkTitle.split(' ')[0].toUpperCase();
        const chiefB = b.sparkTitle.split(' ')[0].toUpperCase();
        if (chiefA === chiefB) {
          return a.diagnosis.length - b.diagnosis.length; // Within group, simple → complex
        }
        return chiefA.localeCompare(chiefB);
      });
      break;

    case 'protocol_mastery':
      // Protocol order (ACLS: VFib → VTach → Asystole → PEA)
      cases.sort(function(a, b) {
        const protocolA = getProtocolPriority_(a.diagnosis);
        const protocolB = getProtocolPriority_(b.diagnosis);
        return protocolA - protocolB;
      });
      break;

    case 'organ_system_journey':
      // Group by system, then severity within system
      cases.sort(function(a, b) {
        if (a.category === b.category) {
          return a.diagnosis.length - b.diagnosis.length;
        }
        return a.category.localeCompare(b.category);
      });
      break;

    case 'age_spectrum':
      // Pediatric → Adult → Geriatric (by age keywords in diagnosis/spark)
      cases.sort(function(a, b) {
        const ageA = getAgeCategory_(a.diagnosis + ' ' + a.sparkTitle);
        const ageB = getAgeCategory_(b.diagnosis + ' ' + b.sparkTitle);
        return ageA - ageB;
      });
      break;

    case 'rare_zebras':
      // Rare/uncommon diagnoses first (by rarity keywords)
      cases.sort(function(a, b) {
        const rarityA = getRarityScore_(a.diagnosis);
        const rarityB = getRarityScore_(b.diagnosis);
        return rarityB - rarityA; // Descending (rare first)
      });
      break;

    case 'comorbidity_complexity':
      // Single-system → Multi-system (count commas, "and", "&")
      cases.sort(function(a, b) {
        const comorbidA = getComorbidityCount_(a.diagnosis);
        const comorbidB = getComorbidityCount_(b.diagnosis);
        return comorbidA - comorbidB;
      });
      break;

    case 'time_pressure':
      // By urgency (minutes → hours → days)
      cases.sort(function(a, b) {
        const urgencyA = getTimeUrgency_(a.diagnosis + ' ' + a.sparkTitle);
        const urgencyB = getTimeUrgency_(b.diagnosis + ' ' + a.sparkTitle);
        return urgencyB - urgencyA; // Descending (most urgent first)
      });
      break;

    case 'cognitive_traps':
      // Cases likely to trigger bias (by keywords like "classic", "typical")
      cases.sort(function(a, b) {
        const trapA = getCognitiveTrapScore_(a.diagnosis + ' ' + a.sparkTitle);
        const trapB = getCognitiveTrapScore_(b.diagnosis + ' ' + b.sparkTitle);
        return trapB - trapA;
      });
      break;

    case 'resource_constrained':
      // Full resource → Limited resource (by diagnostic dependency)
      cases.sort(function(a, b) {
        const resourceA = getResourceDependency_(a.diagnosis);
        const resourceB = getResourceDependency_(b.diagnosis);
        return resourceB - resourceA; // High-resource first, then low-resource
      });
      break;

    case 'handoff_continuity':
      // Cases that evolve over time (keywords: "progressive", "evolving")
      cases.sort(function(a, b) {
        const evolutionA = getEvolutionScore_(a.diagnosis + ' ' + a.sparkTitle);
        const evolutionB = getEvolutionScore_(b.diagnosis + ' ' + b.sparkTitle);
        return evolutionB - evolutionA;
      });
      break;

    default:
      // Fallback to complexity gradient
      cases.sort(function(a, b) {
        return a.diagnosis.length - b.diagnosis.length;
      });
  }
}

// Helper scoring functions for logic types
function getAcuityScore_(text) {
  const criticalWords = ['arrest', 'shock', 'hemorrhage', 'stroke', 'mi', 'infarction', 'critical', 'severe'];
  const urgentWords = ['acute', 'emergency', 'unstable', 'crisis'];
  let score = 0;
  const upper = text.toUpperCase();
  for (let i = 0; i < criticalWords.length; i++) {
    if (upper.indexOf(criticalWords[i].toUpperCase()) !== -1) score += 3;
  }
  for (let i = 0; i < urgentWords.length; i++) {
    if (upper.indexOf(urgentWords[i].toUpperCase()) !== -1) score += 1;
  }
  return score;
}

function getProtocolPriority_(diagnosis) {
  const upper = diagnosis.toUpperCase();
  if (upper.indexOf('VFIB') !== -1 || upper.indexOf('V FIB') !== -1) return 1;
  if (upper.indexOf('VTACH') !== -1 || upper.indexOf('V TACH') !== -1) return 2;
  if (upper.indexOf('ASYSTOLE') !== -1) return 3;
  if (upper.indexOf('PEA') !== -1) return 4;
  if (upper.indexOf('BRADYCARD') !== -1) return 5;
  if (upper.indexOf('SVT') !== -1 || upper.indexOf('TACHYCARD') !== -1) return 6;
  return 7;
}

function getAgeCategory_(text) {
  const upper = text.toUpperCase();
  if (upper.indexOf('PEDIATRIC') !== -1 || upper.indexOf('CHILD') !== -1 || upper.indexOf('INFANT') !== -1) return 1;
  if (upper.indexOf('ADOLESCENT') !== -1 || upper.indexOf('TEEN') !== -1) return 2;
  if (upper.indexOf('GERIATRIC') !== -1 || upper.indexOf('ELDERLY') !== -1 || upper.indexOf('SENIOR') !== -1) return 4;
  return 3; // Adult default
}

function getRarityScore_(diagnosis) {
  const rareWords = ['rare', 'uncommon', 'unusual', 'atypical', 'zebra'];
  let score = 0;
  const upper = diagnosis.toUpperCase();
  for (let i = 0; i < rareWords.length; i++) {
    if (upper.indexOf(rareWords[i].toUpperCase()) !== -1) score += 2;
  }
  return score;
}

function getComorbidityCount_(diagnosis) {
  let count = 0;
  count += (diagnosis.match(/,/g) || []).length;
  count += (diagnosis.match(/\band\b/gi) || []).length;
  count += (diagnosis.match(/\bwith\b/gi) || []).length;
  count += (diagnosis.match(/&/g) || []).length;
  return count;
}

function getTimeUrgency_(text) {
  const immediateWords = ['emergent', 'stat', 'immediate', 'critical', 'arrest'];
  const urgentWords = ['urgent', 'acute', 'minutes'];
  let score = 0;
  const upper = text.toUpperCase();
  for (let i = 0; i < immediateWords.length; i++) {
    if (upper.indexOf(immediateWords[i].toUpperCase()) !== -1) score += 3;
  }
  for (let i = 0; i < urgentWords.length; i++) {
    if (upper.indexOf(urgentWords[i].toUpperCase()) !== -1) score += 1;
  }
  return score;
}

function getCognitiveTrapScore_(text) {
  const trapWords = ['classic', 'typical', 'textbook', 'obvious', 'clear'];
  let score = 0;
  const upper = text.toUpperCase();
  for (let i = 0; i < trapWords.length; i++) {
    if (upper.indexOf(trapWords[i].toUpperCase()) !== -1) score += 1;
  }
  return score;
}

function getResourceDependency_(diagnosis) {
  const highResourceWords = ['ct', 'mri', 'angiography', 'catheterization', 'specialist'];
  let score = 0;
  const upper = diagnosis.toUpperCase();
  for (let i = 0; i < highResourceWords.length; i++) {
    if (upper.indexOf(highResourceWords[i].toUpperCase()) !== -1) score += 1;
  }
  return score;
}

function getEvolutionScore_(text) {
  const evolutionWords = ['progressive', 'evolving', 'worsening', 'deteriorating', 'chronic'];
  let score = 0;
  const upper = text.toUpperCase();
  for (let i = 0; i < evolutionWords.length; i++) {
    if (upper.indexOf(evolutionWords[i].toUpperCase()) !== -1) score += 1;
  }
  return score;
}

// ========== AI-POWERED LOGIC TYPE GENERATION ==========

function generateLogicTypeWithAI(pathwayId) {
  Logger.log('🤖 AI generating new logic type for pathway: ' + pathwayId);

  try {
    const analysis = getOrCreateHolisticAnalysis_();

    // Find the pathway
    let pathway = null;
    for (let i = 0; i < analysis.topPathways.length; i++) {
      if (analysis.topPathways[i].id === pathwayId) {
        pathway = analysis.topPathways[i];
        break;
      }
    }

    if (!pathway) {
      throw new Error('Pathway not found: ' + pathwayId);
    }

    // Get cases for this pathway
    const pathwayCases = [];
    for (let i = 0; i < analysis.allCases.length; i++) {
      for (let j = 0; j < pathway.suggestedCases.length; j++) {
        if (analysis.allCases[i].caseId === pathway.suggestedCases[j]) {
          pathwayCases.push(analysis.allCases[i]);
          break;
        }
      }
    }

    // Create context for ChatGPT
    const casesSummary = pathwayCases.map(function(c) {
      return c.caseId + ': ' + c.sparkTitle + ' | ' + c.diagnosis;
    }).join('\\n');

    const existingLogicTypes = getAllLogicTypes_().map(function(lt) {
      return lt.name + ': ' + lt.description;
    }).join('\\n');

    const prompt = 'You are an expert medical educator analyzing a case library for pathway building.\\n\\n' +
      'PATHWAY: ' + pathway.name + '\\n' +
      'CASES (' + pathwayCases.length + ' total):\\n' + casesSummary + '\\n\\n' +
      'EXISTING LOGIC TYPES:\\n' + existingLogicTypes + '\\n\\n' +
      'Task: Analyze these cases and suggest ONE innovative logic type for ordering them that is DIFFERENT from the existing types. ' +
      'Consider unique pedagogical approaches, clinical reasoning patterns, or educational objectives that aren\'t covered yet.\\n\\n' +
      'Respond ONLY with valid JSON in this exact format:\\n' +
      '{\\n' +
      '  "id": "ai_generated_[unique_slug]",\\n' +
      '  "name": "Your Logic Type Name",\\n' +
      '  "icon": "📌",\\n' +
      '  "description": "Brief one-line description",\\n' +
      '  "explanation": "Detailed explanation of how this orders cases and why it\'s valuable",\\n' +
      '  "targetAudience": "Who should use this approach",\\n' +
      '  "whenToUse": "When this approach is most appropriate",\\n' +
      '  "sortingCriteria": "Detailed instructions for how to sort cases (e.g., analyze X, then prioritize by Y)"\\n' +
      '}';

    // Get OpenAI API key from Settings sheet cell B2
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName('Settings');
    let apiKey = '';

    if (settingsSheet) {
      apiKey = settingsSheet.getRange('B2').getValue();
      Logger.log('🔑 Retrieved API key from Settings!B2');
    }

    if (!apiKey) {
      // Return demo logic type if no API key
      Logger.log('⚠️ No OpenAI API key found in Settings!B2, returning demo logic type');
      return {
        id: 'ai_demo_' + new Date().getTime(),
        name: 'Misdiagnosis Risk Gradient',
        icon: '⚠️',
        description: 'Orders cases by likelihood of misdiagnosis - from commonly missed to obvious',
        explanation: 'This AI-generated logic type analyzes cases for cognitive bias triggers, atypical presentations, and diagnostic pitfalls. Cases with high misdiagnosis risk come first to train pattern interruption, while clear-cut cases come last.',
        targetAudience: 'Advanced practitioners, quality improvement teams, patient safety officers',
        whenToUse: 'When teaching diagnostic error prevention and developing meta-cognitive awareness',
        sortingCriteria: 'Analyze diagnosis complexity, symptom overlap with common conditions, and presence of red herrings'
      };
    }

    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + apiKey
      },
      payload: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert medical educator who designs innovative case sequencing logic.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 500
      })
    });

    const result = JSON.parse(response.getContentText());
    const aiResponse = result.choices[0].message.content;

    // Parse JSON from AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON');
    }

    const newLogicType = JSON.parse(jsonMatch[0]);
    Logger.log('✅ AI generated logic type: ' + newLogicType.name);

    return newLogicType;

  } catch (error) {
    Logger.log('❌ Error generating logic type with AI: ' + error.toString());
    throw error;
  }
}

function interpretCustomLogicDescription(description, pathwayId) {
  Logger.log('✨ Interpreting custom logic description: ' + description);

  try {
    const analysis = getOrCreateHolisticAnalysis_();

    // Find the pathway
    let pathway = null;
    for (let i = 0; i < analysis.topPathways.length; i++) {
      if (analysis.topPathways[i].id === pathwayId) {
        pathway = analysis.topPathways[i];
        break;
      }
    }

    const prompt = 'Convert this user\'s logic type idea into a structured logic type definition:\\n\\n' +
      'User Input: "' + description + '"\\n\\n' +
      'Respond ONLY with valid JSON in this exact format:\\n' +
      '{\\n' +
      '  "id": "custom_[unique_slug_based_on_description]",\\n' +
      '  "name": "Clear Name for This Logic",\\n' +
      '  "icon": "📌",\\n' +
      '  "description": "Brief one-line description",\\n' +
      '  "explanation": "How this orders cases and why",\\n' +
      '  "targetAudience": "Who should use this",\\n' +
      '  "whenToUse": "When to use this approach",\\n' +
      '  "sortingCriteria": "Detailed sorting instructions"\\n' +
      '}';

    // Get OpenAI API key from Settings sheet cell B2
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName('Settings');
    let apiKey = '';

    if (settingsSheet) {
      apiKey = settingsSheet.getRange('B2').getValue();
      Logger.log('🔑 Retrieved API key from Settings!B2');
    }

    if (!apiKey) {
      // Create basic custom logic type without AI
      Logger.log('⚠️ No OpenAI API key found in Settings!B2, creating basic custom logic type');
      const slug = description.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 30);
      return {
        id: 'custom_' + slug + '_' + new Date().getTime(),
        name: description.substring(0, 50),
        icon: '✨',
        description: description,
        explanation: 'Custom ordering logic: ' + description,
        targetAudience: 'Custom use case',
        whenToUse: 'When ' + description.toLowerCase(),
        sortingCriteria: 'Cases ordered according to: ' + description
      };
    }

    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + apiKey
      },
      payload: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You convert user ideas into structured logic type definitions.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    const result = JSON.parse(response.getContentText());
    const aiResponse = result.choices[0].message.content;

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const customLogicType = JSON.parse(jsonMatch[0]);

    Logger.log('✅ Custom logic type created: ' + customLogicType.name);
    return customLogicType;

  } catch (error) {
    Logger.log('❌ Error interpreting custom logic: ' + error.toString());
    throw error;
  }
}

function applyDynamicLogicType(pathwayId, logicType) {
  Logger.log('🔄 Applying dynamic logic type: ' + logicType.name + ' to pathway: ' + pathwayId);

  // This function will use the sortingCriteria from the logic type
  // For now, we'll use complexity gradient as fallback, but you can extend this
  // to interpret the sorting Criteria using AI or custom rules

  return buildChainBuilderUI(pathwayId, 'complexity_gradient');
}

function saveCustomLogicType(logicType) {
  Logger.log('💾 Saving custom logic type: ' + logicType.name);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let customLogicSheet = ss.getSheetByName('Custom_Logic_Types');

    // Create sheet if it doesn't exist
    if (!customLogicSheet) {
      customLogicSheet = ss.insertSheet('Custom_Logic_Types');
      customLogicSheet.appendRow(['ID', 'Name', 'Icon', 'Description', 'Explanation', 'Target Audience', 'When To Use', 'Sorting Criteria', 'Created']);
    }

    // Add the custom logic type
    customLogicSheet.appendRow([
      logicType.id,
      logicType.name,
      logicType.icon,
      logicType.description,
      logicType.explanation,
      logicType.targetAudience,
      logicType.whenToUse,
      logicType.sortingCriteria || '',
      new Date().toISOString()
    ]);

    Logger.log('✅ Custom logic type saved to sheet');

  } catch (error) {
    Logger.log('❌ Error saving custom logic type: ' + error.toString());
    throw error;
  }
}

// ========== PHASE 2B: HORIZONTAL CHAIN BUILDER ==========

function buildChainBuilderUI(pathwayId, logicTypeId) {
  // Default to complexity_gradient if not specified
  if (!logicTypeId) {
    logicTypeId = 'complexity_gradient';
  }
  Logger.log('🎯 buildChainBuilderUI called with pathwayId: ' + pathwayId);

  try {
    const analysis = getOrCreateHolisticAnalysis_();
    Logger.log('📊 Got analysis with ' + analysis.topPathways.length + ' pathways');

    // Find the pathway from analysis
    let pathway = null;
    for (let i = 0; i < analysis.topPathways.length; i++) {
      Logger.log('  Checking pathway: ' + analysis.topPathways[i].id + ' (looking for: ' + pathwayId + ')');
      if (analysis.topPathways[i].id === pathwayId) {
        pathway = analysis.topPathways[i];
        Logger.log('  ✅ Found matching pathway: ' + pathway.name);
        break;
      }
    }

    if (!pathway) {
      Logger.log('❌ Pathway not found: ' + pathwayId);
      Logger.log('Available pathway IDs: ' + analysis.topPathways.map(function(p) { return p.id; }).join(', '));
      return '<html><body style="font-family: system-ui; padding: 40px; text-align: center;"><h2>Pathway not found</h2><p>ID: ' + pathwayId + '</p><p>Available IDs: ' + analysis.topPathways.map(function(p) { return p.id; }).join(', ') + '</p></body></html>';
    }

    Logger.log('🔨 Building initial chain with logic type: ' + logicTypeId);
    // Build initial chain with suggested cases using selected logic type
    const logicType = getLogicTypeById_(logicTypeId);
    const initialChain = buildInitialChain_(pathway, analysis.allCases, logicTypeId);
    Logger.log('✅ Built chain with ' + initialChain.length + ' positions');

    Logger.log('🎨 Building HTML...');
    const html = buildChainBuilderHTML_(pathway, initialChain, logicType);
    Logger.log('✅ HTML built, length: ' + html.length + ' chars');

    return html;
  } catch (e) {
    Logger.log('❌ Exception in buildChainBuilderUI: ' + e.message);
    Logger.log('Stack trace: ' + e.stack);
    return '<html><body style="font-family: system-ui; padding: 40px; text-align: center;"><h2 style="color: #ff4444;">Error</h2><p>' + e.message + '</p><pre style="text-align: left; background: #f5f5f5; padding: 20px; border-radius: 8px;">' + e.stack + '</pre></body></html>';
  }
}

function buildInitialChain_(pathway, allCases, logicTypeId) {
  // Get cases for this pathway
  const pathwayCases = [];
  for (let i = 0; i < allCases.length; i++) {
    for (let j = 0; j < pathway.suggestedCases.length; j++) {
      if (allCases[i].caseId === pathway.suggestedCases[j]) {
        pathwayCases.push(allCases[i]);
        break;
      }
    }
  }

  // Sort based on logic type
  sortByLogicType_(pathwayCases, logicTypeId || 'complexity_gradient');

  // Build chain: first 10 cases as positions, rest as alternatives
  const chain = [];
  const maxPositions = Math.min(10, pathwayCases.length);

  for (let i = 0; i < maxPositions; i++) {
    const caseData = pathwayCases[i];
    const position = {
      position: i + 1,
      primary: caseData,
      alternatives: [],
      rationale: generatePositionRationale_(i + 1, caseData, pathwayCases, pathway)
    };

    // Add 3 alternatives (or fewer if not enough cases)
    const alternativeStartIndex = maxPositions;
    for (let j = 0; j < 3 && (alternativeStartIndex + j) < pathwayCases.length; j++) {
      position.alternatives.push(pathwayCases[alternativeStartIndex + j]);
    }

    chain.push(position);
  }

  return chain;
}

function generatePositionRationale_(position, caseData, allCases, pathway) {
  const totalPositions = Math.min(10, allCases.length);
  const diagnosisLength = caseData.diagnosis.length;
  const sparkTitle = caseData.sparkTitle;

  // Position-based pedagogical reasoning
  if (position === 1) {
    return '🎯 Foundation: Clear presentation with straightforward diagnosis - builds confidence and establishes pattern recognition baseline';
  } else if (position === 2) {
    return '📚 Early Learning: Slightly more complex than opener - introduces key concepts while maintaining accessibility';
  } else if (position === 3) {
    return '🔄 Pattern Building: Familiar symptoms with subtle variation - reinforces recognition while adding nuance';
  } else if (position <= Math.ceil(totalPositions * 0.4)) {
    return '🧩 Skill Development: Moderate complexity - challenges learner to apply foundational knowledge in new contexts';
  } else if (position <= Math.ceil(totalPositions * 0.6)) {
    return '⚡ Critical Thinking: Intermediate difficulty - requires synthesis of multiple concepts and differential diagnosis';
  } else if (position <= Math.ceil(totalPositions * 0.8)) {
    return '🎓 Advanced Application: Complex presentation - tests mastery through atypical symptoms or comorbidities';
  } else if (position === totalPositions) {
    return '🏆 Mastery Challenge: Most complex case - demonstrates full competency through comprehensive clinical reasoning';
  } else {
    return '💡 Advanced Integration: High complexity - requires expert-level pattern recognition and multi-system thinking';
  }
}

function buildChainBuilderHTML_(pathway, chain, logicType) {
  // Build logic type dropdown options
  const allLogicTypes = getAllLogicTypes_();
  const logicTypeOptionsHTML = allLogicTypes.map(function(lt) {
    const selected = lt.id === logicType.id ? 'selected' : '';
    return '<option value="' + lt.id + '" ' + selected + '>' + lt.icon + ' ' + lt.name + '</option>';
  }).join('');

  const chainPositionsHTML = chain.map(function(pos) {
    const primaryHTML =
      '<div class="case-primary" data-case-id="' + pos.primary.caseId + '" data-position="' + pos.position + '" data-rationale="' + pos.rationale.replace(/"/g, '&quot;') + '">' +
      '  <div class="case-header">' +
      '    <span class="case-id">' + pos.primary.caseId + '</span>' +
      '    <span class="case-row">Row ' + pos.primary.row + '</span>' +
      '  </div>' +
      '  <div class="case-title">' + pos.primary.sparkTitle + '</div>' +
      '  <div class="case-diagnosis">Dx: ' + ((pos.primary.diagnosis || '').substring(0, 30) + ((pos.primary.diagnosis || '').length > 30 ? '...' : '')) + '</div>' +
      '  <div class="case-learning">Learning: ' + ((pos.primary.learningOutcomes || '').substring(0, 40) + ((pos.primary.learningOutcomes || '').length > 40 ? '...' : '')) + '</div>' +
      '  <div class="case-rationale">' + pos.rationale + '</div>' +
      '</div>';

    const alternativesHTML = pos.alternatives.map(function(alt) {
      return '<div class="case-alternative" data-case-id="' + alt.caseId + '" onclick="swapCase(' + pos.position + ', \'' + alt.caseId + '\')">' +
             '  <div class="alt-title">' + alt.sparkTitle.substring(0, 40) + (alt.sparkTitle.length > 40 ? '...' : '') + '</div>' +
             '  <div class="alt-id">' + alt.caseId + '</div>' +
             '</div>';
    }).join('');

    return '<div class="chain-position" data-position="' + pos.position + '">' +
           primaryHTML +
           '  <div class="case-alternatives">' +
           alternativesHTML +
           '  </div>' +
           '</div>';
  }).join('<div class="chain-arrow">→</div>');

  return '<!DOCTYPE html>' +
'<html>' +
'<head>' +
'  <base target="_top">' +
'  <style>' +
'    * { margin: 0; padding: 0; box-sizing: border-box; }' +
'' +
'    body {' +
'      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;' +
'      background: linear-gradient(135deg, #0f1115 0%, #1a1d26 100%);' +
'      color: #e7eaf0;' +
'      overflow-x: hidden;' +
'      height: 1000px;' +
'    }' +
'' +
'    .header {' +
'      background: linear-gradient(135deg, #1b1f2a 0%, #141824 100%);' +
'      padding: 20px 32px;' +
'      border-bottom: 2px solid #2a3040;' +
'      display: flex;' +
'      justify-content: space-between;' +
'      align-items: center;' +
'    }' +
'' +
'    .header-left {' +
'      display: flex;' +
'      align-items: center;' +
'      gap: 16px;' +
'    }' +
'' +
'    .btn-back {' +
'      background: #141824;' +
'      border: 1px solid #2a3040;' +
'      color: #e7eaf0;' +
'      padding: 10px 16px;' +
'      border-radius: 8px;' +
'      cursor: pointer;' +
'      font-size: 14px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .btn-back:hover {' +
'      background: #1b1f2a;' +
'      border-color: #3a4458;' +
'    }' +
'' +
'    .pathway-info h1 {' +
'      font-size: 24px;' +
'      font-weight: 700;' +
'      margin-bottom: 4px;' +
'    }' +
'' +
'    .pathway-info .meta {' +
'      font-size: 13px;' +
'      color: #8b92a0;' +
'    }' +
'' +
'    .header-right {' +
'      display: flex;' +
'      gap: 12px;' +
'    }' +
'' +
'    .btn-save {' +
'      background: linear-gradient(135deg, #2357ff 0%, #1a47d9 100%);' +
'      border: none;' +
'      color: #fff;' +
'      padding: 10px 20px;' +
'      border-radius: 8px;' +
'      cursor: pointer;' +
'      font-size: 14px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .btn-save:hover {' +
'      background: linear-gradient(135deg, #1a47d9 0%, #1538b8 100%);' +
'      transform: translateY(-1px);' +
'    }' +
'' +
'    /* Logic Type Selector */' +
'    .logic-type-bar {' +
'      background: #0f1115;' +
'      border-bottom: 1px solid #2a3040;' +
'      padding: 16px 32px;' +
'      display: flex;' +
'      gap: 20px;' +
'      align-items: flex-start;' +
'    }' +
'' +
'    .logic-type-selector {' +
'      display: flex;' +
'      flex-direction: column;' +
'      gap: 8px;' +
'      min-width: 320px;' +
'    }' +
'' +
'    .logic-type-label {' +
'      font-size: 12px;' +
'      font-weight: 600;' +
'      color: #8b92a0;' +
'      text-transform: uppercase;' +
'      letter-spacing: 0.5px;' +
'    }' +
'' +
'    .logic-type-dropdown {' +
'      background: #141824;' +
'      border: 1px solid #2a3040;' +
'      color: #e7eaf0;' +
'      padding: 10px 14px;' +
'      border-radius: 8px;' +
'      font-size: 14px;' +
'      font-weight: 600;' +
'      cursor: pointer;' +
'      transition: all 0.2s;' +
'      appearance: none;' +
'      background-image: url("data:image/svg+xml,%3Csvg width=\'12\' height=\'8\' viewBox=\'0 0 12 8\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1L6 6L11 1\' stroke=\'%238b92a0\' stroke-width=\'2\' stroke-linecap=\'round\'/%3E%3C/svg%3E");' +
'      background-repeat: no-repeat;' +
'      background-position: right 12px center;' +
'      padding-right: 36px;' +
'    }' +
'' +
'    .logic-type-dropdown:hover {' +
'      background: #1b1f2a;' +
'      border-color: #3a4458;' +
'    }' +
'' +
'    .logic-type-dropdown:focus {' +
'      outline: none;' +
'      border-color: #2357ff;' +
'      box-shadow: 0 0 0 3px rgba(35, 87, 255, 0.1);' +
'    }' +
'' +
'    .logic-type-explanation {' +
'      flex: 1;' +
'      background: linear-gradient(135deg, #1e2533 0%, #181d28 100%);' +
'      border: 1px solid #2a3040;' +
'      border-left: 3px solid #2357ff;' +
'      padding: 12px 16px;' +
'      border-radius: 8px;' +
'    }' +
'' +
'    .logic-type-explanation h4 {' +
'      font-size: 13px;' +
'      font-weight: 700;' +
'      color: #2357ff;' +
'      margin-bottom: 6px;' +
'    }' +
'' +
'    .logic-type-explanation p {' +
'      font-size: 12px;' +
'      color: #8b92a0;' +
'      line-height: 1.5;' +
'      margin: 0;' +
'    }' +
'' +
'    .logic-type-meta {' +
'      display: flex;' +
'      gap: 16px;' +
'      margin-top: 8px;' +
'      font-size: 11px;' +
'    }' +
'' +
'    .logic-type-meta span {' +
'      color: #6b7280;' +
'    }' +
'' +
'    .logic-type-meta .audience {' +
'      color: #2357ff;' +
'    }' +
'' +
'    /* AI Generator and Custom Input */' +
'    .logic-type-actions {' +
'      display: flex;' +
'      gap: 12px;' +
'      margin-top: 12px;' +
'      padding-top: 12px;' +
'      border-top: 1px solid #2a3040;' +
'    }' +
'' +
'    .btn-generate-logic {' +
'      background: linear-gradient(135deg, #10b981 0%, #059669 100%);' +
'      border: none;' +
'      color: #fff;' +
'      padding: 8px 16px;' +
'      border-radius: 6px;' +
'      cursor: pointer;' +
'      font-size: 12px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'      display: flex;' +
'      align-items: center;' +
'      gap: 6px;' +
'    }' +
'' +
'    .btn-generate-logic:hover {' +
'      background: linear-gradient(135deg, #059669 0%, #047857 100%);' +
'      transform: translateY(-1px);' +
'    }' +
'' +
'    .custom-logic-input {' +
'      flex: 1;' +
'      background: #141824;' +
'      border: 1px solid #2a3040;' +
'      color: #e7eaf0;' +
'      padding: 8px 12px;' +
'      border-radius: 6px;' +
'      font-size: 12px;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .custom-logic-input::placeholder {' +
'      color: #6b7280;' +
'      font-style: italic;' +
'    }' +
'' +
'    .custom-logic-input:focus {' +
'      outline: none;' +
'      border-color: #2357ff;' +
'      box-shadow: 0 0 0 3px rgba(35, 87, 255, 0.1);' +
'    }' +
'' +
'    .btn-apply-custom {' +
'      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);' +
'      border: none;' +
'      color: #fff;' +
'      padding: 8px 16px;' +
'      border-radius: 6px;' +
'      cursor: pointer;' +
'      font-size: 12px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .btn-apply-custom:hover {' +
'      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);' +
'      transform: translateY(-1px);' +
'    }' +
'' +
'    .btn-save-logic {' +
'      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);' +
'      border: none;' +
'      color: #fff;' +
'      padding: 8px 16px;' +
'      border-radius: 6px;' +
'      cursor: pointer;' +
'      font-size: 12px;' +
'      font-weight: 600;' +
'      transition: all 0.2s;' +
'    }' +
'' +
'    .btn-save-logic:hover {' +
'      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);' +
'      transform: translateY(-1px);' +
'    }' +
'' +
'    .chain-container {' +
'      display: flex;' +
'      flex-direction: row;' +
'      gap: 6px;' +
'      padding: 12px 4px;' +
'      overflow-x: auto;' +
'      overflow-y: hidden;' +
'      height: calc(1000px - 120px);' +
'      align-items: flex-start;' +
'    }' +
'' +
'    .chain-container::-webkit-scrollbar {' +
'      height: 10px;' +
'    }' +
'' +
'    .chain-container::-webkit-scrollbar-track {' +
'      background: #0f1115;' +
'    }' +
'' +
'    .chain-container::-webkit-scrollbar-thumb {' +
'      background: #2a3040;' +
'      border-radius: 5px;' +
'    }' +
'' +
'    .chain-position {' +
'      display: flex;' +
'      flex-direction: column;' +
'      align-items: center;' +
'      min-width: 140px;' +
'      flex-shrink: 0;' +
'    }' +
'' +
'    .case-primary {' +
'      width: 140px;' +
'      min-height: 90px;' +
'      background: linear-gradient(135deg, #1e2533 0%, #181d28 100%);' +
'      border: 2px solid #2357ff;' +
'      border-radius: 8px;' +
'      padding: 8px;' +
'      cursor: grab;' +
'      transition: all 0.3s ease;' +
'      box-shadow: 0 4px 16px rgba(35, 87, 255, 0.4);' +
'      opacity: 1.0;' +
'      transform: scale(1.0);' +
'      position: relative;' +
'      font-size: 11px;' +
'    }' +
'' +
'    .case-primary:active {' +
'      cursor: grabbing;' +
'      transform: scale(1.05);' +
'    }' +
'' +
'    .case-header {' +
'      display: flex;' +
'      justify-content: space-between;' +
'      align-items: center;' +
'      margin-bottom: 12px;' +
'    }' +
'' +
'    .case-id {' +
'      font-size: 12px;' +
'      font-weight: 700;' +
'      color: #2357ff;' +
'      background: #0f1115;' +
'      padding: 4px 10px;' +
'      border-radius: 6px;' +
'    }' +
'' +
'    .case-row {' +
'      font-size: 11px;' +
'      color: #8b92a0;' +
'    }' +
'' +
'    .case-title {' +
'      font-size: 14px;' +
'      font-weight: 600;' +
'      color: #e7eaf0;' +
'      margin-bottom: 8px;' +
'      line-height: 1.4;' +
'    }' +
'' +
'    .case-diagnosis {' +
'      font-size: 9px;' +
'      color: #ff9500;' +
'      margin-top: 2px;' +
'      font-weight: 600;' +
'    }' +
'' +
'    .case-learning {' +
'      font-size: 8px;' +
'      color: #00d4ff;' +
'      margin-top: 2px;' +
'      line-height: 1.2;' +
'    }' +
'' +
'    .case-rationale {' +
'      display: none;' +
'    }' +
'' +
'    .case-primary {' +
'      position: relative;' +
'    }' +
'' +
'    .case-primary:hover::after {' +
'      content: attr(data-rationale);' +
'      position: absolute;' +
'      bottom: 100%;' +
'      left: 50%;' +
'      transform: translateX(-50%);' +
'      background: rgba(35, 87, 255, 0.95);' +
'      color: #ffffff;' +
'      padding: 8px 12px;' +
'      border-radius: 6px;' +
'      font-size: 11px;' +
'      line-height: 1.3;' +
'      white-space: normal;' +
'      max-width: 280px;' +
'      width: max-content;' +
'      z-index: 1000;' +
'      margin-bottom: 8px;' +
'      box-shadow: 0 4px 12px rgba(0,0,0,0.3);' +
'      pointer-events: none;' +
'    }' +
'' +
'    .case-alternatives {' +
'      display: flex;' +
'      flex-direction: column;' +
'      gap: 8px;' +
'      margin-top: 16px;' +
'      width: 280px;' +
'    }' +
'' +
'    .case-alternative {' +
'      width: 100%;' +
'      min-height: 60px;' +
'      background: #0f1115;' +
'      border: 1px solid #2a3040;' +
'      border-radius: 8px;' +
'      padding: 10px 12px;' +
'      cursor: pointer;' +
'      transition: all 0.3s ease;' +
'      opacity: 0.5;' +
'      transform: scale(0.92);' +
'    }' +
'' +
'    .case-alternative:hover {' +
'      opacity: 0.85;' +
'      transform: scale(0.96);' +
'      border-color: #2357ff;' +
'      background: #141824;' +
'    }' +
'' +
'    .alt-title {' +
'      font-size: 13px;' +
'      color: #e7eaf0;' +
'      margin-bottom: 4px;' +
'      font-weight: 500;' +
'    }' +
'' +
'    .alt-id {' +
'      font-size: 11px;' +
'      color: #8b92a0;' +
'    }' +
'' +
'    .chain-arrow {' +
'      font-size: 32px;' +
'      color: #2357ff;' +
'      align-self: center;' +
'      margin-top: 60px;' +
'      flex-shrink: 0;' +
'    }' +
'' +
'    .btn-add-case {' +
'      width: 280px;' +
'      height: 180px;' +
'      background: #141824;' +
'      border: 2px dashed #2a3040;' +
'      border-radius: 12px;' +
'      display: flex;' +
'      flex-direction: column;' +
'      align-items: center;' +
'      justify-content: center;' +
'      cursor: pointer;' +
'      transition: all 0.3s;' +
'      flex-shrink: 0;' +
'      margin-top: 0;' +
'      align-self: flex-start;' +
'    }' +
'' +
'    .btn-add-case:hover {' +
'      background: #1b1f2a;' +
'      border-color: #2357ff;' +
'    }' +
'' +
'    .btn-add-case .icon {' +
'      font-size: 48px;' +
'      margin-bottom: 12px;' +
'      opacity: 0.5;' +
'    }' +
'' +
'    .btn-add-case .text {' +
'      font-size: 14px;' +
'      color: #8b92a0;' +
'      font-weight: 600;' +
'    }' +
'  </style>' +
'</head>' +
'<body>' +
'  <div class="header">' +
'    <div class="header-left">' +
'      <button class="btn-back" onclick="goBack()">← Back</button>' +
'      <div class="pathway-info">' +
'        <h1>' + pathway.icon + ' ' + pathway.name + '</h1>' +
'        <div class="meta">' + chain.length + ' cases in sequence • ' + pathway.logicType + ' pathway</div>' +
'      </div>' +
'    </div>' +
'    <div class="header-right">' +
'      <button class="btn-save" onclick="savePathway()">💾 Save Pathway</button>' +
'    </div>' +
'  </div>' +
'' +
'  <div class="logic-type-bar">' +
'    <div class="logic-type-selector">' +
'      <div class="logic-type-label">🧠 Intelligent Ordering Logic</div>' +
'      <select class="logic-type-dropdown" id="logicTypeSelector" onchange="changeLogicType()">' +
'        ' + logicTypeOptionsHTML +
'      </select>' +
'    </div>' +
'    <div class="logic-type-explanation" id="logicTypeExplanation">' +
'      <h4>' + logicType.icon + ' ' + logicType.name + '</h4>' +
'      <p>' + logicType.explanation + '</p>' +
'      <div class="logic-type-meta">' +
'        <span>👥 <span class="audience">' + logicType.targetAudience + '</span></span>' +
'        <span>• ' + logicType.whenToUse + '</span>' +
'      </div>' +
'      <div class="logic-type-actions">' +
'        <button class="btn-generate-logic" onclick="generateNewLogicType()">' +
'          <span>🤖</span>' +
'          <span>AI: Generate New Logic Type</span>' +
'        </button>' +
'        <input type="text" class="custom-logic-input" id="customLogicInput" ' +
'          placeholder="✨ Or describe your own logic type (e.g., \'Order by likelihood of misdiagnosis\')..." />' +
'        <button class="btn-apply-custom" onclick="applyCustomLogic()">Apply</button>' +
'        <button class="btn-save-logic" onclick="saveCurrentLogic()" title="Save this logic type for future use">' +
'          💾 Save' +
'        </button>' +
'      </div>' +
'    </div>' +
'  </div>' +
'' +
'  <div class="chain-container" id="chainContainer">' +
'    ' + chainPositionsHTML +
'    <div class="chain-arrow">→</div>' +
'    <button class="btn-add-case" onclick="addCase()">' +
'      <div class="icon">+</div>' +
'      <div class="text">Add Case</div>' +
'    </button>' +
'  </div>' +
'' +
'  <script>' +
'    let pathwayData = ' + JSON.stringify({id: pathway.id, name: pathway.name, chain: chain, logicType: logicType}) + ';' +
'    let allLogicTypes = ' + JSON.stringify(allLogicTypes) + ';' +
'' +
'    function changeLogicType() {' +
'      const newLogicTypeId = document.getElementById("logicTypeSelector").value;' +
'      console.log("🔄 Changing logic type to:", newLogicTypeId);' +
'      ' +
'      // Show loading state' +
'      document.getElementById("chainContainer").innerHTML = ' +
'        \'<div style="text-align:center; padding:100px; width:100%;"><h2>⚙️ Reordering chain...</h2><p style="color: #8b92a0;">Applying new logic type</p></div>\';' +
'      ' +
'      // Reload with new logic type' +
'      google.script.run' +
'        .withSuccessHandler(function(html) {' +
'          document.documentElement.innerHTML = html;' +
'        })' +
'        .withFailureHandler(function(error) {' +
'          alert("Error changing logic type: " + error.message);' +
'          location.reload();' +
'        })' +
'        .buildChainBuilderUI(\'' + pathway.id + '\', newLogicTypeId);' +
'    }' +
'' +
'    function generateNewLogicType() {' +
'      console.log("🤖 Generating new logic type using AI...");' +
'      ' +
'      // Show loading state' +
'      const btn = event.target.closest(".btn-generate-logic");' +
'      const originalHTML = btn.innerHTML;' +
'      btn.innerHTML = "<span>⏳</span><span>AI is analyzing cases...</span>";' +
'      btn.disabled = true;' +
'      ' +
'      // Call server-side ChatGPT integration' +
'      google.script.run' +
'        .withSuccessHandler(function(newLogicType) {' +
'          console.log("✅ AI generated new logic type:", newLogicType);' +
'          ' +
'          // Show preview dialog' +
'          const useIt = confirm(' +
'            "🤖 AI GENERATED NEW LOGIC TYPE\\n\\n" +' +
'            "Name: " + newLogicType.name + "\\n" +' +
'            "Icon: " + newLogicType.icon + "\\n\\n" +' +
'            "Description: " + newLogicType.description + "\\n\\n" +' +
'            "Explanation: " + newLogicType.explanation + "\\n\\n" +' +
'            "Target Audience: " + newLogicType.targetAudience + "\\n\\n" +' +
'            "Would you like to apply this logic type to your chain?"' +
'          );' +
'          ' +
'          btn.innerHTML = originalHTML;' +
'          btn.disabled = false;' +
'          ' +
'          if (useIt) {' +
'            // Add to temporary logic types and apply' +
'            allLogicTypes.push(newLogicType);' +
'            applyDynamicLogic(newLogicType);' +
'          }' +
'        })' +
'        .withFailureHandler(function(error) {' +
'          console.error("❌ AI logic generation failed:", error);' +
'          alert("Error generating logic type: " + error.message);' +
'          btn.innerHTML = originalHTML;' +
'          btn.disabled = false;' +
'        })' +
'        .generateLogicTypeWithAI(\'' + pathway.id + '\');' +
'    }' +
'' +
'    function applyCustomLogic() {' +
'      const customDescription = document.getElementById("customLogicInput").value.trim();' +
'      if (!customDescription) {' +
'        alert("Please describe your desired logic type first!");' +
'        return;' +
'      }' +
'      ' +
'      console.log("✨ Applying custom logic:", customDescription);' +
'      ' +
'      // Show loading' +
'      const btn = event.target;' +
'      btn.innerHTML = "⏳ Analyzing...";' +
'      btn.disabled = true;' +
'      ' +
'      // Have AI interpret the custom description and create logic type' +
'      google.script.run' +
'        .withSuccessHandler(function(customLogicType) {' +
'          console.log("✅ Custom logic type created:", customLogicType);' +
'          ' +
'          // Add to temporary logic types and apply' +
'          allLogicTypes.push(customLogicType);' +
'          applyDynamicLogic(customLogicType);' +
'          ' +
'          btn.innerHTML = "Apply";' +
'          btn.disabled = false;' +
'          document.getElementById("customLogicInput").value = "";' +
'        })' +
'        .withFailureHandler(function(error) {' +
'          alert("Error creating custom logic: " + error.message);' +
'          btn.innerHTML = "Apply";' +
'          btn.disabled = false;' +
'        })' +
'        .interpretCustomLogicDescription(customDescription, \'' + pathway.id + '\');' +
'    }' +
'' +
'    function applyDynamicLogic(logicType) {' +
'      console.log("🔄 Applying dynamic logic type:", logicType.id);' +
'      ' +
'      // Show loading state' +
'      document.getElementById("chainContainer").innerHTML = ' +
'        \'<div style="text-align:center; padding:100px; width:100%;"><h2>⚙️ Reordering with custom logic...</h2><p style="color: #8b92a0;">Applying: \' + logicType.name + \'</p></div>\';' +
'      ' +
'      // Apply the dynamic logic type' +
'      google.script.run' +
'        .withSuccessHandler(function(html) {' +
'          document.documentElement.innerHTML = html;' +
'        })' +
'        .withFailureHandler(function(error) {' +
'          alert("Error applying dynamic logic: " + error.message);' +
'          location.reload();' +
'        })' +
'        .applyDynamicLogicType(\'' + pathway.id + '\', logicType);' +
'    }' +
'' +
'    function saveCurrentLogic() {' +
'      const currentLogicTypeId = document.getElementById("logicTypeSelector").value;' +
'      const currentLogic = allLogicTypes.find(function(lt) { return lt.id === currentLogicTypeId; });' +
'      ' +
'      if (!currentLogic) {' +
'        alert("No logic type selected!");' +
'        return;' +
'      }' +
'      ' +
'      // Check if it\'s a custom/dynamic logic type (not in the original 12)' +
'      const isCustom = currentLogic.id.startsWith("custom_") || currentLogic.id.startsWith("ai_");' +
'      ' +
'      if (!isCustom) {' +
'        alert("This is a built-in logic type - already saved!");' +
'        return;' +
'      }' +
'      ' +
'      const logicName = prompt("Save this logic type as:", currentLogic.name);' +
'      if (!logicName) return;' +
'      ' +
'      console.log("💾 Saving custom logic type:", logicName);' +
'      ' +
'      google.script.run' +
'        .withSuccessHandler(function() {' +
'          alert("✅ Logic type \\"" + logicName + "\\" saved successfully!\\n\\nIt will now appear in the dropdown for all future sessions.");' +
'        })' +
'        .withFailureHandler(function(error) {' +
'          alert("Error saving logic type: " + error.message);' +
'        })' +
'        .saveCustomLogicType(Object.assign({}, currentLogic, { name: logicName }));' +
'    }' +
'' +
'    function goBack() {' +
'      google.script.host.close();' +
'      google.script.run.runPathwayChainBuilder();' +
'    }' +
'' +
'    function swapCase(position, newCaseId) {' +
'      console.log("Swapping position " + position + " with case " + newCaseId);' +
'      ' +
'      // Find current primary and alternative' +
'      const positionData = pathwayData.chain[position - 1];' +
'      const currentPrimary = positionData.primary;' +
'      ' +
'      // Find the alternative being clicked' +
'      let clickedAlt = null;' +
'      let altIndex = -1;' +
'      for (let i = 0; i < positionData.alternatives.length; i++) {' +
'        if (positionData.alternatives[i].caseId === newCaseId) {' +
'          clickedAlt = positionData.alternatives[i];' +
'          altIndex = i;' +
'          break;' +
'        }' +
'      }' +
'      ' +
'      if (!clickedAlt) return;' +
'      ' +
'      // Swap' +
'      pathwayData.chain[position - 1].primary = clickedAlt;' +
'      pathwayData.chain[position - 1].alternatives[altIndex] = currentPrimary;' +
'      ' +
'      // Re-render (for now, just reload)' +
'      alert("Swapped! Full re-render coming in Phase 2C...");' +
'    }' +
'' +
'    function savePathway() {' +
'      alert("Save functionality coming in Phase 2F (Persistence)!");' +
'    }' +
'' +
'    function addCase() {' +
'      alert("Add case functionality coming in Phase 2C!");' +
'    }' +
'  </script>' +
'</body>' +
'</html>';
}

// ========== AI PATHWAY DISCOVERY SYSTEM (DUAL MODE) ==========

/**
 * Generate AI-discovered pathways with two creativity levels
 * creativityMode: 'standard' or 'radical'
 */
function discoverNovelPathwaysWithAI_(creativityMode) {
  // Refresh headers before analysis
  refreshHeaders();
  
  creativityMode = creativityMode || 'standard';

  // Get API key from Settings sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Settings');
  let apiKey = '';

  if (settingsSheet) {
    apiKey = settingsSheet.getRange('B2').getValue();
    Logger.log('API key retrieved for ' + creativityMode + ' mode pathway discovery');
  }

  if (!apiKey) {
    return {
      success: false,
      error: 'No OpenAI API key found in Settings!B2',
      pathways: []
    };
  }

  const analysis = analyzeCatalogWithMultiLayerCache_();
  const cases = analysis.allCases;

  const caseSummaries = cases.map(function(c) {
    return {
      id: c.caseId,
      title: c.sparkTitle,
      diagnosis: c.diagnosis || 'Not specified',
      learning: (c.learningOutcomes || 'Not specified').substring(0, 100),
      category: c.category
    };
  });

  let temperature = creativityMode === 'radical' ? 1.0 : 0.7;
  let prompt = creativityMode === 'radical'
    ? 'You are Dr. Zara Blackwood, a visionary medical educator. Create pathway groupings so creative they border on experimental. RADICAL CONCEPTS: The Gambler\'s Fallacy, Method Actor\'s Toolkit, Butterfly Effect, Jazz Improvisation. Requirements: Novelty 8-10/10, psychological/cognitive science backing. ANALYZE ' + cases.length + ' CASES. INVENT 5-8 RADICALLY CREATIVE PATHWAYS with pathway_name, pathway_icon, grouping_logic_type, why_this_matters, learning_outcomes, best_for, unique_value, case_ids (min 3), novelty_score (8-10), estimated_learning_time, difficulty_curve, scientific_rationale. Return ONLY valid JSON array.'
    : 'You are Dr. Maria Rodriguez, award-winning medical educator. Create novel pathways beyond traditional categories. FORBIDDEN: Body systems, simple age/acuity. ENCOURAGED: Cognitive biases, emotional journeys, narrative arcs, skill scaffolding, pattern interrupts. EXAMPLES: The Imposter Syndrome Destroyer, The Puzzle Master Series, The 90-Second Saves. ANALYZE ' + cases.length + ' CASES. INVENT 5-8 PATHWAYS with pathway_name, pathway_icon, grouping_logic_type, why_this_matters, learning_outcomes, best_for, unique_value, case_ids (min 3), novelty_score (7+), estimated_learning_time, difficulty_curve. Return ONLY valid JSON array.';

  try {
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: creativityMode === 'radical'
              ? 'You are an experimental medical educator applying cognitive science to education.'
              : 'You are an expert medical educator specializing in innovative curriculum design.'
          },
          {
            role: 'user',
            content: prompt + '\n\nCASES:\n' + JSON.stringify(caseSummaries, null, 2)
          }
        ],
        temperature: temperature,
        max_tokens: 2500
      }),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      return { success: false, error: 'OpenAI API error: ' + responseCode, pathways: [] };
    }

    const data = JSON.parse(response.getContentText());
    const aiResponse = data.choices[0].message.content;

    let pathways = [];
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    pathways = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiResponse);

    const formattedPathways = pathways.map(function(pw, index) {
      return {
        id: 'ai_' + creativityMode + '_' + (index + 1),
        name: pw.pathway_name || 'Unnamed Pathway',
        logicType: pw.grouping_logic_type || 'ai_discovered',
        icon: pw.pathway_icon || '🤖',
        confidence: (pw.novelty_score || 5) / 10,
        caseCount: (pw.case_ids || []).length,
        pitch: pw.why_this_matters || '',
        learningOutcomes: pw.learning_outcomes || [],
        bestFor: pw.best_for || '',
        uniqueValue: pw.unique_value || '',
        noveltyScore: pw.novelty_score || 5,
        estimatedTime: pw.estimated_learning_time || 'Not specified',
        difficultyCurve: pw.difficulty_curve || 'Unknown',
        scientificRationale: pw.scientific_rationale || '',
        creativityMode: creativityMode,
        suggestedCases: pw.case_ids || []
      };
    });

    return { success: true, pathways: formattedPathways };
  } catch (e) {
    return { success: false, error: e.message, pathways: [] };
  }
}

/**
 * Show AI-discovered pathways
 */
function showAIDiscoveredPathways(creativityMode) {
  creativityMode = creativityMode || 'standard';
  const result = discoverNovelPathwaysWithAI_(creativityMode);

  if (!result.success) {
    SpreadsheetApp.getUi().alert('AI Pathway Discovery Failed', result.error, SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  const modeLabel = creativityMode === 'radical' ? '🔥 RADICAL EXPERIMENTAL' : '🤖 CREATIVE';
  const modeColor = creativityMode === 'radical' ? '#ff6b00' : '#2357ff';

  let html = '<style>body{font-family:Arial;background:#0a0b0e;color:#fff;padding:24px;margin:0}.header{text-align:center;margin-bottom:32px}.header h1{font-size:28px;background:linear-gradient(135deg,' + modeColor + ',#00d4ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.pathway-card{background:linear-gradient(135deg,#1a1f2e,#141824);border:2px solid transparent;border-radius:16px;padding:24px;margin-bottom:24px;position:relative;overflow:hidden;transition:all .3s}.pathway-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(' + (creativityMode === 'radical' ? '255,107,0' : '35,87,255') + ',.3)}.pathway-icon{font-size:42px}.pathway-name{font-size:22px;font-weight:700}.pitch-title{font-size:13px;font-weight:600;color:#ff9500;text-transform:uppercase;margin:12px 0 8px}.pitch-text{font-size:15px;line-height:1.7;color:#e0e0e0}.stars{color:#ffd700;margin-left:8px}.create-btn{background:linear-gradient(135deg,' + modeColor + ',' + (creativityMode === 'radical' ? '#cc5500' : '#1a47cc') + ');color:#fff;border:none;padding:12px 20px;border-radius:8px;cursor:pointer;font-size:15px;font-weight:600;margin-top:16px}</style>';

  html += '<div class="header"><h1>' + modeLabel + ' AI-Discovered Pathways</h1><p>' +
    (creativityMode === 'radical' ? 'Experimental groupings pushing educational boundaries' : 'Creative pathways for maximum learning impact') +
    '</p></div>';

  result.pathways.forEach(function(pw) {
    const stars = '⭐'.repeat(Math.min(5, Math.round(pw.noveltyScore / 2)));
    html += '<div class="pathway-card">';
    html += '<div class="pathway-icon">' + pw.icon + '</div>';
    html += '<div class="pathway-name">' + pw.name + '<span class="stars">' + stars + '</span></div>';
    html += '<div class="pitch-title">🎯 Why This Matters</div>';
    html += '<div class="pitch-text">' + pw.pitch + '</div>';
    html += '<button class="create-btn" onclick="alert(\'Coming soon!\')">🚀 Build This Pathway Now</button>';
    html += '</div>';
  });

  const htmlOutput = HtmlService.createHtmlOutput(html).setWidth(800).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, modeLabel + ' AI-Discovered Pathways');
}

function showAIPathwaysStandard() {
  showAIDiscoveredPathways('standard');
}

function showAIPathwaysRadical() {
  showAIDiscoveredPathways('radical');
}
/**
 * AI PATHWAY DISCOVERY - STREAMING LOGS (No Background Execution)
 * Uses server-side logging with client polling
 */

// Global log storage
var AI_DISCOVERY_LOGS = [];

/**
 * Main entry point - shows log window and triggers discovery
 */
function showAIPathwaysStandardWithLogs() {
  showAIDiscoveryWithStreamingLogs_('standard');
}

function showAIPathwaysRadicalWithLogs() {
  showAIDiscoveryWithStreamingLogs_('radical');
}

/**
 * PRE-CACHE RICH DATA WITH LIVE PROGRESS
 * Shows live progress window as it caches all 210+ cases with 23 fields each
 */

/**
 * Backend function to perform caching with progress updates
 */

/**
 * Get cache status for UI indicator
 * Returns: { status: 'valid'|'stale'|'missing', hoursOld, expiresIn, cases }
 */

/**
 * Show live log window that polls for updates
 */

/**
 * Start AI discovery (called from client)
 */

/**
 * Get current status (called by polling)
 */

/**
 * Analyze case catalog - SMART CACHING VERSION
 *
 * Three-tier strategy for maximum reliability + rich data:
 * 1. CACHE HIT (instant): Use cached holistic analysis if < 24 hours old
 * 2. FRESH ANALYSIS (slow but rich): Try performHolisticAnalysis_() with 4min timeout
 * 3. LIGHTWEIGHT FALLBACK (fast but basic): Direct sheet read if timeout
 *
 * This preserves all rich clinical context (demographics, vitals, exam findings, etc.)
 */
function analyzeCatalogWithMultiLayerCache_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

    let cacheSheet = ss.getSheetByName('Pathway_Analysis_Cache');

  if (cacheSheet) {
    const data = cacheSheet.getDataRange().getValues();
    if (data.length > 1) {
      const cachedTimestamp = new Date(data[1][0]);
      const now = new Date();
      const hoursDiff = (now - cachedTimestamp) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        // Cache hit! Return full rich data instantly
        Logger.log('✅ Using cached holistic analysis (' + hoursDiff.toFixed(1) + ' hours old)');
        return JSON.parse(data[1][1]);
      }
    }
  }

    Logger.log('📊 Cache miss or stale - attempting fresh holistic analysis');
  const startTime = new Date().getTime();
  const MAX_TIME = 4 * 60 * 1000; // 4 minutes (leave 2min buffer for 6min timeout)

  try {
    const analysis = performHolisticAnalysis_();
    const elapsed = new Date().getTime() - startTime;

    Logger.log('✅ Fresh analysis completed in ' + (elapsed / 1000).toFixed(1) + 's');

    if (elapsed < MAX_TIME) {
      return analysis; // Success! Got all the rich data + auto-cached for next time
    } else {
      Logger.log('⚠️  Analysis took too long, falling back to lightweight mode');
    }
  } catch (e) {
    Logger.log('⚠️  Error in performHolisticAnalysis_(): ' + e.message);
  }

    Logger.log('📉 Using lightweight analysis fallback');
  const sheet = ss.getSheets().find(function(sh) {
    return /master scenario csv/i.test(sh.getName());
  }) || ss.getActiveSheet();

  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  // Dynamic column resolution for catalog analysis
  const columnIndices = resolveColumnIndices_({
    caseId: { name: 'Case_Organization_Case_ID', fallback: 0 },
    sparkTitle: { name: 'Case_Organization_Spark_Title', fallback: 1 },
    pathway: { name: 'Case_Organization_Pathway_or_Course_Name', fallback: 5 },
    category: { name: 'Case_Organization_Category', fallback: 4 },
    diagnosis: { name: 'Case_Orientation_Chief_Diagnosis', fallback: 44 },
    learningOutcomes: { name: 'Case_Orientation_Actual_Learning_Outcomes', fallback: 45 }
  });

  const caseIdIdx = columnIndices.caseId;
  const sparkIdx = columnIndices.sparkTitle;
  const diagnosisIdx = columnIndices.diagnosis;
  const learningIdx = columnIndices.learningOutcomes;
  const categoryIdx = columnIndices.category;
  const pathwayIdx = columnIndices.pathway;

  const allCases = [];
  for (let i = 2; i < data.length; i++) {
    allCases.push({
      caseId: data[i][caseIdIdx] || '',
      sparkTitle: data[i][sparkIdx] || '',
      diagnosis: data[i][diagnosisIdx] || '',
      learningOutcomes: data[i][learningIdx] || '',
      category: data[i][categoryIdx] || '',
      pathway: data[i][pathwayIdx] || ''
    });
  }

  return { allCases: allCases };
}

/**
 * Helper: Extract vital value from vitals JSON string
 */

/**
 * Synchronous discovery with logging
 */

/**
 * Show results (called after discovery completes)
 */


/**
 * Multi-Step Cache Enrichment System for AI Pathway Discovery
 *
 * Architecture: 7 independent cache layers that can be enriched progressively
 * Each layer caches a subset of the 26 required fields for AI discovery
 * Layers combine during AI discovery via merger logic
 *
 * Benefits:
 * - No execution timeouts (each layer completes quickly)
 * - Progressive enhancement (AI quality improves as layers cache)
 * - Independent scheduling (cache different layers at different times)
 * - Graceful degradation (works even if some layers missing)
 */

// ============================================================================
// LAYER DEFINITIONS
// ============================================================================

/**
 * Returns field mapping configuration for all 7 cache layers
 */
function getCacheLayerDefinitions_() {
  return {
    basic: {
      sheetName: 'Pathway_Analysis_Cache_Basic',
      fields: {
        caseId: 0,  // Case_Organization_Case_ID
        sparkTitle: 1,  // Case_Organization_Spark_Title
        pathway: 5  // Case_Organization_Pathway_or_Course_Name
      },
      priority: 1,
      estimatedTime: '<1s'
    },

    learning: {
      sheetName: 'Pathway_Analysis_Cache_Learning',
      fields: {
        preSimOverview: 9,  // Case_Organization_Pre_Sim_Overview
        postSimOverview: 10,  // Case_Organization_Post_Sim_Overview
        learningOutcomes: 191,  // CME_and_Educational_Content_CME_Learning_Objective
        learningObjectives: 34  // Set_the_Stage_Context_Educational_Goal
      },
      priority: 2,
      estimatedTime: '~30s',
      truncate: {
        preSimOverview: 300,
        postSimOverview: 300
      }
    },

    metadata: {
      sheetName: 'Pathway_Analysis_Cache_Metadata',
      fields: {
        category: 11,  // Case_Organization_Medical_Category
        difficulty: 6,  // Case_Organization_Difficulty_Level
        setting: 38,  // Set_the_Stage_Context_Environment_Type
        chiefComplaint: 66  // Patient_Demographics_and_Clinical_Data_Presenting_Complaint
      },
      priority: 3,
      estimatedTime: '~5s'
    },

    demographics: {
      sheetName: 'Pathway_Analysis_Cache_Demographics',
      fields: {
        age: 62,  // Patient_Demographics_and_Clinical_Data_Age
        gender: 63,  // Patient_Demographics_and_Clinical_Data_Gender
        patientName: 61  // Patient_Demographics_and_Clinical_Data_Patient_Name
      },
      priority: 4,
      estimatedTime: '~3s'
    },

    vitals: {
      sheetName: 'Pathway_Analysis_Cache_Vitals',
      fields: {
        initialVitals: 55  // Monitor_Vital_Signs_Initial_Vitals (JSON)
      },
      priority: 5,
      estimatedTime: '~15s',
      parseJSON: ['initialVitals'],
      extractFromJSON: {
        initialVitals: ['hr', 'bp.sys', 'bp.dia', 'rr', 'spo2']
      }
    },

    clinical: {
      sheetName: 'Pathway_Analysis_Cache_Clinical',
      fields: {
        examFindings: 73,  // Patient_Demographics_and_Clinical_Data_Exam_Positive_Findings
        medications: 68,  // Patient_Demographics_and_Clinical_Data_Current_Medications
        pastMedicalHistory: 67,  // Patient_Demographics_and_Clinical_Data_Past_Medical_History
        allergies: 69  // Patient_Demographics_and_Clinical_Data_Allergies
      },
      priority: 6,
      estimatedTime: '~10s',
      truncate: {
        examFindings: 200,
        medications: 150,
        pastMedicalHistory: 200
      }
    },

    environment: {
      sheetName: 'Pathway_Analysis_Cache_Environment',
      fields: {
        environmentType: 38,  // Set_the_Stage_Context_Environment_Type
        dispositionPlan: 48,  // Situation_and_Environment_Details_Disposition_Plan
        context: 36  // Set_the_Stage_Context_Clinical_Vignette
      },
      priority: 7,
      estimatedTime: '~8s',
      truncate: {
        context: 300
      }
    }
  };
}


// ============================================================================
// DYNAMIC HEADER RESOLUTION
// ============================================================================

/**
 * Get column index by Tier2 header name with fallback to static index
 * Uses CACHED_HEADER2 document property for dynamic column resolution
 *
 * @param {string} tier2Name - The Tier2 header name to search for
 * @param {number} fallbackIndex - Static index to use if header not found
 * @returns {number} Column index
 */

// ============================================================================
// CORE ENRICHMENT ENGINE
// ============================================================================

/**
 * Enrich a single cache layer with field data
 *
 * @param {string} layerKey - Key from getCacheLayerDefinitions_() (e.g., 'learning')
 * @returns {Object} Result object with success status and metadata
 */
function enrichCacheLayer_(layerKey) {
  const layerDef = getCacheLayerDefinitions_()[layerKey];

  if (!layerDef) {
    throw new Error(`Unknown cache layer: ${layerKey}`);
  }

  Logger.log(`🗄️  [LAYER ${layerDef.priority}/${Object.keys(getCacheLayerDefinitions_()).length}] Enriching ${layerKey} cache...`);
  Logger.log(`   Sheet: ${layerDef.sheetName}`);
  Logger.log(`   Fields: ${Object.keys(layerDef.fields).length}`);
  Logger.log(`   Estimated time: ${layerDef.estimatedTime}`);

  const startTime = new Date().getTime();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Find master sheet
  const masterSheet = ss.getSheets().find(function(sh) {
    return /master.*scenario.*convert/i.test(sh.properties.title);
  });

  if (!masterSheet) {
    throw new Error('Master Scenario Convert sheet not found');
  }

  Logger.log(`   Reading data from: ${masterSheet.getName()}`);
  const data = masterSheet.getDataRange().getValues();
  const tier2Headers = data[1];

  // Validate field mappings with dynamic header resolution
  const validatedIndices = {};
  Object.keys(layerDef.fields).forEach(function(fieldName) {
    const fallbackIndex = layerDef.fields[fieldName];

    // Resolve column index dynamically from refreshed headers
    let columnIndex;

    if (typeof fallbackIndex === 'number' && fallbackIndex >= 0) {
      // Get the actual tier2 header name for this column
      const tier2Name = tier2Headers[fallbackIndex];

      if (tier2Name) {
        // Use dynamic resolution with fallback
        columnIndex = getColumnIndexByHeader_(tier2Name, fallbackIndex);

        if (columnIndex !== fallbackIndex) {
          Logger.log(`   🔄 Field ${fieldName}: Column moved from ${fallbackIndex} to ${columnIndex} (${tier2Name})`);
        }
      } else {
        columnIndex = fallbackIndex;
      }
    } else {
      Logger.log(`   ⚠️  Invalid column index for field ${fieldName}: ${fallbackIndex}`);
      return;
    }

    if (typeof columnIndex !== 'number' || columnIndex < 0) {
      Logger.log(`   ⚠️  Could not resolve column for field ${fieldName}`);
      return;
    }

    if (columnIndex >= tier2Headers.length) {
      Logger.log(`   ⚠️  Field ${fieldName} index ${columnIndex} out of range (max: ${tier2Headers.length - 1})`);
    } else {
      validatedIndices[fieldName] = columnIndex;
      Logger.log(`   ✅ ${fieldName} → Column ${columnIndex} (${tier2Headers[columnIndex]})`);
    }
  });

  // Extract field data for all cases
  const enrichedCases = [];
  const caseIdIndex = 0;  // Case_Organization_Case_ID always at index 0

  for (let i = 2; i < data.length; i++) {
    const caseId = data[i][caseIdIndex];
    if (!caseId) continue;  // Skip rows without case ID

    const caseData = { caseId: caseId, row: i + 1 };

    Object.keys(validatedIndices).forEach(function(fieldName) {
      const columnIndex = validatedIndices[fieldName];
      let value = data[i][columnIndex] || '';

      // Apply truncation if specified
      if (layerDef.truncate && layerDef.truncate[fieldName]) {
        const maxLength = layerDef.truncate[fieldName];
        if (value.length > maxLength) {
          value = value.substring(0, maxLength);
        }
      }

      // Parse JSON if specified
      if (layerDef.parseJSON && layerDef.parseJSON.indexOf(fieldName) !== -1) {
        try {
          const parsed = JSON.parse(value);

          // Extract nested fields if specified
          if (layerDef.extractFromJSON && layerDef.extractFromJSON[fieldName]) {
            const extractFields = layerDef.extractFromJSON[fieldName];
            extractFields.forEach(function(extractPath) {
              const parts = extractPath.split('.');
              let extractedValue = parsed;

              for (let p = 0; p < parts.length; p++) {
                extractedValue = extractedValue[parts[p]];
                if (extractedValue === undefined) break;
              }

              const extractFieldName = 'initial' + extractPath.charAt(0).toUpperCase() + extractPath.slice(1).replace('.', '');
              caseData[extractFieldName] = extractedValue || '';
            });
          } else {
            caseData[fieldName] = parsed;
          }
        } catch (e) {
          Logger.log(`   ⚠️  Failed to parse JSON for ${fieldName} in case ${caseId}: ${e.message}`);
          caseData[fieldName] = value;  // Store raw value as fallback
        }
      } else {
        caseData[fieldName] = value;
      }
    });

    enrichedCases.push(caseData);
  }

  Logger.log(`   ✅ Enriched ${enrichedCases.length} cases`);

  // Create or update cache sheet
  let cacheSheet = ss.getSheetByName(layerDef.sheetName);

  if (!cacheSheet) {
    Logger.log(`   📄 Creating new cache sheet: ${layerDef.sheetName}`);
    cacheSheet = ss.insertSheet(layerDef.sheetName);
    cacheSheet.setHiddenGridlines(true);
  } else {
    Logger.log(`   📄 Updating existing cache sheet: ${layerDef.sheetName}`);
    cacheSheet.clear();
  }

  // Write cache data: [timestamp, jsonData]
  const cacheData = {
    timestamp: new Date().toISOString(),
    layerKey: layerKey,
    totalCases: enrichedCases.length,
    fields: Object.keys(layerDef.fields),
    allCases: enrichedCases
  };

  cacheSheet.getRange(1, 1).setValue('Timestamp');
  cacheSheet.getRange(1, 2).setValue('Cache Data (JSON)');
  cacheSheet.getRange(2, 1).setValue(new Date());
  cacheSheet.getRange(2, 2).setValue(JSON.stringify(cacheData));

  // Format sheet
  cacheSheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  cacheSheet.autoResizeColumns(1, 2);

  const elapsed = new Date().getTime() - startTime;
  Logger.log(`   ⏱️  Completed in ${(elapsed / 1000).toFixed(1)}s`);

  return {
    success: true,
    layerKey: layerKey,
    sheetName: layerDef.sheetName,
    casesEnriched: enrichedCases.length,
    fieldsEnriched: Object.keys(layerDef.fields).length,
    elapsedMs: elapsed
  };
}

/**
 * Enrich all cache layers sequentially
 *
 * @returns {Object} Summary of enrichment results
 */
function enrichAllCacheLayers() {
  const startTime = new Date().getTime();

  // Refresh headers before enrichment (ensures up-to-date column mappings)
  Logger.log('\n🔄 REFRESHING HEADERS\n');
  try {
    if (typeof refreshHeaders === 'function') {
      refreshHeaders();
      Logger.log('✅ Headers refreshed successfully\n');
    } else {
      Logger.log('⚠️  refreshHeaders() function not found, skipping\n');
    }
  } catch (e) {
    Logger.log(`⚠️  Could not refresh headers: ${e.message}\n`);
  }

  const layers = getCacheLayerDefinitions_();
  const results = [];

  Logger.log('\n🚀 STARTING MULTI-LAYER CACHE ENRICHMENT\n');
  Logger.log('═══════════════════════════════════════════════════════════════\n');

  // Sort layers by priority
  const layerKeys = Object.keys(layers).sort(function(a, b) {
    return layers[a].priority - layers[b].priority;
  });

  layerKeys.forEach(function(layerKey) {
    try {
      const result = enrichCacheLayer_(layerKey);
      results.push(result);
      Logger.log('');
    } catch (e) {
      Logger.log(`   ❌ Error enriching ${layerKey}: ${e.message}\n`);
      results.push({
        success: false,
        layerKey: layerKey,
        error: e.message
      });
    }
  });

  const totalElapsed = new Date().getTime() - startTime;
  const successCount = results.filter(function(r) { return r.success; }).length;

  Logger.log('═══════════════════════════════════════════════════════════════');
  Logger.log(`✅ ENRICHMENT COMPLETE: ${successCount}/${results.length} layers successful`);
  Logger.log(`⏱️  Total time: ${(totalElapsed / 1000).toFixed(1)}s\n`);

  return {
    success: successCount === results.length,
    totalLayers: results.length,
    successfulLayers: successCount,
    totalElapsedMs: totalElapsed,
    results: results
  };
}

// ============================================================================
// CACHE READER & MERGER
// ============================================================================

/**
 * Read a single cache layer
 *
 * @param {string} sheetName - Name of cache sheet
 * @returns {Object|null} Cached data or null if not found/stale
 */
function readCacheLayer_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cacheSheet = ss.getSheetByName(sheetName);

  if (!cacheSheet) {
    return null;
  }

  try {
    const data = cacheSheet.getDataRange().getValues();

    if (data.length < 2) {
      return null;
    }

    const cachedTimestamp = new Date(data[1][0]);
    const now = new Date();
    const hoursDiff = (now - cachedTimestamp) / (1000 * 60 * 60);

    // 24-hour expiry
    if (hoursDiff >= 24) {
      Logger.log(`⚠️  Cache layer ${sheetName} is stale (${hoursDiff.toFixed(1)}h old)`);
      return null;
    }

    const jsonData = data[1][1];
    const parsed = JSON.parse(jsonData);

    Logger.log(`✅ Cache layer ${sheetName} is fresh (${hoursDiff.toFixed(1)}h old, ${parsed.allCases.length} cases)`);

    return parsed;
  } catch (e) {
    Logger.log(`❌ Error reading cache layer ${sheetName}: ${e.message}`);
    return null;
  }
}

/**
 * Merge all available cache layers into single enriched dataset
 *
 * @returns {Object} Merged cache data with all available fields
 */
function mergeAllCacheLayers_() {
  Logger.log('\n🔀 MERGING CACHE LAYERS\n');
  Logger.log('═══════════════════════════════════════════════════════════════\n');

  const layers = getCacheLayerDefinitions_();
  const mergedByCase = {};

  // Sort layers by priority
  const layerKeys = Object.keys(layers).sort(function(a, b) {
    return layers[a].priority - layers[b].priority;
  });

  let totalLayersFound = 0;
  let totalFieldsAvailable = 0;

  layerKeys.forEach(function(layerKey) {
    const layerDef = layers[layerKey];
    const cacheData = readCacheLayer_(layerDef.sheetName);

    if (cacheData && cacheData.allCases) {
      totalLayersFound++;
      Logger.log(`📦 Layer ${layerDef.priority}: ${layerKey} (${cacheData.allCases.length} cases, ${Object.keys(layerDef.fields).length} fields)`);

      cacheData.allCases.forEach(function(caseData) {
        if (!mergedByCase[caseData.caseId]) {
          mergedByCase[caseData.caseId] = {};
        }

        // Merge fields (later layers override earlier ones if conflict)
        Object.keys(caseData).forEach(function(key) {
          mergedByCase[caseData.caseId][key] = caseData[key];
        });
      });

      totalFieldsAvailable += Object.keys(layerDef.fields).length;
    } else {
      Logger.log(`⏭️  Layer ${layerDef.priority}: ${layerKey} - not cached or stale`);
    }
  });

  const mergedCases = Object.values(mergedByCase);
  const fieldsPerCase = mergedCases.length > 0 ? Object.keys(mergedCases[0]).length : 0;

  Logger.log('\n═══════════════════════════════════════════════════════════════');
  Logger.log(`✅ MERGE COMPLETE:`);
  Logger.log(`   Layers merged: ${totalLayersFound}/${layerKeys.length}`);
  Logger.log(`   Total cases: ${mergedCases.length}`);
  Logger.log(`   Fields per case: ${fieldsPerCase}`);
  Logger.log(`   Field coverage: ${Math.round((fieldsPerCase / 26) * 100)}% of 26 required fields\n`);

  return {
    allCases: mergedCases,
    layersMerged: totalLayersFound,
    totalCases: mergedCases.length,
    fieldsPerCase: fieldsPerCase
  };
}

// ============================================================================
// MODIFIED analyzeCatalog_() WITH MULTI-LAYER SUPPORT
// ============================================================================

/**
 * Get case catalog for AI discovery with multi-layer cache support
 *
 * TIER 1: Try merged multi-layer cache
 * TIER 2: Try basic cache only
 * TIER 3: Fresh lightweight analysis
 */

/**
 * Lightweight analysis fallback (simplified version of original)
 */
function performLightweightAnalysis_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets().find(function(sh) {
    return /master.*scenario.*convert/i.test(sh.getName());
  }) || ss.getActiveSheet();

  const data = sheet.getDataRange().getValues();
  const headers = data[1];

  const caseIdIdx = 0;
  const sparkIdx = 1;
  const pathwayIdx = 5;

  const allCases = [];
  for (let i = 2; i < data.length; i++) {
    allCases.push({
      caseId: data[i][caseIdIdx] || '',
      sparkTitle: data[i][sparkIdx] || '',
      pathway: data[i][pathwayIdx] || ''
    });
  }

  return { allCases: allCases };
}


// ==================== END OF MONOLITHIC CODE ====================



function checkSavedFields() {
  const docProps = PropertiesService.getDocumentProperties();
  const saved = docProps.getProperty('SELECTED_CACHE_FIELDS');

  if (!saved) {
    return { status: 'NO_SAVED_FIELDS', message: 'No saved field selection found' };
  }

  try {
    const fields = JSON.parse(saved);
    return {
      status: 'FOUND',
      count: fields.length,
      fields: fields
    };
  } catch (e) {
    return {
      status: 'ERROR',
      message: 'Error parsing saved fields: ' + e.message,
      raw: saved
    };
  }
}
